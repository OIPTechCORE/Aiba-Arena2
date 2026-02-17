const router = require('express').Router();
const RedemptionProduct = require('../models/RedemptionProduct');
const { requireAdmin } = require('../middleware/requireAdmin');
const { adminAudit } = require('../middleware/adminAudit');
const { validateBody, validateParams } = require('../middleware/validate');

router.use(requireAdmin(), adminAudit());

// GET /api/admin/redemption/products — list all (including disabled)
router.get('/products', async (_req, res) => {
    try {
        const products = await RedemptionProduct.find().sort({ createdAt: -1 }).lean();
        res.json(products);
    } catch (err) {
        console.error('Admin redemption products list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/redemption/products — create product (LMS / school fees / merch)
router.post(
    '/products',
    validateBody({
        key: { type: 'string', trim: true, minLength: 1, maxLength: 100, required: true },
        name: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        description: { type: 'string', trim: true, maxLength: 2000 },
        type: { type: 'string', enum: ['school_fee_discount', 'lms_premium', 'exam_prep', 'merch', 'custom'], required: true },
        costAiba: { type: 'number', min: 0 },
        costNeur: { type: 'number', min: 0 },
        costStars: { type: 'number', min: 0 },
        enabled: { type: 'boolean' },
        partnerWebhookUrl: { type: 'string', trim: true, maxLength: 2048 },
        partnerPayloadTemplate: { type: 'object' },
        issueCodePrefix: { type: 'string', trim: true, maxLength: 50 },
        maxRedemptionsPerUser: { type: 'integer', min: 0 },
        maxRedemptionsTotal: { type: 'integer', min: 0 },
        metadata: { type: 'object' },
    }),
    async (req, res) => {
        try {
            const body = req.validatedBody;
            const product = await RedemptionProduct.create({
                key: body.key.trim(),
                name: body.name.trim(),
                description: (body.description || '').trim(),
                type: body.type,
                costAiba: Math.max(0, Number(body.costAiba) || 0),
                costNeur: Math.max(0, Number(body.costNeur) || 0),
                costStars: Math.max(0, Number(body.costStars) || 0),
                enabled: body.enabled === undefined ? true : Boolean(body.enabled),
                partnerWebhookUrl: (body.partnerWebhookUrl || '').trim(),
                partnerPayloadTemplate: body.partnerPayloadTemplate && typeof body.partnerPayloadTemplate === 'object' ? body.partnerPayloadTemplate : {},
                issueCodePrefix: (body.issueCodePrefix || 'REDEEM').trim(),
                maxRedemptionsPerUser: Math.max(0, Number(body.maxRedemptionsPerUser) || 0),
                maxRedemptionsTotal: Math.max(0, Number(body.maxRedemptionsTotal) || 0),
                metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
            });
            res.status(201).json(product);
        } catch (err) {
            if (String(err?.code) === '11000') return res.status(409).json({ error: 'product key already exists' });
            console.error('Admin redemption product create error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// PATCH /api/admin/redemption/products/:id
router.patch(
    '/products/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        name: { type: 'string', trim: true, maxLength: 200 },
        description: { type: 'string', trim: true, maxLength: 2000 },
        type: { type: 'string', enum: ['school_fee_discount', 'lms_premium', 'exam_prep', 'merch', 'custom'] },
        costAiba: { type: 'number', min: 0 },
        costNeur: { type: 'number', min: 0 },
        costStars: { type: 'number', min: 0 },
        enabled: { type: 'boolean' },
        partnerWebhookUrl: { type: 'string', trim: true, maxLength: 2048 },
        partnerPayloadTemplate: { type: 'object' },
        issueCodePrefix: { type: 'string', trim: true, maxLength: 50 },
        maxRedemptionsPerUser: { type: 'integer', min: 0 },
        maxRedemptionsTotal: { type: 'integer', min: 0 },
        metadata: { type: 'object' },
    }),
    async (req, res) => {
        try {
            const id = req.validatedParams.id;
            const body = req.validatedBody || {};
            const upd = {};
            if (body.name !== undefined) upd.name = String(body.name).trim();
            if (body.description !== undefined) upd.description = String(body.description).trim();
            if (body.type !== undefined) upd.type = body.type;
            if (body.costAiba !== undefined) upd.costAiba = Math.max(0, Number(body.costAiba));
            if (body.costNeur !== undefined) upd.costNeur = Math.max(0, Number(body.costNeur));
            if (body.costStars !== undefined) upd.costStars = Math.max(0, Number(body.costStars));
            if (body.enabled !== undefined) upd.enabled = Boolean(body.enabled);
            if (body.partnerWebhookUrl !== undefined) upd.partnerWebhookUrl = String(body.partnerWebhookUrl).trim();
            if (body.partnerPayloadTemplate !== undefined && typeof body.partnerPayloadTemplate === 'object') upd.partnerPayloadTemplate = body.partnerPayloadTemplate;
            if (body.issueCodePrefix !== undefined) upd.issueCodePrefix = String(body.issueCodePrefix).trim();
            if (body.maxRedemptionsPerUser !== undefined) upd.maxRedemptionsPerUser = Math.max(0, Number(body.maxRedemptionsPerUser));
            if (body.maxRedemptionsTotal !== undefined) upd.maxRedemptionsTotal = Math.max(0, Number(body.maxRedemptionsTotal));
            if (body.metadata !== undefined && typeof body.metadata === 'object') upd.metadata = body.metadata;

            const product = await RedemptionProduct.findByIdAndUpdate(id, { $set: upd }, { new: true }).lean();
            if (!product) return res.status(404).json({ error: 'product not found' });
            res.json(product);
        } catch (err) {
            console.error('Admin redemption product patch error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/admin/redemption/seed — create default LMS/school-fees products if none exist
router.post('/seed', async (_req, res) => {
    try {
        const count = await RedemptionProduct.countDocuments();
        if (count > 0) return res.json({ message: 'Products already exist', count });

        const defaults = [
            { key: 'school_fee_discount_10', name: '10% School Fee Discount', description: 'Redeem for 10% off school fees.', type: 'school_fee_discount', costAiba: 500, costNeur: 0, costStars: 0 },
            { key: 'lms_premium_1m', name: 'LMS Premium 1 Month', description: 'Unlock LMS premium features for 1 month.', type: 'lms_premium', costAiba: 200, costNeur: 1000, costStars: 0 },
            { key: 'exam_prep_unlock', name: 'Exam Prep Unlock', description: 'Unlock exam prep materials.', type: 'exam_prep', costAiba: 100, costNeur: 500, costStars: 0 },
            { key: 'merch_tee', name: 'Merch: T-Shirt', description: 'Redeem for branded T-shirt (while supplies last).', type: 'merch', costAiba: 300, costNeur: 0, costStars: 50 },
        ];
        await RedemptionProduct.insertMany(defaults);
        res.status(201).json({ message: 'Default redemption products created', count: defaults.length });
    } catch (err) {
        console.error('Admin redemption seed error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
