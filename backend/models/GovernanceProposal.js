const mongoose = require('mongoose');

const GovernanceProposalSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        status: { type: String, default: 'draft', trim: true }, // draft, voting, executed, rejected
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        votesFor: { type: Number, default: 0 },
        votesAgainst: { type: Number, default: 0 },
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null },
        actions: { type: [Object], default: [] },
    },
    { timestamps: true },
);

GovernanceProposalSchema.index({ status: 1, endAt: 1 });

module.exports = mongoose.model('GovernanceProposal', GovernanceProposalSchema);
