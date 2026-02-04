const mongoose = require('mongoose');

const RacingMotorcycleSchema = new mongoose.Schema({
    ownerTelegramId: { type: String, index: true, required: true },
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
}, { timestamps: true });

RacingMotorcycleSchema.index({ ownerTelegramId: 1, createdAt: -1 });

module.exports = mongoose.model('RacingMotorcycle', RacingMotorcycleSchema);
