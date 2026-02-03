const mongoose = require('mongoose');

const StabilityReserveSchema = new mongoose.Schema(
    {
        aibaBalance: { type: Number, default: 0 },
        neurBalance: { type: Number, default: 0 },
        tonBalanceNano: { type: String, default: '0', trim: true },
    },
    { timestamps: true },
);

module.exports = mongoose.model('StabilityReserve', StabilityReserveSchema);
