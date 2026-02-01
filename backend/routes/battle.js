const router = require('express').Router();

const { requireTelegram } = require('../middleware/requireTelegram');
const Broker = require('../models/Broker');
const Battle = require('../models/Battle');
const User = require('../models/User');
const { hmacSha256Hex, seedFromHex } = require('../engine/deterministicRandom');
const { simulateBattle } = require('../engine/battleEngine');
const { getConfig, tryEmitAiba } = require('../engine/economy');
const { createSignedClaim } = require('../ton/signRewardClaim');
const { getVaultLastSeqno } = require('../ton/vaultRead');

// POST /api/battle/run
// Body:
// - requestId: string (idempotency key)
// - brokerId: string
// - arena: string ("prediction" | "arbitrage" | ...)
// - league: string
router.post('/run', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramUser?.id ? String(req.telegramUser.id) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const requestId = String(req.body?.requestId ?? '').trim();
        const brokerId = String(req.body?.brokerId ?? '').trim();
        const arena = String(req.body?.arena ?? 'prediction').trim();
        const league = String(req.body?.league ?? 'rookie').trim();

        if (!requestId) return res.status(400).json({ error: 'requestId required' });
        if (!brokerId) return res.status(400).json({ error: 'brokerId required' });

        // Idempotency: return existing battle for same requestId
        const existing = await Battle.findOne({ requestId }).lean();
        if (existing) return res.json(existing);

        const broker = await Broker.findById(brokerId).lean();
        if (!broker) return res.status(404).json({ error: 'broker not found' });
        if (String(broker.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your broker' });

        // Cooldown / energy checks (anti-spam)
        if ((broker.energy ?? 0) <= 0) return res.status(403).json({ error: 'no energy' });
        if (broker.lastBattleAt) {
            const ms = Date.now() - new Date(broker.lastBattleAt).getTime();
            if (ms < 30_000) return res.status(429).json({ error: 'cooldown' });
        }

        // Deterministic seed derived from requestId + broker snapshot (server secret prevents precompute)
        const secret = String(process.env.BATTLE_SEED_SECRET || 'dev-secret');
        const seedHex = hmacSha256Hex(secret, `${telegramId}:${brokerId}:${arena}:${league}:${requestId}`);
        const seed = seedFromHex(seedHex);

        const { score } = simulateBattle({ broker, seed, arena });

        // Reward issuance with emission caps
        const cfg = await getConfig();
        const proposedAiba = Math.max(0, Math.floor(score * cfg.baseRewardAibaPerScore));

        let rewardAiba = 0;
        const emitResult = await tryEmitAiba(proposedAiba);
        if (emitResult.ok) rewardAiba = proposedAiba;
        // else: cap hit -> rewardAiba stays 0 (you can fallback to NEUR here)

        // Create signature claim payload if configured
        let claim = {};
        const vaultAddress = String(process.env.ARENA_VAULT_ADDRESS || '').trim();
        const jettonMaster = String(process.env.AIBA_JETTON_MASTER || '').trim();

        const user = await User.findOne({ telegramId }).lean();
        const toAddress = user?.wallet ? String(user.wallet) : '';

        if (vaultAddress && jettonMaster && toAddress && rewardAiba > 0) {
            // IMPORTANT: derive seqno from on-chain vault state so failed claims don't desync.
            // If the backend can't read on-chain state, we fail safe and return no claim.
            try {
                const lastOnchain = await getVaultLastSeqno(vaultAddress, toAddress);
                const nextSeqno = lastOnchain + 1n;
                const validUntil = Math.floor(Date.now() / 1000) + 10 * 60; // 10 minutes

                // amount must be integer string in smallest jetton units (here: 1 token == 1 unit for MVP)
                const amount = String(rewardAiba);

                const signed = createSignedClaim({
                    vaultAddress,
                    jettonMaster,
                    to: toAddress,
                    amount,
                    seqno: nextSeqno.toString(),
                    validUntil,
                });

                claim = {
                    vaultAddress,
                    toAddress,
                    amount,
                    seqno: Number(nextSeqno),
                    validUntil,
                    ...signed,
                };
            } catch (e) {
                // Intentionally omit claim when we can't ensure correct seqno
                claim = {};
            }
        }

        // Save battle + update broker energy/cooldown
        await Broker.updateOne(
            { _id: brokerId, ownerTelegramId: telegramId },
            { $inc: { energy: -1 }, $set: { lastBattleAt: new Date(), lastRequestId: requestId } }
        );

        const battle = await Battle.create({
            requestId,
            ownerTelegramId: telegramId,
            brokerId: broker._id,
            arena,
            league,
            seedHex,
            score,
            rewardAiba,
            rewardNeur: 0,
            claim,
        });

        res.json(battle.toObject());
    } catch (err) {
        console.error('Error in /api/battle/run:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;

