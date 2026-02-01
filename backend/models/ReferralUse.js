const mongoose = require('mongoose');

const ReferralUseSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, trim: true, index: true },
        referrerTelegramId: { type: String, required: true, index: true },
        refereeTelegramId: { type: String, required: true, unique: true, index: true },
    },
    { timestamps: true },
);

ReferralUseSchema.index({ referrerTelegramId: 1, createdAt: -1 });

module.exports = mongoose.model('ReferralUse', ReferralUseSchema);
