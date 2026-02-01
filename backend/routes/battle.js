const router = require('express').Router();

const { requireTelegram } = require('../middleware/requireTelegram');
const Broker = require('../models/Broker');
const Battle = require('../models/Battle');
const User = require('../models/User');
const Guild = require('../models/Guild');
const GameMode = require('../models/GameMode');
const { hmacSha256Hex, seedFromHex } = require('../engine/deterministicRandom');
const { simulateBattle } = require('../engine/battleEngine');
const { getConfig, tryEmitAiba, tryEmitNeur } = require('../engine/economy');
const { createSignedClaim } = require('../ton/signRewardClaim');
const { getVaultLastSeqno } = require('../ton/vaultRead');
const { rateLimit } = require('../middleware/rateLimit');

const ARENAS = new Set(['prediction', 'simulation', 'strategyWars', 'guildWars']);

function clampInt(n, min, max) {
    const x = Number(n);
    if (!Number.isFinite(x)) return min;
    return Math.max(min, Math.min(max, Math.floor(x)));
}

function applyEnergyRegen(brokerDoc, now) {
    const maxEnergy = 100;
    const regenSecondsPerEnergy = 60; // 1 energy / minute baseline

    const last = brokerDoc.energyUpdatedAt ? new Date(brokerDoc.energyUpdatedAt) : brokerDoc.updatedAt ? new Date(brokerDoc.updatedAt) : now;
    const deltaSec = Math.max(0, Math.floor((now.getTime() - last.getTime()) / 1000));
    const gained = Math.floor(deltaSec / regenSecondsPerEnergy);
    if (gained <= 0) return;

    brokerDoc.energy = Math.min(maxEnergy, clampInt(brokerDoc.energy ?? 0, 0, maxEnergy) + gained);
    brokerDoc.energyUpdatedAt = new Date(last.getTime() + gained * regenSecondsPerEnergy * 1000);
}

