const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const Broker = require('../models/Broker');
const BrokerMintJob = require('../models/BrokerMintJob');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');
const { adminAudit } = require('../middleware/adminAudit');

router.use(requireAdmin(), adminAudit());

// GET /api/admin/brokers?ownerTelegramId=...&minted=true
router.get(
    '/',
    validateQuery({
        ownerTelegramId: { type: 'string', trim: true, maxLength: 50 },
        minted: { type: 'string', trim: true, maxLength: 10 },
    }),
    async (req, res) => {
    try {
        const q = {};
        const ownerTelegramId = req.validatedQuery?.ownerTelegramId
            ? String(req.validatedQuery.ownerTelegramId).trim()
            : '';
        const minted = req.validatedQuery?.minted !== undefined ? String(req.validatedQuery.minted).trim() : '';

        if (ownerTelegramId) q.ownerTelegramId = ownerTelegramId;
        if (minted === 'true') q.nftItemAddress = { $ne: '' };
        if (minted === 'false') q.$or = [{ nftItemAddress: { $exists: false } }, { nftItemAddress: '' }];

        const brokers = await Broker.find(q).sort({ createdAt: -1 }).limit(200).lean();
        res.json(brokers);
    } catch (err) {
        console.error('Error listing brokers (admin):', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// POST /api/admin/brokers/:id/link-nft
// Body: { nftCollectionAddress, nftItemIndex, nftItemAddress, metadataUri? }
router.post(
    '/:id/link-nft',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        nftCollectionAddress: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        nftItemAddress: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        nftItemIndex: { type: 'integer', min: 0 },
        metadataUri: { type: 'string', trim: true, maxLength: 500 },
    }),
    async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const nftCollectionAddress = String(req.validatedBody?.nftCollectionAddress || '').trim();
        const nftItemAddress = String(req.validatedBody?.nftItemAddress || '').trim();
        const nftItemIndexRaw = req.validatedBody?.nftItemIndex;
        const nftItemIndex = nftItemIndexRaw === undefined || nftItemIndexRaw === null ? null : Number(nftItemIndexRaw);
        const metadataUri =
            req.validatedBody?.metadataUri !== undefined ? String(req.validatedBody.metadataUri || '').trim() : undefined;

        if (!nftCollectionAddress) return res.status(400).json({ error: 'nftCollectionAddress required' });
        if (!nftItemAddress) return res.status(400).json({ error: 'nftItemAddress required' });
        if (nftItemIndex !== null && (!Number.isFinite(nftItemIndex) || nftItemIndex < 0)) {
            return res.status(400).json({ error: 'nftItemIndex invalid' });
        }

        const update = {
            nftCollectionAddress,
            nftItemAddress,
            nftItemIndex,
        };
        if (metadataUri !== undefined) update.metadataUri = metadataUri;

        const broker = await Broker.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
        if (!broker) return res.status(404).json({ error: 'not found' });
        res.json(broker);
    } catch (err) {
        console.error('Error linking broker NFT:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/admin/brokers/mint-jobs?status=pending
router.get(
    '/mint-jobs',
    validateQuery({ status: { type: 'string', trim: true, maxLength: 20 } }),
    async (req, res) => {
    try {
        const status = String(req.validatedQuery?.status || '').trim();
        const q = status ? { status } : {};
        const jobs = await BrokerMintJob.find(q).sort({ createdAt: -1 }).limit(100).lean();
        res.json(jobs);
    } catch (err) {
        console.error('Error listing mint jobs:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// POST /api/admin/brokers/mint-jobs/:id/complete — mark job completed and link NFT to broker
router.post(
    '/mint-jobs/:id/complete',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        nftCollectionAddress: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        nftItemAddress: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        nftItemIndex: { type: 'integer', min: 0 },
    }),
    async (req, res) => {
    try {
        const job = await BrokerMintJob.findById(req.validatedParams.id);
        if (!job) return res.status(404).json({ error: 'mint job not found' });
        if (job.status === 'completed') return res.status(400).json({ error: 'already completed' });

        const nftCollectionAddress = String(req.validatedBody?.nftCollectionAddress || '').trim();
        const nftItemAddress = String(req.validatedBody?.nftItemAddress || '').trim();
        const nftItemIndex = req.validatedBody?.nftItemIndex != null ? Number(req.validatedBody.nftItemIndex) : null;
        if (!nftCollectionAddress || !nftItemAddress) return res.status(400).json({ error: 'nftCollectionAddress and nftItemAddress required' });

        await Broker.findByIdAndUpdate(job.brokerId, {
            $set: {
                nftCollectionAddress,
                nftItemAddress,
                ...(nftItemIndex != null && Number.isFinite(nftItemIndex) ? { nftItemIndex } : {}),
            },
        });
        job.status = 'completed';
        job.nftItemAddress = nftItemAddress;
        job.nftCollectionAddress = nftCollectionAddress;
        job.completedAt = new Date();
        await job.save();
        res.json(job);
    } catch (err) {
        console.error('Error completing mint job:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
