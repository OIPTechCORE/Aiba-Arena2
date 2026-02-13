const mongoose = require('mongoose');

const TournamentEntrySchema = new mongoose.Schema(
    {
        tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
        brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
        paidTonTxHash: { type: String, default: '', trim: true },
        paidAiba: { type: Number, default: 0 },
        position: { type: Number, default: null },
        aibaReward: { type: Number, default: 0 },
    },
    { timestamps: true },
);

TournamentEntrySchema.index({ tournamentId: 1, telegramId: 1 }, { unique: true });

module.exports = mongoose.model('TournamentEntry', TournamentEntrySchema);
