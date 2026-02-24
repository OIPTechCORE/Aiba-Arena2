const mongoose = require('mongoose');

const SocialShareSchema = new mongoose.Schema({
    // Share metadata
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shareType: {
        type: String,
        enum: ['achievement', 'milestone', 'victory', 'creation', 'habit_completion', 'level_up', 'streak', 'custom'],
        required: true,
        index: true
    },
    
    // Content of the share
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    imageUrl: { type: String, default: '', trim: true },
    videoUrl: { type: String, default: '', trim: true },
    
    // Related entities
    relatedEntity: {
        entityType: {
            type: String,
            enum: ['habit', 'competition', 'achievement', 'user_profile', 'custom']
        },
        entityId: { type: mongoose.Schema.Types.ObjectId },
        entityData: { type: mongoose.Schema.Types.Mixed } // Flexible data for different entity types
    },
    
    // Social interactions
    shares: [{
        platform: {
            type: String,
            enum: ['telegram', 'twitter', 'discord', 'facebook', 'instagram', 'linkedin', 'custom'],
            required: true
        },
        shareId: { type: String, default: '', trim: true }, // Platform-specific share ID
        shareUrl: { type: String, default: '', trim: true },
        sharedAt: { type: Date, default: Date.now },
        views: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 }
    }],
    
    // Engagement metrics
    likes: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        likedAt: { type: Date, default: Date.now }
    }],
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, trim: true, maxlength: 500 },
        commentedAt: { type: Date, default: Date.now },
        likes: { type: Number, default: 0 },
        replies: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            content: { type: String, required: true, trim: true, maxlength: 500 },
            repliedAt: { type: Date, default: Date.now },
            likes: { type: Number, default: 0 }
        }]
    }],
    
    // Emotional investment features
    emotionalTags: [{
        type: String,
        enum: ['proud', 'excited', 'grateful', 'motivated', 'accomplished', 'inspired', 'joyful', 'determined', 'confident', 'peaceful']
    }],
    moodBefore: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    moodAfter: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    
    // Viral and trending features
    isTrending: { type: Boolean, default: false },
    trendingScore: { type: Number, default: 0 },
    viralCoefficient: { type: Number, default: 1.0 },
    
    // Rewards and incentives
    rewardEarned: {
        aiba: { type: Number, default: 0 },
        neur: { type: Number, default: 0 },
        stars: { type: Number, default: 0 },
        diamonds: { type: Number, default: 0 }
    },
    bonusMultiplier: { type: Number, default: 1.0 },
    
    // Privacy and visibility
    visibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
    },
    allowComments: { type: Boolean, default: true },
    allowReactions: { type: Boolean, default: true },
    
    // Share chain/viral tracking
    originalShareId: { type: mongoose.Schema.Types.ObjectId, ref: 'SocialShare', default: null },
    resharedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'SocialShare', default: null },
    reshareCount: { type: Number, default: 0 },
    
    // Achievement integration
    achievements: [{
        achievementType: {
            type: String,
            enum: ['first_share', 'viral_share', 'trending_share', 'most_liked', 'most_commented', 'emotional_impact', 'consistency_bonus']
        },
        earnedAt: { type: Date, default: Date.now },
        rewardBonus: { type: Number, default: 0 }
    }],
    
    // Deep engagement metrics
    totalEngagementTime: { type: Number, default: 0 }, // Time spent interacting with this share
    uniqueViewers: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }, // Views to actions/shares
    
    // Status
    isActive: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    moderationFlags: { type: Number, default: 0 }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals for enhanced functionality
SocialShareSchema.virtual('totalLikes').get(function() {
    return this.likes.length;
});

SocialShareSchema.virtual('totalComments').get(function() {
    return this.comments.length;
});

SocialShareSchema.virtual('totalShares').get(function() {
    return this.shares.length;
});

SocialShareSchema.virtual('engagementRate').get(function() {
    const totalInteractions = this.likes.length + this.comments.length + this.shares.reduce((sum, share) => sum + share.views, 0);
    return totalInteractions > 0 ? totalInteractions : 0;
});

SocialShareSchema.virtual('emotionalImpact').get(function() {
    return this.moodAfter - this.moodBefore;
});

SocialShareSchema.virtual('viralPotential').get(function() {
    return this.viralCoefficient * this.engagementRate * this.reshareCount;
});

// Methods for social features
SocialShareSchema.methods.addLike = function(userId) {
    if (!this.likes.some(like => like.userId.toString() === userId.toString())) {
        this.likes.push({ userId });
        return true;
    }
    return false;
};

SocialShareSchema.methods.addComment = function(userId, content) {
    this.comments.push({ userId, content });
    return this.comments[this.comments.length - 1];
};

SocialShareSchema.methods.addShare = function(platform, shareUrl) {
    this.shares.push({ platform, shareUrl, sharedAt: new Date() });
    this.reshareCount++;
    return this.shares[this.shares.length - 1];
};

SocialShareSchema.methods.calculateRewards = function() {
    let baseReward = this.rewardEarned.aiba;
    const engagementBonus = Math.floor(this.engagementRate * 0.1);
    const viralBonus = this.isTrending ? Math.floor(baseReward * 0.5) : 0;
    const emotionalBonus = Math.floor(Math.abs(this.emotionalImpact) * 2);
    
    return {
        baseReward,
        engagementBonus,
        viralBonus,
        emotionalBonus,
        totalReward: baseReward + engagementBonus + viralBonus + emotionalBonus
    };
};

// Indexes for performance
SocialShareSchema.index({ userId: 1, createdAt: -1 });
SocialShareSchema.index({ shareType: 1, isTrending: 1 });
SocialShareSchema.index({ trendingScore: -1 });
SocialShareSchema.index({ 'likes.userId': 1 });
SocialShareSchema.index({ visibility: 1, isActive: 1 });

module.exports = mongoose.model('SocialShare', SocialShareSchema);
