const router = require('express').Router();
const GameMode = require('../models/GameMode');
const { requireAdmin } = require('../middleware/requireAdmin');

router.use(requireAdmin());

router.get('/', async (_req, res) => {
    const modes = await GameMode.find().sort({ createdAt: -1 }).lean();
    res.json(modes);
});

router.post('/', async (req, res) => {
    const key = String(req.body?.key || '').trim();
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    const enabled = req.body?.enabled === undefined ? true : Boolean(req.body.enabled);
    const arena = String(req.body?.arena || '').trim();
    const league = String(req.body?.league || 'rookie').trim();
    const energyCost = Number(req.body?.energyCost ?? 10);
    const cooldownSeconds = Number(req.body?.cooldownSeconds ?? 30);
    const entryNeurCost = Number(req.body?.entryNeurCost ?? 0);
    const entryAibaCost = Number(req.body?.entryAibaCost ?? 0);
    const rewardMultiplierAiba = Number(req.body?.rewardMultiplierAiba ?? 1);
    const rewardMultiplierNeur = Number(req.body?.rewardMultiplierNeur ?? 1);
    const rules = req.body?.rules && typeof req.body.rules === 'object' ? req.body.rules : {};

    if (!key || !name || !arena) return res.status(400).json({ error: 'key, name, arena required' });
    if (Number.isNaN(energyCost) || energyCost < 0) return res.status(400).json({ error: 'energyCost invalid' });
    if (Number.isNaN(cooldownSeconds) || cooldownSeconds < 0)
        return res.status(400).json({ error: 'cooldownSeconds invalid' });
    if (Number.isNaN(entryNeurCost) || entryNeurCost < 0)
        return res.status(400).json({ error: 'entryNeurCost invalid' });
    if (Number.isNaN(entryAibaCost) || entryAibaCost < 0)
        return res.status(400).json({ error: 'entryAibaCost invalid' });

    const mode = await GameMode.create({
        key,
        name,
        description,
        enabled,
        arena,
        league,
        energyCost,
        cooldownSeconds,
        entryNeurCost,
        entryAibaCost,
        rewardMultiplierAiba,
        rewardMultiplierNeur,
        rules,
    });
    res.status(201).json(mode);
});

router.patch('/:id', async (req, res) => {
    const update = {};
    const setStr = (k) => (update[k] = String(req.body[k] ?? '').trim());

    if (req.body?.key !== undefined) setStr('key');
    if (req.body?.name !== undefined) setStr('name');
    if (req.body?.description !== undefined) setStr('description');
    if (req.body?.enabled !== undefined) update.enabled = Boolean(req.body.enabled);
    if (req.body?.arena !== undefined) setStr('arena');
    if (req.body?.league !== undefined) setStr('league');
    if (req.body?.energyCost !== undefined) update.energyCost = Number(req.body.energyCost);
    if (req.body?.cooldownSeconds !== undefined) update.cooldownSeconds = Number(req.body.cooldownSeconds);
    if (req.body?.entryNeurCost !== undefined) update.entryNeurCost = Number(req.body.entryNeurCost);
    if (req.body?.entryAibaCost !== undefined) update.entryAibaCost = Number(req.body.entryAibaCost);
    if (req.body?.rewardMultiplierAiba !== undefined)
        update.rewardMultiplierAiba = Number(req.body.rewardMultiplierAiba);
    if (req.body?.rewardMultiplierNeur !== undefined)
        update.rewardMultiplierNeur = Number(req.body.rewardMultiplierNeur);
    if (req.body?.rules !== undefined)
        update.rules = req.body.rules && typeof req.body.rules === 'object' ? req.body.rules : {};

    const mode = await GameMode.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!mode) return res.status(404).json({ error: 'not found' });
    res.json(mode);
});

router.delete('/:id', async (req, res) => {
    const deleted = await GameMode.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: true });
});

module.exports = router;
