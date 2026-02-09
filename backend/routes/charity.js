const router = require('express').Router();
const mongoose = require('mongoose');
const { requireTelegram } = require('../middleware/requireTelegram');
const CharityCampaign = require('../models/CharityCampaign');
const CharityDonation = require('../models/CharityDonation');
const { getConfig } = require('../engine/economy');
const { donateToCampaign } = require('../engine/charity');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { getLimit } = require('../util/pagination');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');

// GET /api/charity/campaigns — list active/ended campaigns (public or authenticated)
// Query: featured=1, cause=education, status=active
router.get(
    '/campaigns',
    validateQuery({
        featured: { type: 'boolean' },
        cause: { type: 'string', trim: true, maxLength: 50 },
        status: { type: 'string', trim: true, maxLength: 20 },
        limit: { type: 'integer', min: 1, max: 100 },
    }),
    async (req, res) => {
    try {
        const featured = Boolean(req.validatedQuery?.featured);
        const cause = (req.validatedQuery?.cause || '').trim().toLowerCase();
        const statusFilter = (req.validatedQuery?.status || '').trim().toLowerCase();
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 50, maxLimit: 100 },
        );

        const query = { status: { $in: ['active', 'ended'] } };
        if (featured) query.featured = true;
        if (cause) query.cause = cause;
        if (statusFilter === 'active') query.status = 'active';
        if (statusFilter === 'ended') query.status = 'ended';

        const list = await CharityCampaign.find(query)
            .sort({ featured: -1, order: 1, createdAt: -1 })
            .limit(limit)
            .lean()
            .select('name description cause goalNeur goalAiba goalTonNano raisedNeur raisedAiba raisedTonNano donorCount status endAt featured');

        res.json(list);
    } catch (err) {
        console.error('Charity campaigns list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/charity/campaigns/:id — one campaign + recent donations (anonymized if anonymous)
router.get(
    '/campaigns/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateQuery({
        recentDonations: { type: 'integer', min: 1, max: 50 },
    }),
    async (req, res) => {
    try {
        const campaign = await CharityCampaign.findById(req.validatedParams.id).lean();
        if (!campaign || !['active', 'ended', 'funded', 'disbursed'].includes(campaign.status)) {
            return res.status(404).json({ error: 'not found' });
        }

        const recentLimit = getLimit(
            { query: { limit: req.validatedQuery?.recentDonations } },
            { defaultLimit: 20, maxLimit: 50 },
        );
        const recent = await CharityDonation.find({ campaignId: campaign._id })
            .sort({ donatedAt: -1 })
            .limit(recentLimit)
            .lean()
            .select('amountNeur amountAiba amountTonNano donatedAt anonymous message');
        const sanitized = recent.map((d) => ({
            amountNeur: d.amountNeur,
            amountAiba: d.amountAiba,
            amountTonNano: d.amountTonNano,
            donatedAt: d.donatedAt,
            donor: d.anonymous ? 'Anonymous' : undefined,
            message: d.message || undefined,
        }));

        res.json({ ...campaign, recentDonations: sanitized });
    } catch (err) {
        console.error('Charity campaign get error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// POST /api/charity/donate — donate NEUR/AIBA from balance (authenticated)
router.post(
    '/donate',
    requireTelegram,
    validateBody({
        campaignId: { type: 'objectId', required: true },
        amountNeur: { type: 'integer', min: 0 },
        amountAiba: { type: 'integer', min: 0 },
        message: { type: 'string', trim: true, maxLength: 500 },
        anonymous: { type: 'boolean' },
        requestId: { type: 'string', trim: true, minLength: 1, maxLength: 128 },
    }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const campaignId = req.validatedBody?.campaignId;
        const amountNeur = Math.floor(Number(req.validatedBody?.amountNeur ?? 0)) || 0;
        const amountAiba = Math.floor(Number(req.validatedBody?.amountAiba ?? 0)) || 0;
        const message = (req.validatedBody?.message || '').trim().slice(0, 500);
        const anonymous = Boolean(req.validatedBody?.anonymous);
        const requestId = getIdempotencyKey(req);

        if (!campaignId) return res.status(400).json({ error: 'campaignId required' });
        if (amountNeur <= 0 && amountAiba <= 0) {
            return res.status(400).json({ error: 'At least one of amountNeur or amountAiba must be > 0' });
        }

        const result = await donateToCampaign({
            telegramId,
            campaignId,
            amountNeur,
            amountAiba,
            requestId: requestId || undefined,
            message,
            anonymous,
            source: 'balance',
        });

        if (!result.ok) {
            const status =
                result.error === 'insufficient_neur' || result.error === 'insufficient_aiba' ? 403 : 400;
            return res.status(status).json({
                error: result.error,
                detail: result.detail || result.error,
            });
        }

        if (result.duplicate) {
            return res.json({
                ok: true,
                duplicate: true,
                donation: result.donation,
                campaign: result.campaign,
            });
        }

        res.status(201).json({
            ok: true,
            donation: result.donation,
            campaign: result.campaign,
        });
    } catch (err) {
        console.error('Charity donate error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/charity/leaderboard — top donors (by=neur|aiba|impact|count, campaignId=, limit=)
router.get(
    '/leaderboard',
    validateQuery({
        by: { type: 'string', trim: true, maxLength: 20 },
        campaignId: { type: 'objectId' },
        limit: { type: 'integer', min: 1, max: 100 },
    }),
    async (req, res) => {
    try {
        const by = (req.validatedQuery?.by || 'impact').trim().toLowerCase();
        const campaignId = (req.validatedQuery?.campaignId || '').trim();
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 50, maxLimit: 100 },
        );

        const allowed = ['neur', 'aiba', 'impact', 'count'];
        if (!allowed.includes(by)) {
            return res.status(400).json({ error: 'invalid by', allowed });
        }

        const cfg = await getConfig();
        const aibaMultiplier = Number(cfg.charityImpactAibaMultiplier) || 10;

        let match = {};
        if (campaignId) {
            match = { campaignId: new mongoose.Types.ObjectId(campaignId) };
        }
        match.anonymous = { $ne: true };

        const agg = await CharityDonation.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$telegramId',
                    amountNeur: { $sum: '$amountNeur' },
                    amountAiba: { $sum: '$amountAiba' },
                    count: { $sum: 1 },
                },
            },
            {
                $addFields: {
                    impactScore: { $add: ['$amountNeur', { $multiply: ['$amountAiba', aibaMultiplier] }] },
                },
            },
            {
                $sort:
                    by === 'neur'
                        ? { amountNeur: -1 }
                        : by === 'aiba'
                          ? { amountAiba: -1 }
                          : by === 'count'
                            ? { count: -1 }
                            : { impactScore: -1 },
            },
            { $limit: limit },
            { $lookup: { from: 'users', localField: '_id', foreignField: 'telegramId', as: 'userDoc' } },
            { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    telegramId: '$_id',
                    amountNeur: 1,
                    amountAiba: 1,
                    impactScore: 1,
                    count: 1,
                    badges: { $ifNull: ['$userDoc.badges', []] },
                },
            },
        ]);

        const withRank = agg.map((row, i) => ({
            rank: i + 1,
            telegramId: row.telegramId,
            amountNeur: row.amountNeur,
            amountAiba: row.amountAiba,
            impactScore: row.impactScore,
            count: row.count,
            badges: Array.isArray(row.badges) ? row.badges : [],
        }));

        res.json(withRank);
    } catch (err) {
        console.error('Charity leaderboard error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/charity/my-impact — current user's total donated (NEUR, AIBA, impact) and per-campaign breakdown
router.get('/my-impact', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const cfg = await getConfig();
        const aibaMultiplier = Number(cfg.charityImpactAibaMultiplier) || 10;

        const totals = await CharityDonation.aggregate([
            { $match: { telegramId } },
            {
                $group: {
                    _id: null,
                    amountNeur: { $sum: '$amountNeur' },
                    amountAiba: { $sum: '$amountAiba' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const byCampaign = await CharityDonation.aggregate([
            { $match: { telegramId } },
            {
                $group: {
                    _id: '$campaignId',
                    amountNeur: { $sum: '$amountNeur' },
                    amountAiba: { $sum: '$amountAiba' },
                    count: { $sum: 1 },
                },
            },
            { $lookup: { from: 'charitycampaigns', localField: '_id', foreignField: '_id', as: 'camp' } },
            { $unwind: { path: '$camp', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    campaignId: '$_id',
                    campaignName: '$camp.name',
                    amountNeur: 1,
                    amountAiba: 1,
                    count: 1,
                },
            },
        ]);

        const t = totals[0] || { amountNeur: 0, amountAiba: 0, count: 0 };
        const impactScore = t.amountNeur + (t.amountAiba || 0) * aibaMultiplier;

        res.json({
            telegramId,
            amountNeur: t.amountNeur || 0,
            amountAiba: t.amountAiba || 0,
            impactScore,
            donationCount: t.count || 0,
            byCampaign: byCampaign.map((c) => ({
                campaignId: c.campaignId,
                campaignName: c.campaignName,
                amountNeur: c.amountNeur,
                amountAiba: c.amountAiba,
                count: c.count,
            })),
        });
    } catch (err) {
        console.error('Charity my-impact error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/charity/stats — global stats (total raised, donors, campaign count)
router.get('/stats', async (_req, res) => {
    try {
        const [campaignCounts, donorAgg, raisedAgg] = await Promise.all([
            CharityCampaign.aggregate([
                { $match: { status: { $in: ['active', 'ended', 'funded', 'disbursed'] } } },
                { $group: { _id: '$status', n: { $sum: 1 } } },
            ]),
            CharityDonation.aggregate([{ $group: { _id: '$telegramId' } }, { $count: 'totalDonors' }]),
            CharityCampaign.aggregate([
                { $match: { status: { $in: ['active', 'ended', 'funded', 'disbursed'] } } },
                { $group: { _id: null, totalRaisedNeur: { $sum: '$raisedNeur' }, totalRaisedAiba: { $sum: '$raisedAiba' } } },
            ]),
        ]);

        const statusCounts = Object.fromEntries((campaignCounts || []).map((c) => [c._id, c.n]));
        const totalDonors = donorAgg[0]?.totalDonors ?? 0;
        const r = raisedAgg[0] || {};
        const totalRaisedNeur = r.totalRaisedNeur ?? 0;
        const totalRaisedAiba = r.totalRaisedAiba ?? 0;

        res.json({
            totalRaisedNeur,
            totalRaisedAiba,
            totalDonors,
            campaignCount:
                (statusCounts.active || 0) +
                (statusCounts.ended || 0) +
                (statusCounts.funded || 0) +
                (statusCounts.disbursed || 0),
            activeCampaignCount: statusCounts.active || 0,
        });
    } catch (err) {
        console.error('Charity stats error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
