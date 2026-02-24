const Rental = require('../models/Rental');

async function expireRentals() {
    const now = new Date();
    await Rental.updateMany({ status: 'active', endsAt: { $lte: now } }, { $set: { status: 'expired' } });
}

module.exports = { expireRentals };
