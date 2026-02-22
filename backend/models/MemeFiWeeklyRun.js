const mongoose = require('mongoose');

const MemeFiWeeklyRunSchema = new mongoose.Schema(
    {
        weekKey: { type: String, required: true, unique: true, trim: true },
        status: { type: String, required: true, enum: ['running', 'completed', 'failed'], default: 'running' },
        completedAt: { type: Date, default: null },
        resultSummary: { type: Object, default: {} },
        errorMessage: { type: String, default: '', trim: true },
    },
    { timestamps: true },
);

MemeFiWeeklyRunSchema.index({ weekKey: 1 });

module.exports = mongoose.model('MemeFiWeeklyRun', MemeFiWeeklyRunSchema);
