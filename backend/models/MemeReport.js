const mongoose = require('mongoose');

const MemeReportSchema = new mongoose.Schema(
    {
        memeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meme', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
        reason: { type: String, default: 'spam', trim: true },
    },
    { timestamps: true },
);

MemeReportSchema.index({ memeId: 1, telegramId: 1 }, { unique: true });

module.exports = mongoose.model('MemeReport', MemeReportSchema);
