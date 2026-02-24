const mongoose = require('mongoose');

const EmotionalInvestmentSchema = new mongoose.Schema({
    // Investment metadata
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    investmentType: {
        type: String,
        enum: ['habit_commitment', 'competition_entry', 'social_bond', 'learning_goal', 'creative_project', 'relationship', 'self_improvement'],
        required: true,
        index: true
    },
    
    // Target and purpose
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    purpose: {
        type: String,
        enum: ['growth', 'connection', 'achievement', 'mastery', 'contribution', 'wellbeing', 'legacy'],
        required: true
    },
    
    // Emotional stakes
    emotionalStakes: {
        type: String,
        enum: ['low', 'medium', 'high', 'extreme'],
        default: 'medium'
    },
    emotionalValue: {
        type: Number,
        min: 1,
        max: 100,
        default: 50
    },
    
    // Initial emotional state
    emotionsAtStart: {
        primary: {
            type: String,
            enum: ['excited', 'nervous', 'confident', 'determined', 'curious', 'hopeful', 'anxious', 'motivated'],
            required: true
        },
        secondary: {
            type: String,
            enum: ['excited', 'nervous', 'confident', 'determined', 'curious', 'hopeful', 'anxious', 'motivated']
        },
        intensity: {
            type: Number,
            min: 1,
            max: 10,
            default: 5
        },
        confidence: {
            type: Number,
            min: 1,
            max: 10,
            default: 5
        },
        expectations: {
            type: String,
            enum: ['very_low', 'low', 'moderate', 'high', 'very_high'],
            default: 'moderate'
        }
    },
    
    // Investment resources
    investedResources: {
        aiba: { type: Number, default: 0 },
        neur: { type: Number, default: 0 },
        time: { type: Number, default: 0 }, // in hours
        energy: { type: Number, default: 0 }, // subjective energy scale 1-10
        socialCapital: { type: Number, default: 0 } // social connections/reputation
    },
    
    // Commitment levels
    commitmentLevel: {
        type: String,
        enum: ['casual', 'dedicated', 'obsessed', 'legendary'],
        default: 'dedicated'
    },
    durationDays: { type: Number, default: 30 },
    dailyCheckpoints: { type: Number, default: 1 },
    
    // Progress tracking
    currentProgress: {
        percentage: { type: Number, default: 0, min: 0, max: 100 },
        milestonesCompleted: { type: Number, default: 0 },
        totalMilestones: { type: Number, default: 1 },
        consistencyScore: { type: Number, default: 100 }, // 0-100 consistency
        lastCheckpointDate: { type: Date, default: null }
    },
    
    // Emotional journey tracking
    emotionalJourney: [{
        date: { type: Date, required: true },
        emotions: {
            primary: {
                type: String,
                enum: ['excited', 'nervous', 'confident', 'determined', 'curious', 'hopeful', 'anxious', 'motivated', 'proud', 'disappointed', 'relieved', 'frustrated']
            },
            secondary: {
                type: String,
                enum: ['excited', 'nervous', 'confident', 'determined', 'curious', 'hopeful', 'anxious', 'motivated', 'proud', 'disappointed', 'relieved', 'frustrated']
            },
            intensity: { type: Number, min: 1, max: 10, default: 5 },
            confidence: { type: Number, min: 1, max: 10, default: 5 }
        },
        triggers: [String], // What triggered these emotions
        insights: { type: String, default: '', trim: true, maxlength: 500 },
        achievements: [String],
        challenges: [String]
    }],
    
    // Social connections
    supporters: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        supportType: {
            type: String,
            enum: ['mentor', 'accountability_partner', 'cheerleader', 'collaborator', 'witness']
        },
        joinedAt: { type: Date, default: Date.now },
        contributionLevel: { type: Number, default: 1 }, // 1-10 contribution scale
        messages: [{
            content: { type: String, required: true, trim: true, maxlength: 300 },
            sentAt: { type: Date, default: Date.now },
            emotionalImpact: { type: Number, default: 0 } // -5 to +5 impact
        }]
    }],
    
    // Risk and reward
    riskLevel: {
        type: String,
        enum: ['safe', 'moderate', 'risky', 'high_risk', 'all_in'],
        default: 'moderate'
    },
    potentialReward: {
        emotional: { type: Number, default: 0 }, // Emotional fulfillment
        social: { type: Number, default: 0 }, // Social recognition
        tangible: { type: Number, default: 0 }, // AIBA/NEUR rewards
        personal: { type: Number, default: 0 } // Personal growth
    },
    
    // Outcomes
    finalOutcome: {
        status: {
            type: String,
            enum: ['in_progress', 'completed', 'abandoned', 'failed', 'paused'],
            default: 'in_progress'
        },
        completionDate: { type: Date, default: null },
        finalEmotions: {
            primary: {
                type: String,
                enum: ['ecstatic', 'proud', 'relieved', 'disappointed', 'frustrated', 'grateful', 'transformed', 'exhausted', 'confident']
            },
            satisfaction: { type: Number, min: 1, max: 10, default: 5 },
            growth: { type: Number, min: -10, max: 10, default: 0 } // Personal growth score
        },
        lessons: { type: String, default: '', trim: true, maxlength: 2000 },
        achievements: [String],
        unexpectedOutcomes: [String]
    },
    
    // Deep investment features
    isRecurring: { type: Boolean, default: false },
    investmentChain: [{
        investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmotionalInvestment' },
        relationship: {
            type: String,
            enum: ['sequel', 'expansion', 'evolution', 'correction', 'culmination']
        },
        connectionStrength: { type: Number, default: 1.0 } // 0.1-10.0 connection strength
    }],
    
    // Legacy and impact
    legacyScore: { type: Number, default: 0 }, // Long-term impact score
    inspirationCount: { type: Number, default: 0 }, // How many people inspired
    rippleEffect: { type: Number, default: 1.0 }, // Social multiplier
    
    // Privacy and sharing
    visibility: {
        type: String,
        enum: ['private', 'supporters', 'public', 'legacy'],
        default: 'supporters'
    },
    allowSupportMessages: { type: Boolean, default: true },
    shareProgress: { type: Boolean, default: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals for enhanced functionality
EmotionalInvestmentSchema.virtual('timeInvested').get(function() {
    return this.investedResources.time;
});

EmotionalInvestmentSchema.virtual('totalResourceValue').get(function() {
    return this.investedResources.aiba + 
           (this.investedResources.neur * 0.5) + 
           (this.investedResources.time * 10) +
           (this.investedResources.energy * 20) +
           (this.investedResources.socialCapital * 15);
});

EmotionalInvestmentSchema.virtual('emotionalROI').get(function() {
    if (this.finalOutcome.status === 'in_progress') return 0;
    const emotionalGain = this.finalOutcome.finalEmotions.satisfaction - this.emotionsAtStart.intensity;
    return emotionalGain > 0 ? emotionalGain : 0;
});

EmotionalInvestmentSchema.virtual('supportNetwork').get(function() {
    return this.supporters.length;
});

EmotionalInvestmentSchema.virtual('isOnTrack').get(function() {
    const now = new Date();
    const expectedProgress = ((now - this.createdAt) / (this.durationDays * 24 * 60 * 60 * 1000)) * 100;
    return this.currentProgress.percentage >= expectedProgress * 0.8; // 80% threshold
});

// Methods for emotional investment features
EmotionalInvestmentSchema.methods.addEmotionalCheckpoint = function(emotions, insights, triggers) {
    this.emotionalJourney.push({
        date: new Date(),
        emotions,
        insights,
        triggers
    });
    this.currentProgress.lastCheckpointDate = new Date();
    return this.emotionalJourney[this.emotionalJourney.length - 1];
};

EmotionalInvestmentSchema.methods.addSupporter = function(userId, supportType) {
    if (!this.supporters.some(s => s.userId.toString() === userId.toString())) {
        this.supporters.push({ userId, supportType });
        return true;
    }
    return false;
};

EmotionalInvestmentSchema.methods.addSupportMessage = function(supporterId, content, emotionalImpact) {
    const supporter = this.supporters.find(s => s.userId.toString() === supporterId.toString());
    if (supporter) {
        supporter.messages.push({ content, emotionalImpact });
        return supporter.messages[supporter.messages.length - 1];
    }
    return null;
};

EmotionalInvestmentSchema.methods.calculateEmotionalReturns = function() {
    const baseReturn = this.potentialReward.emotional;
    const consistencyBonus = this.currentProgress.consistencyScore > 80 ? baseReturn * 0.2 : 0;
    const supportBonus = this.supporters.length * 2;
    const riskMultiplier = this.riskLevel === 'high_risk' ? 1.5 : 
                       this.riskLevel === 'risky' ? 1.2 : 
                       this.riskLevel === 'moderate' ? 1.0 : 0.8;
    
    return {
        baseReturn,
        consistencyBonus,
        supportBonus,
        riskMultiplier,
        totalReturn: (baseReturn + consistencyBonus + supportBonus) * riskMultiplier
    };
};

EmotionalInvestmentSchema.methods.updateProgress = function(percentage, milestonesCompleted) {
    this.currentProgress.percentage = Math.min(percentage, 100);
    if (milestonesCompleted > this.currentProgress.milestonesCompleted) {
        this.currentProgress.milestonesCompleted = milestonesCompleted;
    }
    
    // Update consistency based on checkpoint timing
    const now = new Date();
    const daysSinceStart = Math.floor((now - this.createdAt) / (24 * 60 * 60 * 1000));
    const expectedCheckpoints = Math.floor(daysSinceStart / (this.durationDays / this.dailyCheckpoints));
    const actualCheckpoints = this.emotionalJourney.length;
    
    this.currentProgress.consistencyScore = Math.min((actualCheckpoints / expectedCheckpoints) * 100, 100);
};

// Indexes for performance
EmotionalInvestmentSchema.index({ userId: 1, investmentType: 1 });
EmotionalInvestmentSchema.index({ userId: 1, status: 1 });
EmotionalInvestmentSchema.index({ emotionalValue: -1 });
EmotionalInvestmentSchema.index({ legacyScore: -1 });
EmotionalInvestmentSchema.index({ 'supporters.userId': 1 });

module.exports = mongoose.model('EmotionalInvestment', EmotionalInvestmentSchema);
