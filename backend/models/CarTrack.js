const mongoose = require('mongoose');

const CarTrackSchema = new mongoose.Schema(
    {
        trackId: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },
        length: { type: Number, default: 1 },
        difficulty: { type: Number, default: 50 },
        league: { type: String, enum: ['rookie', 'pro', 'elite'], default: 'rookie', index: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
);

CarTrackSchema.index({ league: 1, active: 1 });

module.exports = mongoose.model('CarTrack', CarTrackSchema);
