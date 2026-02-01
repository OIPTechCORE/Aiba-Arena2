const router = require('express').Router();
const Broker = require('../models/Broker');

function getBaseUrl(req) {
    const proto = String(req.headers['x-forwarded-proto'] || 'http');
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5000');
    const base = `${proto}://${host}`.replace(/\/+$/, '');
    const env = String(process.env.PUBLIC_BASE_URL || '')
        .trim()
        .replace(/\/+$/, '');
    return env && /^https?:\/\//i.test(env) ? env : base;
}

function svgEscape(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// GET /api/metadata/brokers/:id
router.get('/brokers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const broker = await Broker.findById(id).lean();
        if (!broker) return res.status(404).json({ error: 'not found' });

        const baseUrl = getBaseUrl(req);
        const image = `${baseUrl}/api/metadata/brokers/${broker._id}/image.svg`;

        const attrs = [
            { trait_type: 'Specialty', value: broker.specialty || 'unknown' },
            { trait_type: 'Level', value: Number(broker.level ?? 1) },
            { trait_type: 'Intelligence', value: Number(broker.intelligence ?? 0) },
            { trait_type: 'Speed', value: Number(broker.speed ?? 0) },
            { trait_type: 'Risk', value: Number(broker.risk ?? 0) },
        ];

        res.json({
            name: `AIBA Broker #${String(broker._id).slice(-6)}`,
            description: 'AI Broker NFT for AIBA Arena. Stats and traits update off-chain as the broker progresses.',
            image,
            attributes: attrs,
            properties: {
                brokerId: String(broker._id),
                ownerTelegramId: String(broker.ownerTelegramId || ''),
            },
        });
    } catch (err) {
        console.error('Error in /api/metadata/brokers/:id:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/metadata/brokers/:id/image.svg
router.get('/brokers/:id/image.svg', async (req, res) => {
    try {
        const { id } = req.params;
        const broker = await Broker.findById(id).lean();
        if (!broker) return res.status(404).send('not found');

        const title = `AIBA Broker #${String(broker._id).slice(-6)}`;
        const subtitle = `lvl ${Number(broker.level ?? 1)} • ${String(broker.specialty || 'crypto')}`;
        const intelligence = Math.max(0, Math.min(100, Number(broker.intelligence ?? 0)));
        const speed = Math.max(0, Math.min(100, Number(broker.speed ?? 0)));
        const risk = Math.max(0, Math.min(100, Number(broker.risk ?? 0)));

        const bar = (label, value, y, color) => `
  <text x="28" y="${y - 8}" font-size="14" fill="#9CA3AF" font-family="Arial, Helvetica, sans-serif">${svgEscape(label)}</text>
  <rect x="28" y="${y}" width="200" height="10" rx="5" fill="#111827"/>
  <rect x="28" y="${y}" width="${2 * value}" height="10" rx="5" fill="${color}"/>
  <text x="236" y="${y + 9}" font-size="12" fill="#E5E7EB" font-family="Arial, Helvetica, sans-serif" text-anchor="end">${value}</text>
`;

        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111827"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="28" fill="url(#g)"/>
  <text x="28" y="48" font-size="20" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="700">${svgEscape(
      title,
  )}</text>
  <text x="28" y="72" font-size="12" fill="#E5E7EB" font-family="Arial, Helvetica, sans-serif">${svgEscape(
      subtitle,
  )}</text>
  ${bar('Intelligence', intelligence, 106, '#22c55e')}
  ${bar('Speed', speed, 146, '#38bdf8')}
  ${bar('Risk', risk, 186, '#f59e0b')}
  <text x="28" y="232" font-size="12" fill="#E5E7EB" font-family="Arial, Helvetica, sans-serif">aibaarena • metadata v1</text>
</svg>`;

        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
        res.send(svg);
    } catch (err) {
        console.error('Error in /api/metadata/brokers/:id/image.svg:', err);
        res.status(500).send('error');
    }
});

module.exports = router;
