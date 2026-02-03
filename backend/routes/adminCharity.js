const router = require('express').Router();
const mongoose = require('mongoose');
const { requireAdmin } = require('../middleware/requireAdmin');
const CharityCampaign = require('../models/CharityCampaign');
const CharityDonation = require('../models/CharityDonation');

router.use(requireAdmin());

// GET /api/admin/charity/campaigns — list all campaigns (any status)
router.get('/campaigns', async (req, res) => {
    try {
        const list = await CharityCampaign.find({})
            .sort({ status: 1, featured: -1, order: 1, createdAt: -1 })
            .lean();
        res.json(list);
    } catch (err) {
        console.error('Admin charity campaigns list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/charity/campaigns — create campaign
router.post('/campaigns', async (req, res) => {
    try {
        const body = req.body || {};
        const name = (body.name || '').trim();
        if (!name) return res.status(400).json({ error: 'name required' });

        const cause = ['education', 'environment', 'health', 'emergency', 'community', 'other'].includes(
            (body.cause || '').trim().toLowerCase(),
        )
            ? (body.cause || 'community').trim().toLowerCase()
            : 'community';

        const campaign = await CharityCampaign.create({
            name,
            description: (body.description || '').trim().slice(0, 2000),
            cause,
            goalNeur: Math.max(0, Math.floor(Number(body.goalNeur) || 0)),
            goalAiba: Math.max(0, Math.floor(Number(body.goalAiba) || 0)),
            goalTonNano: Math.max(0, Math.floor(Number(body.goalTonNano) || 0)),
            status: body.status === 'active' ? 'active' : 'draft',
            beneficiaryTonAddress: (body.beneficiaryTonAddress || '').trim().slice(0, 128),
            beneficiaryType: body.beneficiaryType === 'external' ? 'external' : 'treasury',
            startAt: body.startAt ? new Date(body.startAt) : null,
            endAt: body.endAt ? new Date(body.endAt) : null,
            featured: Boolean(body.featured),
            order: Math.floor(Number(body.order) || 0),
            createdBy: (req.admin?.telegramId || req.admin?.id || 'admin') + '',
        });
        res.status(201).json(campaign.toObject());
    } catch (err) {
        console.error('Admin charity create campaign error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// PATCH /api/admin/charity/campaigns/:id — update campaign
router.patch('/campaigns/:id', async (req, res) => {
    try {
        const campaign = await CharityCampaign.findById(req.params.id);
        if (!campaign) return res.status(404).json({ error: 'not found' });

        const body = req.body || {};
        if (body.name !== undefined) campaign.name = String(body.name).trim().slice(0, 200);
        if (body.description !== undefined) campaign.description = String(body.description).trim().slice(0, 2000);
        if (body.cause !== undefined && ['education', 'environment', 'health', 'emergency', 'community', 'other'].includes(String(body.cause).toLowerCase())) {
            campaign.cause = String(body.cause).toLowerCase();
        }
        if (body.goalNeur !== undefined) campaign.goalNeur = Math.max(0, Math.floor(Number(body.goalNeur) || 0));
        if (body.goalAiba !== undefined) campaign.goalAiba = Math.max(0, Math.floor(Number(body.goalAiba) || 0));
        if (body.goalTonNano !== undefined) campaign.goalTonNano = Math.max(0, Math.floor(Number(body.goalTonNano) || 0));
        if (body.status !== undefined && ['draft', 'active', 'ended', 'funded', 'disbursed'].includes(body.status)) {
            campaign.status = body.status;
        }
        if (body.beneficiaryTonAddress !== undefined) campaign.beneficiaryTonAddress = String(body.beneficiaryTonAddress).trim().slice(0, 128);
        if (body.beneficiaryType !== undefined && ['treasury', 'external'].includes(body.beneficiaryType)) {
            campaign.beneficiaryType = body.beneficiaryType;
        }
        if (body.startAt !== undefined) campaign.startAt = body.startAt ? new Date(body.startAt) : null;
        if (body.endAt !== undefined) campaign.endAt = body.endAt ? new Date(body.endAt) : null;
        if (body.featured !== undefined) campaign.featured = Boolean(body.featured);
        if (body.order !== undefined) campaign.order = Math.floor(Number(body.order) || 0);

        await campaign.save();
        res.json(campaign.toObject());
    } catch (err) {
        console.error('Admin charity update campaign error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/charity/campaigns/:id/close — set status to ended (or funded if goals met)
router.post('/campaigns/:id/close', async (req, res) => {
    try {
        const campaign = await CharityCampaign.findById(req.params.id);
        if (!campaign) return res.status(404).json({ error: 'not found' });

        const goalNeur = campaign.goalNeur || 0;
        const goalAiba = campaign.goalAiba || 0;
        const raisedNeur = campaign.raisedNeur || 0;
        const raisedAiba = campaign.raisedAiba || 0;
        const funded = (goalNeur <= 0 || raisedNeur >= goalNeur) && (goalAiba <= 0 || raisedAiba >= goalAiba);

        campaign.status = funded ? 'funded' : 'ended';
        await campaign.save();
        res.json({ ok: true, campaign: campaign.toObject(), status: campaign.status });
    } catch (err) {
        console.error('Admin charity close campaign error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/charity/campaigns/:id/disburse — mark as disbursed (record disbursedAt)
router.post('/campaigns/:id/disburse', async (req, res) => {
    try {
        const campaign = await CharityCampaign.findById(req.params.id);
        if (!campaign) return res.status(404).json({ error: 'not found' });

        campaign.status = 'disbursed';
        campaign.disbursedAt = new Date();
        await campaign.save();
        res.json({ ok: true, campaign: campaign.toObject() });
    } catch (err) {
        console.error('Admin charity disburse campaign error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/admin/charity/donations — list donations (filter by campaignId, telegramId, date range)
router.get('/donations', async (req, res) => {
    try {
        const campaignId = (req.query?.campaignId || '').trim();
        const telegramId = (req.query?.telegramId || '').trim();
        const from = req.query?.from ? new Date(req.query.from) : null;
        const to = req.query?.to ? new Date(req.query.to) : null;
        const limit = Math.min(500, Math.max(1, parseInt(req.query?.limit, 10) || 100));

        const query = {};
        if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) query.campaignId = new mongoose.Types.ObjectId(campaignId);
        if (telegramId) query.telegramId = telegramId;
        if (from || to) {
            query.donatedAt = {};
            if (from) query.donatedAt.$gte = from;
            if (to) query.donatedAt.$lte = to;
        }

        const list = await CharityDonation.find(query)
            .sort({ donatedAt: -1 })
            .limit(limit)
            .lean()
            .populate('campaignId', 'name cause status');
        res.json(list);
    } catch (err) {
        console.error('Admin charity donations list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/admin/charity/stats — global + per-campaign stats
router.get('/stats', async (_req, res) => {
    try {
        const [global, byCampaign] = await Promise.all([
            CharityCampaign.aggregate([
                { $match: { status: { $in: ['active', 'ended', 'funded', 'disbursed'] } } },
                {
                    $group: {
                        _id: null,
                        totalRaisedNeur: { $sum: '$raisedNeur' },
                        totalRaisedAiba: { $sum: '$raisedAiba' },
                        campaignCount: { $sum: 1 },
                    },
                },
            ]),
            CharityCampaign.find({ status: { $in: ['active', 'ended', 'funded', 'disbursed'] } })
                .lean()
                .select('name cause status raisedNeur raisedAiba donorCount goalNeur goalAiba'),
        ]);

        const donorCount = await CharityDonation.distinct('telegramId').then((ids) => ids.length);

        const g = global[0] || {};
        res.json({
            totalRaisedNeur: g.totalRaisedNeur ?? 0,
            totalRaisedAiba: g.totalRaisedAiba ?? 0,
            totalDonors: donorCount,
            campaignCount: g.campaignCount ?? 0,
            byCampaign,
        });
    } catch (err) {
        console.error('Admin charity stats error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
