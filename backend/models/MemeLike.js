const mongoose = require('mongoose');

const MemeLikeSchema = new mongoose.Schema(
    {
        memeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meme', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
    },
    { timestamps: true },
);

MemeLikeSchema.index({ memeId: 1, telegramId: 1 }, { unique: true });

module.exports = mongoose.model('MemeLike', MemeLikeSchema);
