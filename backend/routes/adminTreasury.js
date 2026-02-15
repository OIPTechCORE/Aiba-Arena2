const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const Treasury = require('../models/Treasury');
const StabilityReserve = require('../models/StabilityReserve');
const BuybackPool = require('../models/BuybackPool');
const EconomyConfig = require('../models/EconomyConfig');
const { validateBody } = require('../middleware/validate');
const { adminAudit } = require('../middleware/adminAudit');

router.use(requireAdmin(), adminAudit());

async function getTreasury() {
    let t = await Treasury.findOne().lean();
    if (!t) {
        await Treasury.create({});
        t = await Treasury.findOne().lean();
    }
    return t || { balanceAiba: 0, balanceNeur: 0, cancelledStakesAiba: 0, totalPaidOutAiba: 0, totalPaidOutNeur: 0 };
}

// GET /api/admin/treasury
router.get('/', async (_req, res) => {
    try {
        const t = await getTreasury();
        res.json(t);
    } catch (err) {
        console.error('Admin treasury get error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/treasury/fund — Body: { aibaDelta?, neurDelta? }
router.post(
    '/fund',
    validateBody({
        aibaDelta: { type: 'integer' },
        neurDelta: { type: 'integer' },
    }),
    async (req, res) => {
    try {
        const aiba = Math.floor(Number(req.validatedBody?.aibaDelta ?? 0));
        const neur = Math.floor(Number(req.validatedBody?.neurDelta ?? 0));
        if (aiba === 0 && neur === 0) return res.status(400).json({ error: 'aibaDelta or neurDelta required' });
        await Treasury.findOneAndUpdate(
            {},
            { $inc: { balanceAiba: aiba, balanceNeur: neur } },
            { upsert: true, new: true },
        );
        const t = await getTreasury();
        res.json(t);
    } catch (err) {
        console.error('Admin treasury fund error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/admin/treasury/reserve — stability reserve
router.get('/reserve', async (_req, res) => {
    try {
        let r = await StabilityReserve.findOne().lean();
        if (!r) {
            await StabilityReserve.create({});
            r = await StabilityReserve.findOne().lean();
        }
        res.json(r || { aibaBalance: 0, neurBalance: 0, tonBalanceNano: '0' });
    } catch (err) {
        console.error('Admin reserve get error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/treasury/reserve/fund — Body: { aibaDelta?, neurDelta? }
router.post(
    '/reserve/fund',
    validateBody({
        aibaDelta: { type: 'integer' },
        neurDelta: { type: 'integer' },
    }),
    async (req, res) => {
    try {
        const aiba = Math.floor(Number(req.validatedBody?.aibaDelta ?? 0));
        const neur = Math.floor(Number(req.validatedBody?.neurDelta ?? 0));
        await StabilityReserve.findOneAndUpdate(
            {},
            { $inc: { aibaBalance: aiba, neurBalance: neur } },
            { upsert: true, new: true },
        );
        const r = await StabilityReserve.findOne().lean();
        res.json(r);
    } catch (err) {
        console.error('Admin reserve fund error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/admin/treasury/buyback
router.get('/buyback', async (_req, res) => {
    try {
        let b = await BuybackPool.findOne().lean();
        if (!b) {
            await BuybackPool.create({});
            b = await BuybackPool.findOne().lean();
        }
        res.json(b || { aibaBalance: 0, neurBalance: 0, totalBoughtBackAiba: 0 });
    } catch (err) {
        console.error('Admin buyback get error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/treasury/buyback/fund — Body: { aibaDelta?, neurDelta? }
router.post(
    '/buyback/fund',
    validateBody({
        aibaDelta: { type: 'integer' },
        neurDelta: { type: 'integer' },
    }),
    async (req, res) => {
    try {
        const aiba = Math.floor(Number(req.validatedBody?.aibaDelta ?? 0));
        const neur = Math.floor(Number(req.validatedBody?.neurDelta ?? 0));
        await BuybackPool.findOneAndUpdate(
            {},
            { $inc: { aibaBalance: aiba, neurBalance: neur } },
            { upsert: true, new: true },
        );
        const b = await BuybackPool.findOne().lean();
        res.json(b);
    } catch (err) {
        console.error('Admin buyback fund error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// PATCH /api/admin/treasury/oracle — set price oracle (config)
router.patch(
    '/oracle',
    validateBody({
        oracleAibaPerTon: { type: 'number', min: 0 },
        oracleNeurPerAiba: { type: 'number', min: 0 },
    }),
    async (req, res) => {
    try {
        const aibaPerTon =
            req.validatedBody?.oracleAibaPerTon !== undefined ? Number(req.validatedBody.oracleAibaPerTon) : undefined;
        const neurPerAiba =
            req.validatedBody?.oracleNeurPerAiba !== undefined ? Number(req.validatedBody.oracleNeurPerAiba) : undefined;
        const update = {};
        if (Number.isFinite(aibaPerTon)) update.oracleAibaPerTon = aibaPerTon;
        if (Number.isFinite(neurPerAiba)) update.oracleNeurPerAiba = neurPerAiba;
        if (Object.keys(update).length === 0) return res.status(400).json({ error: 'oracleAibaPerTon or oracleNeurPerAiba required' });
        const cfg = await EconomyConfig.findOneAndUpdate({}, { $set: update }, { new: true }).lean();
        res.json(cfg);
    } catch (err) {
        console.error('Admin oracle update error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
