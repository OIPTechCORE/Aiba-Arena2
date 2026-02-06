const mongoose = require('mongoose');

const RealmSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        level: { type: Number, default: 1 }, // 1 = Nexus, 2 = Realms, 3 = Inter‑Realm
        order: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
        unlockCriteria: { type: Object, default: {} }, // e.g. { minLevel: 2, completedRealm: "nexus" }
        tracks: { type: [String], default: [] },
    },
    { timestamps: true },
);

RealmSchema.index({ key: 1 }, { unique: true });

module.exports = mongoose.model('Realm', RealmSchema);
