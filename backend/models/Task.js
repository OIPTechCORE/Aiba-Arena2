const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        enabled: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);

