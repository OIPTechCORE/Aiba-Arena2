const mongoose = require('mongoose');

const BossDamageSchema = new mongoose.Schema(
    {
        bossId: { type: mongoose.Schema.Types.ObjectId, ref: 'GlobalBoss', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
        battleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle', default: null },
        damage: { type: Number, required: true },
        score: { type: Number, default: 0 },
    },
    { timestamps: true },
);

BossDamageSchema.index({ bossId: 1, telegramId: 1 });
BossDamageSchema.index({ bossId: 1, damage: -1 });

module.exports = mongoose.model('BossDamage', BossDamageSchema);
