import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

const DeepCompetitions = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedCompetition, setSelectedCompetition] = useState(null);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);

    const categories = [
        { value: 'all', label: 'All Competitions', icon: '🏆' },
        { value: 'battle', label: 'Battle', icon: '⚔️' },
        { value: 'racing', label: 'Racing', icon: '🏁' },
        { value: 'social', label: 'Social', icon: '👥' },
        { value: 'learning', label: 'Learning', icon: '📚' },
        { value: 'creative', label: 'Creative', icon: '🎨' },
        { value: 'endurance', label: 'Endurance', icon: '💪' }
    ];

    const competitionTypes = [
        { value: 'tournament', label: 'Tournament', color: '#FF6B6B' },
        { value: 'league', label: 'League', color: '#4CAF50' },
        { value: 'endless', label: 'Endless', color: '#9C27B0' },
        { value: 'seasonal', label: 'Seasonal', color: '#FF9800' }
    ];

    useEffect(() => {
        fetchCompetitions();
    }, [selectedCategory]);

    const fetchCompetitions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/competitions${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`);
            const data = await response.json();
            setCompetitions(data.competitions || []);
        } catch (error) {
            console.error('Error fetching competitions:', error);
        } finally {
            setLoading(false);
        }
    };

    const joinCompetition = async (competitionId) => {
        try {
            const response = await fetch(`/api/competitions/${competitionId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'user_id_here' }) // Would come from auth
            });
            const data = await response.json();
            
            if (data.message) {
                alert('Successfully joined the competition!');
                fetchCompetitions(); // Refresh list
            }
        } catch (error) {
            console.error('Error joining competition:', error);
            alert('Failed to join competition');
        }
    };

    const fetchLeaderboard = async (competitionId) => {
        try {
            const response = await fetch(`/api/competitions/${competitionId}/leaderboard`);
            const data = await response.json();
            setLeaderboard(data.leaderboard || []);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming': return '#FF9800';
            case 'active': return '#4CAF50';
            case 'completed': return '#9E9E9E';
            case 'cancelled': return '#F44336';
            default: return '#9E9E9E';
        }
    };

    const getTimeRemaining = (timeRemaining) => {
        if (timeRemaining <= 0) return 'Completed';
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading competitions...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">🏆 Deep Multi-Level Competitions</h1>
                    <div className="flex gap-2">
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                            🎯 Create Competition
                        </button>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            📊 My Competitions
                        </button>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map(category => (
                        <button
                            key={category.value}
                            onClick={() => setSelectedCategory(category.value)}
                            className={`px-4 py-2 rounded-lg transition-all ${
                                selectedCategory === category.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span className="mr-2">{category.icon}</span>
                            {category.label}
                        </button>
                    ))}
                </div>

                {/* Competitions Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {competitions.map(competition => (
                        <div key={competition._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all">
                            {/* Competition Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{competition.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{competition.description}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`px-2 py-1 rounded text-xs font-medium text-white`} 
                                          style={{ backgroundColor: getStatusColor(competition.status) }}>
                                        {competition.status}
                                    </span>
                                    {competition.isEndless && (
                                        <span className="mt-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                            ♾️ Endless
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Competition Info */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-sm text-gray-500">Type</div>
                                    <div className="font-medium" style={{ color: competitionTypes.find(t => t.value === competition.competitionType)?.color }}>
                                        {competitionTypes.find(t => t.value === competition.competitionType)?.label}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Participants</div>
                                    <div className="font-medium">{competition.currentParticipants}/{competition.maxParticipants}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Time Remaining</div>
                                    <div className="font-medium">{getTimeRemaining(competition.timeRemaining)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Entry Fee</div>
                                    <div className="font-medium">{competition.entryFeeAiba} AIBA</div>
                                </div>
                            </div>

                            {/* Progress Bar for Participation */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Participation Rate</span>
                                    <span>{Math.round(competition.participationRate)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-purple-600 transition-all duration-500"
                                        style={{ width: `${Math.min(competition.participationRate, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Prize Pool */}
                            {competition.prizePoolAiba > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                    <div className="text-center">
                                        <div className="text-sm text-yellow-800">Prize Pool</div>
                                        <div className="text-2xl font-bold text-yellow-900">{competition.prizePoolAiba} AIBA</div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                {competition.status === 'upcoming' || competition.status === 'active' ? (
                                    <button
                                        onClick={() => joinCompetition(competition._id)}
                                        disabled={competition.currentParticipants >= competition.maxParticipants}
                                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {competition.currentParticipants >= competition.maxParticipants ? '🔒 Full' : '🚀 Join Competition'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => fetchLeaderboard(competition._id)}
                                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        📊 View Results
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedCompetition(competition)}
                                    className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {competitions.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🏆</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No competitions found</h3>
                        <p className="text-gray-600 mb-4">Jump into exciting multi-level competitions and test your skills!</p>
                        <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                            Browse All Competitions
                        </button>
                    </div>
                )}
            </div>

            {/* Competition Details Modal */}
            {selectedCompetition && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">{selectedCompetition.title}</h2>
                            <button
                                onClick={() => setSelectedCompetition(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                <p className="text-gray-600">{selectedCompetition.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Competition Details</h4>
                                    <div className="space-y-1 text-sm">
                                        <div><span className="text-gray-500">Type:</span> {competitionTypes.find(t => t.value === selectedCompetition.competitionType)?.label}</div>
                                        <div><span className="text-gray-500">Max Level:</span> {selectedCompetition.maxLevel}</div>
                                        <div><span className="text-gray-500">Difficulty:</span> {selectedCompetition.difficultyScaling}</div>
                                        <div><span className="text-gray-500">Rewards:</span> {selectedCompetition.prizePoolAiba} AIBA</div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Participation</h4>
                                    <div className="space-y-1 text-sm">
                                        <div><span className="text-gray-500">Current:</span> {selectedCompetition.currentParticipants}/{selectedCompetition.maxParticipants}</div>
                                        <div><span className="text-gray-500">Entry Fee:</span> {selectedCompetition.entryFeeAiba} AIBA</div>
                                        <div><span className="text-gray-500">Time Left:</span> {getTimeRemaining(selectedCompetition.timeRemaining)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Leaderboard */}
                            {leaderboard.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">🏆 Leaderboard</h4>
                                    <div className="space-y-2">
                                        {leaderboard.slice(0, 10).map((entry, index) => (
                                            <div key={entry.rank} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center">
                                                    <span className="font-bold text-lg mr-3">#{entry.rank}</span>
                                                    <span className="font-medium">{entry.userId?.telegram?.username || 'Anonymous'}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">{entry.score}</div>
                                                    <div className="text-sm text-gray-500">Level {entry.currentLevel}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setSelectedCompetition(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                                {selectedCompetition.status === 'upcoming' || selectedCompetition.status === 'active' ? (
                                    <button
                                        onClick={() => {
                                            joinCompetition(selectedCompetition._id);
                                            setSelectedCompetition(null);
                                        }}
                                        disabled={selectedCompetition.currentParticipants >= selectedCompetition.maxParticipants}
                                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Join Competition
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setSelectedCompetition(null)}
                                        className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
                                        disabled
                                    >
                                        Competition Ended
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeepCompetitions;
