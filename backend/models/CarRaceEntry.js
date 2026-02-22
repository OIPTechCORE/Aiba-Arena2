const mongoose = require('mongoose');

const CarRaceEntrySchema = new mongoose.Schema(
    {
        raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'CarRace', required: true },
        carId: { type: mongoose.Schema.Types.ObjectId, ref: 'RacingCar', required: true, index: true },
        telegramId: { type: String, required: true },
        position: { type: Number, default: null },
        finishTime: { type: Number, default: null },
        points: { type: Number, default: 0 },
        aibaReward: { type: Number, default: 0 },
    },
    { timestamps: true },
);

CarRaceEntrySchema.index({ raceId: 1 });
CarRaceEntrySchema.index({ telegramId: 1, raceId: 1 }, { unique: true });

module.exports = mongoose.model('CarRaceEntry', CarRaceEntrySchema);
