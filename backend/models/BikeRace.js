const mongoose = require('mongoose');

const BikeRaceSchema = new mongoose.Schema(
    {
        trackId: { type: String, required: true, index: true },
        league: { type: String, enum: ['rookie', 'pro', 'elite'], default: 'rookie', index: true },
        status: { type: String, enum: ['open', 'running', 'completed'], default: 'open', index: true },
        entryFeeAiba: { type: Number, default: 0 },
        rewardPool: { type: Number, default: 0 },
        maxEntries: { type: Number, default: 16 },
        seed: { type: String, default: '', trim: true },
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

BikeRaceSchema.index({ status: 1, league: 1, createdAt: -1 });

module.exports = mongoose.model('BikeRace', BikeRaceSchema);
