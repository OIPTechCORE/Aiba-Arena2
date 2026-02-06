const mongoose = require('mongoose');

const RentalSchema = new mongoose.Schema(
    {
        assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        priceAiba: { type: Number, required: true },
        durationHours: { type: Number, default: 24 },
        status: { type: String, default: 'active', trim: true }, // active, expired, cancelled
        startedAt: { type: Date, default: Date.now },
        endsAt: { type: Date, default: null },
    },
    { timestamps: true },
);

RentalSchema.index({ assetId: 1, status: 1 });

module.exports = mongoose.model('Rental', RentalSchema);
