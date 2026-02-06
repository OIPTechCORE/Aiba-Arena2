const mongoose = require('mongoose');

const MentorSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },
        realmKey: { type: String, default: '', trim: true },
        tier: { type: String, default: 'guide', trim: true }, // guide, coach, strategist, architect, mastermind
        description: { type: String, default: '', trim: true },
        perks: { type: [String], default: [] },
        stakingRequiredAiba: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
);

MentorSchema.index({ key: 1 }, { unique: true });
MentorSchema.index({ realmKey: 1, tier: 1 });

module.exports = mongoose.model('Mentor', MentorSchema);
