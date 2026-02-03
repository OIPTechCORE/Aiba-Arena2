const mongoose = require('mongoose');

const TreasurySchema = new mongoose.Schema(
    {
        // Single global treasury (id: 'default' or first doc)
        balanceAiba: { type: Number, default: 0 },
        balanceNeur: { type: Number, default: 0 },
        totalPaidOutAiba: { type: Number, default: 0 },
        totalPaidOutNeur: { type: Number, default: 0 },
    },
    { timestamps: true },
);

module.exports = mongoose.model('Treasury', TreasurySchema);
