const mongoose = require('mongoose');

const UsedTonTxHashSchema = new mongoose.Schema(
    {
        txHash: { type: String, required: true, trim: true, unique: true },
        purpose: { type: String, required: true, trim: true, index: true }, // 'profile_boost', 'gift'
        ownerTelegramId: { type: String, default: '', index: true },
    },
    { timestamps: true },
);

module.exports = mongoose.model('UsedTonTxHash', UsedTonTxHashSchema);
