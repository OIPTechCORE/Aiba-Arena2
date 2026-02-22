const mongoose = require('mongoose');

const CharityDonationSchema = new mongoose.Schema(
    {
        campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'CharityCampaign', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
        amountNeur: { type: Number, default: 0 },
        amountAiba: { type: Number, default: 0 },
        amountTonNano: { type: Number, default: 0 },
        source: {
            type: String,
            enum: ['balance', 'ton', 'round_up', 'marketplace'],
            default: 'balance',
            index: true,
        },
        message: { type: String, default: '', trim: true },
        anonymous: { type: Boolean, default: false },
        txHash: { type: String, default: '', trim: true, index: true },
        requestId: { type: String, default: null, trim: true, sparse: true },
        donatedAt: { type: Date, default: Date.now, index: true },
    },
    { timestamps: true },
);

CharityDonationSchema.index({ campaignId: 1, donatedAt: -1 });
CharityDonationSchema.index({ telegramId: 1, donatedAt: -1 });
CharityDonationSchema.index({ campaignId: 1, telegramId: 1 });

module.exports = mongoose.model('CharityDonation', CharityDonationSchema);
