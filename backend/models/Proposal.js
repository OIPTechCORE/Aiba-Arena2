const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        type: { type: String, default: 'general', trim: true }, // 'general' | 'treasury_payout'
        status: { type: String, enum: ['active', 'closed', 'executed'], default: 'active', index: true }, // closed = voting ended; executed = treasury payout done
        closedAt: { type: Date, default: null },
        executedAt: { type: Date, default: null },
        // For type === 'treasury_payout'
        recipientTelegramId: { type: String, default: '', trim: true },
        payoutAiba: { type: Number, default: 0 },
        payoutNeur: { type: Number, default: 0 },
    },
    { timestamps: true },
);

ProposalSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Proposal', ProposalSchema);
