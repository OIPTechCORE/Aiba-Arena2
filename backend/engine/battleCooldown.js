function getBattleCooldownKey({ modeKey = '', arena = '' } = {}) {
    const mk = String(modeKey || '').trim();
    const a = String(arena || '').trim();
    return mk || a;
}

module.exports = { getBattleCooldownKey };

