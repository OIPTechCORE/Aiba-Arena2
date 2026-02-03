const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        body: { type: String, default: '', trim: true },
        type: { type: String, default: 'announcement', enum: ['announcement', 'maintenance', 'status'], trim: true },
        link: { type: String, default: '', trim: true },
        active: { type: Boolean, default: true },
        publishedAt: { type: Date, default: null },
        priority: { type: Number, default: 0 },
    },
    { timestamps: true },
);

AnnouncementSchema.index({ active: 1, publishedAt: -1 });
AnnouncementSchema.index({ type: 1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
