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
    },
    { timestamps: true }
);

GuildSchema.index({ active: 1, createdAt: -1 });

module.exports = mongoose.model('Guild', GuildSchema);

