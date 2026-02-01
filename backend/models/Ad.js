const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema(
    {
        imageUrl: { type: String, required: true, trim: true },
        linkUrl: { type: String, default: '', trim: true },
        placement: { type: String, default: 'between_battles', trim: true },
        weight: { type: Number, default: 1 },
        active: { type: Boolean, default: true },
        startsAt: { type: Date, default: null },
        endsAt: { type: Date, default: null },
    },
    { timestamps: true }
);

AdSchema.index({ active: 1, placement: 1, startsAt: 1, endsAt: 1 });

module.exports = mongoose.model('Ad', AdSchema);

