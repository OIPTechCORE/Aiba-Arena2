const mongoose = require('mongoose');

const MemeTemplateSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        imageUrl: { type: String, required: true, trim: true },
        category: { type: String, default: 'general', trim: true },
        sortOrder: { type: Number, default: 0 },
        enabled: { type: Boolean, default: true },
    },
    { timestamps: true },
);

MemeTemplateSchema.index({ enabled: 1, sortOrder: 1 });

module.exports = mongoose.model('MemeTemplate', MemeTemplateSchema);
