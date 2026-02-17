const mongoose = require('mongoose');

const RedemptionSchema = new mongoose.Schema(
    {
        telegramId: { type: String, required: true, index: true },
        productKey: { type: String, required: true, index: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'RedemptionProduct', index: true },
        costAiba: { type: Number, default: 0 },
        costNeur: { type: Number, default: 0 },
        costStars: { type: Number, default: 0 },
        code: { type: String, default: '', trim: true, index: true },
        status: { type: String, default: 'issued', enum: ['issued', 'consumed', 'expired', 'failed'], index: true },
        partnerResponse: { type: Object, default: {} },
        consumedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

RedemptionSchema.index({ telegramId: 1, productKey: 1 });
RedemptionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Redemption', RedemptionSchema);
