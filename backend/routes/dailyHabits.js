const express = require('express');
const router = express.Router();
const DailyHabit = require('../models/DailyHabit');

// GET /api/daily-habits - Get user's daily habits
router.get('/', async (req, res) => {
    try {
        const { userId, category, isActive } = req.query;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        
        const filter = { userId, isActive: isActive !== 'false' };
        if (category) filter.category = category;
        
        const habits = await DailyHabit.find(filter)
            .sort({ sortOrder: 1, createdAt: -1 });
            
        res.json({
            habits: habits.map(habit => ({
                ...habit.toJSON(),
                currentStreak: habit.currentStreak,
                progressPercentage: habit.progressPercentage,
                nextMilestone: habit.nextMilestone
            }))
        });
    } catch (error) {
        console.error('Error fetching daily habits:', error);
        res.status(500).json({ error: 'Failed to fetch daily habits' });
    }
});

// GET /api/daily-habits/:id - Get specific daily habit
router.get('/:id', async (req, res) => {
    try {
        const habit = await DailyHabit.findById(req.params.id);
        
        if (!habit) {
            return res.status(404).json({ error: 'Daily habit not found' });
        }
        
        res.json({
            habit: {
                ...habit.toJSON(),
                currentStreak: habit.currentStreak,
                progressPercentage: habit.progressPercentage,
                nextMilestone: habit.nextMilestone
            }
        });
    } catch (error) {
        console.error('Error fetching daily habit:', error);
        res.status(500).json({ error: 'Failed to fetch daily habit' });
    }
});

// POST /api/daily-habits/:id/complete - Complete habit for today
router.post('/:id/complete', async (req, res) => {
    try {
        const { notes } = req.body;
        const today = new Date().toISOString().split('T')[0];
        
        const habit = await DailyHabit.findById(req.params.id);
        if (!habit) {
            return res.status(404).json({ error: 'Daily habit not found' });
        }
        
        // Check if already completed today
        const existingProgress = habit.dailyProgress.find(p => p.date === today);
        if (existingProgress && existingProgress.completed) {
            return res.status(400).json({ error: 'Habit already completed today' });
        }
        
        // Update or create today's progress
        if (existingProgress) {
            existingProgress.completed = true;
            existingProgress.completedAt = new Date();
            existingProgress.notes = notes || '';
        } else {
            habit.dailyProgress.push({
                date: today,
                completed: true,
                completedAt: new Date(),
                notes: notes || ''
            });
        }
        
        // Update streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayProgress = habit.dailyProgress.find(p => p.date === yesterdayStr);
        
        if (yesterdayProgress && yesterdayProgress.completed) {
            habit.streakDays++;
        } else {
            habit.streakDays = 1;
        }
        
        if (habit.streakDays > habit.longestStreak) {
            habit.longestStreak = habit.streakDays;
        }
        
        habit.lastCompletedAt = new Date();
        habit.completionCount++;
        
        // Add experience points
        habit.experiencePoints += 10;
        
        // Check for level up
        const xpForNextLevel = habit.currentLevel * 100;
        if (habit.experiencePoints >= xpForNextLevel) {
            habit.currentLevel++;
            habit.experiencePoints = habit.experiencePoints - xpForNextLevel;
        }
        
        await habit.save();
        
        // Calculate rewards
        const baseReward = habit.rewardAiba;
        const streakBonus = Math.floor(habit.streakDays * 0.5);
        const levelBonus = Math.floor(habit.currentLevel * 2);
        const totalReward = baseReward + streakBonus + levelBonus;
        
        res.json({
            message: 'Habit completed successfully',
            habit: {
                ...habit.toJSON(),
                currentStreak: habit.currentStreak,
                progressPercentage: habit.progressPercentage
            },
            rewards: {
                baseReward,
                streakBonus,
                levelBonus,
                totalReward
            }
        });
    } catch (error) {
        console.error('Error completing habit:', error);
        res.status(500).json({ error: 'Failed to complete habit' });
    }
});

// GET /api/daily-habits/stats/:userId - Get user's habit statistics
router.get('/stats/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const habits = await DailyHabit.find({ userId });
        
        const stats = {
            totalHabits: habits.length,
            activeHabits: habits.filter(h => h.isActive).length,
            totalCompletions: habits.reduce((sum, h) => sum + h.completionCount, 0),
            longestStreak: Math.max(...habits.map(h => h.longestStreak), 0),
            currentStreaks: habits.map(h => h.currentStreak).filter(s => s > 0),
            averageLevel: habits.length > 0 ? Math.round(habits.reduce((sum, h) => sum + h.currentLevel, 0) / habits.length) : 0,
            categoryBreakdown: habits.reduce((acc, h) => {
                acc[h.category] = (acc[h.category] || 0) + 1;
                return acc;
            }, {}),
            todayCompleted: habits.filter(h => {
                const today = new Date().toISOString().split('T')[0];
                return h.dailyProgress.some(p => p.date === today && p.completed);
            }).length
        };
        
        res.json({ stats });
    } catch (error) {
        console.error('Error fetching habit stats:', error);
        res.status(500).json({ error: 'Failed to fetch habit stats' });
    }
});

module.exports = router;
