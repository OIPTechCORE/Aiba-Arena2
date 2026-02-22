/**
 * P2 — Admin CRUD for School and Course (MemeFi/LMS extensions).
 */

const router = require('express').Router();
const School = require('../models/School');
const Course = require('../models/Course');
const { requireAdmin } = require('../middleware/requireAdmin');
const { adminAudit } = require('../middleware/adminAudit');
const { validateBody, validateParams } = require('../middleware/validate');

router.use(requireAdmin(), adminAudit());

// --- Schools ---

// GET /api/admin/schools
router.get('/schools', async (_req, res) => {
    try {
        const list = await School.find().sort({ name: 1 }).lean();
        res.json(list);
    } catch (err) {
        console.error('Admin schools list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/schools
router.post(
    '/schools',
    validateBody({
        name: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        slug: { type: 'string', trim: true, minLength: 1, maxLength: 100, required: true },
        metadata: { type: 'object' },
    }),
    async (req, res) => {
        try {
            const body = req.validatedBody;
            const school = await School.create({
                name: body.name.trim(),
                slug: body.slug.trim().toLowerCase().replace(/\s+/g, '-'),
                metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
            });
            res.status(201).json(school);
        } catch (err) {
            if (String(err?.code) === '11000') return res.status(409).json({ error: 'school slug already exists' });
            console.error('Admin school create error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// PATCH /api/admin/schools/:id
router.patch(
    '/schools/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        name: { type: 'string', trim: true, maxLength: 200 },
        slug: { type: 'string', trim: true, maxLength: 100 },
        metadata: { type: 'object' },
    }),
    async (req, res) => {
        try {
            const updates = {};
            if (req.validatedBody.name !== undefined) updates.name = req.validatedBody.name.trim();
            if (req.validatedBody.slug !== undefined)
                updates.slug = req.validatedBody.slug.trim().toLowerCase().replace(/\s+/g, '-');
            if (req.validatedBody.metadata !== undefined) updates.metadata = req.validatedBody.metadata;
            const school = await School.findByIdAndUpdate(
                req.validatedParams.id,
                { $set: updates },
                { new: true },
            ).lean();
            if (!school) return res.status(404).json({ error: 'school not found' });
            res.json(school);
        } catch (err) {
            if (String(err?.code) === '11000') return res.status(409).json({ error: 'school slug already exists' });
            console.error('Admin school patch error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// DELETE /api/admin/schools/:id
router.delete('/schools/:id', validateParams({ id: { type: 'objectId', required: true } }), async (req, res) => {
    try {
        const school = await School.findByIdAndDelete(req.validatedParams.id);
        if (!school) return res.status(404).json({ error: 'school not found' });
        res.json({ ok: true });
    } catch (err) {
        console.error('Admin school delete error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// --- Courses ---

// GET /api/admin/schools/:schoolId/courses
router.get(
    '/schools/:schoolId/courses',
    validateParams({ schoolId: { type: 'objectId', required: true } }),
    async (req, res) => {
        try {
            const list = await Course.find({ schoolId: req.validatedParams.schoolId }).sort({ name: 1 }).lean();
            res.json(list);
        } catch (err) {
            console.error('Admin courses list error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/admin/schools/:schoolId/courses
router.post(
    '/schools/:schoolId/courses',
    validateParams({ schoolId: { type: 'objectId', required: true } }),
    validateBody({
        name: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        slug: { type: 'string', trim: true, minLength: 1, maxLength: 100, required: true },
        metadata: { type: 'object' },
    }),
    async (req, res) => {
        try {
            const schoolId = req.validatedParams.schoolId;
            const school = await School.findById(schoolId).lean();
            if (!school) return res.status(404).json({ error: 'school not found' });
            const body = req.validatedBody;
            const course = await Course.create({
                schoolId,
                name: body.name.trim(),
                slug: body.slug.trim().toLowerCase().replace(/\s+/g, '-'),
                metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
            });
            res.status(201).json(course);
        } catch (err) {
            if (String(err?.code) === '11000')
                return res.status(409).json({ error: 'course slug already exists for this school' });
            console.error('Admin course create error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// PATCH /api/admin/courses/:id
router.patch(
    '/courses/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        name: { type: 'string', trim: true, maxLength: 200 },
        slug: { type: 'string', trim: true, maxLength: 100 },
        metadata: { type: 'object' },
    }),
    async (req, res) => {
        try {
            const updates = {};
            if (req.validatedBody.name !== undefined) updates.name = req.validatedBody.name.trim();
            if (req.validatedBody.slug !== undefined)
                updates.slug = req.validatedBody.slug.trim().toLowerCase().replace(/\s+/g, '-');
            if (req.validatedBody.metadata !== undefined) updates.metadata = req.validatedBody.metadata;
            const course = await Course.findByIdAndUpdate(
                req.validatedParams.id,
                { $set: updates },
                { new: true },
            ).lean();
            if (!course) return res.status(404).json({ error: 'course not found' });
            res.json(course);
        } catch (err) {
            if (String(err?.code) === '11000')
                return res.status(409).json({ error: 'course slug already exists for this school' });
            console.error('Admin course patch error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// DELETE /api/admin/courses/:id
router.delete('/courses/:id', validateParams({ id: { type: 'objectId', required: true } }), async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.validatedParams.id);
        if (!course) return res.status(404).json({ error: 'course not found' });
        res.json({ ok: true });
    } catch (err) {
        console.error('Admin course delete error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
