const mongoose = require('mongoose');

const CarListingSchema = new mongoose.Schema(
    {
        carId: { type: mongoose.Schema.Types.ObjectId, ref: 'RacingCar', required: true, index: true },
        sellerTelegramId: { type: String, required: true, index: true },
        priceAIBA: { type: Number, required: true, min: 0 },
        status: { type: String, enum: ['active', 'sold', 'cancelled'], default: 'active', index: true },
    },
    { timestamps: true },
);

CarListingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('CarListing', CarListingSchema);
