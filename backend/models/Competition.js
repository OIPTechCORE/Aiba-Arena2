const mongoose = require('mongoose');

const CompetitionSchema = new mongoose.Schema({
    // Competition metadata
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    category: {
        type: String,
        enum: ['battle', 'racing', 'social', 'learning', 'creative', 'endurance'],
        required: true,
        index: true
    },
    
    // Competition structure
    competitionType: {
        type: String,
        enum: ['tournament', 'league', 'endless', 'seasonal'],
        default: 'tournament'
    },
    maxParticipants: { type: Number, default: 1000 },
    currentParticipants: { type: Number, default: 0 },
    
    // Level progression
    currentLevel: { type: Number, default: 1 },
    maxLevel: { type: Number, default: 100 },
    levelThreshold: { type: Number, default: 10 }, // Score needed to advance
    
    // Timing and status
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    
    // Rewards and stakes
    entryFeeAiba: { type: Number, default: 0 },
    prizePoolAiba: { type: Number, default: 0 },
    prizePoolNeur: { type: Number, default: 0 },
    
    // Reward distribution
    rewardStructure: {
        type: String,
        enum: ['winner_takes_all', 'top_3', 'top_10', 'tiered', 'participation'],
        default: 'top_3'
    },
    
    // Endless progression features
    isEndless: { type: Boolean, default: false },
    difficultyScaling: {
        type: String,
        enum: ['linear', 'exponential', 'adaptive'],
        default: 'linear'
    },
    
    // Social features
    isPublic: { type: Boolean, default: true },
    allowSpectating: { type: Boolean, default: true },
    leaderboardEnabled: { type: Boolean, default: true },
    
    // Competition rules
    rules: [{
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true }
    }],
    
    // Level-specific configurations
    levelConfigs: [{
        level: { type: Number, required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        difficultyMultiplier: { type: Number, default: 1.0 },
        bonusRewards: {
            aiba: { type: Number, default: 0 },
            neur: { type: Number, default: 0 }
        },
        unlockRequirements: {
            minScore: { type: Number, default: 0 },
            previousLevelComplete: { type: Boolean, default: true }
        }
    }],
    
    // Participants
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        joinedAt: { type: Date, default: Date.now },
        currentLevel: { type: Number, default: 1 },
        score: { type: Number, default: 0 },
        bestScore: { type: Number, default: 0 },
        attempts: { type: Number, default: 0 },
        lastPlayedAt: { type: Date, default: null },
        status: {
            type: String,
            enum: ['registered', 'playing', 'completed', 'eliminated', 'withdrawn'],
            default: 'registered'
        },
        progress: {
            levelsCompleted: { type: Number, default: 0 },
            timeSpent: { type: Number, default: 0 }, // in seconds
            achievements: [String]
        }
    }],
    
    // Results and winners
    results: {
        winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        topParticipants: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rank: { type: Number, required: true },
            score: { type: Number, required: true },
            rewards: {
                aiba: { type: Number, default: 0 },
                neur: { type: Number, default: 0 },
                bonus: { type: Number, default: 0 }
            }
        }],
        totalParticipants: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals for enhanced functionality
CompetitionSchema.virtual('timeRemaining').get(function() {
    const now = new Date();
    if (this.status === 'completed') return 0;
    if (now < this.startsAt) return this.startsAt - now;
    if (now > this.endsAt) return 0;
    return this.endsAt - now;
});

CompetitionSchema.virtual('isActive').get(function() {
    const now = new Date();
    return now >= this.startsAt && now <= this.endsAt && this.status === 'active';
});

CompetitionSchema.virtual('participationRate').get(function() {
    if (this.maxParticipants === 0) return 0;
    return (this.currentParticipants / this.maxParticipants) * 100;
});

CompetitionSchema.virtual('currentLevelConfig').get(function() {
    return this.levelConfigs.find(config => config.level === this.currentLevel);
});

// Indexes for performance
CompetitionSchema.index({ category: 1, status: 1 });
CompetitionSchema.index({ startsAt: 1, endsAt: 1 });
CompetitionSchema.index({ 'participants.userId': 1 });
CompetitionSchema.index({ isEndless: 1, status: 1 });

module.exports = mongoose.model('Competition', CompetitionSchema);
