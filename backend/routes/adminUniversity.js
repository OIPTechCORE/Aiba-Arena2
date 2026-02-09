const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const User = require('../models/User');
const UniversityProgress = require('../models/UniversityProgress');
const { COURSES, getTotalModuleCount } = require('./university');
const { getLimit } = require('../util/pagination');
const { validateQuery } = require('../middleware/validate');
const { adminAudit } = require('../middleware/adminAudit');

router.use(requireAdmin(), adminAudit());

/** GET /api/admin/university/stats — graduate count, progress count, total modules. */
router.get('/stats', async (_req, res) => {
    try {
        const totalModules = getTotalModuleCount();
        const graduateCount = await User.countDocuments({ badges: 'university_graduate' });
        const progressCount = await UniversityProgress.countDocuments({});
        const graduatedCount = await UniversityProgress.countDocuments({ graduatedAt: { $ne: null } });
        res.json({
            totalCourses: COURSES.length,
            totalModules,
            usersWithProgress: progressCount,
            graduates: graduateCount,
            graduatedProgressRecords: graduatedCount,
        });
    } catch (err) {
        console.error('Admin university stats error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

/** GET /api/admin/university/courses — read-only list of courses (same as public, for admin view). */
router.get('/courses', async (_req, res) => {
    try {
        const list = COURSES.map((c) => ({
            id: c.id,
            title: c.title,
            shortDescription: c.shortDescription,
            order: c.order,
            moduleCount: (c.modules || []).length,
            modules: (c.modules || []).map((m) => ({ id: m.id, title: m.title })),
        }));
        res.json({ courses: list, totalModules: getTotalModuleCount() });
    } catch (err) {
        console.error('Admin university courses error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

/** GET /api/admin/university/graduates?limit=100 — list users with university_graduate badge. */
router.get(
    '/graduates',
    validateQuery({ limit: { type: 'integer', min: 1, max: 200 } }),
    async (req, res) => {
    try {
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 100, maxLimit: 200 },
        );
        const users = await User.find({ badges: 'university_graduate' })
            .select('telegramId username telegram badges graduatedAt')
            .limit(limit)
            .lean();
        const withGraduatedAt = await UniversityProgress.find({ graduatedAt: { $ne: null } })
            .select('telegramId graduatedAt')
            .lean();
        const graduatedAtByTelegram = {};
        withGraduatedAt.forEach((d) => { graduatedAtByTelegram[d.telegramId] = d.graduatedAt; });
        const list = users.map((u) => ({
            telegramId: u.telegramId,
            username: u.username || (u.telegram && u.telegram.username) || '',
            graduatedAt: graduatedAtByTelegram[u.telegramId] || null,
        }));
        res.json(list);
    } catch (err) {
        console.error('Admin university graduates error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
