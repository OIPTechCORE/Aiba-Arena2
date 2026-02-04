const mongoose = require('mongoose');

const GiftSchema = new mongoose.Schema(
    {
        fromTelegramId: { type: String, required: true, index: true },
        toTelegramId: { type: String, required: true, index: true },
        amountNano: { type: Number, default: 0 },
        txHash: { type: String, default: '', trim: true, index: true },
        message: { type: String, default: '', trim: true },
    },
    { timestamps: true },
);

GiftSchema.index({ toTelegramId: 1, createdAt: -1 });
GiftSchema.index({ fromTelegramId: 1, createdAt: -1 });

module.exports = mongoose.model('Gift', GiftSchema);
