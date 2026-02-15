/**
 * Predict/Bet: "Battle of the hour" — users bet AIBA on which broker scores higher.
 * INNOVATIONS-100X-ADVISORY §4
 */
const mongoose = require('mongoose');

const PredictEventSchema = new mongoose.Schema(
    {
        brokerAId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
        brokerBId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
        arena: { type: String, default: 'prediction', trim: true },
        league: { type: String, default: 'rookie', trim: true },
        status: { type: String, enum: ['open', 'resolved', 'cancelled'], default: 'open', index: true },
        // When resolved: which broker won (higher score)
        resultBrokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker' },
        scoreA: { type: Number },
        scoreB: { type: Number },
        poolAiba: { type: Number, default: 0 }, // total bet on broker A
        poolBiba: { type: Number, default: 0 }, // total bet on broker B
        vigBps: { type: Number, default: 300 }, // 3% to treasury
        maxBetAiba: { type: Number, default: 10_000 },
        resolvedAt: { type: Date },
    },
    { timestamps: true },
);

PredictEventSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PredictEvent', PredictEventSchema);
