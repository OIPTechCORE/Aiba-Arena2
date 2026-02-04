const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const User = require('../models/User');
const LedgerEntry = require('../models/LedgerEntry');
const ActionRunKey = require('../models/ActionRunKey');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { getConfig, debitAibaFromUserNoBurn } = require('../engine/economy');
const { createSignedClaim } = require('../ton/signRewardClaim');
const { getVaultLastSeqno } = require('../ton/vaultRead');
const { metrics } = require('../metrics');

router.use(requireTelegram);

async function acquireActionLock({ scope, requestId, telegramId }) {
    const lockTtlMs = 15 * 60 * 1000;
    let runKey = null;
    let createdLock = false;

    try {
        runKey = await ActionRunKey.create({
            scope,
            requestId,
            ownerTelegramId: telegramId,
            status: 'in_progress',
            expiresAt: new Date(Date.now() + lockTtlMs),
        });
        createdLock = true;
    } catch (err) {
        if (String(err?.code) !== '11000') throw err;
        runKey = await ActionRunKey.findOne({ scope, requestId, ownerTelegramId: telegramId }).lean();
    }

    if (!runKey) return { ok: false, inProgress: true };

    if (runKey.status === 'completed' && runKey.response) {
        return { ok: true, completed: true, response: runKey.response, lockId: String(runKey._id) };
    }

    if (!createdLock && runKey.status === 'in_progress') {
        return { ok: false, inProgress: true, lockId: String(runKey._id) };
    }

    if (!createdLock && runKey.status === 'failed') {
        await ActionRunKey.updateOne(
            { _id: runKey._id },
            {
                $set: {
                    status: 'in_progress',
                    errorCode: '',
                    errorMessage: '',
                    expiresAt: new Date(Date.now() + lockTtlMs),
                },
            },
        );
    }

    return { ok: true, completed: false, lockId: String(runKey._id) };
}

function safeVaultClaimSeqno(user) {
    const n = Math.floor(Number(user?.vaultClaimSeqno ?? 0));
    if (!Number.isFinite(n) || n < 0) return 0n;
    return BigInt(n);
}

async function acquireClaimMutex({ telegramId }) {
    const scope = 'aiba_claim_mutex';
    const requestId = 'mutex';
    const lockTtlMs = 60 * 1000;

    const now = Date.now();
    try {
        const created = await ActionRunKey.create({
            scope,
            requestId,
            ownerTelegramId: telegramId,
            status: 'in_progress',
            expiresAt: new Date(now + lockTtlMs),
        });
        return { ok: true, lockId: String(created._id) };
    } catch (err) {
        if (String(err?.code) !== '11000') throw err;
    }

    // Reuse the same mutex row across claims; only one request may flip it to in_progress.
    const updated = await ActionRunKey.findOneAndUpdate(
        { scope, requestId, ownerTelegramId: telegramId, status: { $ne: 'in_progress' } },
        {
            $set: {
                status: 'in_progress',
                errorCode: '',
                errorMessage: '',
                response: null,
                expiresAt: new Date(now + lockTtlMs),
            },
        },
        { new: true },
    ).lean();

    if (!updated) return { ok: false, inProgress: true };
    return { ok: true, lockId: String(updated._id) };
}

async function releaseClaimMutex(lockId) {
    if (!lockId) return;
    await ActionRunKey.updateOne(
        { _id: lockId },
        {
            $set: {
                status: 'completed',
                response: { released: true },
                errorCode: '',
                errorMessage: '',
                expiresAt: new Date(Date.now() + 10 * 1000),
            },
        },
    ).catch(() => {});
}

// GET /api/economy/me
router.get('/me', async (req, res) => {
    const telegramId = req.telegramId ? String(req.telegramId) : '';
    if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

    const user = req.user || (await User.findOne({ telegramId }).lean());
    const cfg = await getConfig();
    res.json({
        telegramId,
        wallet: user?.wallet || '',
        neurBalance: user?.neurBalance ?? 0,
        aibaBalance: user?.aibaBalance ?? 0,
        starsBalance: user?.starsBalance ?? 0,
        diamondsBalance: user?.diamondsBalance ?? 0,
        badges: Array.isArray(user?.badges) ? user.badges : [],
        economy: {
            baseRewardAibaPerScore: cfg.baseRewardAibaPerScore,
            baseRewardNeurPerScore: cfg.baseRewardNeurPerScore,
            trainNeurCost: cfg.trainNeurCost,
            upgradeAibaCost: cfg.upgradeAibaCost,
            combineNeurCost: cfg.combineNeurCost,
            mintAibaCost: cfg.mintAibaCost,
            createGroupCostTonNano: cfg.createGroupCostTonNano,
            boostGroupCostTonNano: cfg.boostGroupCostTonNano,
            leaderboardTopFreeCreate: cfg.leaderboardTopFreeCreate,
            createBrokerCostTonNano: cfg.createBrokerCostTonNano,
            boostProfileCostTonNano: cfg.boostProfileCostTonNano,
            boostProfileDurationDays: cfg.boostProfileDurationDays,
            giftCostTonNano: cfg.giftCostTonNano,
            marketplaceDefaultNewBrokerPriceAIBA: cfg.marketplaceDefaultNewBrokerPriceAIBA,
            starRewardPerBattle: cfg.starRewardPerBattle,
            diamondRewardFirstWin: cfg.diamondRewardFirstWin,
            courseCompletionBadgeMintCostTonNano: cfg.courseCompletionBadgeMintCostTonNano,
            fullCourseCompletionCertificateMintCostTonNano: cfg.fullCourseCompletionCertificateMintCostTonNano,
        },
        profileBoostedUntil: user?.profileBoostedUntil || null,
    });
});

