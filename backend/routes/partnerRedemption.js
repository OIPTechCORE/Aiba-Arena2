/**
 * P4 — Partner dashboard: read-only redemptions for products the partner owns.
 * Auth: X-Partner-API-Key header must match RedemptionProduct.partnerApiKey for at least one product.
 */

const router = require('express').Router();
const RedemptionProduct = require('../models/RedemptionProduct');
const Redemption = require('../models/Redemption');
const { validateQuery } = require('../middleware/validate');

async function requirePartner(req, res, next) {
    const key = (
        req.headers['x-partner-api-key'] ||
        req.headers['authorization']?.replace(/^Bearer\s+/i, '') ||
        ''
    ).trim();
    if (!key)
        return res
            .status(401)
            .json({ error: 'missing partner API key (X-Partner-API-Key or Authorization: Bearer <key>)' });
    const products = await RedemptionProduct.find({ partnerApiKey: key, enabled: true }).select('key').lean();
    if (!products.length) return res.status(403).json({ error: 'invalid partner API key' });
    req.partnerProductKeys = products.map((p) => p.key);
    next();
}

router.use(requirePartner);

// GET /api/partner/redemptions — list redemptions for partner's products
router.get(
    '/redemptions',
    validateQuery({
        productKey: { type: 'string', trim: true, maxLength: 100 },
        limit: { type: 'integer', min: 1, max: 200 },
        offset: { type: 'integer', min: 0 },
        from: { type: 'string', trim: true },
        to: { type: 'string', trim: true },
    }),
    async (req, res) => {
        try {
            const productKeys = req.partnerProductKeys;
            const productKey = (req.validatedQuery?.productKey || '').trim();
            const limit = Math.min(200, Number(req.validatedQuery?.limit) || 50);
            const offset = Math.max(0, Number(req.validatedQuery?.offset) || 0);
            const from = (req.validatedQuery?.from || '').trim();
            const to = (req.validatedQuery?.to || '').trim();

            const q = {
                productKey: productKey
                    ? productKeys.includes(productKey)
                        ? productKey
                        : productKeys[0]
                    : { $in: productKeys },
            };
            if (from || to) {
                q.createdAt = {};
                if (from) q.createdAt.$gte = new Date(from);
                if (to) q.createdAt.$lte = new Date(to);
            }

            const list = await Redemption.find(q).sort({ createdAt: -1 }).skip(offset).limit(limit).lean();
            const total = await Redemption.countDocuments(q);
            res.json({ redemptions: list, total, limit, offset });
        } catch (err) {
            console.error('Partner redemptions error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
