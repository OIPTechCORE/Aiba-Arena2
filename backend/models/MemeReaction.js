const mongoose = require('mongoose');

const MemeReactionSchema = new mongoose.Schema(
    {
        memeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meme', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
        reactionType: { type: String, required: true, trim: true, index: true }, // e.g. fire, funny, edu
    },
    { timestamps: true },
);

MemeReactionSchema.index({ memeId: 1, telegramId: 1 }, { unique: true });

module.exports = mongoose.model('MemeReaction', MemeReactionSchema);
