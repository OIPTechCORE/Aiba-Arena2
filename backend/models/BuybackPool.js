const mongoose = require('mongoose');

const BuybackPoolSchema = new mongoose.Schema(
    {
        aibaBalance: { type: Number, default: 0 },
        neurBalance: { type: Number, default: 0 },
        totalBoughtBackAiba: { type: Number, default: 0 },
    },
    { timestamps: true },
);

module.exports = mongoose.model('BuybackPool', BuybackPoolSchema);
