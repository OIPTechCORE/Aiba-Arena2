/**
 * Support request (Unified Comms Phase 4 — in-app support form).
 * Users submit subject + message; admins can view in Admin → Support.
 */
const mongoose = require('mongoose');

const SupportRequestSchema = new mongoose.Schema(
    {
        telegramId: { type: String, required: true, trim: true },
        username: { type: String, default: '', trim: true },
        subject: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        status: { type: String, default: 'open', enum: ['open', 'in_progress', 'resolved', 'closed'], trim: true },
        adminNote: { type: String, default: '', trim: true },
    },
    { timestamps: true },
);

SupportRequestSchema.index({ telegramId: 1, createdAt: -1 });
SupportRequestSchema.index({ status: 1 });
SupportRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SupportRequest', SupportRequestSchema);
