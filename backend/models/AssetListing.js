const mongoose = require('mongoose');

const AssetListingSchema = new mongoose.Schema(
    {
        assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
        sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        priceAiba: { type: Number, required: true },
        listingType: { type: String, default: 'secondary_sale', trim: true }, // primary_mint, secondary_sale, rental, fractional_share
        status: { type: String, default: 'active', trim: true }, // active, sold, cancelled, expired
        feeBps: { type: Number, default: 300 },
        expiresAt: { type: Date, default: null },
    },
    { timestamps: true },
);

AssetListingSchema.index({ status: 1, listingType: 1 });

module.exports = mongoose.model('AssetListing', AssetListingSchema);
