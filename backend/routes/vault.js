const router = require('express').Router();
const { getVaultInventory, getVaultLastSeqno } = require('../ton/vaultRead');
const { validateQuery } = require('../middleware/validate');

// Public read endpoints (on-chain data is public anyway)

function safeBigInt(s, fallback = 0n) {
    try {
        return BigInt(String(s));
    } catch {
        return fallback;
    }
}

// GET /api/vault/last-seqno?to=EQ...
router.get(
    '/last-seqno',
    validateQuery({
        to: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
        try {
            const vaultAddress = String(process.env.ARENA_VAULT_ADDRESS || '').trim();
            if (!vaultAddress) return res.status(400).json({ error: 'ARENA_VAULT_ADDRESS not configured' });

            const to = String(req.validatedQuery?.to || '').trim();
            if (!to) return res.status(400).json({ error: 'to required' });

            const last = await getVaultLastSeqno(vaultAddress, to);
            res.json({ vaultAddress, to, lastSeqno: last.toString(), nextSeqno: (last + 1n).toString() });
        } catch (err) {
            console.error('Error in /api/vault/last-seqno:', err);
            res.status(500).json({ error: 'failed to read vault', detail: String(err?.message || err) });
        }
    },
);

// GET /api/vault/claim-status?to=EQ...&seqno=123&validUntil=1700000000&amount=1000
// Returns: pending | confirmed | expired | insufficient_inventory | insufficient_ton
router.get(
    '/claim-status',
    validateQuery({
        to: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        seqno: { type: 'integer', min: 0, required: true },
        validUntil: { type: 'integer', min: 0, required: true },
        amount: { type: 'integer', min: 0 },
    }),
    async (req, res) => {
        try {
            const vaultAddress = String(process.env.ARENA_VAULT_ADDRESS || '').trim();
            if (!vaultAddress) return res.status(400).json({ error: 'ARENA_VAULT_ADDRESS not configured' });

            const to = String(req.validatedQuery?.to || '').trim();
            const seqno = safeBigInt(req.validatedQuery?.seqno, 0n);
            const validUntil = Number(req.validatedQuery?.validUntil ?? 0);
            const amount = safeBigInt(req.validatedQuery?.amount, 0n);

            if (!to) return res.status(400).json({ error: 'to required' });
            if (seqno <= 0n) return res.status(400).json({ error: 'seqno required' });
            if (!Number.isFinite(validUntil) || validUntil <= 0)
                return res.status(400).json({ error: 'validUntil required' });
            if (amount < 0n) return res.status(400).json({ error: 'amount invalid' });

            const now = Math.floor(Date.now() / 1000);
            if (now > validUntil) {
                return res.json({ vaultAddress, to, seqno: seqno.toString(), status: 'expired', now, validUntil });
            }

            const last = await getVaultLastSeqno(vaultAddress, to);
            if (last >= seqno) {
                return res.json({
                    vaultAddress,
                    to,
                    seqno: seqno.toString(),
                    status: 'confirmed',
                    lastSeqno: last.toString(),
                    now,
                    validUntil,
                });
            }

            // Optional inventory check (best-effort)
            let inventory = null;
            try {
                inventory = await getVaultInventory(vaultAddress);
                const jettonBalance = safeBigInt(inventory?.jettonBalance, 0n);
                const tonBalanceNano = safeBigInt(inventory?.tonBalanceNano, 0n);
                const minTonNano = safeBigInt(process.env.MIN_VAULT_TON_NANO ?? '30000000', 30_000_000n); // 0.03 TON default
                if (tonBalanceNano < minTonNano) {
                    return res.json({
                        vaultAddress,
                        to,
                        seqno: seqno.toString(),
                        status: 'insufficient_ton',
                        lastSeqno: last.toString(),
                        neededTonNano: minTonNano.toString(),
                        haveTonNano: tonBalanceNano.toString(),
                        now,
                        validUntil,
                    });
                }
                if (amount > 0n && jettonBalance < amount) {
                    return res.json({
                        vaultAddress,
                        to,
                        seqno: seqno.toString(),
                        status: 'insufficient_inventory',
                        lastSeqno: last.toString(),
                        needed: amount.toString(),
                        have: jettonBalance.toString(),
                        now,
                        validUntil,
                    });
                }
            } catch {
                inventory = null;
            }

            return res.json({
                vaultAddress,
                to,
                seqno: seqno.toString(),
                status: 'pending',
                lastSeqno: last.toString(),
                now,
                validUntil,
            });
        } catch (err) {
            console.error('Error in /api/vault/claim-status:', err);
            res.status(500).json({ error: 'failed to read claim status', detail: String(err?.message || err) });
        }
    },
);

// GET /api/vault/inventory
router.get('/inventory', async (_req, res) => {
    try {
        const vaultAddress = String(process.env.ARENA_VAULT_ADDRESS || '').trim();
        if (!vaultAddress) return res.status(400).json({ error: 'ARENA_VAULT_ADDRESS not configured' });

        const inv = await getVaultInventory(vaultAddress);
        res.json(inv);
    } catch (err) {
        console.error('Error in /api/vault/inventory:', err);
        res.status(500).json({ error: 'failed to read vault inventory', detail: String(err?.message || err) });
    }
});

module.exports = router;
