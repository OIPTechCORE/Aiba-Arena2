const mongoose = require('mongoose');

const BikeTrackSchema = new mongoose.Schema(
    {
        trackId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        length: { type: Number, default: 1 },
        difficulty: { type: Number, default: 50 },
        league: { type: String, default: 'rookie', index: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

BikeTrackSchema.index({ league: 1, active: 1 });

module.exports = mongoose.model('BikeTrack', BikeTrackSchema);
