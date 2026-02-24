const express = require('express');
const router = express.Router();
const DailyHabit = require('../models/DailyHabit');
const { requireAdmin } = require('../middleware/requireAdmin');

// Apply admin authentication to all routes
router.use(requireAdmin());

// GET /api/admin/daily-habits - List all daily habits
router.get('/', async (req, res) => {
    try {
        const { userId, category, isActive, page = 1, limit = 50 } = req.query;
        const filter = {};
        
        if (userId) filter.userId = userId;
        if (category) filter.category = category;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        
        const habits = await DailyHabit.find(filter)
            .populate('userId', 'telegramId username telegram.firstName telegram.lastName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await DailyHabit.countDocuments(filter);
        
        res.json({
            habits,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching daily habits:', error);
        res.status(500).json({ error: 'Failed to fetch daily habits' });
    }
});

// POST /api/admin/daily-habits - Create new daily habit
router.post('/', async (req, res) => {
    try {
        const habitData = {
            ...req.body,
            userId: req.admin.id // Use admin ID for now, should be req.body.userId
        };
        
        const habit = new DailyHabit(habitData);
        await habit.save();
        
        res.status(201).json({
            message: 'Daily habit created successfully',
            habit
        });
    } catch (error) {
        console.error('Error creating daily habit:', error);
        res.status(500).json({ error: 'Failed to create daily habit' });
    }
});

// GET /api/admin/daily-habits/:id - Get specific daily habit
router.get('/:id', async (req, res) => {
    try {
        const habit = await DailyHabit.findById(req.params.id)
            .populate('userId', 'telegramId username telegram.firstName telegram.lastName');
            
        if (!habit) {
            return res.status(404).json({ error: 'Daily habit not found' });
        }
        
        res.json({ habit });
    } catch (error) {
        console.error('Error fetching daily habit:', error);
        res.status(500).json({ error: 'Failed to fetch daily habit' });
    }
});

// PUT /api/admin/daily-habits/:id - Update daily habit
router.put('/:id', async (req, res) => {
    try {
        const habit = await DailyHabit.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!habit) {
            return res.status(404).json({ error: 'Daily habit not found' });
        }
        
        res.json({
            message: 'Daily habit updated successfully',
            habit
        });
    } catch (error) {
        console.error('Error updating daily habit:', error);
        res.status(500).json({ error: 'Failed to update daily habit' });
    }
});

// DELETE /api/admin/daily-habits/:id - Delete daily habit
router.delete('/:id', async (req, res) => {
    try {
        const habit = await DailyHabit.findByIdAndDelete(req.params.id);
        
        if (!habit) {
            return res.status(404).json({ error: 'Daily habit not found' });
        }
        
        res.json({
            message: 'Daily habit deleted successfully',
            habit
        });
    } catch (error) {
        console.error('Error deleting daily habit:', error);
        res.status(500).json({ error: 'Failed to delete daily habit' });
    }
});

// POST /api/admin/daily-habits/:id/complete - Mark habit as complete for today
router.post('/:id/complete', async (req, res) => {
    try {
        const { notes, rewardClaimed = false } = req.body;
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
            existingProgress.rewardClaimed = rewardClaimed;
        } else {
            habit.dailyProgress.push({
                date: today,
                completed: true,
                completedAt: new Date(),
                notes: notes || '',
                rewardClaimed
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
        
        res.json({
            message: 'Habit completed successfully',
            habit: {
                ...habit.toJSON(),
                currentStreak: habit.currentStreak,
                progressPercentage: habit.progressPercentage
            }
        });
    } catch (error) {
        console.error('Error completing habit:', error);
        res.status(500).json({ error: 'Failed to complete habit' });
    }
});

// POST /api/admin/daily-habits/:id/add-milestone - Add milestone to habit
router.post('/:id/add-milestone', async (req, res) => {
    try {
        const { level, title, description, rewardBonus } = req.body;
        
        const habit = await DailyHabit.findById(req.params.id);
        if (!habit) {
            return res.status(404).json({ error: 'Daily habit not found' });
        }
        
        habit.milestones.push({
            level,
            title,
            description,
            rewardBonus: rewardBonus || 0
        });
        
        await habit.save();
        
        res.status(201).json({
            message: 'Milestone added successfully',
            milestone: habit.milestones[habit.milestones.length - 1]
        });
    } catch (error) {
        console.error('Error adding milestone:', error);
        res.status(500).json({ error: 'Failed to add milestone' });
    }
});

module.exports = router;
