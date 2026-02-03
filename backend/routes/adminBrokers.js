const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const Broker = require('../models/Broker');
const BrokerMintJob = require('../models/BrokerMintJob');

router.use(requireAdmin());

// GET /api/admin/brokers?ownerTelegramId=...&minted=true
router.get('/', async (req, res) => {
    try {
        const q = {};
        const ownerTelegramId = req.query?.ownerTelegramId ? String(req.query.ownerTelegramId).trim() : '';
        const minted = req.query?.minted !== undefined ? String(req.query.minted).trim() : '';

        if (ownerTelegramId) q.ownerTelegramId = ownerTelegramId;
        if (minted === 'true') q.nftItemAddress = { $ne: '' };
        if (minted === 'false') q.$or = [{ nftItemAddress: { $exists: false } }, { nftItemAddress: '' }];

        const brokers = await Broker.find(q).sort({ createdAt: -1 }).limit(200).lean();
        res.json(brokers);
    } catch (err) {
        console.error('Error listing brokers (admin):', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/brokers/:id/link-nft
// Body: { nftCollectionAddress, nftItemIndex, nftItemAddress, metadataUri? }
router.post('/:id/link-nft', async (req, res) => {
    try {
        const { id } = req.params;
        const nftCollectionAddress = String(req.body?.nftCollectionAddress || '').trim();
        const nftItemAddress = String(req.body?.nftItemAddress || '').trim();
        const nftItemIndexRaw = req.body?.nftItemIndex;
        const nftItemIndex = nftItemIndexRaw === undefined || nftItemIndexRaw === null ? null : Number(nftItemIndexRaw);
        const metadataUri = req.body?.metadataUri !== undefined ? String(req.body.metadataUri || '').trim() : undefined;

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
});

// GET /api/admin/brokers/mint-jobs?status=pending
router.get('/mint-jobs', async (req, res) => {
    try {
        const status = String(req.query?.status || '').trim();
        const q = status ? { status } : {};
        const jobs = await BrokerMintJob.find(q).sort({ createdAt: -1 }).limit(100).lean();
        res.json(jobs);
    } catch (err) {
        console.error('Error listing mint jobs:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/brokers/mint-jobs/:id/complete — mark job completed and link NFT to broker
router.post('/mint-jobs/:id/complete', async (req, res) => {
    try {
        const job = await BrokerMintJob.findById(req.params.id);
        if (!job) return res.status(404).json({ error: 'mint job not found' });
        if (job.status === 'completed') return res.status(400).json({ error: 'already completed' });

        const nftCollectionAddress = String(req.body?.nftCollectionAddress || '').trim();
        const nftItemAddress = String(req.body?.nftItemAddress || '').trim();
        const nftItemIndex = req.body?.nftItemIndex != null ? Number(req.body.nftItemIndex) : null;
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
});

module.exports = router;
