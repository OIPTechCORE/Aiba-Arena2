const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema(
    {
        proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
        support: { type: Boolean, required: true },
    },
    { timestamps: true },
);

VoteSchema.index({ proposalId: 1, telegramId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema);
