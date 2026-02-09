const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const Announcement = require('../models/Announcement');
const { getLimit } = require('../util/pagination');
const User = require('../models/User');
const { notifyAnnouncement } = require('../services/telegramNotify');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');
const { adminAudit } = require('../middleware/adminAudit');

router.use(requireAdmin(), adminAudit());

/**
 * GET /api/admin/announcements?limit=50
 */
router.get(
    '/',
    validateQuery({ limit: { type: 'integer', min: 1, max: 100 } }),
    async (req, res) => {
    try {
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 50, maxLimit: 100 },
        );
        const items = await Announcement.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        res.json(items);
    } catch (err) {
        console.error('Admin announcements list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

/**
 * POST /api/admin/announcements
 * Body: { title, body?, type?, link?, active?, publishedAt?, priority? }
 */
router.post(
    '/',
    validateBody({
        title: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        body: { type: 'string', trim: true, maxLength: 5000 },
        type: { type: 'string', trim: true, maxLength: 20 },
        link: { type: 'string', trim: true, maxLength: 500 },
        active: { type: 'boolean' },
        publishedAt: { type: 'string', trim: true, maxLength: 50 },
        priority: { type: 'number', min: 0 },
    }),
    async (req, res) => {
    try {
        const title = String(req.validatedBody?.title ?? '').trim();
        if (!title) return res.status(400).json({ error: 'title required' });

        const body = String(req.validatedBody?.body ?? '').trim();
        const type = ['announcement', 'maintenance', 'status'].includes(String(req.validatedBody?.type ?? '').trim())
            ? String(req.validatedBody.type).trim()
            : 'announcement';
        const link = String(req.validatedBody?.link ?? '').trim();
        const active = req.validatedBody?.active === undefined ? true : Boolean(req.validatedBody.active);
        let publishedAt = req.validatedBody?.publishedAt;
        if (publishedAt !== undefined && publishedAt !== null) {
            publishedAt = new Date(publishedAt);
            if (Number.isNaN(publishedAt.getTime())) publishedAt = null;
        } else {
            publishedAt = active ? new Date() : null;
        }
        const priority = Number(req.validatedBody?.priority) || 0;

        const doc = await Announcement.create({
            title,
            body,
            type,
            link,
            active,
            publishedAt,
            priority,
        });
        res.status(201).json(doc);
    } catch (err) {
        console.error('Admin create announcement error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

/**
 * PATCH /api/admin/announcements/:id
 */
router.patch(
    '/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        title: { type: 'string', trim: true, maxLength: 200 },
        body: { type: 'string', trim: true, maxLength: 5000 },
        type: { type: 'string', trim: true, maxLength: 20 },
        link: { type: 'string', trim: true, maxLength: 500 },
        active: { type: 'boolean' },
        publishedAt: { type: 'string', trim: true, maxLength: 50 },
        priority: { type: 'number', min: 0 },
    }),
    async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const update = {};
        if (req.validatedBody?.title !== undefined) update.title = String(req.validatedBody.title).trim();
        if (req.validatedBody?.body !== undefined) update.body = String(req.validatedBody.body).trim();
        if (req.validatedBody?.type !== undefined && ['announcement', 'maintenance', 'status'].includes(String(req.validatedBody.type).trim())) {
            update.type = String(req.validatedBody.type).trim();
        }
        if (req.validatedBody?.link !== undefined) update.link = String(req.validatedBody.link).trim();
        if (req.validatedBody?.active !== undefined) update.active = Boolean(req.validatedBody.active);
        if (req.validatedBody?.publishedAt !== undefined) {
            const d = new Date(req.validatedBody.publishedAt);
            update.publishedAt = Number.isNaN(d.getTime()) ? null : d;
        }
        if (req.validatedBody?.priority !== undefined) update.priority = Number(req.validatedBody.priority) || 0;

        if (update.title !== undefined && !update.title) return res.status(400).json({ error: 'title cannot be empty' });

        const doc = await Announcement.findByIdAndUpdate(id, update, { new: true }).lean();
        if (!doc) return res.status(404).json({ error: 'not found' });
        res.json(doc);
    } catch (err) {
        console.error('Admin update announcement error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

/**
 * DELETE /api/admin/announcements/:id
 */
router.delete(
    '/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    async (req, res) => {
    try {
        const doc = await Announcement.findByIdAndDelete(req.validatedParams.id).lean();
        if (!doc) return res.status(404).json({ error: 'not found' });
        res.json({ deleted: true });
    } catch (err) {
        console.error('Admin delete announcement error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

/**
 * POST /api/admin/announcements/:id/broadcast
 * Send this announcement to all users with telegramId via Telegram (fire-and-forget, rate-friendly).
 */
router.post(
    '/:id/broadcast',
    validateParams({ id: { type: 'objectId', required: true } }),
    async (req, res) => {
    try {
        const doc = await Announcement.findById(req.validatedParams.id).lean();
        if (!doc) return res.status(404).json({ error: 'not found' });

        const users = await User.find({ telegramId: { $exists: true, $ne: '' } })
            .select('telegramId')
            .limit(5000)
            .lean();

        let sent = 0;
        for (const u of users) {
            const tid = String(u.telegramId || '').trim();
            if (!tid) continue;
            const result = await notifyAnnouncement(tid, {
                title: doc.title,
                body: doc.body,
                link: doc.link || undefined,
            });
            if (result.ok) sent++;
            await new Promise((r) => setTimeout(r, 80));
        }
        res.json({ ok: true, total: users.length, sent });
    } catch (err) {
        console.error('Admin broadcast announcement error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
