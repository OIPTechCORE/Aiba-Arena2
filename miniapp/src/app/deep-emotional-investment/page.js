'use client';

import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

const DeepEmotionalInvestment = () => {
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvestment, setSelectedInvestment] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCheckpointModal, setShowCheckpointModal] = useState(false);
    const [newInvestment, setNewInvestment] = useState({
        title: '',
        description: '',
        investmentType: 'habit_commitment',
        purpose: 'growth',
        emotionalStakes: 'medium',
        emotionalValue: 50,
        commitmentLevel: 'dedicated',
        durationDays: 30,
        dailyCheckpoints: 1,
        investedResources: {
            aiba: 0,
            neur: 0,
            time: 0,
            energy: 5,
            socialCapital: 0
        },
        emotionsAtStart: {
            primary: 'determined',
            secondary: 'motivated',
            intensity: 5,
            confidence: 5,
            expectations: 'moderate'
        }
    });

    const [newCheckpoint, setNewCheckpoint] = useState({
        emotions: {
            primary: 'determined',
            secondary: 'motivated',
            intensity: 5,
            confidence: 5
        },
        insights: '',
        triggers: []
    });

    const investmentTypes = [
        { value: 'habit_commitment', label: 'Habit Commitment', icon: '✅', description: 'Commit to building daily habits' },
        { value: 'competition_entry', label: 'Competition Entry', icon: '🏆', description: 'Invest emotionally in competitive challenges' },
        { value: 'social_bond', label: 'Social Bond', icon: '👥', description: 'Build meaningful social connections' },
        { value: 'learning_goal', label: 'Learning Goal', icon: '📚', description: 'Invest in personal growth and education' },
        { value: 'creative_project', label: 'Creative Project', icon: '🎨', description: 'Commit to creative endeavors' },
        { value: 'relationship', label: 'Relationship', icon: '💕', description: 'Invest in personal relationships' },
        { value: 'self_improvement', label: 'Self Improvement', icon: '🌱', description: 'Invest in personal development' }
    ];

    const purposes = [
        { value: 'growth', label: 'Growth', icon: '🌱', color: '#4CAF50' },
        { value: 'connection', label: 'Connection', icon: '👥', color: '#2196F3' },
        { value: 'achievement', label: 'Achievement', icon: '🏆', color: '#FF9800' },
        { value: 'mastery', label: 'Mastery', icon: '🎯', color: '#9C27B0' },
        { value: 'contribution', label: 'Contribution', icon: '🤝', color: '#FF5722' },
        { value: 'wellbeing', label: 'Wellbeing', icon: '🧘', color: '#9C27B0' },
        { value: 'legacy', label: 'Legacy', icon: '⭐', color: '#FF6B6B' }
    ];

    const emotionalStakes = [
        { value: 'low', label: 'Low', color: '#4CAF50', description: 'Safe and comfortable' },
        { value: 'medium', label: 'Medium', color: '#FF9800', description: 'Challenging but manageable' },
        { value: 'high', label: 'High', color: '#FF5722', description: 'Significant personal risk' },
        { value: 'extreme', label: 'Extreme', color: '#F44336', description: 'Life-changing commitment' }
    ];

    const commitmentLevels = [
        { value: 'casual', label: 'Casual', color: '#9E9E9E', description: 'Light engagement' },
        { value: 'dedicated', label: 'Dedicated', color: '#2196F3', description: 'Regular commitment' },
        { value: 'obsessed', label: 'Obsessed', color: '#FF9800', description: 'Intense focus' },
        { value: 'legendary', label: 'Legendary', color: '#FF6B6B', description: 'Ultimate dedication' }
    ];

    useEffect(() => {
        fetchInvestments();
    }, []);

    const fetchInvestments = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/emotional-investments');
            const data = await response.json();
            setInvestments(data.investments || []);
        } catch (error) {
            console.error('Error fetching investments:', error);
        } finally {
            setLoading(false);
        }
    };

    const createInvestment = async () => {
        try {
            const response = await fetch('/api/emotional-investments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newInvestment,
                    userId: 'user_id_here' // Would come from auth
                })
            });
            const data = await response.json();
            
            if (data.message) {
                setInvestments(prev => [data.investment, ...prev]);
                setShowCreateModal(false);
                resetNewInvestment();
                alert('Emotional investment created successfully! 💪');
            }
        } catch (error) {
            console.error('Error creating investment:', error);
            alert('Failed to create investment');
        }
    };

    const addCheckpoint = async (investmentId) => {
        try {
            const response = await fetch(`/api/emotional-investments/${investmentId}/add-checkpoint`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'user_id_here',
                    ...newCheckpoint
                })
            });
            const data = await response.json();
            
            if (data.message) {
                // Update the investment in local state
                setInvestments(prev => prev.map(inv => 
                    inv._id === investmentId ? { ...inv, emotionalJourney: [...inv.emotionalJourney, data.checkpoint] } : inv
                ));
                
                setShowCheckpointModal(false);
                resetNewCheckpoint();
                alert('Emotional checkpoint added! 📝');
            }
        } catch (error) {
            console.error('Error adding checkpoint:', error);
            alert('Failed to add checkpoint');
        }
    };

    const resetNewInvestment = () => {
        setNewInvestment({
            title: '',
            description: '',
            investmentType: 'habit_commitment',
            purpose: 'growth',
            emotionalStakes: 'medium',
            emotionalValue: 50,
            commitmentLevel: 'dedicated',
            durationDays: 30,
            dailyCheckpoints: 1,
            investedResources: {
                aiba: 0,
                neur: 0,
                time: 0,
                energy: 5,
                socialCapital: 0
            },
            emotionsAtStart: {
                primary: 'determined',
                secondary: 'motivated',
                intensity: 5,
                confidence: 5,
                expectations: 'moderate'
            }
        });
    };

    const resetNewCheckpoint = () => {
        setNewCheckpoint({
            emotions: {
                primary: 'determined',
                secondary: 'motivated',
                intensity: 5,
                confidence: 5
            },
            insights: '',
            triggers: []
        });
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 80) return '#4CAF50';
        if (percentage >= 60) return '#FF9800';
        if (percentage >= 40) return '#FF5722';
        return '#9E9E9E';
    };

    const getEmotionalValueColor = (value) => {
        if (value >= 80) return '#FF6B6B'; // Deep emotional investment
        if (value >= 60) return '#FF9800'; // High emotional value
        if (value >= 40) return '#FFD54F'; // Medium emotional value
        return '#4CAF50'; // Low emotional value
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading emotional investments...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">💪 Deep Endless Emotional Investment</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        + Invest Emotionally
                    </button>
                </div>

                {/* Investments Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {investments.map(investment => (
                        <div key={investment._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all">
                            {/* Investment Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{investment.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-3">{investment.description}</p>
                                    
                                    {/* Investment Type and Purpose */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                            {investmentTypes.find(t => t.value === investment.investmentType)?.label}
                                        </span>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                            {purposes.find(p => p.value === investment.purpose)?.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end ml-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold" style={{ color: getEmotionalValueColor(investment.emotionalValue) }}>
                                            {investment.emotionalValue}
                                        </div>
                                        <div className="text-xs text-gray-500">Emotional Value</div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium text-white`} 
                                          style={{ backgroundColor: emotionalStakes.find(s => s.value === investment.emotionalStakes)?.color }}>
                                        {investment.emotionalStakes}
                                    </span>
                                </div>
                            </div>

                            {/* Progress Overview */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Investment Progress</span>
                                    <span>{Math.round(investment.currentProgress?.percentage || 0)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="h-3 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${investment.currentProgress?.percentage || 0}%`,
                                            backgroundColor: getProgressColor(investment.currentProgress?.percentage || 0)
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{investment.supportNetwork}</div>
                                    <div className="text-xs text-gray-500">Support Network</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{investment.timeInvested}</div>
                                    <div className="text-xs text-gray-500">Hours Invested</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{investment.isOnTrack ? '✅' : '⚠️'}</div>
                                    <div className="text-xs text-gray-500">On Track</div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCheckpointModal(true)}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    📝 Add Checkpoint
                                </button>
                                <button
                                    onClick={() => setSelectedInvestment(investment)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {investments.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">💪</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No emotional investments found</h3>
                        <p className="text-gray-600 mb-4">Start investing emotionally in meaningful goals to build your legacy!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Make Your First Investment
                        </button>
                    </div>
                )}
            </div>

            {/* Create Investment Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">💪 Create Emotional Investment</h2>
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
                                    value={newInvestment.title}
                                    onChange={(e) => setNewInvestment(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="What are you investing in?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newInvestment.description}
                                    onChange={(e) => setNewInvestment(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    rows={3}
                                    placeholder="Describe your emotional investment..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Investment Type</label>
                                    <select
                                        value={newInvestment.investmentType}
                                        onChange={(e) => setNewInvestment(prev => ({ ...prev, investmentType: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        {investmentTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.icon} {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                                    <select
                                        value={newInvestment.purpose}
                                        onChange={(e) => setNewInvestment(prev => ({ ...prev, purpose: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        {purposes.map(purpose => (
                                            <option key={purpose.value} value={purpose.value}>
                                                {purpose.icon} {purpose.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emotional Stakes</label>
                                    <div className="space-y-2">
                                        {emotionalStakes.map(stake => (
                                            <button
                                                key={stake.value}
                                                type="button"
                                                onClick={() => setNewInvestment(prev => ({ ...prev, emotionalStakes: stake.value }))}
                                                className={`w-full px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                                                    newInvestment.emotionalStakes === stake.value
                                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{stake.label}</span>
                                                    <span className="text-xs">{stake.description}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Commitment Level</label>
                                    <div className="space-y-2">
                                        {commitmentLevels.map(level => (
                                            <button
                                                key={level.value}
                                                type="button"
                                                onClick={() => setNewInvestment(prev => ({ ...prev, commitmentLevel: level.value }))}
                                                className={`w-full px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                                                    newInvestment.commitmentLevel === level.value
                                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{level.label}</span>
                                                    <span className="text-xs">{level.description}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Emotional Value (1-100)</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={newInvestment.emotionalValue}
                                    onChange={(e) => setNewInvestment(prev => ({ ...prev, emotionalValue: parseInt(e.target.value) }))}
                                    className="w-full"
                                />
                                <div className="text-center text-sm text-gray-600">{newInvestment.emotionalValue}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                                    <input
                                        type="number"
                                        value={newInvestment.durationDays}
                                        onChange={(e) => setNewInvestment(prev => ({ ...prev, durationDays: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        min="1"
                                        max="365"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily Checkpoints</label>
                                    <input
                                        type="number"
                                        value={newInvestment.dailyCheckpoints}
                                        onChange={(e) => setNewInvestment(prev => ({ ...prev, dailyCheckpoints: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        min="1"
                                        max="24"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Emotions</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Primary Emotion</label>
                                        <select
                                            value={newInvestment.emotionsAtStart.primary}
                                            onChange={(e) => setNewInvestment(prev => ({ ...prev, emotionsAtStart: { ...prev.emotionsAtStart, primary: e.target.value } }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="excited">😊 Excited</option>
                                            <option value="nervous">😰 Nervous</option>
                                            <option value="confident">😎 Confident</option>
                                            <option value="determined">💪 Determined</option>
                                            <option value="curious">🤔 Curious</option>
                                            <option value="hopeful">🌟 Hopeful</option>
                                            <option value="anxious">😰 Anxious</option>
                                            <option value="motivated">🔥 Motivated</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Confidence (1-10)</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={newInvestment.emotionsAtStart.confidence}
                                            onChange={(e) => setNewInvestment(prev => ({ ...prev, emotionsAtStart: { ...prev.emotionsAtStart, confidence: parseInt(e.target.value) } }))}
                                            className="w-full"
                                        />
                                        <div className="text-center text-sm text-gray-600">{newInvestment.emotionsAtStart.confidence}/10</div>
                                    </div>
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
                                onClick={createInvestment}
                                disabled={!newInvestment.title.trim()}
                                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Create Investment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkpoint Modal */}
            {showCheckpointModal && selectedInvestment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">📝 Add Emotional Checkpoint</h2>
                            <button
                                onClick={() => setShowCheckpointModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-medium text-gray-900 mb-2">{selectedInvestment.title}</h3>
                            <p className="text-sm text-gray-600">Record your current emotional state and insights</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Emotions</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Primary</label>
                                        <select
                                            value={newCheckpoint.emotions.primary}
                                            onChange={(e) => setNewCheckpoint(prev => ({ ...prev, emotions: { ...prev.emotions, primary: e.target.value } }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="excited">😊 Excited</option>
                                            <option value="nervous">😰 Nervous</option>
                                            <option value="confident">😎 Confident</option>
                                            <option value="determined">💪 Determined</option>
                                            <option value="curious">🤔 Curious</option>
                                            <option value="hopeful">🌟 Hopeful</option>
                                            <option value="anxious">😰 Anxious</option>
                                            <option value="motivated">🔥 Motivated</option>
                                            <option value="proud">😊 Proud</option>
                                            <option value="disappointed">😞 Disappointed</option>
                                            <option value="relieved">😌 Relieved</option>
                                            <option value="frustrated">😤 Frustrated</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Intensity (1-10)</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={newCheckpoint.emotions.intensity}
                                            onChange={(e) => setNewCheckpoint(prev => ({ ...prev, emotions: { ...prev.emotions, intensity: parseInt(e.target.value) } }))}
                                            className="w-full"
                                        />
                                        <div className="text-center text-sm text-gray-600">{newCheckpoint.emotions.intensity}/10</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Insights</label>
                                <textarea
                                    value={newCheckpoint.insights}
                                    onChange={(e) => setNewCheckpoint(prev => ({ ...prev, insights: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="What have you learned? How are you feeling?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Triggers (comma separated)</label>
                                <input
                                    type="text"
                                    value={newCheckpoint.triggers.join(', ')}
                                    onChange={(e) => setNewCheckpoint(prev => ({ ...prev, triggers: e.target.value.split(',').map(t => t.trim()) }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="What triggered these emotions?"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCheckpointModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => addCheckpoint(selectedInvestment._id)}
                                disabled={!newCheckpoint.emotions.primary}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Add Checkpoint
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeepEmotionalInvestment;
