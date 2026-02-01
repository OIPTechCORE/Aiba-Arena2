const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        ownerTelegramId: { type: String, required: true, index: true },
        members: {
            type: [
                {
                    telegramId: { type: String, required: true },
                    role: { type: String, default: 'member' },
                    joinedAt: { type: Date, default: Date.now },
                },
            ],
            default: [],
        },
        bio: { type: String, default: '', trim: true },
        active: { type: Boolean, default: true },

        // Guild pooled brokers (used for guild wars)
        pooledBrokers: {
            type: [
                {
                    brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
                    depositedByTelegramId: { type: String, required: true },
                    depositedAt: { type: Date, default: Date.now },
                },
            ],
            default: [],
        },

        // Simple off-chain guild treasury (NEUR for now; AIBA can be wired later)
        vaultNeur: { type: Number, default: 0 },
        vaultAiba: { type: Number, default: 0 },
    },
    { timestamps: true },
);

GuildSchema.index({ active: 1, createdAt: -1 });
GuildSchema.index({ ownerTelegramId: 1, active: 1 });

module.exports = mongoose.model('Guild', GuildSchema);
