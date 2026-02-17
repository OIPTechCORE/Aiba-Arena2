/**
 * MemeFi engagement score with time decay.
 * Score = (like*W1 + comment*W2 + internalShare*W3 + externalShare*W4 + boostContribution) * timeDecayFactor
 * timeDecayFactor = 0.5^(hoursSinceCreation / halfLifeHours)
 */

async function getMemeFiConfig() {
    const MemeFiConfig = require('../models/MemeFiConfig');
    const cfg = await MemeFiConfig.findOne().lean();
    if (cfg) return cfg;
    const created = await MemeFiConfig.create({});
    return created.toObject();
}

function timeDecayFactor(createdAt, halfLifeHours = 24) {
    if (!createdAt || !halfLifeHours || halfLifeHours <= 0) return 1;
    const now = Date.now();
    const created = new Date(createdAt).getTime();
    const hours = (now - created) / (1000 * 60 * 60);
    return Math.pow(0.5, hours / halfLifeHours);
}

function computeEngagementScore(meme, cfg = {}) {
    const wLike = Number(cfg.weightLike) || 1;
    const wComment = Number(cfg.weightComment) || 2;
    const wInternal = Number(cfg.weightInternalShare) || 3;
    const wExternal = Number(cfg.weightExternalShare) || 5;
    const boostMul = Number(cfg.boostMultiplierPerUnit) || 0.1;
    const halfLife = Number(cfg.timeDecayHalfLifeHours) || 24;

    const likeCount = Math.max(0, Number(meme.likeCount) || 0);
    const commentCount = Math.max(0, Number(meme.commentCount) || 0);
    const internalShareCount = Math.max(0, Number(meme.internalShareCount) || 0);
    const externalShareCount = Math.max(0, Number(meme.externalShareCount) || 0);
    const boostTotal = Math.max(0, Number(meme.boostTotal) || 0);

    const raw =
        likeCount * wLike +
        commentCount * wComment +
        internalShareCount * wInternal +
        externalShareCount * wExternal +
        boostTotal * boostMul;

    const decay = timeDecayFactor(meme.createdAt, halfLife);
    const score = Math.max(0, Math.round(raw * decay));
    return { score, raw, decay };
}

async function recomputeMemeScore(memeId) {
    const Meme = require('../models/Meme');
    const meme = await Meme.findById(memeId).lean();
    if (!meme) return null;
    const cfg = await getMemeFiConfig();
    const { score } = computeEngagementScore(meme, cfg);
    await Meme.updateOne(
        { _id: memeId },
        { $set: { engagementScore: score, scoreUpdatedAt: new Date() } },
    );
    return score;
}

module.exports = {
    getMemeFiConfig,
    timeDecayFactor,
    computeEngagementScore,
    recomputeMemeScore,
};
