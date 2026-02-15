/**
 * Predict/Bet: user's bet on a predict event.
 */
const mongoose = require('mongoose');

const PredictBetSchema = new mongoose.Schema(
    {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'PredictEvent', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
        brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true }, // broker A or B — which side they bet on
        amountAiba: { type: Number, required: true, min: 1 },
    },
    { timestamps: true },
);

PredictBetSchema.index({ eventId: 1, telegramId: 1 }, { unique: true }); // one bet per user per event
PredictBetSchema.index({ eventId: 1, brokerId: 1 });

module.exports = mongoose.model('PredictBet', PredictBetSchema);
