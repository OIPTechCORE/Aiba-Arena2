const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
    {
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, trim: true, index: true },
        metadata: { type: Object, default: {} },
    },
    { timestamps: true },
);

CourseSchema.index({ schoolId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Course', CourseSchema);
