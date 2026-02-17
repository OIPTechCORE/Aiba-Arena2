const mongoose = require('mongoose');

const MemeCommentSchema = new mongoose.Schema(
    {
        memeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meme', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
        text: { type: String, required: true, trim: true, maxlength: 500 },
    },
    { timestamps: true },
);

MemeCommentSchema.index({ memeId: 1, createdAt: -1 });

module.exports = mongoose.model('MemeComment', MemeCommentSchema);