// POST /api/battle/run
// Body:
// - requestId: string (idempotency key)
// - brokerId: string
// - arena: string ("prediction" | "arbitrage" | ...)
// - league: string
router.post(
    '/run',
    requireTelegram,
    rateLimit({ windowMs: 60_000, max: 25, keyFn: (req) => `battle:${req.telegramId || 'unknown'}` }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const requestId = String(req.body?.requestId ?? '').trim();
        const brokerId = String(req.body?.brokerId ?? '').trim();
        const arena = String(req.body?.arena ?? 'prediction').trim();
        const league = String(req.body?.league ?? 'rookie').trim();
        const modeKey = String(req.body?.modeKey ?? '').trim();

        if (!requestId) return res.status(400).json({ error: 'requestId required' });
        if (!brokerId) return res.status(400).json({ error: 'brokerId required' });
        if (!ARENAS.has(arena)) return res.status(400).json({ error: 'invalid arena' });

        // Ban enforcement
        const user = req.user || (await User.findOne({ telegramId }).lean());
        if (user?.bannedUntil && new Date(user.bannedUntil).getTime() > Date.now()) {
            return res.status(403).json({ error: 'banned', reason: user.bannedReason || 'banned', until: user.bannedUntil });
        }

        // Idempotency: return existing battle for same requestId (scoped to user)
        const existing = await Battle.findOne({ requestId, ownerTelegramId: telegramId }).lean();
        if (existing) return res.json(existing);

        // If requestId exists for a different user, do not leak it
        const requestIdTaken = await Battle.findOne({ requestId }).select({ _id: 1, ownerTelegramId: 1 }).lean();
        if (requestIdTaken && String(requestIdTaken.ownerTelegramId) !== telegramId) {
            return res.status(409).json({ error: 'requestId already used' });
        }

        // Arena-specific prerequisites
        if (arena === 'guildWars') {
            const g = await Guild.findOne({ active: true, 'members.telegramId': telegramId }).lean();
            if (!g) return res.status(403).json({ error: 'guild required' });
        }

        const broker = await Broker.findById(brokerId);
        if (!broker) return res.status(404).json({ error: 'broker not found' });
        if (String(broker.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your broker' });
        if (broker.banned) return res.status(403).json({ error: 'broker banned', reason: broker.banReason || 'banned' });

        // Load mode rules (DB override), fallback to defaults
        let mode = null;
        if (modeKey) mode = await GameMode.findOne({ key: modeKey }).lean();
        if (!mode) mode = await GameMode.findOne({ enabled: true, arena, league }).lean();

        const energyCost = clampInt(mode?.energyCost ?? 1, 0, 100);
        const cooldownSeconds = clampInt(mode?.cooldownSeconds ?? 30, 0, 24 * 3600);

        const now = new Date();

        // Energy regen + cooldown checks (anti-spam)
        applyEnergyRegen(broker, now);
        if ((broker.energy ?? 0) < energyCost) return res.status(403).json({ error: 'no energy', need: energyCost, have: broker.energy ?? 0 });

        const arenaLast = broker.cooldowns?.get ? broker.cooldowns.get(arena) : broker.cooldowns?.[arena];
        if (arenaLast) {
            const ms = now.getTime() - new Date(arenaLast).getTime();
            if (ms < cooldownSeconds * 1000) {
                return res.status(429).json({ error: 'cooldown', retryAfterMs: cooldownSeconds * 1000 - ms });
            }
        }

        // Deterministic seed derived from requestId + broker snapshot (server secret prevents precompute)
        const secret = String(process.env.BATTLE_SEED_SECRET || 'dev-secret');
        const seedHex = hmacSha256Hex(secret, `${telegramId}:${brokerId}:${arena}:${league}:${requestId}`);
        const seed = seedFromHex(seedHex);

        const { score } = simulateBattle({ broker, seed, arena, league });

        // Simple anomaly detection (server-side)
        const anomaly = score > 220 || score < 0 || !Number.isFinite(score);
        const anomalyReason = anomaly ? `score_out_of_range:${score}` : '';

        // Reward issuance with emission caps
        const cfg = await getConfig();
        const multAiba = Number(mode?.rewardMultiplierAiba ?? 1) || 1;
        const proposedAiba = Math.max(0, Math.floor(score * cfg.baseRewardAibaPerScore * multAiba));

        let rewardAiba = 0;
        const emitResult = await tryEmitAiba(proposedAiba, { arena });
        if (emitResult.ok) rewardAiba = proposedAiba;

        // NEUR off-chain ledger (server-authoritative)
        let rewardNeur = 0;
        const multNeur = Number(mode?.rewardMultiplierNeur ?? 1) || 1;
        const proposedNeur = Math.max(0, Math.floor(score * cfg.baseRewardNeurPerScore * multNeur));
        if (proposedNeur > 0) {
            const neurEmit = await tryEmitNeur(proposedNeur, { arena });
            if (neurEmit.ok) {
                rewardNeur = proposedNeur;
                await User.updateOne(
                    { telegramId },
                    { $inc: { neurBalance: rewardNeur }, $setOnInsert: { telegramId } },
                    { upsert: true, setDefaultsOnInsert: true }
                );
            }
        }

        // Create signature claim payload if configured
        let claim = {};
        const vaultAddress = String(process.env.ARENA_VAULT_ADDRESS || '').trim();
        const jettonMaster = String(process.env.AIBA_JETTON_MASTER || '').trim();

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

        // Update broker state
        broker.energy = clampInt(broker.energy ?? 0, 0, 100) - energyCost;
        broker.lastBattleAt = now;
        broker.energyUpdatedAt = broker.energyUpdatedAt || now;
        if (broker.cooldowns?.set) broker.cooldowns.set(arena, now);
        else broker.cooldowns = { ...(broker.cooldowns || {}), [arena]: now };
        broker.lastRequestId = requestId;
        if (anomaly) {
            broker.anomalyFlags = clampInt(broker.anomalyFlags ?? 0, 0, 1_000_000) + 1;
            if (broker.anomalyFlags >= 5) {
                broker.banned = true;
                broker.banReason = 'auto-banned (anomaly threshold)';
            }
        }
        await broker.save();

        let battle;
        try {
            battle = await Battle.create({
                requestId,
                ownerTelegramId: telegramId,
                brokerId: broker._id,
                arena,
                league,
                modeKey: mode?.key || modeKey || '',
                seedHex,
                score,
                rewardAiba,
                rewardNeur,
                anomaly,
                anomalyReason,
                claim,
            });
        } catch (err) {
            // Handle rare duplicate key races
            if (String(err?.code) === '11000') {
                const existing2 = await Battle.findOne({ requestId, ownerTelegramId: telegramId }).lean();
                if (existing2) return res.json(existing2);
                return res.status(409).json({ error: 'requestId already used' });
            }
            throw err;
        }

        res.json(battle.toObject());
    } catch (err) {
        console.error('Error in /api/battle/run:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    }
);

module.exports = router;

