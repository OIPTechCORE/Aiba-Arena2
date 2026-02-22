const mongoose = require('mongoose');
const { Schema } = mongoose;

const externalAppSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^[a-z0-9_-]+$/,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    url: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                try {
                    new URL(v);
                    return true;
                } catch {
                    return false;
                }
            },
            message: 'URL must be a valid URL'
        }
    },
    active: {
        type: Boolean,
        default: true,
    },
    order: {
        type: Number,
        default: 0,
    },
    icon: {
        type: String,
        trim: true,
        default: 'games'
    },
    badge: {
        type: String,
        trim: true,
        enum: ['NEW', 'HOT', 'UPDATED'],
    },
}, {
    timestamps: true,
});

// Index for efficient queries
externalAppSchema.index({ active: 1, order: 1 });
externalAppSchema.index({ id: 1 });

module.exports = mongoose.model('ExternalApp', externalAppSchema);
