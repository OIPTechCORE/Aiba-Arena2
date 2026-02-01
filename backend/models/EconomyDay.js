const mongoose = require('mongoose');

const EconomyDaySchema = new mongoose.Schema(
    {
        day: { type: String, required: true, unique: true, index: true }, // YYYY-MM-DD (UTC)

        // Emissions
        emittedAiba: { type: Number, default: 0 },
        emittedNeur: { type: Number, default: 0 },

        // Sinks (tracking only; you can wire these into on-chain burns later)
        burnedAiba: { type: Number, default: 0 },
        spentNeur: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('EconomyDay', EconomyDaySchema);

