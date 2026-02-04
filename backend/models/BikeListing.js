const mongoose = require('mongoose');

const BikeListingSchema = new mongoose.Schema(
    {
        bikeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RacingMotorcycle', required: true, index: true },
        sellerTelegramId: { type: String, required: true, index: true },
        priceAIBA: { type: Number, required: true, min: 0 },
        status: { type: String, enum: ['active', 'sold', 'cancelled'], default: 'active', index: true },
    },
    { timestamps: true },
);

BikeListingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('BikeListing', BikeListingSchema);
