const mongoose = require('mongoose');

const CarRaceSchema = new mongoose.Schema(
    {
        trackId: { type: String, required: true, index: true },
        league: { type: String, default: 'rookie', index: true },
        status: { type: String, default: 'open', index: true },
        entryFeeAiba: { type: Number, default: 0 },
        rewardPool: { type: Number, default: 0 },
        maxEntries: { type: Number, default: 16 },
        seed: { type: String, default: '' },
        startedAt: Date,
        completedAt: Date,
    },
    { timestamps: true },
);

CarRaceSchema.index({ status: 1, league: 1, createdAt: -1 });

module.exports = mongoose.model('CarRace', CarRaceSchema);
