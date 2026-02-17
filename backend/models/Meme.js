const mongoose = require('mongoose');

const MemeSchema = new mongoose.Schema(
    {
        ownerTelegramId: { type: String, required: true, index: true },
        caption: { type: String, default: '', trim: true },
        imageUrl: { type: String, required: true, trim: true },
        templateId: { type: String, default: '', trim: true },
        category: { type: String, default: 'general', trim: true, index: true },
        // LMS / education (Phase 4)
        educationCategory: { type: String, default: '', trim: true, index: true }, // study_humor, exam_tips, school_events, etc.
        watermarkApplied: { type: Boolean, default: false },

        // Scoring (computed)
        engagementScore: { type: Number, default: 0, index: true },
        scoreUpdatedAt: { type: Date, default: null },
        likeCount: { type: Number, default: 0 },
        commentCount: { type: Number, default: 0 },
        internalShareCount: { type: Number, default: 0 },
        externalShareCount: { type: Number, default: 0 },
        boostTotal: { type: Number, default: 0 },
        boostMultiplier: { type: Number, default: 1 },

        // Moderation
        reportCount: { type: Number, default: 0 },
        hidden: { type: Boolean, default: false },
        hiddenReason: { type: String, default: '', trim: true },
    },
    { timestamps: true },
);

MemeSchema.index({ createdAt: -1 });
MemeSchema.index({ engagementScore: -1, createdAt: -1 });
MemeSchema.index({ ownerTelegramId: 1, createdAt: -1 });
MemeSchema.index({ category: 1, engagementScore: -1 });
MemeSchema.index({ educationCategory: 1, engagementScore: -1 });

module.exports = mongoose.model('Meme', MemeSchema);
