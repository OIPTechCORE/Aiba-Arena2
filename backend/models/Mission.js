const mongoose = require('mongoose');

const MissionSchema = new mongoose.Schema(
    {
        realmKey: { type: String, required: true, index: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        type: { type: String, default: 'mission', trim: true }, // knowledge, simulation, mission, boss
        rewardAiba: { type: Number, default: 0 },
        rewardNeur: { type: Number, default: 0 },
        xp: { type: Number, default: 0 },
        order: { type: Number, default: 0 },
        requirements: { type: Object, default: {} }, // e.g. { minLevel: 2, completedMissions: [...] }
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
);

MissionSchema.index({ realmKey: 1, order: 1 });

module.exports = mongoose.model('Mission', MissionSchema);
