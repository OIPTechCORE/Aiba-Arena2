const mongoose = require('mongoose');

const UniversityProgressSchema = new mongoose.Schema(
    {
        telegramId: { type: String, required: true, unique: true, index: true },
        completedKeys: { type: [String], default: [] },
        graduatedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

UniversityProgressSchema.index({ telegramId: 1 });

module.exports = mongoose.model('UniversityProgress', UniversityProgressSchema);
