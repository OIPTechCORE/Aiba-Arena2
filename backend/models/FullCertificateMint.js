const mongoose = require('mongoose');

const FullCertificateMintSchema = new mongoose.Schema(
    {
        telegramId: { type: String, required: true, index: true },
        txHash: { type: String, required: true, trim: true, unique: true, index: true },
    },
    { timestamps: true },
);

FullCertificateMintSchema.index({ telegramId: 1 });

module.exports = mongoose.model('FullCertificateMint', FullCertificateMintSchema);
