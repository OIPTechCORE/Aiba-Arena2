const mongoose = require('mongoose');
const { Schema } = mongoose;

const introScreenSchema = new Schema({
    screenType: {
        type: String,
        required: true,
        enum: ['welcome', 'onboarding', 'tutorial', 'loading'],
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    backgroundImageUrl: {
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
            message: 'Background image URL must be a valid URL'
        }
    },
    mobileBackgroundImageUrl: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v) return true; // Optional field
                try {
                    new URL(v);
                    return true;
                } catch {
                    return false;
                }
            },
            message: 'Mobile background image URL must be a valid URL'
        }
    },
    overlayOpacity: {
        type: Number,
        default: 0.3,
        min: 0,
        max: 1
    },
    textColor: {
        type: String,
        default: '#ffffff',
        match: /^#[0-9A-Fa-f]{6}$/
    },
    buttonColor: {
        type: String,
        default: '#007bff',
        match: /^#[0-9A-Fa-f]{6}$/
    },
    active: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    displayDuration: {
        type: Number,
        default: 5000, // milliseconds
        min: 1000,
        max: 30000
    },
    showSkipButton: {
        type: Boolean,
        default: true
    },
    autoAdvance: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
introScreenSchema.index({ screenType: 1, active: 1, order: 1 });
introScreenSchema.index({ active: 1, order: 1 });

module.exports = mongoose.model('IntroScreen', introScreenSchema);
