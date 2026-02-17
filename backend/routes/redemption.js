const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const { validateBody, validateParams } = require('../middleware/validate');
const RedemptionProduct = require('../models/RedemptionProduct');
const Redemption = require('../models/Redemption');
const User = require('../models/User');
const { debitAibaFromUser, debitNeurFromUser, getConfig } = require('../engine/economy');
const crypto = require('crypto');

// GET /api/redemption/products — list enabled products (public or auth)
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

// POST /api/redemption/redeem — redeem product (debit balance, issue code or call partner)
router.post(
    '/redeem',
    validateBody({ productKey: { type: 'string', trim: true, minLength: 1, maxLength: 100, required: true } }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const productKey = req.validatedBody.productKey.trim();

            const product = await RedemptionProduct.findOne({ key: productKey, enabled: true });
            if (!product) return res.status(404).json({ error: 'product not found or disabled' });

            const user = await User.findOne({ telegramId }).lean();
            if (!user) return res.status(403).json({ error: 'user not found' });

            if (product.maxRedemptionsPerUser > 0) {
                const count = await Redemption.countDocuments({ telegramId, productKey });
                if (count >= product.maxRedemptionsPerUser) return res.status(403).json({ error: 'max redemptions per user reached' });
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
                if (!debit.ok) return res.status(403).json({ error: debit.error || 'insufficient AIBA', need: costAiba });
            }
            if (costNeur > 0) {
                const debit = await debitNeurFromUser(costNeur, {
                    telegramId,
                    reason: 'redemption',
                    sourceType: 'redemption',
                    sourceId: productKey,
                    meta: { productKey, productId: String(product._id) },
                });
                if (!debit.ok) return res.status(403).json({ error: debit.error || 'insufficient NEUR', need: costNeur });
            }
            if (costStars > 0) {
                const starsBalance = Number(user.starsBalance) || 0;
                if (starsBalance < costStars) return res.status(403).json({ error: 'insufficient Stars', need: costStars });
                await User.updateOne({ telegramId }, { $inc: { starsBalance: -costStars } });
            }

            let code = '';
            let partnerResponse = {};

            if (product.partnerWebhookUrl && product.partnerWebhookUrl.trim()) {
                try {
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
                    const axios = require('axios');
                    const resp = await axios.post(product.partnerWebhookUrl.trim(), payload, {
                        timeout: 10000,
                        headers: { 'Content-Type': 'application/json' },
                    });
                    partnerResponse = { status: resp.status, data: resp.data };
                    code = (resp.data && (resp.data.code || resp.data.coupon || resp.data.redemptionCode)) || '';
                } catch (err) {
                    if (costAiba > 0) {
                        const { creditAibaNoCap } = require('../engine/economy');
                        await creditAibaNoCap(costAiba, { telegramId, reason: 'redemption_refund', sourceType: 'redemption_refund', sourceId: productKey });
                    }
                    if (costNeur > 0) {
                        const { creditNeurNoCap } = require('../engine/economy');
                        await creditNeurNoCap(costNeur, { telegramId, reason: 'redemption_refund', sourceType: 'redemption_refund', sourceId: productKey });
                    }
                    if (costStars > 0) await User.updateOne({ telegramId }, { $inc: { starsBalance: costStars } });
                    return res.status(502).json({ error: 'partner redemption failed', detail: err.message });
                }
            } else {
                const prefix = (product.issueCodePrefix || 'REDEEM').trim();
                code = `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
            }

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
            });

            res.status(201).json({
                redemptionId: redemption._id,
                productKey,
                code: code || undefined,
                message: product.metadata?.successMessage || 'Redemption successful. Use your code where applicable.',
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
