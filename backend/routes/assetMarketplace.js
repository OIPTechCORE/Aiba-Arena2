const express = require('express');
const Asset = require('../models/Asset');
const AssetListing = require('../models/AssetListing');
const Rental = require('../models/Rental');
const User = require('../models/User');
const EconomyConfig = require('../models/EconomyConfig');
const TreasuryOp = require('../models/TreasuryOp');
const { requireTelegram } = require('../middleware/requireTelegram');
const { computeTokenSplits } = require('../util/tokenSplits');

const router = express.Router();

router.get('/listings', async (req, res) => {
    const listingType = String(req.query.listingType || '').trim();
    const query = { status: 'active' };
    if (listingType) query.listingType = listingType;
    const listings = await AssetListing.find(query).sort({ createdAt: -1 }).lean();
    res.json({ listings });
});

router.post('/list', requireTelegram, async (req, res) => {
    const { assetId, priceAiba, listingType } = req.body || {};
    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const user = await User.findOne({ telegramId: req.telegramId });
    if (!user || String(asset.ownerId) !== String(user._id)) return res.status(403).json({ error: 'Not owner' });

    const listing = await AssetListing.create({
        assetId: asset._id,
        sellerId: user._id,
        priceAiba: Number(priceAiba || 0),
        listingType: listingType || 'secondary_sale',
    });

    asset.status = 'listed';
    await asset.save();

    res.json({ listing });
});

router.post('/buy', requireTelegram, async (req, res) => {
    const listingId = String(req.body?.listingId || '').trim();
    const listing = await AssetListing.findById(listingId);
    if (!listing || listing.status !== 'active') return res.status(404).json({ error: 'Listing not found' });

    const buyer = await User.findOne({ telegramId: req.telegramId });
    if (!buyer) return res.status(404).json({ error: 'User not found' });
    if (buyer.aibaBalance < listing.priceAiba) return res.status(400).json({ error: 'Insufficient AIBA' });

    const seller = await User.findById(listing.sellerId);
    const asset = await Asset.findById(listing.assetId);
    if (!seller || !asset) return res.status(404).json({ error: 'Asset not found' });

    const cfg = (await EconomyConfig.findOne().sort({ createdAt: -1 })) || new EconomyConfig();
    const feeBps = Number(cfg.marketplaceFeeBps || 0);
    const fee = Math.floor((listing.priceAiba * feeBps) / 10000);
    const sellerAmount = listing.priceAiba - fee;

    buyer.aibaBalance -= listing.priceAiba;
    seller.aibaBalance += sellerAmount;
    await buyer.save();
    await seller.save();

    asset.ownerId = buyer._id;
    asset.status = 'owned';
    await asset.save();

    listing.status = 'sold';
    await listing.save();

    const splits = computeTokenSplits(fee, cfg);
    for (const [type, amount] of Object.entries(splits)) {
        if (!amount) continue;
        await TreasuryOp.create({ type, amountAiba: amount, source: 'asset_sale', refId: String(listing._id) });
    }

    res.json({ ok: true, asset });
});

router.post('/rent', requireTelegram, async (req, res) => {
    const { listingId, durationHours } = req.body || {};
    const listing = await AssetListing.findById(listingId);
    if (!listing || listing.status !== 'active') return res.status(404).json({ error: 'Listing not found' });

    const renter = await User.findOne({ telegramId: req.telegramId });
    if (!renter) return res.status(404).json({ error: 'User not found' });
    if (renter.aibaBalance < listing.priceAiba) return res.status(400).json({ error: 'Insufficient AIBA' });

    const owner = await User.findById(listing.sellerId);
    if (!owner) return res.status(404).json({ error: 'Owner not found' });

    const cfg = (await EconomyConfig.findOne().sort({ createdAt: -1 })) || new EconomyConfig();
    const feeBps = Number(cfg.assetRentalFeeBps || 0);
    const fee = Math.floor((listing.priceAiba * feeBps) / 10000);
    const ownerAmount = listing.priceAiba - fee;

    renter.aibaBalance -= listing.priceAiba;
    owner.aibaBalance += ownerAmount;
    await renter.save();
    await owner.save();

    const endsAt = new Date(Date.now() + Number(durationHours || 24) * 3600 * 1000);
    const rental = await Rental.create({
        assetId: listing.assetId,
        ownerId: owner._id,
        renterId: renter._id,
        priceAiba: listing.priceAiba,
        durationHours: Number(durationHours || 24),
        endsAt,
    });

    const splits = computeTokenSplits(fee, cfg);
    for (const [type, amount] of Object.entries(splits)) {
        if (!amount) continue;
        await TreasuryOp.create({ type, amountAiba: amount, source: 'asset_rent', refId: String(rental._id) });
    }

    res.json({ rental });
});

module.exports = router;
