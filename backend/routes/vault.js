const router = require('express').Router();
const { getVaultInventory, getVaultLastSeqno } = require('../ton/vaultRead');

// Public read endpoints (on-chain data is public anyway)

// GET /api/vault/last-seqno?to=EQ...
router.get('/last-seqno', async (req, res) => {
    try {
        const vaultAddress = String(process.env.ARENA_VAULT_ADDRESS || '').trim();
        if (!vaultAddress) return res.status(400).json({ error: 'ARENA_VAULT_ADDRESS not configured' });

        const to = String(req.query?.to || '').trim();
        if (!to) return res.status(400).json({ error: 'to required' });

        const last = await getVaultLastSeqno(vaultAddress, to);
        res.json({ vaultAddress, to, lastSeqno: last.toString(), nextSeqno: (last + 1n).toString() });
    } catch (err) {
        console.error('Error in /api/vault/last-seqno:', err);
        res.status(500).json({ error: 'failed to read vault', detail: String(err?.message || err) });
    }
});

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

