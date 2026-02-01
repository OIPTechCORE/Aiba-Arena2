const mongoose = require('mongoose');

const EconomyDaySchema = new mongoose.Schema(
    {
        day: { type: String, required: true, unique: true, index: true }, // YYYY-MM-DD (UTC)

        // Emissions
        emittedAiba: { type: Number, default: 0 },
        emittedNeur: { type: Number, default: 0 },
        emittedAibaByArena: { type: Map, of: Number, default: {} },
        emittedNeurByArena: { type: Map, of: Number, default: {} },

        // Sinks (tracking only; you can wire these into on-chain burns later)
        burnedAiba: { type: Number, default: 0 },
        spentNeur: { type: Number, default: 0 },
        burnedAibaByReason: { type: Map, of: Number, default: {} },
        spentNeurByReason: { type: Map, of: Number, default: {} },
        burnedAibaByArena: { type: Map, of: Number, default: {} },
        spentNeurByArena: { type: Map, of: Number, default: {} },
    },
    { timestamps: true }
);

module.exports = mongoose.model('EconomyDay', EconomyDaySchema);

