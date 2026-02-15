const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, trim: true },
        ownerTelegramId: { type: String, required: true },
        uses: { type: Number, default: 0 },
        maxUses: { type: Number, default: 1000 },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
);

module.exports = mongoose.model('Referral', ReferralSchema);
