const mongoose = require('mongoose');

const MemeSaveSchema = new mongoose.Schema(
    {
        memeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meme', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
    },
    { timestamps: true },
);

MemeSaveSchema.index({ memeId: 1, telegramId: 1 }, { unique: true });
MemeSaveSchema.index({ telegramId: 1, createdAt: -1 });

module.exports = mongoose.model('MemeSave', MemeSaveSchema);
