/**
 * Donate broker, car, bike, gifts.
 * Transaction charges (TON) go to Super Admin wallets: DONATE_BROKER_WALLET, DONATE_CAR_WALLET, DONATE_BIKE_WALLET, DONATE_GIFTS_WALLET
 */
const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Broker = require('../models/Broker');
const RacingCar = require('../models/RacingCar');
const RacingMotorcycle = require('../models/RacingMotorcycle');
const { getConfig } = require('../engine/economy');
const { verifyTonPayment } = require('../util/tonVerify');
const UsedTonTxHash = require('../models/UsedTonTxHash');
const { validateBody } = require('../middleware/validate');

const DONATION_POOL_ID = 'donation_pool';

router.use(requireTelegram);

function getDonateWallet(envKey) {
    return (process.env[envKey] || '').trim();
}

// POST /api/donate/broker — Donate a broker. Pay TON fee → DONATE_BROKER_WALLET.
// Body: { brokerId, txHash }
router.post(
    '/broker',
    validateBody({
        brokerId: { type: 'string', trim: true, minLength: 1, maxLength: 50, required: true },
        txHash: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const brokerId = String(req.validatedBody?.brokerId || '').trim();
            const txHash = String(req.validatedBody?.txHash || '').trim();

            const wallet = getDonateWallet('DONATE_BROKER_WALLET');
            if (!wallet) return res.status(503).json({ error: 'Donate broker not configured' });

            const cfg = await getConfig();
            const feeNano = Math.max(0, Number(cfg.donateBrokerFeeTonNano ?? 500_000_000));
            const verified = await verifyTonPayment(txHash, wallet, feeNano);
            if (!verified) return res.status(400).json({ error: 'TON payment verification failed' });

            try {
                await UsedTonTxHash.create({ txHash, purpose: 'donate_broker', ownerTelegramId: telegramId });
            } catch (e) {
                if (String(e?.code) === '11000') return res.status(409).json({ error: 'txHash already used' });
                throw e;
            }

            const broker = await Broker.findOne({ _id: brokerId, ownerTelegramId: telegramId });
            if (!broker) return res.status(404).json({ error: 'broker not found or not yours' });
            if (broker.guildId) return res.status(400).json({ error: 'withdraw broker from guild first' });

            await Broker.updateOne({ _id: broker._id }, { $set: { ownerTelegramId: DONATION_POOL_ID } });

            res.json({ ok: true, brokerId: broker._id, message: 'Broker donated.' });
        } catch (err) {
            console.error('Donate broker error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/donate/car — Donate a car. Pay TON fee → DONATE_CAR_WALLET.
router.post(
    '/car',
    validateBody({
        carId: { type: 'string', trim: true, minLength: 1, maxLength: 50, required: true },
        txHash: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const carId = String(req.validatedBody?.carId || '').trim();
            const txHash = String(req.validatedBody?.txHash || '').trim();

            const wallet = getDonateWallet('DONATE_CAR_WALLET');
            if (!wallet) return res.status(503).json({ error: 'Donate car not configured' });

            const cfg = await getConfig();
            const feeNano = Math.max(0, Number(cfg.donateCarFeeTonNano ?? 500_000_000));
            const verified = await verifyTonPayment(txHash, wallet, feeNano);
            if (!verified) return res.status(400).json({ error: 'TON payment verification failed' });

            try {
                await UsedTonTxHash.create({ txHash, purpose: 'donate_car', ownerTelegramId: telegramId });
            } catch (e) {
                if (String(e?.code) === '11000') return res.status(409).json({ error: 'txHash already used' });
                throw e;
            }

            const car = await RacingCar.findOne({ _id: carId, ownerTelegramId: telegramId });
            if (!car) return res.status(404).json({ error: 'car not found or not yours' });

            await RacingCar.updateOne({ _id: car._id }, { $set: { ownerTelegramId: DONATION_POOL_ID } });

            res.json({ ok: true, carId: car._id, message: 'Car donated.' });
        } catch (err) {
            console.error('Donate car error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/donate/bike — Donate a bike. Pay TON fee → DONATE_BIKE_WALLET.
router.post(
    '/bike',
    validateBody({
        bikeId: { type: 'string', trim: true, minLength: 1, maxLength: 50, required: true },
        txHash: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const bikeId = String(req.validatedBody?.bikeId || '').trim();
            const txHash = String(req.validatedBody?.txHash || '').trim();

            const wallet = getDonateWallet('DONATE_BIKE_WALLET');
            if (!wallet) return res.status(503).json({ error: 'Donate bike not configured' });

            const cfg = await getConfig();
            const feeNano = Math.max(0, Number(cfg.donateBikeFeeTonNano ?? 500_000_000));
            const verified = await verifyTonPayment(txHash, wallet, feeNano);
            if (!verified) return res.status(400).json({ error: 'TON payment verification failed' });

            try {
                await UsedTonTxHash.create({ txHash, purpose: 'donate_bike', ownerTelegramId: telegramId });
            } catch (e) {
                if (String(e?.code) === '11000') return res.status(409).json({ error: 'txHash already used' });
                throw e;
            }

            const bike = await RacingMotorcycle.findOne({ _id: bikeId, ownerTelegramId: telegramId });
            if (!bike) return res.status(404).json({ error: 'bike not found or not yours' });

            await RacingMotorcycle.updateOne({ _id: bike._id }, { $set: { ownerTelegramId: DONATION_POOL_ID } });

            res.json({ ok: true, bikeId: bike._id, message: 'Bike donated.' });
        } catch (err) {
            console.error('Donate bike error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/donate/gifts — Donate TON to gifts fund. TON → DONATE_GIFTS_WALLET.
router.post(
    '/gifts',
    validateBody({
        txHash: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const txHash = String(req.validatedBody?.txHash || '').trim();

            const wallet = getDonateWallet('DONATE_GIFTS_WALLET');
            if (!wallet) return res.status(503).json({ error: 'Donate gifts not configured' });

            const cfg = await getConfig();
            const feeNano = Math.max(0, Number(cfg.donateGiftsFeeTonNano ?? 100_000_000));
            const verified = await verifyTonPayment(txHash, wallet, feeNano);
            if (!verified) return res.status(400).json({ error: 'TON payment verification failed' });

            try {
                await UsedTonTxHash.create({ txHash, purpose: 'donate_gifts', ownerTelegramId: telegramId });
            } catch (e) {
                if (String(e?.code) === '11000') return res.status(409).json({ error: 'txHash already used' });
                throw e;
            }

            res.json({ ok: true, message: 'Gifts donation recorded.' });
        } catch (err) {
            console.error('Donate gifts error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// GET /api/donate/config — Fee info for UI
router.get('/config', async (req, res) => {
    try {
        const cfg = await getConfig();
        res.json({
            donateBrokerFeeTonNano: cfg.donateBrokerFeeTonNano ?? 500_000_000,
            donateCarFeeTonNano: cfg.donateCarFeeTonNano ?? 500_000_000,
            donateBikeFeeTonNano: cfg.donateBikeFeeTonNano ?? 500_000_000,
            donateGiftsFeeTonNano: cfg.donateGiftsFeeTonNano ?? 100_000_000,
            broker: !!process.env.DONATE_BROKER_WALLET,
            car: !!process.env.DONATE_CAR_WALLET,
            bike: !!process.env.DONATE_BIKE_WALLET,
            gifts: !!process.env.DONATE_GIFTS_WALLET,
        });
    } catch (err) {
        console.error('Donate config error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
