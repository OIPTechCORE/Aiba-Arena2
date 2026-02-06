const mongoose = require('mongoose');

const TreasuryOpSchema = new mongoose.Schema(
    {
        type: { type: String, required: true, trim: true }, // burn, treasury, rewards, staking
        amountAiba: { type: Number, required: true },
        source: { type: String, default: '', trim: true }, // marketplace, arena, mentor, mint, upgrade
        refId: { type: String, default: '', trim: true },
    },
    { timestamps: true },
);

TreasuryOpSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('TreasuryOp', TreasuryOpSchema);
