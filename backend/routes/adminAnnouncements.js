const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { notifyAnnouncement } = require('../services/telegramNotify');

router.use(requireAdmin());

/**
 * GET /api/admin/announcements?limit=50
 */
router.get('/', async (req, res) => {
    try {
        const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 50));
        const items = await Announcement.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        res.json(items);
    } catch (err) {
        console.error('Admin announcements list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

/**
 * POST /api/admin/announcements
 * Body: { title, body?, type?, link?, active?, publishedAt?, priority? }
 */
router.post('/', async (req, res) => {
    try {
        const title = String(req.body?.title ?? '').trim();
        if (!title) return res.status(400).json({ error: 'title required' });

        const body = String(req.body?.body ?? '').trim();
        const type = ['announcement', 'maintenance', 'status'].includes(String(req.body?.type ?? '').trim())
            ? String(req.body.type).trim()
            : 'announcement';
        const link = String(req.body?.link ?? '').trim();
        const active = req.body?.active === undefined ? true : Boolean(req.body.active);
        let publishedAt = req.body?.publishedAt;
        if (publishedAt !== undefined && publishedAt !== null) {
            publishedAt = new Date(publishedAt);
            if (Number.isNaN(publishedAt.getTime())) publishedAt = null;
        } else {
            publishedAt = active ? new Date() : null;
        }
        const priority = Number(req.body?.priority) || 0;

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
});

/**
 * PATCH /api/admin/announcements/:id
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const update = {};
        if (req.body?.title !== undefined) update.title = String(req.body.title).trim();
        if (req.body?.body !== undefined) update.body = String(req.body.body).trim();
        if (req.body?.type !== undefined && ['announcement', 'maintenance', 'status'].includes(String(req.body.type).trim())) {
            update.type = String(req.body.type).trim();
        }
        if (req.body?.link !== undefined) update.link = String(req.body.link).trim();
        if (req.body?.active !== undefined) update.active = Boolean(req.body.active);
        if (req.body?.publishedAt !== undefined) {
            const d = new Date(req.body.publishedAt);
            update.publishedAt = Number.isNaN(d.getTime()) ? null : d;
        }
        if (req.body?.priority !== undefined) update.priority = Number(req.body.priority) || 0;

        if (update.title !== undefined && !update.title) return res.status(400).json({ error: 'title cannot be empty' });

        const doc = await Announcement.findByIdAndUpdate(id, update, { new: true }).lean();
        if (!doc) return res.status(404).json({ error: 'not found' });
        res.json(doc);
    } catch (err) {
        console.error('Admin update announcement error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

/**
 * DELETE /api/admin/announcements/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const doc = await Announcement.findByIdAndDelete(req.params.id).lean();
        if (!doc) return res.status(404).json({ error: 'not found' });
        res.json({ deleted: true });
    } catch (err) {
        console.error('Admin delete announcement error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

/**
 * POST /api/admin/announcements/:id/broadcast
 * Send this announcement to all users with telegramId via Telegram (fire-and-forget, rate-friendly).
 */
router.post('/:id/broadcast', async (req, res) => {
    try {
        const doc = await Announcement.findById(req.params.id).lean();
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
});

module.exports = router;
