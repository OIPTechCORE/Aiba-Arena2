/**
 * Support requests (Unified Comms Phase 4 — in-app support form).
 * POST /api/support/request — user submits subject + message.
 */
const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const SupportRequest = require('../models/SupportRequest');
const { validateBody } = require('../middleware/validate');

const SUBJECT_OPTIONS = ['bug', 'feature', 'question', 'account', 'other'];

router.get('/my', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const items = await SupportRequest.find({ telegramId }).sort({ createdAt: -1 }).limit(50).lean();
        res.json(items);
    } catch (err) {
        console.error('Support my-list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.post(
    '/request',
    requireTelegram,
    validateBody({
        subject: { type: 'string', trim: true, minLength: 1, maxLength: 50, enum: SUBJECT_OPTIONS, required: true },
        message: { type: 'string', trim: true, minLength: 1, maxLength: 2000, required: true },
    }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const subject = String(req.validatedBody?.subject ?? '')
                .trim()
                .toLowerCase();
            const message = String(req.validatedBody?.message ?? '').trim();

            const doc = await SupportRequest.create({
                telegramId,
                username: req.user?.username || req.telegramUser?.username || '',
                subject,
                message,
            });
            res.status(201).json({ ok: true, id: doc._id });
        } catch (err) {
            console.error('Support request error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
