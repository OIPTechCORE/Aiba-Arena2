const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const User = require('../models/User');
const Battle = require('../models/Battle');
const EconomyDay = require('../models/EconomyDay');
const { adminAudit } = require('../middleware/adminAudit');


router.use(requireAdmin(), adminAudit());

function utcDayKey(date = new Date()) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// GET /api/admin/stats — dashboard stats: DAU, volume, etc.
router.get('/', async (req, res) => {
    try {
        const today = utcDayKey();
        const todayStart = new Date(Date.UTC(
            parseInt(today.slice(0, 4), 10),
            parseInt(today.slice(5, 7), 10) - 1,
            parseInt(today.slice(8, 10), 10),
            0,
            0,
            0,
            0,
        ));

        const [dau, totalBattles, battlesToday, dayDoc] = await Promise.all([
            User.countDocuments({ lastSeenAt: { $gte: todayStart } }),
            Battle.countDocuments(),
            Battle.countDocuments({ createdAt: { $gte: todayStart } }),
            EconomyDay.findOne({ day: today }).lean(),
        ]);

        const totalUsers = await User.countDocuments();
        const emittedAiba = dayDoc?.emittedAiba ?? 0;
        const emittedNeur = dayDoc?.emittedNeur ?? 0;

        res.json({
            dau,
            totalUsers,
            totalBattles,
            battlesToday,
            todayEmittedAiba: emittedAiba,
            todayEmittedNeur: emittedNeur,
            day: today,
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
