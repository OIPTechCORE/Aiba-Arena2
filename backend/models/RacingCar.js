const mongoose = require('mongoose');

const CAR_CLASSES = [
    'formula1', 'lemans', 'canam', 'indycar', 'groupB', 'gt1', 'electric',
    'drag', 'touring', 'hillclimb', 'nascar', 'historic', 'hypercar', 'extreme',
];

const RacingCarSchema = new mongoose.Schema(
    {
        ownerTelegramId: { type: String, index: true, required: true },
        carClass: { type: String, enum: CAR_CLASSES, default: 'formula1', trim: true, index: true },
        topSpeed: { type: Number, default: 50 },
        acceleration: { type: Number, default: 50 },
        handling: { type: Number, default: 50 },
        durability: { type: Number, default: 50 },
        level: { type: Number, default: 1 },
        xp: { type: Number, default: 0 },
        energy: { type: Number, default: 100 },
        energyUpdatedAt: { type: Date, default: () => new Date() },
        cooldowns: { type: Map, of: Date, default: {} },
        lastRaceAt: { type: Date, default: null },
        nftItemAddress: { type: String, default: '', trim: true },
        createdWithTonTxHash: { type: String, default: '', trim: true, sparse: true, index: true },
    },
    { timestamps: true },
);

RacingCarSchema.index({ ownerTelegramId: 1, createdAt: -1 });

RacingCarSchema.statics.CAR_CLASSES = CAR_CLASSES;

module.exports = mongoose.model('RacingCar', RacingCarSchema);
module.exports.CAR_CLASSES = CAR_CLASSES;
