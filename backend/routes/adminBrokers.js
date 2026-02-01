const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const Broker = require('../models/Broker');

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

module.exports = router;
