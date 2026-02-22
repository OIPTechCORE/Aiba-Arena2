/**
 * P2P AIBA send, Buy AIBA with TON
 * Transaction charges (TON) go to Super Admin wallets: P2P_AIBA_SEND_WALLET, BUY_AIBA_WITH_TON_WALLET
 */
const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const User = require('../models/User');
const { getConfig, debitAibaFromUserNoBurn, creditAibaNoCap } = require('../engine/economy');
const { verifyTonPayment } = require('../util/tonVerify');
const UsedTonTxHash = require('../models/UsedTonTxHash');
const { validateBody } = require('../middleware/validate');

router.use(requireTelegram);

// POST /api/p2p-aiba/send — Send AIBA to another user. Pay TON fee to P2P_AIBA_SEND_WALLET.
// Body: { toTelegramId?, toUsername?, amountAiba, txHash }
router.post(
    '/send',
    validateBody({
        toTelegramId: { type: 'string', trim: true, maxLength: 50 },
        toUsername: { type: 'string', trim: true, maxLength: 50 },
        amountAiba: { type: 'integer', min: 1 },
        txHash: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
        try {
            const fromTelegramId = String(req.telegramId || '');
            const toTelegramId = String(req.validatedBody?.toTelegramId || '').trim();
            let toUsername = String(req.validatedBody?.toUsername || '').trim();
            const amountAiba = Math.floor(Number(req.validatedBody?.amountAiba ?? 0));
            const txHash = String(req.validatedBody?.txHash || '').trim();

            if (amountAiba < 1) return res.status(400).json({ error: 'amountAiba must be at least 1' });

            let recipientId = toTelegramId;
            if (!recipientId && toUsername) {
                toUsername = toUsername.replace(/^@/, '');
                const u = await User.findOne({
                    $or: [{ username: toUsername }, { 'telegram.username': toUsername }],
                })
                    .select({ telegramId: 1 })
                    .lean();
                if (!u) return res.status(404).json({ error: 'recipient not found' });
                recipientId = u.telegramId;
            }
            if (!recipientId) return res.status(400).json({ error: 'toTelegramId or toUsername required' });
            if (recipientId === fromTelegramId) return res.status(400).json({ error: 'cannot send to yourself' });

            const cfg = await getConfig();
            const feeNano = Math.max(0, Number(cfg.p2pAibaSendFeeTonNano ?? 100_000_000));
            const wallet = (process.env.P2P_AIBA_SEND_WALLET || '').trim();
            if (feeNano <= 0 || !wallet) return res.status(503).json({ error: 'P2P AIBA send not configured' });

            const verified = await verifyTonPayment(txHash, wallet, feeNano);
            if (!verified) return res.status(400).json({ error: 'TON payment verification failed' });

            try {
                await UsedTonTxHash.create({ txHash, purpose: 'p2p_aiba_send', ownerTelegramId: fromTelegramId });
            } catch (e) {
                if (String(e?.code) === '11000') return res.status(409).json({ error: 'txHash already used' });
                throw e;
            }

            const debit = await debitAibaFromUserNoBurn(amountAiba, {
                telegramId: fromTelegramId,
                reason: 'p2p_aiba_send',
                arena: 'economy',
                league: 'global',
                sourceType: 'p2p_send',
                sourceId: recipientId,
                meta: { toTelegramId: recipientId, amountAiba },
            });
            if (!debit.ok) return res.status(400).json({ error: debit.error || 'insufficient AIBA balance' });

            await creditAibaNoCap(amountAiba, {
                telegramId: recipientId,
                reason: 'p2p_aiba_receive',
                arena: 'economy',
                league: 'global',
                sourceType: 'p2p_receive',
                sourceId: fromTelegramId,
                meta: { fromTelegramId, amountAiba },
            });

            res.json({
                ok: true,
                amountAiba,
                toTelegramId: recipientId,
            });
        } catch (err) {
            console.error('P2P AIBA send error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/p2p-aiba/buy — Buy AIBA with TON. TON goes to BUY_AIBA_WITH_TON_WALLET.
// Body: { txHash }
router.post(
    '/buy',
    validateBody({
        txHash: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const txHash = String(req.validatedBody?.txHash || '').trim();

            const wallet = (process.env.BUY_AIBA_WITH_TON_WALLET || '').trim();
            if (!wallet) return res.status(503).json({ error: 'Buy AIBA with TON not configured' });

            // Verify TON payment - min 0.1 TON
            const minNano = 100_000_000;
            const verified = await verifyTonPayment(txHash, wallet, minNano);
            if (!verified) return res.status(400).json({ error: 'TON payment verification failed' });

            try {
                await UsedTonTxHash.create({ txHash, purpose: 'buy_aiba_with_ton', ownerTelegramId: telegramId });
            } catch (e) {
                if (String(e?.code) === '11000') return res.status(409).json({ error: 'txHash already used' });
                throw e;
            }

            // Fetch tx value to know how much TON was sent
            const base = (
                process.env.TON_PROVIDER_URL ||
                process.env.TON_API_URL ||
                'https://toncenter.com/api/v2'
            ).replace(/\/+$/, '');
            const url = `${base}/getTransactionByHash?hash=${encodeURIComponent(txHash)}`;
            const opts = { headers: process.env.TON_API_KEY ? { 'X-API-Key': process.env.TON_API_KEY } : {} };
            const txRes = await fetch(url, opts);
            const txData = await txRes.json().catch(() => ({}));
            const tx = txData?.result || txData;
            const value = tx?.in_msg?.value ? BigInt(tx.in_msg.value) : 0n;
            const tonNano = Number(value);

            const cfg = await getConfig();
            const rate = Number(cfg.oracleAibaPerTon ?? 0);
            if (!rate || rate <= 0)
                return res.status(400).json({ error: 'AIBA/TON rate not set; admin must set oracleAibaPerTon' });

            const feeBps = Math.max(0, Math.min(10000, Number(cfg.buyAibaWithTonFeeBps ?? 500)));
            const grossAiba = Math.floor((tonNano / 1e9) * rate);
            const aibaToCredit = Math.floor((grossAiba * (10000 - feeBps)) / 10000);

            if (aibaToCredit < 1) return res.status(400).json({ error: 'amount too small; need more TON' });

            await creditAibaNoCap(aibaToCredit, {
                telegramId,
                reason: 'buy_aiba_with_ton',
                arena: 'economy',
                league: 'global',
                sourceType: 'buy_aiba',
                sourceId: txHash,
                meta: { tonNano, rate, feeBps },
            });

            res.json({
                ok: true,
                aibaCredited: aibaToCredit,
                tonNano,
                rate,
            });
        } catch (err) {
            console.error('Buy AIBA with TON error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// GET /api/p2p-aiba/config — Fee, wallet info for UI (all tx charges → Super Admin wallets)
router.get('/config', async (req, res) => {
    try {
        const cfg = await getConfig();
        res.json({
            p2pSendFeeTonNano: cfg.p2pAibaSendFeeTonNano ?? 100_000_000,
            buyFeeBps: cfg.buyAibaWithTonFeeBps ?? 500,
            aibaInGiftsFeeTonNano: cfg.aibaInGiftsFeeTonNano ?? 100_000_000,
            oracleAibaPerTon: cfg.oracleAibaPerTon ?? 0,
            p2pWallet: !!process.env.P2P_AIBA_SEND_WALLET,
            buyWallet: !!process.env.BUY_AIBA_WITH_TON_WALLET,
            aibaInGiftsWallet: !!process.env.AIBA_IN_GIFTS_WALLET,
        });
    } catch (err) {
        console.error('P2P config error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
