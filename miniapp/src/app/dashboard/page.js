import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        habits: { total: 0, active: 0, streaks: 0 },
        competitions: { total: 0, active: 0, completed: 0 },
        social: { total: 0, trending: 0, viral: 0 },
        emotional: { total: 0, active: 0, completed: 0 }
    });

    const tabs = [
        { id: 'overview', label: '🌟 Overview', icon: '🌟' },
        { id: 'habits', label: 'Daily Habits', icon: '✅' },
        { id: 'competitions', label: 'Competitions', icon: '🏆' },
        { id: 'social', label: 'Social Sharing', icon: '🌐' },
        { id: 'emotional', label: 'Emotional Investment', icon: '💪' }
    ];

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            // Fetch stats from all four systems
            const [habitsRes, competitionsRes, socialRes, emotionalRes] = await Promise.all([
                fetch('/api/daily-habits/stats/user_id_here').then(r => r.json()),
                fetch('/api/competitions/user/user_id_here').then(r => r.json()),
                fetch('/api/social-shares/user/user_id_here').then(r => r.json()),
                fetch('/api/emotional-investments/stats/user_id_here').then(r => r.json())
            ]);

            setStats({
                habits: habitsRes.stats || { total: 0, active: 0, streaks: 0 },
                competitions: competitionsRes.stats || { total: 0, active: 0, completed: 0 },
                social: socialRes.stats || { total: 0, trending: 0, viral: 0 },
                emotional: emotionalRes.stats || { total: 0, active: 0, completed: 0 }
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const getStatCard = (title, value, icon, color, subtitle = '') => (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <span className="text-2xl">{icon}</span>
            </div>
            <div className="text-center">
                <div className={`text-3xl font-bold`} style={{ color }}>{value}</div>
                {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 text-center">🎮 Deep Game Dashboard</h1>
                    <p className="text-center text-gray-600 mt-2">Track your endless journey across all dimensions</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg transition-all ${
                                activeTab === tab.id
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Stats Overview */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {getStatCard('Total Habits', stats.habits.total, '✅', '#4CAF50', `${stats.habits.active} active`)}
                        {getStatCard('Total Competitions', stats.competitions.total, '🏆', '#FF9800', `${stats.competitions.active} active`)}
                        {getStatCard('Social Shares', stats.social.total, '🌐', '#2196F3', `${stats.social.trending} trending`)}
                        {getStatCard('Emotional Investments', stats.emotional.total, '💪', '#9C27B0', `${stats.emotional.active} active`)}
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 border border-purple-200 rounded-lg p-6 text-white hover:shadow-lg transition-all">
                        <h3 className="text-lg font-semibold mb-2">🌟 Daily Habits</h3>
                        <p className="text-sm mb-4">Build and maintain meaningful daily habits</p>
                        <button className="w-full bg-white text-purple-600 py-2 px-4 rounded-lg hover:bg-purple-50 transition-colors">
                            Manage Habits →
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 border border-blue-200 rounded-lg p-6 text-white hover:shadow-lg transition-all">
                        <h3 className="text-lg font-semibold mb-2">🏆 Multi-Level Competitions</h3>
                        <p className="text-sm mb-4">Compete in endless multi-level challenges</p>
                        <button className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                            Browse Competitions →
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-teal-500 border border-green-200 rounded-lg p-6 text-white hover:shadow-lg transition-all">
                        <h3 className="text-lg font-semibold mb-2">🌐 Social Sharing</h3>
                        <p className="text-sm mb-4">Share achievements and connect with others</p>
                        <button className="w-full bg-white text-green-600 py-2 px-4 rounded-lg hover:bg-green-50 transition-colors">
                            Share Something →
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-red-500 border border-orange-200 rounded-lg p-6 text-white hover:shadow-lg transition-all">
                        <h3 className="text-lg font-semibold mb-2">💪 Emotional Investment</h3>
                        <p className="text-sm mb-4">Invest emotionally in meaningful goals</p>
                        <button className="w-full bg-white text-orange-600 py-2 px-4 rounded-lg hover:bg-orange-50 transition-colors">
                            Make Investment →
                        </button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">🔥 Recent Activity</h2>
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">🌟</span>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Habit Streak Milestone!</h4>
                                    <p className="text-sm text-gray-600">You maintained a 30-day streak in your wellness habit</p>
                                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">🏆</span>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Competition Victory!</h4>
                                    <p className="text-sm text-gray-600">You reached level 15 in the endless racing competition</p>
                                    <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">🌐</span>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Viral Achievement!</h4>
                                    <p className="text-sm text-gray-600">Your achievement share reached 1000+ engagement</p>
                                    <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">💪</span>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Emotional Breakthrough!</h4>
                                    <p className="text-sm text-gray-600">Your learning goal investment showed significant emotional growth</p>
                                    <p className="text-xs text-gray-500 mt-1">3 days ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
