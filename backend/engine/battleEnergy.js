function clampInt(n, min, max) {
    const x = Number(n);
    if (!Number.isFinite(x)) return min;
    return Math.max(min, Math.min(max, Math.floor(x)));
}

function applyEnergyRegen(brokerDoc, now, cfg) {
    const maxEnergy = clampInt(cfg?.battleMaxEnergy ?? 100, 1, 1_000);
    const regenSecondsPerEnergy = clampInt(cfg?.battleEnergyRegenSecondsPerEnergy ?? 60, 1, 86_400);

    const last = brokerDoc.energyUpdatedAt
        ? new Date(brokerDoc.energyUpdatedAt)
        : brokerDoc.updatedAt
          ? new Date(brokerDoc.updatedAt)
          : now;
    const deltaSec = Math.max(0, Math.floor((now.getTime() - last.getTime()) / 1000));
    const gained = Math.floor(deltaSec / regenSecondsPerEnergy);
    if (gained <= 0) return;

    brokerDoc.energy = Math.min(maxEnergy, clampInt(brokerDoc.energy ?? 0, 0, maxEnergy) + gained);
    brokerDoc.energyUpdatedAt = new Date(last.getTime() + gained * regenSecondsPerEnergy * 1000);
}

module.exports = { clampInt, applyEnergyRegen };

