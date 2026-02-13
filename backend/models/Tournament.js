const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        arena: { type: String, required: true, trim: true },
        league: { type: String, default: 'rookie', trim: true },
        status: { type: String, enum: ['open', 'running', 'completed', 'cancelled'], default: 'open', index: true },
        maxEntries: { type: Number, default: 16 },
        entryCostTonNano: { type: Number, default: 0 },
        entryCostAiba: { type: Number, default: 0 },
        prizePoolTon: { type: Number, default: 0 },
        prizePoolAiba: { type: Number, default: 0 },
        treasuryCutAiba: { type: Number, default: 0 },
        startsAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        seed: { type: String, default: '', trim: true },
        bracket: { type: Object, default: {} },
        winnerTelegramId: { type: String, default: '', trim: true },
    },
    { timestamps: true },
);

TournamentSchema.index({ status: 1, createdAt: -1 });
TournamentSchema.index({ arena: 1, league: 1, status: 1 });

module.exports = mongoose.model('Tournament', TournamentSchema);
