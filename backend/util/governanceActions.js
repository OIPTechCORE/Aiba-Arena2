const EconomyConfig = require('../models/EconomyConfig');
const Realm = require('../models/Realm');

async function applyAction(action = {}) {
    const type = String(action.type || '').trim();
    if (type === 'setEconomyConfig') {
        const update = action.payload || {};
        const cfg = (await EconomyConfig.findOne().sort({ createdAt: -1 })) || new EconomyConfig();
        Object.assign(cfg, update);
        await cfg.save();
        return { ok: true, type };
    }
    if (type === 'setRealmActive') {
        const { key, active } = action.payload || {};
        const realm = await Realm.findOneAndUpdate({ key }, { $set: { active: Boolean(active) } }, { new: true });
        return { ok: true, type, realmKey: realm?.key };
    }
    return { ok: false, type, error: 'Unknown action type' };
}

module.exports = { applyAction };
