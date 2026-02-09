const express = require('express');
const Asset = require('../models/Asset');
const User = require('../models/User');
const EconomyConfig = require('../models/EconomyConfig');
const TreasuryOp = require('../models/TreasuryOp');
const { requireTelegram } = require('../middleware/requireTelegram');
const { validateBody } = require('../middleware/validate');
const { computeTokenSplits } = require('../util/tokenSplits');

const router = express.Router();

router.get('/mine', requireTelegram, async (req, res) => {
    const user = await User.findOne({ telegramId: req.telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const assets = await Asset.find({ ownerId: user._id }).lean();
    res.json({ assets });
});

router.post(
    '/mint',
    requireTelegram,
    validateBody({
        category: { type: 'string', trim: true, maxLength: 100 },
        name: { type: 'string', trim: true, maxLength: 120 },
        realmKey: { type: 'string', trim: true, maxLength: 50 },
        metadataUri: { type: 'string', trim: true, maxLength: 500 },
    }),
    async (req, res) => {
    const { category, name, realmKey, metadataUri } = req.validatedBody || {};
    const user = await User.findOne({ telegramId: req.telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const cfg = (await EconomyConfig.findOne().sort({ createdAt: -1 })) || new EconomyConfig();
    const fee = Number(cfg.assetMintFeeAiba || 0);
    if (fee > 0 && user.aibaBalance < fee) return res.status(400).json({ error: 'Insufficient AIBA' });

    user.aibaBalance -= fee;
    user.assetCount += 1;
    await user.save();

    const asset = await Asset.create({
        ownerId: user._id,
        category,
        name,
        realmKey,
        metadataUri,
    });

    const splits = computeTokenSplits(fee, cfg);
    for (const [type, amount] of Object.entries(splits)) {
        if (!amount) continue;
        await TreasuryOp.create({ type, amountAiba: amount, source: 'asset_mint', refId: String(asset._id) });
    }

    res.json({ asset });
    },
);

router.post(
    '/upgrade',
    requireTelegram,
    validateBody({
        assetId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
    const assetId = req.validatedBody?.assetId;
    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const user = await User.findOne({ telegramId: req.telegramId });
    if (!user || String(asset.ownerId) !== String(user._id)) return res.status(403).json({ error: 'Not owner' });

    const cfg = (await EconomyConfig.findOne().sort({ createdAt: -1 })) || new EconomyConfig();
    const fee = Number(cfg.assetUpgradeFeeAiba || 0);
    if (fee > 0 && user.aibaBalance < fee) return res.status(400).json({ error: 'Insufficient AIBA' });

    user.aibaBalance -= fee;
    await user.save();

    asset.level += 1;
    asset.upgradeCount += 1;
    await asset.save();

    const splits = computeTokenSplits(fee, cfg);
    for (const [type, amount] of Object.entries(splits)) {
        if (!amount) continue;
        await TreasuryOp.create({ type, amountAiba: amount, source: 'asset_upgrade', refId: String(asset._id) });
    }

    res.json({ asset });
    },
);

module.exports = router;
