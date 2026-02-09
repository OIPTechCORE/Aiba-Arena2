const router = require('express').Router();
const GameMode = require('../models/GameMode');
const { requireAdmin } = require('../middleware/requireAdmin');
const { validateBody, validateParams } = require('../middleware/validate');

router.use(requireAdmin());

router.get('/', async (_req, res) => {
    const modes = await GameMode.find().sort({ createdAt: -1 }).lean();
    res.json(modes);
});

router.post(
    '/',
    validateBody({
        key: { type: 'string', trim: true, minLength: 1, maxLength: 100, required: true },
        name: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        description: { type: 'string', trim: true, maxLength: 2000 },
        enabled: { type: 'boolean' },
        arena: { type: 'string', trim: true, minLength: 1, maxLength: 50, required: true },
        league: { type: 'string', trim: true, maxLength: 50 },
        energyCost: { type: 'number', min: 0 },
        cooldownSeconds: { type: 'number', min: 0 },
        entryNeurCost: { type: 'number', min: 0 },
        entryAibaCost: { type: 'number', min: 0 },
        rewardMultiplierAiba: { type: 'number', min: 0 },
        rewardMultiplierNeur: { type: 'number', min: 0 },
        rules: { type: 'object' },
    }),
    async (req, res) => {
    const key = String(req.validatedBody?.key || '').trim();
    const name = String(req.validatedBody?.name || '').trim();
    const description = String(req.validatedBody?.description || '').trim();
    const enabled = req.validatedBody?.enabled === undefined ? true : Boolean(req.validatedBody.enabled);
    const arena = String(req.validatedBody?.arena || '').trim();
    const league = String(req.validatedBody?.league || 'rookie').trim();
    const energyCost = Number(req.validatedBody?.energyCost ?? 10);
    const cooldownSeconds = Number(req.validatedBody?.cooldownSeconds ?? 30);
    const entryNeurCost = Number(req.validatedBody?.entryNeurCost ?? 0);
    const entryAibaCost = Number(req.validatedBody?.entryAibaCost ?? 0);
    const rewardMultiplierAiba = Number(req.validatedBody?.rewardMultiplierAiba ?? 1);
    const rewardMultiplierNeur = Number(req.validatedBody?.rewardMultiplierNeur ?? 1);
    const rules = req.validatedBody?.rules && typeof req.validatedBody.rules === 'object' ? req.validatedBody.rules : {};

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
    },
);

router.patch(
    '/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        key: { type: 'string', trim: true, maxLength: 100 },
        name: { type: 'string', trim: true, maxLength: 200 },
        description: { type: 'string', trim: true, maxLength: 2000 },
        enabled: { type: 'boolean' },
        arena: { type: 'string', trim: true, maxLength: 50 },
        league: { type: 'string', trim: true, maxLength: 50 },
        energyCost: { type: 'number', min: 0 },
        cooldownSeconds: { type: 'number', min: 0 },
        entryNeurCost: { type: 'number', min: 0 },
        entryAibaCost: { type: 'number', min: 0 },
        rewardMultiplierAiba: { type: 'number', min: 0 },
        rewardMultiplierNeur: { type: 'number', min: 0 },
        rules: { type: 'object' },
    }),
    async (req, res) => {
    const update = {};
    const setStr = (k) => (update[k] = String(req.validatedBody[k] ?? '').trim());

    if (req.validatedBody?.key !== undefined) setStr('key');
    if (req.validatedBody?.name !== undefined) setStr('name');
    if (req.validatedBody?.description !== undefined) setStr('description');
    if (req.validatedBody?.enabled !== undefined) update.enabled = Boolean(req.validatedBody.enabled);
    if (req.validatedBody?.arena !== undefined) setStr('arena');
    if (req.validatedBody?.league !== undefined) setStr('league');
    if (req.validatedBody?.energyCost !== undefined) update.energyCost = Number(req.validatedBody.energyCost);
    if (req.validatedBody?.cooldownSeconds !== undefined) update.cooldownSeconds = Number(req.validatedBody.cooldownSeconds);
    if (req.validatedBody?.entryNeurCost !== undefined) update.entryNeurCost = Number(req.validatedBody.entryNeurCost);
    if (req.validatedBody?.entryAibaCost !== undefined) update.entryAibaCost = Number(req.validatedBody.entryAibaCost);
    if (req.validatedBody?.rewardMultiplierAiba !== undefined)
        update.rewardMultiplierAiba = Number(req.validatedBody.rewardMultiplierAiba);
    if (req.validatedBody?.rewardMultiplierNeur !== undefined)
        update.rewardMultiplierNeur = Number(req.validatedBody.rewardMultiplierNeur);
    if (req.validatedBody?.rules !== undefined)
        update.rules = req.validatedBody.rules && typeof req.validatedBody.rules === 'object' ? req.validatedBody.rules : {};

    const mode = await GameMode.findByIdAndUpdate(req.validatedParams.id, update, { new: true }).lean();
    if (!mode) return res.status(404).json({ error: 'not found' });
    res.json(mode);
    },
);

router.delete(
    '/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    async (req, res) => {
    const deleted = await GameMode.findByIdAndDelete(req.validatedParams.id).lean();
    if (!deleted) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: true });
    },
);

module.exports = router;
