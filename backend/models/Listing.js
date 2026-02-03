const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema(
    {
        brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true, index: true },
        sellerTelegramId: { type: String, required: true, index: true },
        priceAIBA: { type: Number, required: true, min: 0 },
        priceNEUR: { type: Number, default: 0, min: 0 },
        status: { type: String, enum: ['active', 'sold', 'cancelled'], default: 'active', index: true },
    },
    { timestamps: true },
);

ListingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Listing', ListingSchema);
