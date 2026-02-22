const mongoose = require('mongoose');

const RedemptionCodeBatchSchema = new mongoose.Schema(
    {
        productKey: { type: String, required: true },
        codes: [{ type: String, trim: true }],
        nextIndex: { type: Number, default: 0 },
    },
    { timestamps: true },
);

RedemptionCodeBatchSchema.index({ productKey: 1 });

module.exports = mongoose.model('RedemptionCodeBatch', RedemptionCodeBatchSchema);
