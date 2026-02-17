const mongoose = require('mongoose');

const MemeShareSchema = new mongoose.Schema(
    {
        memeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meme', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
        kind: { type: String, required: true, enum: ['internal', 'external'], index: true },
    },
    { timestamps: true },
);

MemeShareSchema.index({ memeId: 1, telegramId: 1, kind: 1 });

module.exports = mongoose.model('MemeShare', MemeShareSchema);
