const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');
const Meme = require('../models/Meme');
const MemeLike = require('../models/MemeLike');
const MemeComment = require('../models/MemeComment');
const MemeShare = require('../models/MemeShare');
const MemeBoost = require('../models/MemeBoost');
const MemeReport = require('../models/MemeReport');
const MemeReaction = require('../models/MemeReaction');
const MemeSave = require('../models/MemeSave');
const MemeAppeal = require('../models/MemeAppeal');
const User = require('../models/User');
const { recomputeMemeScore, getMemeFiConfig } = require('../engine/memefiScoring');
const {
    getConfig,
    debitAibaFromUser,
    debitNeurFromUser,
    creditAibaNoCap,
    creditNeurNoCap,
} = require('../engine/economy');
const { rateLimit } = require('../middleware/rateLimit');

async function ensureUser(telegramId) {
    let user = await User.findOne({ telegramId }).lean();
    if (!user) {
        await User.create({ telegramId });
        user = await User.findOne({ telegramId }).lean();
    }
    return user;
}

// GET /api/memefi/feed — public feed (optional auth for "liked" flags)
router.get(
    '/feed',
    validateQuery({
        limit: { type: 'integer', min: 1, max: 50 },
        offset: { type: 'integer', min: 0 },
        category: { type: 'string', trim: true, maxLength: 50 },
        educationCategory: { type: 'string', trim: true, maxLength: 50 },
        tag: { type: 'string', trim: true, maxLength: 50 },
        sort: { type: 'string', enum: ['recent', 'score'] },
        window: { type: 'string', trim: true, maxLength: 10 },
    }),
    async (req, res) => {
        try {
            const limit = Math.min(50, Number(req.validatedQuery?.limit) || 20);
            const offset = Math.max(0, Number(req.validatedQuery?.offset) || 0);
            const category = (req.validatedQuery?.category || '').trim();
            const educationCategory = (req.validatedQuery?.educationCategory || '').trim();
            const tag = (req.validatedQuery?.tag || '').trim().toLowerCase();
            const sort = req.validatedQuery?.sort || 'recent';
            const window = (req.validatedQuery?.window || '').trim();

            const q = { hidden: { $ne: true }, $or: [{ status: 'published' }, { status: { $exists: false } }] };
            if (category) q.category = category;
            if (educationCategory) q.educationCategory = educationCategory;
            if (tag) q.tags = tag;
            if (window === '6h' || window === '24h' || window === '7d') {
                const now = Date.now();
                const ms =
                    window === '6h'
                        ? 6 * 60 * 60 * 1000
                        : window === '24h'
                          ? 24 * 60 * 60 * 1000
                          : 7 * 24 * 60 * 60 * 1000;
                q.createdAt = { $gte: new Date(now - ms) };
            }

            const sortOpt = sort === 'score' ? { engagementScore: -1, createdAt: -1 } : { createdAt: -1 };
            const memes = await Meme.find(q).sort(sortOpt).skip(offset).limit(limit).lean();

            const list = memes.map((m) => ({
                _id: m._id,
                ownerTelegramId: m.ownerTelegramId,
                caption: m.caption,
                imageUrl: m.imageUrl,
                category: m.category,
                educationCategory: m.educationCategory,
                tags: m.tags || [],
                status: m.status,
                publishedAt: m.publishedAt,
                engagementScore: m.engagementScore,
                likeCount: m.likeCount,
                commentCount: m.commentCount,
                internalShareCount: m.internalShareCount,
                externalShareCount: m.externalShareCount,
                boostTotal: m.boostTotal,
                createdAt: m.createdAt,
            }));

            res.json({ memes: list, hasMore: list.length === limit });
        } catch (err) {
            console.error('Memefi feed error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// GET /api/memefi/memes/:id — single meme with engagement summary (public)
router.get('/memes/:id', validateParams({ id: { type: 'objectId', required: true } }), async (req, res) => {
    try {
        const meme = await Meme.findOne({ _id: req.validatedParams.id, hidden: { $ne: true } }).lean();
        if (!meme) return res.status(404).json({ error: 'meme not found' });
        res.json(meme);
    } catch (err) {
        console.error('Memefi get meme error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/memefi/memes/:id/comments — list comments
router.get('/memes/:id/comments', validateParams({ id: { type: 'objectId', required: true } }), async (req, res) => {
    try {
        const memeId = req.validatedParams.id;
        const meme = await Meme.findById(memeId).select('_id').lean();
        if (!meme) return res.status(404).json({ error: 'meme not found' });
        const comments = await MemeComment.find({ memeId }).sort({ createdAt: -1 }).limit(100).lean();
        res.json(comments);
    } catch (err) {
        console.error('Memefi comments error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/memefi/templates — list enabled templates (public, for create picker)
router.get('/templates', async (_req, res) => {
    try {
        const MemeTemplate = require('../models/MemeTemplate');
        const list = await MemeTemplate.find({ enabled: true })
            .sort({ sortOrder: 1, name: 1 })
            .select('_id name imageUrl category')
            .lean();
        res.json(list);
    } catch (err) {
        console.error('Memefi templates error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.use(requireTelegram);

// POST /api/memefi/upload — create meme (imageUrl from client; client can upload to Telegram or external host)
router.post(
    '/upload',
    rateLimit({ windowMs: 60_000, max: 15, keyFn: (r) => `memefi_upload:${r.telegramId || 'unknown'}` }),
    validateBody({
        imageUrl: { type: 'string', trim: true, minLength: 5, maxLength: 2048, required: true },
        caption: { type: 'string', trim: true, maxLength: 500 },
        templateId: { type: 'string', trim: true, maxLength: 50 },
        category: { type: 'string', trim: true, maxLength: 50 },
        educationCategory: { type: 'string', trim: true, maxLength: 50 },
        tags: { type: 'array', items: { type: 'string', trim: true, maxLength: 30 } },
        status: { type: 'string', enum: ['draft', 'published'] },
        schoolId: { type: 'string', trim: true, maxLength: 30 },
    }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const {
                imageUrl,
                caption,
                templateId,
                category,
                educationCategory,
                tags: bodyTags,
                status: bodyStatus,
                schoolId: bodySchoolId,
            } = req.validatedBody;
            const captionStr = (caption || '').trim();
            const parsedTags = (captionStr.match(/#(\w+)/g) || [])
                .map((t) => t.slice(1).toLowerCase())
                .filter((t) => t.length <= 30);
            const tags =
                Array.isArray(bodyTags) && bodyTags.length > 0
                    ? bodyTags
                          .slice(0, 10)
                          .map((t) => String(t).trim().toLowerCase())
                          .filter(Boolean)
                    : parsedTags;
            const status = bodyStatus === 'draft' ? 'draft' : 'published';
            const publishedAt = status === 'published' ? new Date() : null;

            const schoolIdObj =
                (bodySchoolId || '').trim() && /^[a-fA-F0-9]{24}$/.test(String(bodySchoolId).trim())
                    ? String(bodySchoolId).trim()
                    : null;
            const meme = await Meme.create({
                ownerTelegramId: telegramId,
                imageUrl: imageUrl.trim(),
                caption: captionStr,
                templateId: (templateId || '').trim(),
                category: (category || 'general').trim() || 'general',
                educationCategory: (educationCategory || '').trim(),
                tags,
                status,
                publishedAt,
                schoolId: schoolIdObj,
                watermarkApplied: false,
                engagementScore: 0,
                likeCount: 0,
                commentCount: 0,
                internalShareCount: 0,
                externalShareCount: 0,
                boostTotal: 0,
            });

            const recomputed = await recomputeMemeScore(meme._id);
            const out = await Meme.findById(meme._id).lean();
            if (out && recomputed !== null) out.engagementScore = recomputed;
            res.status(201).json(out || meme.toObject());
        } catch (err) {
            console.error('Memefi upload error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// GET /api/memefi/memes/:id/reactions — reaction counts + current user's reaction (auth)
router.get('/memes/:id/reactions', validateParams({ id: { type: 'objectId', required: true } }), async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const memeId = req.validatedParams.id;
        const reactions = await MemeReaction.aggregate([
            { $match: { memeId } },
            { $group: { _id: '$reactionType', count: { $sum: 1 } } },
        ]);
        const reactionCounts = {};
        for (const x of reactions) reactionCounts[x._id] = x.count;
        const my = await MemeReaction.findOne({ memeId, telegramId }).select('reactionType').lean();
        const saved = await MemeSave.findOne({ memeId, telegramId }).select('_id').lean();
        res.json({ reactionCounts, myReaction: my?.reactionType || '', saved: !!saved });
    } catch (err) {
        console.error('Memefi meme reactions error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/memefi/memes/:id/like — toggle like
router.post(
    '/memes/:id/like',
    validateParams({ id: { type: 'objectId', required: true } }),
    rateLimit({ windowMs: 60_000, max: 60, keyFn: (r) => `memefi_like:${r.telegramId || 'unknown'}` }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const memeId = req.validatedParams.id;

            const meme = await Meme.findById(memeId);
            if (!meme) return res.status(404).json({ error: 'meme not found' });
            if (meme.hidden) return res.status(403).json({ error: 'meme hidden' });

            const existing = await MemeLike.findOne({ memeId, telegramId });
            if (existing) {
                await MemeLike.deleteOne({ _id: existing._id });
                await Meme.updateOne({ _id: memeId }, { $inc: { likeCount: -1 } });
                await recomputeMemeScore(memeId);
                return res.json({ liked: false, likeCount: Math.max(0, (meme.likeCount || 0) - 1) });
            }

            await MemeLike.create({ memeId, telegramId });
            await Meme.updateOne({ _id: memeId }, { $inc: { likeCount: 1 } });
            await recomputeMemeScore(memeId);
            const updated = await Meme.findById(memeId).select('likeCount engagementScore').lean();
            res.json({ liked: true, likeCount: updated?.likeCount ?? meme.likeCount + 1 });
        } catch (err) {
            console.error('Memefi like error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/memefi/memes/:id/comment — add comment
router.post(
    '/memes/:id/comment',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({ text: { type: 'string', trim: true, minLength: 1, maxLength: 500, required: true } }),
    rateLimit({ windowMs: 60_000, max: 30, keyFn: (r) => `memefi_comment:${r.telegramId || 'unknown'}` }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const memeId = req.validatedParams.id;
            const text = req.validatedBody.text.trim();

            const meme = await Meme.findById(memeId);
            if (!meme) return res.status(404).json({ error: 'meme not found' });
            if (meme.hidden) return res.status(403).json({ error: 'meme hidden' });

            const comment = await MemeComment.create({ memeId, telegramId, text });
            await Meme.updateOne({ _id: memeId }, { $inc: { commentCount: 1 } });
            await recomputeMemeScore(memeId);
            const updated = await Meme.findById(memeId).select('commentCount engagementScore').lean();
            res.status(201).json({
                comment: {
                    _id: comment._id,
                    text: comment.text,
                    telegramId: comment.telegramId,
                    createdAt: comment.createdAt,
                },
                commentCount: updated?.commentCount ?? meme.commentCount + 1,
            });
        } catch (err) {
            console.error('Memefi comment error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/memefi/memes/:id/share — record share (internal or external)
router.post(
    '/memes/:id/share',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({ kind: { type: 'string', enum: ['internal', 'external'], required: true } }),
    rateLimit({ windowMs: 60_000, max: 30, keyFn: (r) => `memefi_share:${r.telegramId || 'unknown'}` }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const memeId = req.validatedParams.id;
            const kind = req.validatedBody.kind;

            const meme = await Meme.findById(memeId);
            if (!meme) return res.status(404).json({ error: 'meme not found' });
            if (meme.hidden) return res.status(403).json({ error: 'meme hidden' });

            const existing = await MemeShare.findOne({ memeId, telegramId, kind });
            if (existing) return res.json({ shared: true, kind });

            await MemeShare.create({ memeId, telegramId, kind });
            const field = kind === 'internal' ? 'internalShareCount' : 'externalShareCount';
            await Meme.updateOne({ _id: memeId }, { $inc: { [field]: 1 } });
            await recomputeMemeScore(memeId);
            const updated = await Meme.findById(memeId)
                .select('internalShareCount externalShareCount engagementScore')
                .lean();
            res.status(201).json({
                shared: true,
                kind,
                internalShareCount: updated?.internalShareCount ?? 0,
                externalShareCount: updated?.externalShareCount ?? 0,
            });
        } catch (err) {
            console.error('Memefi share error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/memefi/memes/:id/boost — stake AIBA/NEUR to boost meme (Phase 2: off-chain lock)
router.post(
    '/memes/:id/boost',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        amountAiba: { type: 'number', min: 0 },
        amountNeur: { type: 'number', min: 0 },
    }),
    rateLimit({ windowMs: 60_000, max: 20, keyFn: (r) => `memefi_boost:${r.telegramId || 'unknown'}` }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const memeId = req.validatedParams.id;
            let amountAiba = Math.floor(Number(req.validatedBody?.amountAiba) || 0);
            let amountNeur = Math.floor(Number(req.validatedBody?.amountNeur) || 0);

            if (amountAiba <= 0 && amountNeur <= 0)
                return res.status(400).json({ error: 'amountAiba or amountNeur required' });

            const meme = await Meme.findById(memeId);
            if (!meme) return res.status(404).json({ error: 'meme not found' });
            if (meme.hidden) return res.status(403).json({ error: 'meme hidden' });

            const cfg = await getMemeFiConfig();
            const minAiba = Math.max(0, Number(cfg.boostMinAiba) || 0);
            if (amountAiba > 0 && amountAiba < minAiba)
                return res.status(400).json({ error: 'amountAiba below minimum', min: minAiba });

            if (amountAiba > 0) {
                const debit = await debitAibaFromUser(amountAiba, {
                    telegramId,
                    reason: 'memefi_boost',
                    sourceType: 'memefi_boost',
                    sourceId: String(memeId),
                    meta: { memeId: String(memeId) },
                });
                if (!debit.ok)
                    return res.status(403).json({ error: debit.error || 'insufficient AIBA', need: amountAiba });
            }
            if (amountNeur > 0) {
                const debit = await debitNeurFromUser(amountNeur, {
                    telegramId,
                    reason: 'memefi_boost',
                    sourceType: 'memefi_boost',
                    sourceId: String(memeId),
                    meta: { memeId: String(memeId) },
                });
                if (!debit.ok) {
                    if (amountAiba > 0)
                        await creditAibaNoCap(amountAiba, {
                            telegramId,
                            reason: 'memefi_boost_refund',
                            sourceType: 'memefi_boost_refund',
                            sourceId: String(memeId),
                        });
                    return res.status(403).json({ error: debit.error || 'insufficient NEUR', need: amountNeur });
                }
            }

            const lockHours = Number(cfg.boostLockHours) || 24;
            const unlockedAt = new Date(Date.now() + lockHours * 60 * 60 * 1000);
            const boostMul = Number(cfg.boostMultiplierPerUnit) || 0.1;
            const contribution = amountAiba + amountNeur;

            await MemeBoost.create({
                memeId,
                telegramId,
                amountAiba,
                amountNeur,
                multiplier: 1 + contribution * boostMul,
                unlockedAt,
            });
            await Meme.updateOne({ _id: memeId }, { $inc: { boostTotal: contribution } });
            await recomputeMemeScore(memeId);

            const updated = await Meme.findById(memeId).select('boostTotal engagementScore').lean();
            res.status(201).json({
                boosted: true,
                amountAiba,
                amountNeur,
                unlockedAt,
                boostTotal: updated?.boostTotal ?? meme.boostTotal + contribution,
                engagementScore: updated?.engagementScore,
            });
        } catch (err) {
            console.error('Memefi boost error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/memefi/memes/:id/report — report meme (anti-spam); auto-hide when threshold reached (unless trusted creator)
router.post(
    '/memes/:id/report',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({ reason: { type: 'string', trim: true, maxLength: 100 } }),
    rateLimit({ windowMs: 60_000, max: 10, keyFn: (r) => `memefi_report:${r.telegramId || 'unknown'}` }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const memeId = req.validatedParams.id;
            const reason = (req.validatedBody?.reason || 'spam').trim();

            const meme = await Meme.findById(memeId);
            if (!meme) return res.status(404).json({ error: 'meme not found' });

            const existing = await MemeReport.findOne({ memeId, telegramId });
            if (existing) return res.json({ reported: true });

            await MemeReport.create({ memeId, telegramId, reason });
            const updated = await Meme.findOneAndUpdate(
                { _id: memeId },
                { $inc: { reportCount: 1 } },
                { new: true },
            ).lean();
            const newCount = updated?.reportCount ?? (meme.reportCount || 0) + 1;
            const cfg = await getMemeFiConfig();
            const threshold = Math.max(0, Number(cfg.autoHideReportThreshold) || 0);
            if (threshold > 0 && newCount >= threshold) {
                const owner = await User.findOne({ telegramId: meme.ownerTelegramId }).select('memefiTrusted').lean();
                if (!owner?.memefiTrusted) {
                    await Meme.updateOne(
                        { _id: memeId },
                        { $set: { hidden: true, hiddenReason: 'auto_hide_report_threshold' } },
                    );
                }
            }
            res.status(201).json({ reported: true });
        } catch (err) {
            console.error('Memefi report error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/memefi/memes/:id/reaction — set reaction (fire, funny, edu); one per user per meme (replace on change)
router.post(
    '/memes/:id/reaction',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({ reactionType: { type: 'string', trim: true, minLength: 1, maxLength: 20, required: true } }),
    rateLimit({ windowMs: 60_000, max: 60, keyFn: (r) => `memefi_reaction:${r.telegramId || 'unknown'}` }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const memeId = req.validatedParams.id;
            const reactionType = req.validatedBody.reactionType.trim().toLowerCase();

            const meme = await Meme.findById(memeId);
            if (!meme) return res.status(404).json({ error: 'meme not found' });
            if (meme.hidden) return res.status(403).json({ error: 'meme hidden' });

            await MemeReaction.findOneAndUpdate({ memeId, telegramId }, { $set: { reactionType } }, { upsert: true });
            await recomputeMemeScore(memeId);
            const counts = await MemeReaction.aggregate([
                { $match: { memeId: meme._id } },
                { $group: { _id: '$reactionType', count: { $sum: 1 } } },
            ]);
            const reactionCounts = {};
            for (const c of counts) reactionCounts[c._id] = c.count;
            res.json({ reactionType, reactionCounts });
        } catch (err) {
            console.error('Memefi reaction error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/memefi/memes/:id/save — toggle save (bookmark)
router.post(
    '/memes/:id/save',
    validateParams({ id: { type: 'objectId', required: true } }),
    rateLimit({ windowMs: 60_000, max: 30, keyFn: (r) => `memefi_save:${r.telegramId || 'unknown'}` }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const memeId = req.validatedParams.id;

            const meme = await Meme.findById(memeId).select('_id hidden').lean();
            if (!meme) return res.status(404).json({ error: 'meme not found' });
            if (meme.hidden) return res.status(403).json({ error: 'meme hidden' });

            const existing = await MemeSave.findOne({ memeId, telegramId });
            if (existing) {
                await MemeSave.deleteOne({ _id: existing._id });
                return res.json({ saved: false });
            }
            await MemeSave.create({ memeId, telegramId });
            res.status(201).json({ saved: true });
        } catch (err) {
            console.error('Memefi save error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// GET /api/memefi/me/saved — list saved meme ids
router.get('/me/saved', async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
        const offset = Math.max(0, Number(req.query.offset) || 0);
        const saves = await MemeSave.find({ telegramId }).sort({ createdAt: -1 }).skip(offset).limit(limit).lean();
        res.json(saves.map((s) => s.memeId));
    } catch (err) {
        console.error('Memefi me/saved error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/memefi/me/memes — current user's memes (e.g. status=draft for "My drafts")
router.get(
    '/me/memes',
    validateQuery({
        status: { type: 'string', enum: ['draft', 'published'] },
        limit: { type: 'integer', min: 1, max: 50 },
        offset: { type: 'integer', min: 0 },
    }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const status = (req.validatedQuery?.status || 'draft').trim();
            const limit = Math.min(50, Math.max(1, Number(req.validatedQuery?.limit) || 20));
            const offset = Math.max(0, Number(req.validatedQuery?.offset) || 0);
            const q = { ownerTelegramId: telegramId, status };
            const memes = await Meme.find(q).sort({ createdAt: -1 }).skip(offset).limit(limit).lean();
            res.json({ memes, hasMore: memes.length === limit });
        } catch (err) {
            console.error('Memefi me/memes error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// GET /api/memefi/me/memes/:id — get own meme by id (including hidden, for appeal/draft view)
router.get('/me/memes/:id', validateParams({ id: { type: 'objectId', required: true } }), async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const memeId = req.validatedParams.id;
        const meme = await Meme.findOne({ _id: memeId, ownerTelegramId: telegramId }).lean();
        if (!meme) return res.status(404).json({ error: 'meme not found' });
        res.json(meme);
    } catch (err) {
        console.error('Memefi me/memes/:id error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/memefi/memes/:id/appeal — creator appeals hidden meme
router.post(
    '/memes/:id/appeal',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({ reason: { type: 'string', trim: true, maxLength: 500 } }),
    rateLimit({ windowMs: 60_000, max: 5, keyFn: (r) => `memefi_appeal:${r.telegramId || 'unknown'}` }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const memeId = req.validatedParams.id;
            const reason = (req.validatedBody?.reason || '').trim();

            const meme = await Meme.findById(memeId);
            if (!meme) return res.status(404).json({ error: 'meme not found' });
            if (meme.ownerTelegramId !== telegramId) return res.status(403).json({ error: 'not owner' });
            if (!meme.hidden) return res.status(400).json({ error: 'meme is not hidden' });

            const existing = await MemeAppeal.findOne({ memeId }).sort({ createdAt: -1 }).lean();
            if (existing && existing.status === 'pending')
                return res.status(400).json({ error: 'appeal already pending' });

            const appeal = await MemeAppeal.create({ memeId, telegramId, reason, status: 'pending' });
            res.status(201).json({ appealId: appeal._id, status: 'pending' });
        } catch (err) {
            console.error('Memefi appeal error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// PATCH /api/memefi/memes/:id/publish — publish draft (owner only)
router.patch(
    '/memes/:id/publish',
    validateParams({ id: { type: 'objectId', required: true } }),
    rateLimit({ windowMs: 60_000, max: 20, keyFn: (r) => `memefi_publish:${r.telegramId || 'unknown'}` }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const memeId = req.validatedParams.id;

            const meme = await Meme.findById(memeId);
            if (!meme) return res.status(404).json({ error: 'meme not found' });
            if (meme.ownerTelegramId !== telegramId) return res.status(403).json({ error: 'not owner' });
            if (meme.status === 'published') return res.json({ published: true, publishedAt: meme.publishedAt });

            await Meme.updateOne({ _id: memeId }, { $set: { status: 'published', publishedAt: new Date() } });
            await recomputeMemeScore(memeId);
            const updated = await Meme.findById(memeId).select('status publishedAt engagementScore').lean();
            res.json({ published: true, publishedAt: updated?.publishedAt, engagementScore: updated?.engagementScore });
        } catch (err) {
            console.error('Memefi publish error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// GET /api/memefi/trending — top memes in time window (6h, 24h, 7d)
router.get(
    '/trending',
    validateQuery({
        window: { type: 'string', enum: ['6h', '24h', '7d'] },
        limit: { type: 'integer', min: 1, max: 50 },
    }),
    async (req, res) => {
        try {
            const window = req.validatedQuery?.window || '24h';
            const limit = Math.min(50, Number(req.validatedQuery?.limit) || 20);
            const ms =
                window === '6h' ? 6 * 60 * 60 * 1000 : window === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
            const since = new Date(Date.now() - ms);
            const q = {
                hidden: { $ne: true },
                $or: [{ status: 'published' }, { status: { $exists: false } }],
                createdAt: { $gte: since },
            };
            const memes = await Meme.find(q).sort({ engagementScore: -1, createdAt: -1 }).limit(limit).lean();
            res.json({ window, memes });
        } catch (err) {
            console.error('Memefi trending error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// GET /api/memefi/leaderboard — top memes or top creators; optional schoolId filter
router.get(
    '/leaderboard',
    validateQuery({
        by: { type: 'string', enum: ['score', 'creators'] },
        limit: { type: 'integer', min: 1, max: 50 },
        category: { type: 'string', trim: true, maxLength: 50 },
        educationCategory: { type: 'string', trim: true, maxLength: 50 },
        schoolId: { type: 'objectId' },
    }),
    async (req, res) => {
        try {
            const by = req.validatedQuery?.by || 'score';
            const limit = Math.min(50, Number(req.validatedQuery?.limit) || 20);
            const category = (req.validatedQuery?.category || '').trim();
            const educationCategory = (req.validatedQuery?.educationCategory || '').trim();
            const schoolId = req.validatedQuery?.schoolId || null;

            if (by === 'score') {
                const q = { hidden: { $ne: true } };
                if (category) q.category = category;
                if (educationCategory) q.educationCategory = educationCategory;
                if (schoolId) q.schoolId = schoolId;
                const memes = await Meme.find(q).sort({ engagementScore: -1, createdAt: -1 }).limit(limit).lean();
                return res.json({ by: 'score', memes });
            }

            const q = [{ $match: { hidden: { $ne: true } } }];
            if (category) q.push({ $match: { category } });
            if (educationCategory) q.push({ $match: { educationCategory } });
            if (schoolId) q.push({ $match: { schoolId } });
            q.push(
                {
                    $group: {
                        _id: '$ownerTelegramId',
                        totalScore: { $sum: '$engagementScore' },
                        memeCount: { $sum: 1 },
                    },
                },
                { $sort: { totalScore: -1 } },
                { $limit: limit },
            );
            const creators = await Meme.aggregate(q);
            res.json({ by: 'creators', creators });
        } catch (err) {
            console.error('Memefi leaderboard error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// GET /api/memefi/earn-summary — user's meme earnings (for Earn tab)
router.get('/earn-summary', async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const LedgerEntry = require('../models/LedgerEntry');
        const entries = await LedgerEntry.aggregate([
            {
                $match: {
                    telegramId,
                    direction: 'credit',
                    applied: true,
                    $or: [
                        { reason: 'memefi_top_meme' },
                        { reason: 'memefi_booster' },
                        { reason: 'memefi_lottery' },
                        { reason: 'memefi_mining' },
                    ],
                },
            },
            { $group: { _id: '$currency', total: { $sum: '$amount' } } },
        ]);
        const earnedAiba = entries.find((e) => e._id === 'AIBA')?.total ?? 0;
        const earnedNeur = entries.find((e) => e._id === 'NEUR')?.total ?? 0;
        const myMemesCount = await Meme.countDocuments({ ownerTelegramId: telegramId });
        const myBoostsCount = await MemeBoost.countDocuments({ telegramId });
        let creatorTier = 'bronze';
        try {
            const cfg = await getMemeFiConfig();
            const { getCreatorTierForTelegram } = require('../jobs/memefiDailyRewards');
            const tierInfo = await getCreatorTierForTelegram(telegramId, cfg);
            creatorTier = tierInfo.tier || 'bronze';
        } catch (_) {
            /* ignore */
        }
        res.json({
            earnedAiba,
            earnedNeur,
            myMemesCount,
            myBoostsCount,
            creatorTier,
        });
    } catch (err) {
        console.error('Memefi earn-summary error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/memefi/me/likes — meme ids current user liked (for feed UI)
router.get('/me/likes', async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const likes = await MemeLike.find({ telegramId }).select('memeId').lean();
        res.json(likes.map((l) => l.memeId));
    } catch (err) {
        console.error('Memefi me/likes error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/memefi/cron/daily-rewards — run daily pool distribution (call with x-cron-secret or from server cron)
router.post('/cron/daily-rewards', async (req, res) => {
    try {
        const secret = process.env.CRON_SECRET || process.env.ADMIN_JWT_SECRET || '';
        const headerSecret = req.headers['x-cron-secret'] || req.headers['x-cron-secret'] || '';
        if (secret && headerSecret !== secret) return res.status(401).json({ error: 'unauthorized' });

        const { runDailyMemeFiRewards, utcDayKey } = require('../jobs/memefiDailyRewards');
        const dayKey = req.body?.dayKey || utcDayKey();
        const results = await runDailyMemeFiRewards(dayKey);
        res.json(results);
    } catch (err) {
        console.error('Memefi cron daily-rewards error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/memefi/cron/weekly-rewards — run weekly pool (call with x-cron-secret)
router.post('/cron/weekly-rewards', async (req, res) => {
    try {
        const secret = process.env.CRON_SECRET || process.env.ADMIN_JWT_SECRET || '';
        const headerSecret = req.headers['x-cron-secret'] || req.headers['x-cron-secret'] || '';
        if (secret && headerSecret !== secret) return res.status(401).json({ error: 'unauthorized' });

        const { runWeeklyMemeFiRewards, isoWeekKey } = require('../jobs/memefiWeeklyRewards');
        const weekKey = req.body?.weekKey || isoWeekKey();
        const results = await runWeeklyMemeFiRewards(weekKey);
        res.json(results);
    } catch (err) {
        console.error('Memefi cron weekly-rewards error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
