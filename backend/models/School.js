const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, trim: true, index: true },
        metadata: { type: Object, default: {} },
    },
    { timestamps: true },
);

module.exports = mongoose.model('School', SchoolSchema);
