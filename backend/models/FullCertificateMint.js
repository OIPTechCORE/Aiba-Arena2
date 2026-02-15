const mongoose = require('mongoose');

const FullCertificateMintSchema = new mongoose.Schema(
    {
        telegramId: { type: String, required: true },
        txHash: { type: String, required: true, trim: true, unique: true },
    },
    { timestamps: true },
);

FullCertificateMintSchema.index({ telegramId: 1 });

module.exports = mongoose.model('FullCertificateMint', FullCertificateMintSchema);
