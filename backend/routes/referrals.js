const router = require('express').Router();
const crypto = require('crypto');
const requireTelegram = require('../middleware/requireTelegram');
const Referral = require('../models/Referral');

router.use(requireTelegram);

function makeCode() {
    return crypto.randomBytes(5).toString('hex'); // 10 chars
}

// POST /api/referrals/create
router.post('/create', async (req, res) => {
    const telegramId = String(req.telegramId);

    const existing = await Referral.findOne({ ownerTelegramId: telegramId, active: true }).lean();
    if (existing) return res.json(existing);

    for (let i = 0; i < 5; i++) {
        try {
            const created = await Referral.create({ ownerTelegramId: telegramId, code: makeCode() });
            return res.status(201).json(created);
        } catch (err) {
            if (String(err?.code) === '11000') continue;
            console.error('Error creating referral:', err);
            return res.status(500).json({ error: 'internal server error' });
        }
    }

    return res.status(500).json({ error: 'could not create unique code' });
});

// POST /api/referrals/use
router.post('/use', async (req, res) => {
    const telegramId = String(req.telegramId);
    const code = String(req.body?.code || '').trim().toLowerCase();
    if (!code) return res.status(400).json({ error: 'code required' });

    const ref = await Referral.findOne({ code, active: true });
    if (!ref) return res.status(404).json({ error: 'invalid code' });
    if (String(ref.ownerTelegramId) === telegramId) return res.status(400).json({ error: 'cannot refer yourself' });
    if (ref.uses >= ref.maxUses) return res.status(400).json({ error: 'code exhausted' });

    // NOTE: Reward attribution (AIBA/NEUR) is handled in economy layer (later todo).
    ref.uses += 1;
    await ref.save();
    res.json({ ok: true, referrerTelegramId: ref.ownerTelegramId });
});

module.exports = router;

