const mongoose = require('mongoose');

const DailyHabitSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    
    // Habit definition
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    category: {
        type: String,
        enum: ['wellness', 'learning', 'social', 'gaming', 'fitness', 'creativity', 'productivity'],
        required: true,
        index: true
    },
    
    // Habit scheduling and tracking
    frequencyType: {
        type: String,
        enum: ['daily', 'weekly', 'custom'],
        default: 'daily'
    },
    frequencyValue: { type: Number, default: 1 }, // e.g., 3 times per week
    streakDays: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompletedAt: { type: Date, default: null },
    
    // Difficulty and progression
    difficultyLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'master'],
        default: 'beginner'
    },
    currentLevel: { type: Number, default: 1 },
    experiencePoints: { type: Number, default: 0 },
    
    // Rewards and motivation
    rewardAiba: { type: Number, default: 0 },
    rewardNeur: { type: Number, default: 0 },
    bonusMultiplier: { type: Number, default: 1.0 },
    
    // Social features
    isPublic: { type: Boolean, default: false },
    inspirationCount: { type: Number, default: 0 },
    completionCount: { type: Number, default: 0 },
    
    // Status
    isActive: { type: Boolean, default: true },
    isCompleted: { type: Boolean, default: false },
    
    // Daily tracking
    dailyProgress: [{
        date: { type: String, required: true }, // YYYY-MM-DD format
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        notes: { type: String, default: '', trim: true, maxlength: 200 },
        rewardClaimed: { type: Boolean, default: false }
    }],
    
    // Endless progression
    milestones: [{
        level: { type: Number, required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        rewardBonus: { type: Number, default: 0 },
        unlockedAt: { type: Date, default: null },
        isCompleted: { type: Boolean, default: false }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals for enhanced functionality
DailyHabitSchema.virtual('currentStreak').get(function() {
    const today = new Date().toISOString().split('T')[0];
    const todayProgress = this.dailyProgress.find(p => p.date === today);
    if (todayProgress && todayProgress.completed) {
        return this.streakDays;
    }
    
    // Check if yesterday was completed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayProgress = this.dailyProgress.find(p => p.date === yesterdayStr);
    
    if (yesterdayProgress && yesterdayProgress.completed) {
        return this.streakDays;
    }
    
    return 0; // Streak broken
});

DailyHabitSchema.virtual('progressPercentage').get(function() {
    if (this.currentLevel === 1 && this.experiencePoints === 0) return 0;
    const xpForCurrentLevel = this.currentLevel * 100;
    return Math.min((this.experiencePoints / xpForCurrentLevel) * 100, 100);
});

DailyHabitSchema.virtual('nextMilestone').get(function() {
    return this.milestones.find(m => !m.isCompleted);
});

// Indexes for performance
DailyHabitSchema.index({ userId: 1, category: 1 });
DailyHabitSchema.index({ userId: 1, isActive: 1 });
DailyHabitSchema.index({ 'dailyProgress.date': 1 });

module.exports = mongoose.model('DailyHabit', DailyHabitSchema);
