const mongoose = require('mongoose');

const MemeAppealSchema = new mongoose.Schema(
    {
        memeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meme', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
        reason: { type: String, default: '', trim: true },
        status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'], index: true },
        reviewedAt: { type: Date, default: null },
        reviewedBy: { type: String, default: '', trim: true },
    },
    { timestamps: true },
);

MemeAppealSchema.index({ memeId: 1, status: 1 });
MemeAppealSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('MemeAppeal', MemeAppealSchema);
