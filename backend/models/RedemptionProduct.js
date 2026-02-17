const mongoose = require('mongoose');

const RedemptionProductSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        type: { type: String, required: true, enum: ['school_fee_discount', 'lms_premium', 'exam_prep', 'merch', 'custom'], index: true },
        costAiba: { type: Number, default: 0 },
        costNeur: { type: Number, default: 0 },
        costStars: { type: Number, default: 0 },
        enabled: { type: Boolean, default: true },
        // Partner LMS / external: webhook or API URL to call on redeem (optional)
        partnerWebhookUrl: { type: String, default: '', trim: true },
        partnerPayloadTemplate: { type: Object, default: {} },
        // Output: code/coupon to issue (if no webhook)
        issueCodePrefix: { type: String, default: 'REDEEM', trim: true },
        maxRedemptionsPerUser: { type: Number, default: 0 },
        maxRedemptionsTotal: { type: Number, default: 0 },
        metadata: { type: Object, default: {} },
    },
    { timestamps: true },
);

module.exports = mongoose.model('RedemptionProduct', RedemptionProductSchema);
