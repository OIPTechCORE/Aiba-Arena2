const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const AssetListing = require('../models/AssetListing');
const Rental = require('../models/Rental');
const { adminAudit } = require('../middleware/adminAudit');

router.use(requireAdmin(), adminAudit());

router.get('/metrics', async (_req, res) => {
    const activeListings = await AssetListing.countDocuments({ status: 'active' });
    const soldListings = await AssetListing.countDocuments({ status: 'sold' });
    const activeRentals = await Rental.countDocuments({ status: 'active' });

    res.json({
        activeListings,
        soldListings,
        activeRentals,
    });
});

module.exports = router;
