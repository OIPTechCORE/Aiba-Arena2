'use client';

import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

const DeepHabits = () => {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newHabit, setNewHabit] = useState({
        title: '',
        description: '',
        category: 'wellness',
        frequencyType: 'daily',
        difficultyLevel: 'beginner'
    });

    const categories = [
        { value: 'all', label: 'All Habits', icon: '🌟' },
        { value: 'wellness', label: 'Wellness', icon: '🧘' },
        { value: 'learning', label: 'Learning', icon: '📚' },
        { value: 'social', label: 'Social', icon: '👥' },
        { value: 'gaming', label: 'Gaming', icon: '🎮' },
        { value: 'fitness', label: 'Fitness', icon: '💪' },
        { value: 'creativity', label: 'Creativity', icon: '🎨' },
        { value: 'productivity', label: 'Productivity', icon: '⚡' }
    ];

    const difficultyLevels = [
        { value: 'beginner', label: 'Beginner', color: '#4CAF50' },
        { value: 'intermediate', label: 'Intermediate', color: '#FF9800' },
        { value: 'advanced', label: 'Advanced', color: '#F44336' },
        { value: 'master', label: 'Master', color: '#9C27B0' }
    ];

    useEffect(() => {
        fetchHabits();
    }, [selectedCategory]);

    const fetchHabits = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/daily-habits${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`);
            const data = await response.json();
            setHabits(data.habits || []);
        } catch (error) {
            console.error('Error fetching habits:', error);
        } finally {
            setLoading(false);
        }
    };

    const completeHabit = async (habitId) => {
        try {
            const response = await fetch(`/api/daily-habits/${habitId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: '' })
            });
            const data = await response.json();
            
            if (data.message) {
                // Update the habit in local state
                setHabits(prev => prev.map(habit => 
                    habit._id === habitId ? { ...habit, ...data.habit } : habit
                ));
                
                // Show success notification
                alert(`Habit completed! +${data.rewards.totalReward} AIBA earned`);
            }
        } catch (error) {
            console.error('Error completing habit:', error);
            alert('Failed to complete habit');
        }
    };

    const createHabit = async () => {
        try {
            const response = await fetch('/api/daily-habits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newHabit)
            });
            const data = await response.json();
            
            if (data.message) {
                setHabits(prev => [data.habit, ...prev]);
                setShowCreateModal(false);
                setNewHabit({
                    title: '',
                    description: '',
                    category: 'wellness',
                    frequencyType: 'daily',
                    difficultyLevel: 'beginner'
                });
                alert('Habit created successfully!');
            }
        } catch (error) {
            console.error('Error creating habit:', error);
            alert('Failed to create habit');
        }
    };

    const getStreakColor = (streak) => {
        if (streak >= 30) return '#FF6B6B'; // Fire - Long streak
        if (streak >= 14) return '#FFA726'; // Orange - Good streak
        if (streak >= 7) return '#FFD54F'; // Yellow - Decent streak
        return '#4CAF50'; // Green - Starting streak
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 80) return '#4CAF50';
        if (percentage >= 60) return '#FF9800';
        if (percentage >= 40) return '#FF5722';
        return '#9E9E9E';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading habits...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">🌟 Deep Daily Habits</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Create Habit
                    </button>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map(category => (
                        <button
                            key={category.value}
                            onClick={() => setSelectedCategory(category.value)}
                            className={`px-4 py-2 rounded-lg transition-all ${
                                selectedCategory === category.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span className="mr-2">{category.icon}</span>
                            {category.label}
                        </button>
                    ))}
                </div>

                {/* Habits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {habits.map(habit => (
                        <div key={habit._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all">
                            {/* Habit Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{habit.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`px-2 py-1 rounded text-xs font-medium`} 
                                          style={{ backgroundColor: getProgressColor(habit.progressPercentage), color: 'white' }}>
                                        {habit.difficultyLevel}
                                    </span>
                                    <span className="text-2xl font-bold text-gray-900 mt-2">
                                        Lv.{habit.currentLevel}
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span>{Math.round(habit.progressPercentage)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="h-3 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${habit.progressPercentage}%`,
                                            backgroundColor: getProgressColor(habit.progressPercentage)
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold" style={{ color: getStreakColor(habit.currentStreak) }}>
                                        {habit.currentStreak}
                                    </div>
                                    <div className="text-xs text-gray-500">Current Streak</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{habit.longestStreak}</div>
                                    <div className="text-xs text-gray-500">Longest Streak</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{habit.completionCount}</div>
                                    <div className="text-xs text-gray-500">Total Completions</div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => completeHabit(habit._id)}
                                    disabled={habit.dailyProgress.some(p => p.date === new Date().toISOString().split('T')[0] && p.completed)}
                                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {habit.dailyProgress.some(p => p.date === new Date().toISOString().split('T')[0] && p.completed) ? '✅ Completed Today' : '✓ Mark Complete'}
                                </button>
                                <button
                                    className="bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {habits.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎯</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No habits found</h3>
                        <p className="text-gray-600 mb-4">Start building meaningful daily habits to begin your endless journey!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create Your First Habit
                        </button>
                    </div>
                )}
            </div>

            {/* Create Habit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Create New Habit</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newHabit.title}
                                    onChange={(e) => setNewHabit(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter habit title..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newHabit.description}
                                    onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Describe your habit..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={newHabit.category}
                                    onChange={(e) => setNewHabit(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="wellness">🧘 Wellness</option>
                                    <option value="learning">📚 Learning</option>
                                    <option value="social">👥 Social</option>
                                    <option value="gaming">🎮 Gaming</option>
                                    <option value="fitness">💪 Fitness</option>
                                    <option value="creativity">🎨 Creativity</option>
                                    <option value="productivity">⚡ Productivity</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {difficultyLevels.map(level => (
                                        <button
                                            key={level.value}
                                            type="button"
                                            onClick={() => setNewHabit(prev => ({ ...prev, difficultyLevel: level.value }))}
                                            className={`px-3 py-2 rounded-lg border-2 transition-all ${
                                                newHabit.difficultyLevel === level.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            {level.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createHabit}
                                disabled={!newHabit.title.trim()}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Create Habit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeepHabits;