// POST /api/economy/claim-aiba
// Body: { requestId?: string, amount?: number|string }
// Withdraw AIBA credits to an on-chain claim (signature-based vault).
router.post('/claim-aiba', async (req, res) => {
    let claimMutexId = '';
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const lock = await acquireActionLock({ scope: 'aiba_claim', requestId, telegramId });
        if (!lock.ok && lock.inProgress) return res.status(409).json({ error: 'in_progress', retryAfterMs: 1500 });
        if (lock.ok && lock.completed) return res.json(lock.response);

        // Idempotency: if we already created a claim for this requestId, return it.
        const existing = await LedgerEntry.findOne({
            telegramId,
            currency: 'AIBA',
            direction: 'debit',
            sourceType: 'aiba_claim',
            sourceId: requestId,
        })
            .sort({ createdAt: -1 })
            .lean();
        if (existing?.meta?.claim) {
            const response = { ok: true, claim: existing.meta.claim, requestId };
            if (lock.lockId) {
                await ActionRunKey.updateOne(
                    { _id: lock.lockId },
                    {
                        $set: {
                            status: 'completed',
                            response,
                            errorCode: '',
                            errorMessage: '',
                            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        },
                    },
                );
            }
            metrics?.economyWithdrawalsTotal?.inc?.({ result: 'ok' });
            return res.json(response);
        }

        const user = req.user || (await User.findOne({ telegramId }).lean());
        const toAddress = user?.wallet ? String(user.wallet).trim() : '';
        if (!toAddress) return res.status(403).json({ error: 'wallet_required' });

        const vaultAddress = String(process.env.ARENA_VAULT_ADDRESS || '').trim();
        const jettonMaster = String(process.env.AIBA_JETTON_MASTER || '').trim();
        if (!vaultAddress || !jettonMaster) {
            return res.status(500).json({ error: 'vault not configured' });
        }

        // Serialize claim creation per-user to prevent concurrent requests generating the same seqno.
        const mutex = await acquireClaimMutex({ telegramId });
        if (!mutex.ok && mutex.inProgress) return res.status(409).json({ error: 'in_progress', retryAfterMs: 1500 });
        claimMutexId = mutex.lockId || '';

        const rawAmount = req.body?.amount;
        const amt =
            rawAmount === undefined || rawAmount === null
                ? Math.floor(Number(user?.aibaBalance ?? 0))
                : Math.floor(Number(rawAmount));
        if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'amount must be > 0' });

        const lastOnchain = await getVaultLastSeqno(vaultAddress, toAddress);
        const lastIssued = safeVaultClaimSeqno(user);
        if (lastIssued > lastOnchain) {
            // There's an outstanding unconfirmed claim for this recipient. Issuing another claim would either
            // collide (same seqno) or create an unusable gap (seqno > last+1), so block and ask the client
            // to finalize/check the previous claim first.
            const latest = await LedgerEntry.findOne({
                telegramId,
                currency: 'AIBA',
                direction: 'debit',
                reason: 'withdraw_to_chain',
                $or: [{ sourceType: 'aiba_claim' }, { sourceType: 'battle_auto_claim' }],
            })
                .sort({ createdAt: -1 })
                .lean();
            const claim = latest?.meta?.claim || null;
            return res.status(409).json({
                error: 'pending_claim',
                lastOnchainSeqno: lastOnchain.toString(),
                lastIssuedSeqno: lastIssued.toString(),
                claim,
            });
        }

        const nextSeqno = (lastIssued > lastOnchain ? lastIssued : lastOnchain) + 1n;
        const validUntil = Math.floor(Date.now() / 1000) + 10 * 60; // 10 minutes
        const amount = String(amt);

        const signed = createSignedClaim({
            vaultAddress,
            jettonMaster,
            to: toAddress,
            amount,
            seqno: nextSeqno.toString(),
            validUntil,
        });

        const claim = {
            vaultAddress,
            toAddress,
            amount,
            seqno: Number(nextSeqno),
            validUntil,
            ...signed,
        };

        const deb = await debitAibaFromUserNoBurn(amt, {
            telegramId,
            reason: 'withdraw_to_chain',
            arena: 'vault',
            league: 'global',
            sourceType: 'aiba_claim',
            sourceId: requestId,
            requestId,
            meta: { claim },
        });
        if (!deb.ok) {
            if (lock.lockId) {
                await ActionRunKey.updateOne(
                    { _id: lock.lockId },
                    {
                        $set: {
                            status: 'failed',
                            errorCode: 'insufficient_aiba',
                            errorMessage: 'insufficient AIBA',
                            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                        },
                    },
                );
            }
            metrics?.economyWithdrawalsTotal?.inc?.({ result: 'insufficient' });
            return res.status(403).json({ error: 'insufficient AIBA' });
        }

        // Best-effort tracking for operators/debugging.
        await User.updateOne({ telegramId }, { $max: { vaultClaimSeqno: Number(nextSeqno) } }).catch(() => {});

        const response = { ok: true, claim, requestId };
        if (lock.lockId) {
            await ActionRunKey.updateOne(
                { _id: lock.lockId },
                {
                    $set: {
                        status: 'completed',
                        response,
                        errorCode: '',
                        errorMessage: '',
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                },
            );
        }

        metrics?.economyWithdrawalsTotal?.inc?.({ result: 'ok' });
        res.json(response);
    } catch (err) {
        console.error('Error in /api/economy/claim-aiba:', err);
        metrics?.economyWithdrawalsTotal?.inc?.({ result: 'error' });
        res.status(500).json({ error: 'internal server error' });
    } finally {
        await releaseClaimMutex(claimMutexId);
    }
});

module.exports = router;
