const mongoose = require('mongoose');

const TrainerUseSchema = new mongoose.Schema(
    {
        trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true, index: true },
        refereeTelegramId: { type: String, required: true, index: true },
        battlesCompleted: { type: Number, default: 0 },
        isTrainerRecruit: { type: Boolean, default: false },
    },
    { timestamps: true },
);

TrainerUseSchema.index({ trainerId: 1, refereeTelegramId: 1 }, { unique: true });

module.exports = mongoose.model('TrainerUse', TrainerUseSchema);
