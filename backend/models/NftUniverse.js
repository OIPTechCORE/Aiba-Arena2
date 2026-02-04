const mongoose = require('mongoose');

const NftUniverseSchema = new mongoose.Schema(
    {
        slug: { type: String, required: true, unique: true, trim: true, index: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        type: { type: String, enum: ['broker', 'arena_legend', 'badge_course', 'badge_full_cert', 'land', 'art'], default: 'broker' },
        // Mint: AIBA cost (for broker, arena_legend); 0 if TON-only
        mintCostAiba: { type: Number, default: 0, min: 0 },
        // Mint: TON cost (nano); 0 if AIBA-only
        mintCostTonNano: { type: Number, default: 0, min: 0 },
        // Env var name for TON wallet (e.g. CREATED_BROKERS_WALLET, UNIVERSITY_BADGE_TON_WALLET)
        tonWalletEnvVar: { type: String, default: '', trim: true },
        // Marketplace fee basis points (e.g. 300 = 3%)
        feeBps: { type: Number, default: 300, min: 0, max: 10000 },
        burnBps: { type: Number, default: 0, min: 0, max: 10000 },
        // Staking: can users stake NFTs from this universe for AIBA rewards?
        stakingEnabled: { type: Boolean, default: true },
        active: { type: Boolean, default: true, index: true },
        order: { type: Number, default: 0 },
    },
    { timestamps: true },
);

NftUniverseSchema.index({ active: 1, order: 1 });

module.exports = mongoose.model('NftUniverse', NftUniverseSchema);
