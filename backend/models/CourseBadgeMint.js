const mongoose = require('mongoose');

const CourseBadgeMintSchema = new mongoose.Schema(
    {
        telegramId: { type: String, required: true },
        txHash: { type: String, required: true, trim: true, unique: true },
    },
    { timestamps: true },
);

CourseBadgeMintSchema.index({ telegramId: 1 });

module.exports = mongoose.model('CourseBadgeMint', CourseBadgeMintSchema);
