const router = require('express').Router();

const { requireTelegram } = require('../middleware/requireTelegram');
const Broker = require('../models/Broker');
const Battle = require('../models/Battle');
const User = require('../models/User');
const BattleRunKey = require('../models/BattleRunKey');
const Guild = require('../models/Guild');
const GameMode = require('../models/GameMode');
const { hmacSha256Hex, seedFromHex } = require('../engine/deterministicRandom');
const { simulateBattle } = require('../engine/battleEngine');
const {
    getConfig,
    tryEmitAiba,
    tryEmitNeur,
    creditAibaNoCap,
    creditNeurNoCap,
    debitNeurFromUser,
    debitAibaFromUser,
    debitAibaFromUserNoBurn,
} = require('../engine/economy');
const { createSignedClaim } = require('../ton/signRewardClaim');
const { getVaultLastSeqno } = require('../ton/vaultRead');
const { rateLimit } = require('../middleware/rateLimit');
const { metrics } = require('../metrics');
const { clampInt, applyEnergyRegen } = require('../engine/battleEnergy');
const { buildBattleSeedMessage } = require('../engine/battleSeed');
const { getBattleCooldownKey } = require('../engine/battleCooldown');

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
            const arenaInput = String(req.body?.arena ?? 'prediction').trim();
            const leagueInput = String(req.body?.league ?? 'rookie').trim();
            const modeKeyInput = String(req.body?.modeKey ?? '').trim();
            const metricFallback = {
                arena: arenaInput || 'unknown',
                league: leagueInput || 'unknown',
                mode_key: modeKeyInput || '',
            };

            if (!requestId) return res.status(400).json({ error: 'requestId required' });
            if (!brokerId) return res.status(400).json({ error: 'brokerId required' });

            // Ban enforcement
            const user = req.user || (await User.findOne({ telegramId }).lean());
            if (user?.bannedUntil && new Date(user.bannedUntil).getTime() > Date.now()) {
                return res
                    .status(403)
                    .json({ error: 'banned', reason: user.bannedReason || 'banned', until: user.bannedUntil });
            }

            // Idempotency: return existing battle for same requestId (scoped to user)
            const existing = await Battle.findOne({ requestId, ownerTelegramId: telegramId }).lean();
            if (existing) return res.json(existing);

            // If requestId exists for a different user, do not leak it
            const requestIdTaken = await Battle.findOne({ requestId }).select({ _id: 1, ownerTelegramId: 1 }).lean();
            if (requestIdTaken && String(requestIdTaken.ownerTelegramId) !== telegramId) {
                return res.status(409).json({ error: 'requestId already used' });
            }

            // Lightweight idempotency lock to prevent concurrent double-charging.
            // TTL-based: if a run crashes mid-flight, the lock expires and a retry can proceed.
            const lockTtlMs = 15 * 60 * 1000;
            let runKey = null;
            let createdLock = false;
            try {
                runKey = await BattleRunKey.create({
                    requestId,
                    ownerTelegramId: telegramId,
                    status: 'in_progress',
                    expiresAt: new Date(Date.now() + lockTtlMs),
                });
                createdLock = true;
            } catch (err) {
                if (String(err?.code) !== '11000') throw err;
                runKey = await BattleRunKey.findOne({ requestId }).lean();
                if (!runKey) {
                    // Rare: TTL deleted between duplicate error and lookup. Try once more.
                    runKey = await BattleRunKey.create({
                        requestId,
                        ownerTelegramId: telegramId,
                        status: 'in_progress',
                        expiresAt: new Date(Date.now() + lockTtlMs),
                    });
                    createdLock = true;
                }
            }

            if (runKey && String(runKey.ownerTelegramId) !== telegramId) {
                return res.status(409).json({ error: 'requestId already used' });
            }
            if (runKey?.status === 'completed' && runKey?.battleId) {
                const byId = await Battle.findById(runKey.battleId).lean();
                if (byId) return res.json(byId);
            }
            if (!createdLock && runKey?.status === 'in_progress') {
                // Another in-flight request. Don't allow concurrent settlement.
                return res.status(409).json({ error: 'in_progress', retryAfterMs: 1500 });
            }
            if (!createdLock && runKey?.status === 'failed') {
                // Allow retry by reusing the same lock row.
                await BattleRunKey.updateOne(
                    { requestId, ownerTelegramId: telegramId },
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
            const lockId = runKey?._id ? String(runKey._id) : '';

            // Resolve mode (data-driven arenas/leagues)
            let mode = null;
            if (modeKeyInput) {
                mode = await GameMode.findOne({ key: modeKeyInput }).lean();
            } else {
                mode = await GameMode.findOne({ enabled: true, arena: arenaInput, league: leagueInput })
                    .sort({ key: 1 })
                    .lean();
            }
            if (!mode) {
                return res.status(400).json({
                    error: 'invalid_mode',
                    detail: modeKeyInput
                        ? `modeKey not found: ${modeKeyInput}`
                        : `no enabled mode for ${arenaInput}/${leagueInput}`,
                });
            }
            if (mode.enabled === false) {
                return res.status(403).json({ error: 'mode_disabled', modeKey: mode.key });
            }

            const arena = String(mode.arena || '').trim();
            const league = String(mode.league || '').trim();
            const modeKey = String(mode.key || '').trim();
            const metricLabels = { arena: arena || 'unknown', league: league || 'unknown', mode_key: modeKey || '' };

            // Arena-specific prerequisites
            let guild = null;
            let opponentGuild = null;
            const rules = mode?.rules && typeof mode.rules === 'object' ? mode.rules : {};
            const requiresGuild = Boolean(rules.requiresGuild) || arena === 'guildWars';
            if (requiresGuild) {
                guild = await Guild.findOne({ active: true, 'members.telegramId': telegramId }).lean();
                if (!guild) return res.status(403).json({ error: 'guild required' });
                opponentGuild = await Guild.findOne({ active: true, _id: { $ne: guild._id } })
                    .sort({ createdAt: -1 })
                    .lean();
            }

            const broker = await Broker.findById(brokerId);
            if (!broker) return res.status(404).json({ error: 'broker not found' });
            if (String(broker.ownerTelegramId) !== telegramId)
                return res.status(403).json({ error: 'not your broker' });
            if (broker.banned)
                return res.status(403).json({ error: 'broker banned', reason: broker.banReason || 'banned' });

            const cfg = await getConfig();
            const maxEnergy = clampInt(cfg?.battleMaxEnergy ?? 100, 1, 1_000);

            const energyCost = clampInt(mode?.energyCost ?? 1, 0, maxEnergy);
            const cooldownSeconds = clampInt(mode?.cooldownSeconds ?? 30, 0, 24 * 3600);
            const entryNeurCost = clampInt(mode?.entryNeurCost ?? 0, 0, 1_000_000_000);
            const entryAibaCost = clampInt(mode?.entryAibaCost ?? 0, 0, 1_000_000_000);

            const now = new Date();

            // Energy regen + cooldown checks (anti-spam)
            applyEnergyRegen(broker, now, cfg);
            broker.energy = clampInt(broker.energy ?? 0, 0, maxEnergy);

            // League rules (baseline; can be overridden by mode.rules)
            const defaultMinLevel = league === 'elite' ? 10 : league === 'pro' ? 5 : 1;
            const minBrokerLevel = clampInt(rules.minBrokerLevel ?? defaultMinLevel, 1, 1_000);
            if (clampInt(broker.level ?? 1, 1, 1_000) < minBrokerLevel) {
                return res
                    .status(403)
                    .json({ error: 'league_locked', needLevel: minBrokerLevel, haveLevel: broker.level ?? 1 });
            }

            if ((broker.energy ?? 0) < energyCost)
                return res.status(403).json({ error: 'no energy', need: energyCost, have: broker.energy ?? 0 });

            // Cooldowns: prefer mode.key to avoid collisions across leagues/modes.
            // During transition, also honor any legacy arena-based cooldowns.
            const cooldownKey = getBattleCooldownKey({ modeKey, arena });
            const legacyKey = arena;
            const lastByMode = broker.cooldowns?.get
                ? broker.cooldowns.get(cooldownKey)
                : broker.cooldowns?.[cooldownKey];
            const lastByArena =
                legacyKey && legacyKey !== cooldownKey
                    ? broker.cooldowns?.get
                        ? broker.cooldowns.get(legacyKey)
                        : broker.cooldowns?.[legacyKey]
                    : null;
            const arenaLast = lastByMode || lastByArena;
            if (arenaLast) {
                const ms = now.getTime() - new Date(arenaLast).getTime();
                if (ms < cooldownSeconds * 1000) {
                    return res.status(429).json({ error: 'cooldown', retryAfterMs: cooldownSeconds * 1000 - ms });
                }
            }

            // Entry sinks (low-tier fees, tournaments, etc). These are server-authoritative and off-chain.
            // NOTE: For full idempotent accounting across retries, you'd move this into a transactional "battle settlement" flow.
            if (entryNeurCost > 0) {
                const spend = await debitNeurFromUser(entryNeurCost, {
                    telegramId,
                    reason: 'entry',
                    arena,
                    league,
                    sourceType: 'battle',
                    sourceId: requestId,
                    requestId,
                    meta: { brokerId, modeKey: mode?.key || modeKey || '' },
                });
                if (!spend.ok) {
                    if (lockId) {
                        await BattleRunKey.updateOne(
                            { _id: lockId },
                            {
                                $set: {
                                    status: 'failed',
                                    errorCode: 'insufficient_neur',
                                    errorMessage: `insufficient NEUR (need ${entryNeurCost})`,
                                    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                                },
                            },
                        );
                    }
                    return res.status(403).json({ error: 'insufficient NEUR', need: entryNeurCost });
                }
            }
            if (entryAibaCost > 0) {
                const burn = await debitAibaFromUser(entryAibaCost, {
                    telegramId,
                    reason: 'entry',
                    arena,
                    league,
                    sourceType: 'battle',
                    sourceId: requestId,
                    requestId,
                    meta: { brokerId, modeKey: mode?.key || modeKey || '' },
                });
                if (!burn.ok) {
                    if (lockId) {
                        await BattleRunKey.updateOne(
                            { _id: lockId },
                            {
                                $set: {
                                    status: 'failed',
                                    errorCode: 'insufficient_aiba',
                                    errorMessage: `insufficient AIBA (need ${entryAibaCost})`,
                                    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                                },
                            },
                        );
                    }
                    return res.status(403).json({ error: 'insufficient AIBA', need: entryAibaCost });
                }
            }

            // Deterministic seed derived from requestId + broker snapshot (server secret prevents precompute)
            const secret = String(process.env.BATTLE_SEED_SECRET || 'dev-secret');
            const oppId = opponentGuild?._id ? String(opponentGuild._id) : '';
            const seedHex = hmacSha256Hex(
                secret,
                buildBattleSeedMessage({
                    telegramId,
                    brokerId,
                    modeKey,
                    arena,
                    league,
                    requestId,
                    opponentId: oppId,
                }),
            );
            const seed = seedFromHex(seedHex);

            let { score } = simulateBattle({ broker, seed, arena, league, rules });
            // Guild wars: add a small deterministic matchmaking adjustment based on pooled broker counts.
            if (requiresGuild && guild?._id && opponentGuild?._id) {
                const myCount = await Broker.countDocuments({ guildId: guild._id });
                const oppCount = await Broker.countDocuments({ guildId: opponentGuild._id });
                const bonus = Math.max(-15, Math.min(15, (myCount - oppCount) * 3));
                score = Math.max(0, Math.round(score + bonus));
            }

            // Simple anomaly detection (server-side)
            const anomalyMax = clampInt(cfg?.battleAnomalyScoreMax ?? 220, 1, 1_000_000);
            const anomaly = score > anomalyMax || score < 0 || !Number.isFinite(score);
            const anomalyReason = anomaly ? `score_out_of_range:${score}` : '';

            // Reward issuance with emission caps
            const multAiba = Number(mode?.rewardMultiplierAiba ?? 1) || 1;
            const proposedAiba = Math.max(0, Math.floor(score * cfg.baseRewardAibaPerScore * multAiba));

            // NEUR off-chain ledger (server-authoritative)
            let rewardNeur = 0;
            const multNeur = Number(mode?.rewardMultiplierNeur ?? 1) || 1;
            const proposedNeur = Math.max(0, Math.floor(score * cfg.baseRewardNeurPerScore * multNeur));
            let guildShareNeur = 0;
            if (proposedNeur > 0) {
                const neurEmit = await tryEmitNeur(proposedNeur, { arena, league });
                if (neurEmit.ok) {
                    rewardNeur = proposedNeur;

                    // Guild wars reward splitting (off-chain NEUR):
                    // 20% to guild treasury, 80% to the player.
                    if (requiresGuild && guild?._id) {
                        guildShareNeur = Math.floor(rewardNeur * 0.2);
                        const userShare = rewardNeur - guildShareNeur;

                        if (guildShareNeur > 0) {
                            await Guild.updateOne({ _id: guild._id }, { $inc: { vaultNeur: guildShareNeur } });
                        }

                        if (userShare > 0) {
                            await creditNeurNoCap(userShare, {
                                telegramId,
                                reason: 'battle_reward',
                                arena,
                                league,
                                sourceType: 'battle',
                                sourceId: requestId,
                                requestId,
                                meta: { brokerId, guildShareNeur },
                            });
                        }
                    } else {
                        await creditNeurNoCap(rewardNeur, {
                            telegramId,
                            reason: 'battle_reward',
                            arena,
                            league,
                            sourceType: 'battle',
                            sourceId: requestId,
                            requestId,
                            meta: { brokerId },
                        });
                    }
                }
            }

            // AIBA reward is credited off-chain (hybrid model) and may be optionally withdrawn on-chain.
            let rewardAiba = 0;
            let claim = {};

            if (proposedAiba > 0) {
                const aibaEmit = await tryEmitAiba(proposedAiba, { arena, league });
                if (aibaEmit.ok) {
                    rewardAiba = proposedAiba;
                    await creditAibaNoCap(rewardAiba, {
                        telegramId,
                        reason: 'battle_reward',
                        arena,
                        league,
                        sourceType: 'battle',
                        sourceId: requestId,
                        requestId,
                        meta: { brokerId, modeKey },
                    });
                }
            }

            const vaultAddress = String(process.env.ARENA_VAULT_ADDRESS || '').trim();
            const jettonMaster = String(process.env.AIBA_JETTON_MASTER || '').trim();

            const toAddress = user?.wallet ? String(user.wallet) : '';

            const autoClaim = Boolean(req.body?.autoClaim);
            if (autoClaim && vaultAddress && jettonMaster && toAddress && rewardAiba > 0) {
                // IMPORTANT: derive seqno from on-chain vault state so failed claims don't desync.
                // If the backend can't read on-chain state, we fail safe and return no claim.
                try {
                    const lastOnchain = await getVaultLastSeqno(vaultAddress, toAddress);
                    const nextSeqno = lastOnchain + 1n;
                    const validUntil = Math.floor(Date.now() / 1000) + 10 * 60; // 10 minutes
                    const amount = String(rewardAiba); // smallest units (MVP: 1 token == 1 unit)

                    const signed = createSignedClaim({
                        vaultAddress,
                        jettonMaster,
                        to: toAddress,
                        amount,
                        seqno: nextSeqno.toString(),
                        validUntil,
                    });

                    const deb = await debitAibaFromUserNoBurn(rewardAiba, {
                        telegramId,
                        reason: 'withdraw_to_chain',
                        arena,
                        league,
                        sourceType: 'battle_auto_claim',
                        sourceId: requestId,
                        requestId,
                        meta: {
                            brokerId,
                            modeKey,
                            claim: { vaultAddress, toAddress, amount, seqno: Number(nextSeqno), validUntil },
                        },
                    });

                    if (deb.ok) {
                        claim = {
                            vaultAddress,
                            toAddress,
                            amount,
                            seqno: Number(nextSeqno),
                            validUntil,
                            ...signed,
                        };
                        await User.updateOne({ telegramId }, { $max: { vaultClaimSeqno: Number(nextSeqno) } }).catch(
                            () => {},
                        );
                    }
                } catch {
                    claim = {};
                }
            }

            // Update broker state
            broker.energy = clampInt((broker.energy ?? 0) - energyCost, 0, maxEnergy);
            broker.lastBattleAt = now;
            broker.energyUpdatedAt = broker.energyUpdatedAt || now;
            // Save both mode-key and legacy arena key (prevents bypass during migration)
            if (broker.cooldowns?.set) {
                broker.cooldowns.set(cooldownKey, now);
                if (legacyKey) broker.cooldowns.set(legacyKey, now);
            } else {
                broker.cooldowns = {
                    ...(broker.cooldowns || {}),
                    [cooldownKey]: now,
                    ...(legacyKey ? { [legacyKey]: now } : {}),
                };
            }
            broker.lastRequestId = requestId;
            if (anomaly) {
                broker.anomalyFlags = clampInt(broker.anomalyFlags ?? 0, 0, 1_000_000) + 1;
                const brokerAutoBan = clampInt(cfg?.battleAutoBanBrokerAnomalyFlags ?? 5, 1, 1_000_000);
                if (broker.anomalyFlags >= brokerAutoBan) {
                    if (!broker.banned) {
                        metrics?.autoBansTotal?.inc?.({ entity: 'broker' });
                    }
                    broker.banned = true;
                    broker.banReason = 'auto-banned (anomaly threshold)';
                }

                // User-level anomaly tracking and optional auto-ban
                const updatedUser = await User.findOneAndUpdate(
                    { telegramId },
                    { $inc: { anomalyFlags: 1 }, $setOnInsert: { telegramId } },
                    { new: true, upsert: true, setDefaultsOnInsert: true },
                ).lean();

                const userAutoBan = clampInt(cfg?.battleAutoBanUserAnomalyFlags ?? 25, 1, 1_000_000);
                const alreadyBanned =
                    updatedUser?.bannedUntil && new Date(updatedUser.bannedUntil).getTime() > Date.now();
                if (!alreadyBanned && (updatedUser?.anomalyFlags ?? 0) >= userAutoBan) {
                    const minutes = clampInt(cfg?.battleAutoBanUserMinutes ?? 60 * 24, 1, 365 * 24 * 60);
                    const bannedUntil = new Date(Date.now() + minutes * 60 * 1000);
                    await User.updateOne(
                        { telegramId },
                        { $set: { bannedUntil, bannedReason: 'auto-banned (anomaly threshold)' } },
                    ).catch(() => {});
                    metrics?.autoBansTotal?.inc?.({ entity: 'user' });
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
                    guildId: guild?._id || null,
                    opponentGuildId: opponentGuild?._id || null,
                    guildShareNeur,
                });
            } catch (err) {
                // Handle rare duplicate key races
                if (String(err?.code) === '11000') {
                    const existing2 = await Battle.findOne({ requestId, ownerTelegramId: telegramId }).lean();
                    if (existing2) {
                        if (lockId) {
                            await BattleRunKey.updateOne(
                                { _id: lockId },
                                {
                                    $set: {
                                        status: 'completed',
                                        battleId: existing2._id,
                                        errorCode: '',
                                        errorMessage: '',
                                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                                    },
                                },
                            );
                        }
                        return res.json(existing2);
                    }
                    return res.status(409).json({ error: 'requestId already used' });
                }
                throw err;
            }

            if (lockId) {
                await BattleRunKey.updateOne(
                    { _id: lockId },
                    {
                        $set: {
                            status: 'completed',
                            battleId: battle._id,
                            errorCode: '',
                            errorMessage: '',
                            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        },
                    },
                );
            }

            metrics?.battleRunsTotal?.inc?.({ ...metricLabels, result: 'ok' });
            if (anomaly)
                metrics?.battleAnomaliesTotal?.inc?.({
                    arena: metricLabels.arena,
                    league: metricLabels.league,
                    mode_key: metricLabels.mode_key,
                });

            res.json(battle.toObject());
        } catch (err) {
            console.error('Error in /api/battle/run:', err);
            metrics?.battleRunsTotal?.inc?.({ ...metricFallback, result: 'error' });
            // Best-effort: mark lock failed so clients can see failures quickly.
            try {
                if (req.body?.requestId && req.telegramId) {
                    await BattleRunKey.updateOne(
                        { requestId: String(req.body.requestId).trim(), ownerTelegramId: String(req.telegramId) },
                        {
                            $set: {
                                status: 'failed',
                                errorCode: 'internal_error',
                                errorMessage: String(err?.message || 'internal error'),
                                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                            },
                        },
                    );
                }
            } catch {
                // ignore
            }
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
