const mongoose = require('mongoose');

const MemeBoostSchema = new mongoose.Schema(
    {
        memeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meme', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
        amountAiba: { type: Number, required: true, min: 0 },
        amountNeur: { type: Number, default: 0, min: 0 },
        multiplier: { type: Number, default: 1 },
        unlockedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

MemeBoostSchema.index({ memeId: 1, telegramId: 1 });
MemeBoostSchema.index({ telegramId: 1, createdAt: -1 });
MemeBoostSchema.index({ unlockedAt: 1 });

module.exports = mongoose.model('MemeBoost', MemeBoostSchema);
