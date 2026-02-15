const mongoose = require('mongoose');

const BrokerRentalSchema = new mongoose.Schema(
    {
        brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
        ownerTelegramId: { type: String, required: true },
        priceAibaPerHour: { type: Number, required: true },
        status: { type: String, enum: ['listed', 'rented', 'unlisted'], default: 'listed' },
        rentedByTelegramId: { type: String, default: '', trim: true },
        rentedAt: { type: Date, default: null },
        returnAt: { type: Date, default: null },
    },
    { timestamps: true },
);

BrokerRentalSchema.index({ status: 1 });

module.exports = mongoose.model('BrokerRental', BrokerRentalSchema);
