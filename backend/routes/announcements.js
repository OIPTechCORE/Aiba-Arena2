const router = require('express').Router();
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { requireTelegram } = require('../middleware/requireTelegram');
const { getLimit } = require('../util/pagination');
const { validateQuery, validateBody, validateParams } = require('../middleware/validate');

/**
 * GET /api/announcements?limit=20
 * Feed: active, published announcements, newest first.
 * Returns unreadCount (Phase 3: announcements newer than user's lastSeenAnnouncementId).
 */
router.get(
    '/',
    requireTelegram,
    validateQuery({
        limit: { type: 'integer', min: 1, max: 100 },
    }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 20, maxLimit: 100 },
        );
        const now = new Date();

        const items = await Announcement.find({
            active: true,
            $or: [{ publishedAt: null }, { publishedAt: { $lte: now } }],
        })
            .sort({ priority: -1, publishedAt: -1, createdAt: -1 })
            .limit(limit)
            .select('_id title body type link publishedAt createdAt')
            .lean();

        let unreadCount = 0;
        let seenAt = null;
        if (telegramId) {
            const user = await User.findOne({ telegramId }).select('lastSeenAnnouncementId').lean();
            const lastSeenId = user?.lastSeenAnnouncementId ? String(user.lastSeenAnnouncementId) : '';
            if (lastSeenId) {
                const seen = await Announcement.findById(lastSeenId).select('publishedAt createdAt').lean();
                if (seen) seenAt = new Date(seen.publishedAt || seen.createdAt);
            }

            const unreadMatch = {
                active: true,
                $or: [{ publishedAt: null }, { publishedAt: { $lte: now } }],
            };
            if (seenAt && Number.isFinite(seenAt.getTime())) {
                unreadMatch.$and = [{ $or: [{ publishedAt: { $gt: seenAt } }, { publishedAt: null, createdAt: { $gt: seenAt } }] }];
            }
            unreadCount = await Announcement.countDocuments(unreadMatch);
        }

        const mapped = items.map((a) => {
            const createdOrPublished = new Date(a.publishedAt || a.createdAt);
            const isRead = seenAt && Number.isFinite(createdOrPublished.getTime())
                ? createdOrPublished.getTime() <= seenAt.getTime()
                : false;
            return { ...a, isRead: Boolean(isRead) };
        });

        res.json({ items: mapped, unreadCount });
    } catch (err) {
        console.error('Announcements list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

/**
 * POST /api/announcements/seen
 * Phase 3: Mark announcements as read. Body: { announcementId }.
 * Updates user's lastSeenAnnouncementId so unreadCount becomes 0 for this and older items.
 */
router.post(
    '/seen',
    requireTelegram,
    validateBody({
        announcementId: { type: 'objectId' },
    }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        if (!telegramId) return res.status(400).json({ error: 'telegram auth required' });
        let announcementId = req.validatedBody?.announcementId ? String(req.validatedBody.announcementId) : '';
        if (!announcementId) {
            const newest = await Announcement.findOne({
                active: true,
                $or: [{ publishedAt: null }, { publishedAt: { $lte: new Date() } }],
            })
                .sort({ priority: -1, publishedAt: -1, createdAt: -1 })
                .select('_id')
                .lean();
            announcementId = newest?._id ? String(newest._id) : '';
        }
        if (!announcementId) return res.json({ ok: true, skipped: true });

        const ann = await Announcement.findById(announcementId).select('_id publishedAt createdAt').lean();
        if (!ann) return res.status(404).json({ error: 'announcement not found' });

        const user = await User.findOne({ telegramId }).select('lastSeenAnnouncementId').lean();
        const currentSeenId = user?.lastSeenAnnouncementId ? String(user.lastSeenAnnouncementId) : '';
        if (currentSeenId) {
            const current = await Announcement.findById(currentSeenId).select('publishedAt createdAt').lean();
            const currentSeenAt = current ? new Date(current.publishedAt || current.createdAt).getTime() : 0;
            const nextSeenAt = new Date(ann.publishedAt || ann.createdAt).getTime();
            if (currentSeenAt && nextSeenAt && nextSeenAt < currentSeenAt) {
                return res.json({ ok: true, skipped: true });
            }
        }

        await User.findOneAndUpdate(
            { telegramId },
            { $set: { lastSeenAnnouncementId: announcementId } },
            { upsert: true, setDefaultsOnInsert: true },
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('Announcements seen error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

router.post('/seen-all', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        if (!telegramId) return res.status(400).json({ error: 'telegram auth required' });
        const newest = await Announcement.findOne({
            active: true,
            $or: [{ publishedAt: null }, { publishedAt: { $lte: new Date() } }],
        })
            .sort({ priority: -1, publishedAt: -1, createdAt: -1 })
            .select('_id')
            .lean();
        if (!newest?._id) return res.json({ ok: true, skipped: true });

        await User.findOneAndUpdate(
            { telegramId },
            { $set: { lastSeenAnnouncementId: newest._id } },
            { upsert: true, setDefaultsOnInsert: true },
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('Announcements seen-all error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
