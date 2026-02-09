const router = require('express').Router();
const User = require('../models/User');
const { requireTelegram } = require('../middleware/requireTelegram');
const { validateBody } = require('../middleware/validate');

router.post(
    '/connect',
    requireTelegram,
    validateBody({
        address: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        const username = req.telegramUser?.username !== undefined ? String(req.telegramUser.username || '') : '';
        const address = req.validatedBody?.address === undefined ? '' : String(req.validatedBody.address).trim();

        if (!telegramId) return res.status(400).json({ error: 'telegramId required' });
        if (!address) return res.status(400).json({ error: 'address required' });

        const user = await User.findOneAndUpdate(
            { telegramId },
            { $set: { telegramId, username, wallet: address } },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        ).lean();

        res.json({ status: 'connected', user });
    } catch (err) {
        console.error('Error in /api/wallet/connect:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
