const mongoose = require('mongoose');

const MemeFiDailyRunSchema = new mongoose.Schema(
    {
        dayKey: { type: String, required: true, unique: true, trim: true },
        status: { type: String, required: true, enum: ['running', 'completed', 'failed'], default: 'running' },
        completedAt: { type: Date, default: null },
        resultSummary: { type: Object, default: {} },
        errorMessage: { type: String, default: '', trim: true },
    },
    { timestamps: true },
);

MemeFiDailyRunSchema.index({ dayKey: 1 });
MemeFiDailyRunSchema.index({ status: 1, completedAt: -1 });

module.exports = mongoose.model('MemeFiDailyRun', MemeFiDailyRunSchema);
