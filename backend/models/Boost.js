const mongoose = require('mongoose');

const BoostSchema = new mongoose.Schema(
    {
        telegramId: { type: String, required: true, index: true },
        type: { type: String, default: 'score_multiplier', trim: true },
        multiplier: { type: Number, default: 1.2 },
        expiresAt: { type: Date, required: true, index: true },
        meta: { type: Object, default: {} },
    },
    { timestamps: true },
);

BoostSchema.index({ telegramId: 1, expiresAt: 1 });

module.exports = mongoose.model('Boost', BoostSchema);
