const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const { validateBody, validateParams } = require('../middleware/validate');
const RedemptionProduct = require('../models/RedemptionProduct');
const Redemption = require('../models/Redemption');
const RedemptionCodeBatch = require('../models/RedemptionCodeBatch');
const User = require('../models/User');
const { debitAibaFromUser, debitNeurFromUser, creditAibaNoCap, creditNeurNoCap } = require('../engine/economy');
const crypto = require('crypto');
const axios = require('axios');

// GET /api/redemption/products — list enabled products (public)
router.get('/products', async (_req, res) => {
    try {
        const products = await RedemptionProduct.find({ enabled: true })
            .select('key name description type costAiba costNeur costStars maxRedemptionsPerUser metadata')
            .lean();
        res.json(products);
    } catch (err) {
        console.error('Redemption products error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.use(requireTelegram);

// GET /api/redemption/products/for-me — enabled products for this user (school-scoped: no schoolId or user.schoolId)
router.get('/products/for-me', async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const user = await User.findOne({ telegramId }).select('schoolId').lean();
        const schoolId = user?.schoolId ? String(user.schoolId) : null;
        const query = { enabled: true };
        if (schoolId) query.$or = [{ schoolId: null }, { schoolId: user.schoolId }];
        else query.schoolId = null;
        const products = await RedemptionProduct.find(query)
            .select('key name description type costAiba costNeur costStars maxRedemptionsPerUser metadata')
            .lean();
        res.json(products);
    } catch (err) {
        console.error('Redemption products/for-me error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

async function callPartnerWebhook(product, payload, maxRetries = 3) {
    const url = product.partnerWebhookUrl.trim();
    const secret = (product.partnerWebhookSecret || '').trim();
    const headers = { 'Content-Type': 'application/json' };
    if (secret) {
        const body = JSON.stringify(payload);
        const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
        headers['X-Webhook-Signature'] = `sha256=${sig}`;
    }
    let lastErr;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const resp = await axios.post(url, payload, { timeout: 10000, headers });
            return { ok: true, status: resp.status, data: resp.data };
        } catch (err) {
            lastErr = err;
            if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
    }
    return { ok: false, error: lastErr };
}

// POST /api/redemption/redeem — redeem product (debit balance, issue code or call partner)
router.post(
    '/redeem',
    validateBody({
        productKey: { type: 'string', trim: true, minLength: 1, maxLength: 100, required: true },
        idempotencyKey: { type: 'string', trim: true, maxLength: 128 },
    }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const productKey = req.validatedBody.productKey.trim();
            const idempotencyKey = (req.validatedBody.idempotencyKey || req.headers['idempotency-key'] || '').trim();

            const product = await RedemptionProduct.findOne({ key: productKey, enabled: true });
            if (!product) return res.status(404).json({ error: 'product not found or disabled' });

            if (idempotencyKey) {
                const existing = await Redemption.findOne({ idempotencyKey }).lean();
                if (existing) {
                    return res.status(200).json({
                        redemptionId: existing._id,
                        productKey: existing.productKey,
                        code: existing.code || undefined,
                        message: product.metadata?.successMessage || 'Redemption successful.',
                        expiresAt: existing.expiresAt || undefined,
                    });
                }
            }

            const user = await User.findOne({ telegramId }).lean();
            if (!user) return res.status(403).json({ error: 'user not found' });

            // P4 — Eligibility: min balance and/or completed course
            const eligibilityMinAiba = Math.max(0, Number(product.eligibilityMinAiba) || 0);
            const eligibilityMinNeur = Math.max(0, Number(product.eligibilityMinNeur) || 0);
            if (eligibilityMinAiba > 0 && (Number(user.aibaBalance) || 0) < eligibilityMinAiba) {
                return res
                    .status(403)
                    .json({ error: 'eligibility not met', requirement: 'min AIBA balance', need: eligibilityMinAiba });
            }
            if (eligibilityMinNeur > 0 && (Number(user.neurBalance) || 0) < eligibilityMinNeur) {
                return res
                    .status(403)
                    .json({ error: 'eligibility not met', requirement: 'min NEUR balance', need: eligibilityMinNeur });
            }
            const eligibilityCourseId = (product.eligibilityCourseId || '').trim();
            if (eligibilityCourseId) {
                const UniversityProgress = require('../models/UniversityProgress');
                const progress = await UniversityProgress.findOne({ telegramId }).lean();
                const completed =
                    progress && progress.completedKeys && Array.isArray(progress.completedKeys)
                        ? progress.completedKeys
                        : [];
                if (!completed.includes(eligibilityCourseId)) {
                    return res
                        .status(403)
                        .json({
                            error: 'eligibility not met',
                            requirement: 'complete course',
                            courseId: eligibilityCourseId,
                        });
                }
            }
            // P5 — School-scoped product: user must belong to product's school (or product has no school)
            if (product.schoolId) {
                const userSchoolId = user.schoolId ? String(user.schoolId) : '';
                if (userSchoolId !== String(product.schoolId)) {
                    return res.status(403).json({ error: 'product not available for your school' });
                }
            }

            if (product.maxRedemptionsPerUser > 0) {
                const count = await Redemption.countDocuments({ telegramId, productKey });
                if (count >= product.maxRedemptionsPerUser)
                    return res.status(403).json({ error: 'max redemptions per user reached' });
            }
            if (product.maxRedemptionsTotal > 0) {
                const total = await Redemption.countDocuments({ productKey });
                if (total >= product.maxRedemptionsTotal) return res.status(403).json({ error: 'product sold out' });
            }

            const costAiba = Math.max(0, Number(product.costAiba) || 0);
            const costNeur = Math.max(0, Number(product.costNeur) || 0);
            const costStars = Math.max(0, Number(product.costStars) || 0);

            if (costAiba > 0) {
                const debit = await debitAibaFromUser(costAiba, {
                    telegramId,
                    reason: 'redemption',
                    sourceType: 'redemption',
                    sourceId: productKey,
                    meta: { productKey, productId: String(product._id) },
                });
                if (!debit.ok)
                    return res.status(403).json({ error: debit.error || 'insufficient AIBA', need: costAiba });
            }
            if (costNeur > 0) {
                const debit = await debitNeurFromUser(costNeur, {
                    telegramId,
                    reason: 'redemption',
                    sourceType: 'redemption',
                    sourceId: productKey,
                    meta: { productKey, productId: String(product._id) },
                });
                if (!debit.ok)
                    return res.status(403).json({ error: debit.error || 'insufficient NEUR', need: costNeur });
            }
            if (costStars > 0) {
                const starsBalance = Number(user.starsBalance) || 0;
                if (starsBalance < costStars)
                    return res.status(403).json({ error: 'insufficient Stars', need: costStars });
                await User.updateOne({ telegramId }, { $inc: { starsBalance: -costStars } });
            }

            let code = '';
            let partnerResponse = {};

            if (product.partnerWebhookUrl && product.partnerWebhookUrl.trim()) {
                const payload = {
                    telegramId,
                    productKey,
                    productId: String(product._id),
                    costAiba,
                    costNeur,
                    costStars,
                    timestamp: new Date().toISOString(),
                    ...(product.partnerPayloadTemplate || {}),
                };
                const result = await callPartnerWebhook(product, payload);
                if (!result.ok) {
                    if (costAiba > 0)
                        await creditAibaNoCap(costAiba, {
                            telegramId,
                            reason: 'redemption_refund',
                            sourceType: 'redemption_refund',
                            sourceId: productKey,
                        });
                    if (costNeur > 0)
                        await creditNeurNoCap(costNeur, {
                            telegramId,
                            reason: 'redemption_refund',
                            sourceType: 'redemption_refund',
                            sourceId: productKey,
                        });
                    if (costStars > 0) await User.updateOne({ telegramId }, { $inc: { starsBalance: costStars } });
                    return res
                        .status(502)
                        .json({
                            error: 'partner redemption failed',
                            detail: (result.error && result.error.message) || 'unknown',
                        });
                }
                partnerResponse = { status: result.status, data: result.data };
                code = (result.data && (result.data.code || result.data.coupon || result.data.redemptionCode)) || '';
            } else {
                // P4 — Batch codes: try batch first, else generate
                const batch = await RedemptionCodeBatch.findOne({
                    productKey,
                    $expr: { $lt: ['$nextIndex', { $size: '$codes' }] },
                }).lean();
                if (batch && batch.codes && batch.codes.length > 0) {
                    const idx = batch.nextIndex || 0;
                    code = batch.codes[idx] || '';
                    await RedemptionCodeBatch.updateOne({ _id: batch._id }, { $inc: { nextIndex: 1 } });
                }
                if (!code) {
                    const prefix = (product.issueCodePrefix || 'REDEEM').trim();
                    code = `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
                }
            }

            const codeValidityDays = Math.max(0, Number(product.codeValidityDays) || 0);
            const expiresAt =
                codeValidityDays > 0 ? new Date(Date.now() + codeValidityDays * 24 * 60 * 60 * 1000) : null;

            const redemption = await Redemption.create({
                telegramId,
                productKey,
                productId: product._id,
                costAiba,
                costNeur,
                costStars,
                code,
                status: 'issued',
                partnerResponse,
                expiresAt,
                idempotencyKey: idempotencyKey || undefined,
            });

            res.status(201).json({
                redemptionId: redemption._id,
                productKey,
                code: code || undefined,
                message: product.metadata?.successMessage || 'Redemption successful. Use your code where applicable.',
                expiresAt: redemption.expiresAt || undefined,
                partnerResponse: Object.keys(partnerResponse).length ? partnerResponse : undefined,
            });
        } catch (err) {
            console.error('Redemption redeem error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// GET /api/redemption/me — user's redemptions
router.get('/me', async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const list = await Redemption.find({ telegramId }).sort({ createdAt: -1 }).limit(100).lean();
        res.json(list);
    } catch (err) {
        console.error('Redemption me error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
