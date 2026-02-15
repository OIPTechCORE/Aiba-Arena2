const router = require('express').Router();

const { requireTelegram } = require('../middleware/requireTelegram');
const Broker = require('../models/Broker');
const Battle = require('../models/Battle');
const User = require('../models/User');
const BattleRunKey = require('../models/BattleRunKey');
const ActionRunKey = require('../models/ActionRunKey');
const Guild = require('../models/Guild');
const GameMode = require('../models/GameMode');
const Boost = require('../models/Boost');
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
    safeCreateLedgerEntry,
} = require('../engine/economy');
const { createSignedClaim } = require('../ton/signRewardClaim');
const { getVaultLastSeqno } = require('../ton/vaultRead');
const { rateLimit } = require('../middleware/rateLimit');
const { validateBody } = require('../middleware/validate');
const { metrics } = require('../metrics');
const { clampInt, applyEnergyRegen } = require('../engine/battleEnergy');
const { buildBattleSeedMessage } = require('../engine/battleSeed');
const { getBattleCooldownKey } = require('../engine/battleCooldown');
const { getRewardMultiplier, updateBattleWinStreak, resetBattleWinStreak, getCreatorReferrerAndBps } = require('../engine/innovations');
const { recordBossDamageFromBattle } = require('./globalBoss');

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
    validateBody({
        requestId: { type: 'string', trim: true, minLength: 1, maxLength: 128, required: true },
        brokerId: { type: 'objectId', required: true },
        arena: { type: 'string', trim: true, maxLength: 50 },
        league: { type: 'string', trim: true, maxLength: 50 },
        modeKey: { type: 'string', trim: true, maxLength: 100 },
        autoClaim: { type: 'boolean' },
    }),
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
            let proposedAiba = Math.max(0, Math.floor(score * cfg.baseRewardAibaPerScore * multAiba));

            // NEUR off-chain ledger (server-authoritative)
            let rewardNeur = 0;
            const multNeur = Number(mode?.rewardMultiplierNeur ?? 1) || 1;
            let proposedNeur = Math.max(0, Math.floor(score * cfg.baseRewardNeurPerScore * multNeur));

            // Innovations: streak + premium + win streak multiplier
            const innovationsMul = await getRewardMultiplier(telegramId, cfg);
            if (innovationsMul > 1) {
                proposedAiba = Math.max(0, Math.floor(proposedAiba * innovationsMul));
                proposedNeur = Math.max(0, Math.floor(proposedNeur * innovationsMul));
            }
            // Boost: active boost multiplies rewards
            const nowBoost = new Date();
            const activeBoost = await Boost.findOne({
                telegramId,
                expiresAt: { $gt: nowBoost },
            })
                .sort({ expiresAt: -1 })
                .lean();
            const boostMul = activeBoost && Number(activeBoost.multiplier) > 0 ? Number(activeBoost.multiplier) : 1;
            if (boostMul > 1) {
                proposedAiba = Math.max(0, Math.floor(proposedAiba * boostMul));
                proposedNeur = Math.max(0, Math.floor(proposedNeur * boostMul));
            }
            let guildShareNeur = 0;
            if (proposedNeur > 0) {
                const neurEmit = await tryEmitNeur(proposedNeur, { arena, league });
                if (neurEmit.ok) {
                    rewardNeur = proposedNeur;

                    // Guild wars reward splitting (off-chain NEUR):
                    // 20% to guild (1% to leader = creator revenue, 19% to vault), 80% to the player.
                    if (requiresGuild && guild?._id) {
                        guildShareNeur = Math.floor(rewardNeur * 0.2);
                        const creatorBps = Math.min(10000, Math.max(0, Number(cfg?.guildCreatorShareBps ?? 100)));
                        const creatorShareNeur = Math.floor((guildShareNeur * creatorBps) / 10000);
                        const vaultShareNeur = guildShareNeur - creatorShareNeur;
                        const userShare = rewardNeur - guildShareNeur;

                        if (vaultShareNeur > 0) {
                            await Guild.updateOne({ _id: guild._id }, { $inc: { vaultNeur: vaultShareNeur } });
                        }
                        if (creatorShareNeur > 0 && guild.ownerTelegramId) {
                            await creditNeurNoCap(creatorShareNeur, {
                                telegramId: guild.ownerTelegramId,
                                reason: 'guild_creator_earnings',
                                arena,
                                league,
                                sourceType: 'guild_war_member_earnings',
                                sourceId: requestId,
                                meta: { guildId: String(guild._id), memberTelegramId: telegramId, amountNeur: creatorShareNeur },
                            });
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

            // Innovations: update battle win streak
            if (score > 0) {
                updateBattleWinStreak(telegramId).catch(() => {});
                recordBossDamageFromBattle(telegramId, score, null).catch(() => {});
            } else {
                resetBattleWinStreak(telegramId).catch(() => {});
            }

            // Creator Economy: credit referrer with % of referee's battle earnings (tier-based)
            if ((rewardAiba > 0 || rewardNeur > 0) && cfg) {
                getCreatorReferrerAndBps(telegramId, cfg)
                    .then(async (creator) => {
                        if (!creator?.referrerTelegramId) return;
                        const creatorAiba = Math.floor((rewardAiba * creator.bps) / 10000);
                        const creatorNeur = Math.floor((rewardNeur * creator.bps) / 10000);
                        if (creatorAiba > 0) {
                            await creditAibaNoCap(creatorAiba, {
                                telegramId: creator.referrerTelegramId,
                                reason: 'creator_earnings',
                                arena,
                                league,
                                sourceType: 'creator_referee_battle',
                                sourceId: requestId,
                                meta: { refereeTelegramId: telegramId, bps: creator.bps, amountAiba: creatorAiba },
                            });
                        }
                        if (creatorNeur > 0) {
                            await creditNeurNoCap(creatorNeur, {
                                telegramId: creator.referrerTelegramId,
                                reason: 'creator_earnings',
                                arena,
                                league,
                                sourceType: 'creator_referee_battle',
                                sourceId: requestId,
                                meta: { refereeTelegramId: telegramId, bps: creator.bps, amountNeur: creatorNeur },
                            });
                        }
                    })
                    .catch((err) => console.error('Creator economy credit error:', err));
            }
            // Stars: per battle *win* only (Telegram Stars–style); ledger for audit
            const starReward = score > 0 ? Math.max(0, Math.floor(Number(cfg.starRewardPerBattle ?? 0))) : 0;
            if (starReward > 0) {
                await User.updateOne({ telegramId }, { $inc: { starsBalance: starReward } }).catch(() => {});
                await safeCreateLedgerEntry({
                    telegramId,
                    currency: 'STARS',
                    direction: 'credit',
                    amount: starReward,
                    reason: 'battle_reward',
                    arena,
                    league,
                    sourceType: 'battle',
                    sourceId: requestId,
                    requestId,
                    meta: { brokerId, score },
                }).catch(() => {});
            }

            // Diamonds: one-time first win (TON/Telegram premium); ledger for audit
            let firstWinDiamondAwarded = 0;
            const diamondReward = Math.max(0, Math.floor(Number(cfg.diamondRewardFirstWin ?? 0)));
            if (score > 0 && diamondReward > 0) {
                const firstWinUpdate = await User.findOneAndUpdate(
                    { telegramId, firstWinDiamondAwardedAt: null },
                    {
                        $set: { firstWinDiamondAwardedAt: new Date() },
                        $inc: { diamondsBalance: diamondReward },
                    },
                    { new: true },
                ).lean();
                if (firstWinUpdate) {
                    firstWinDiamondAwarded = diamondReward;
                    metrics?.battleRunsTotal?.inc?.({ ...metricLabels, first_win_diamond: 'yes' });
                    await safeCreateLedgerEntry({
                        telegramId,
                        currency: 'DIAMONDS',
                        direction: 'credit',
                        amount: diamondReward,
                        reason: 'first_win',
                        arena,
                        league,
                        sourceType: 'battle',
                        sourceId: requestId,
                        requestId,
                        meta: { brokerId, score, firstWin: true },
                    }).catch(() => {});
                }
            }

            const vaultAddress = String(process.env.ARENA_VAULT_ADDRESS || '').trim();
            const jettonMaster = String(process.env.AIBA_JETTON_MASTER || '').trim();

            const toAddress = user?.wallet ? String(user.wallet) : '';

            const autoClaim = Boolean(req.body?.autoClaim);
            if (autoClaim && vaultAddress && jettonMaster && toAddress && rewardAiba > 0) {
                // IMPORTANT: derive seqno from on-chain vault state so failed claims don't desync.
                // If the backend can't read on-chain state, we fail safe and return no claim.
                const mutex = await acquireClaimMutex({ telegramId });
                if (!mutex.ok && mutex.inProgress) {
                    // Another claim is being prepared; keep credits and let user claim later.
                    claim = {};
                } else if (mutex.ok) {
                    const mutexId = mutex?.lockId || '';
                    try {
                        const lastOnchain = await getVaultLastSeqno(vaultAddress, toAddress);
                        const lastIssued = safeVaultClaimSeqno(user);
                        // If there's an outstanding unconfirmed claim, do not create another one (it would collide or gap).
                        if (lastIssued > lastOnchain) {
                            claim = {};
                        } else {
                            const nextSeqno = (lastIssued > lastOnchain ? lastIssued : lastOnchain) + 1n;
                            const validUntil = Math.floor(Date.now() / 1000) + 10 * 60; // 10 minutes
                            const amount = String(rewardAiba); // smallest units (MVP: 1 token == 1 unit)

                            const signed = await createSignedClaim({
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
                        }
                    } catch {
                        claim = {};
                    } finally {
                        await releaseClaimMutex(mutexId);
                    }
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

            // Push notification: "Your AI just won" (fire-and-forget)
            if (score > 0) {
                const { notifyBattleWin } = require('../services/telegramNotify');
                notifyBattleWin(telegramId, {
                    score,
                    arena,
                    rewardAiba,
                    rewardNeur,
                    starsGranted: starReward,
                    firstWinDiamond: firstWinDiamondAwarded,
                }).catch(() => {});
            }

            const battlePayload = { ...battle.toObject(), starsGranted: starReward, firstWinDiamond: firstWinDiamondAwarded };
            res.json(battlePayload);
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
