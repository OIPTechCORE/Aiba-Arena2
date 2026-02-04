const mongoose = require('mongoose');

const BikeRaceEntrySchema = new mongoose.Schema({
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'BikeRace', required: true, index: true },
    bikeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RacingMotorcycle', required: true, index: true },
    telegramId: { type: String, required: true, index: true },
    position: { type: Number, default: null },
    finishTime: { type: Number, default: null },
    points: { type: Number, default: 0 },
    aibaReward: { type: Number, default: 0 },
}, { timestamps: true });

BikeRaceEntrySchema.index({ raceId: 1 });
BikeRaceEntrySchema.index({ telegramId: 1, raceId: 1 }, { unique: true });

module.exports = mongoose.model('BikeRaceEntry', BikeRaceEntrySchema);
