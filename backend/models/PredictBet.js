/**
 * Predict/Bet: user's bet on a predict event.
 */
const mongoose = require('mongoose');

const PredictBetSchema = new mongoose.Schema(
    {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'PredictEvent', required: true },
        telegramId: { type: String, required: true },
        brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true }, // broker A or B — which side they bet on
        amountAiba: { type: Number, required: true, min: 1 },
        requestId: { type: String, trim: true, maxLength: 128, sparse: true },
    },
    { timestamps: true },
);

PredictBetSchema.index({ eventId: 1, telegramId: 1 }, { unique: true }); // one bet per user per event
PredictBetSchema.index({ eventId: 1, brokerId: 1 }); // resolve path: find winner bets
PredictBetSchema.index({ requestId: 1 }, { unique: true, sparse: true }); // idempotency

module.exports = mongoose.model('PredictBet', PredictBetSchema);
