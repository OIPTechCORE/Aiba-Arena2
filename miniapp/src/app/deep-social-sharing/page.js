import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

const DeepSocialSharing = () => {
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedShareType, setSelectedShareType] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedShare, setSelectedShare] = useState(null);
    const [trendingShares, setTrendingShares] = useState([]);

    const shareTypes = [
        { value: 'all', label: 'All Shares', icon: '🌟' },
        { value: 'achievement', label: 'Achievements', icon: '🏆' },
        { value: 'milestone', label: 'Milestones', icon: '🎯' },
        { value: 'victory', label: 'Victories', icon: '🏆' },
        { value: 'creation', label: 'Creations', icon: '🎨' },
        { value: 'habit_completion', label: 'Habit Wins', icon: '✅' },
        { value: 'level_up', label: 'Level Ups', icon: '⬆️' },
        { value: 'streak', label: 'Streaks', icon: '🔥' },
        { value: 'custom', label: 'Custom', icon: '✨' }
    ];

    const emotionalTags = [
        { value: 'proud', label: 'Proud', color: '#FF6B6B' },
        { value: 'excited', label: 'Excited', color: '#FFD54F' },
        { value: 'grateful', label: 'Grateful', color: '#4CAF50' },
        { value: 'motivated', label: 'Motivated', color: '#2196F3' },
        { value: 'accomplished', label: 'Accomplished', color: '#9C27B0' },
        { value: 'inspired', label: 'Inspired', color: '#FF9800' },
        { value: 'joyful', label: 'Joyful', color: '#FFEB3B' },
        { value: 'determined', label: 'Determined', color: '#3F51B5' },
        { value: 'confident', label: 'Confident', color: '#00BCD4' },
        { value: 'peaceful', label: 'Peaceful', color: '#E91E63' }
    ];

    const platforms = [
        { name: 'telegram', icon: '📱', color: '#0088CC' },
        { name: 'twitter', icon: '🐦', color: '#1DA1F2' },
        { name: 'discord', icon: '💬', color: '#5865F2' },
        { name: 'facebook', icon: '📘', color: '#1877F2' },
        { name: 'instagram', icon: '📷', color: '#E4405F' },
        { name: 'linkedin', icon: '💼', color: '#0077B5' }
    ];

    const [newShare, setNewShare] = useState({
        title: '',
        description: '',
        shareType: 'custom',
        emotionalTags: [],
        moodBefore: 5,
        moodAfter: 5,
        visibility: 'public',
        allowComments: true,
        allowReactions: true
    });

    useEffect(() => {
        fetchShares();
        fetchTrendingShares();
    }, [selectedShareType]);

    const fetchShares = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/social-shares${selectedShareType !== 'all' ? `?shareType=${selectedShareType}` : ''}`);
            const data = await response.json();
            setShares(data.shares || []);
        } catch (error) {
            console.error('Error fetching shares:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendingShares = async () => {
        try {
            const response = await fetch('/api/social-shares/trending');
            const data = await response.json();
            setTrendingShares(data.shares || []);
        } catch (error) {
            console.error('Error fetching trending shares:', error);
        }
    };

    const likeShare = async (shareId) => {
        try {
            const response = await fetch(`/api/social-shares/${shareId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'user_id_here' })
            });
            const data = await response.json();
            
            if (data.message) {
                // Update the share in local state
                setShares(prev => prev.map(share => 
                    share._id === shareId ? { ...share, totalLikes: data.totalLikes } : share
                ));
                
                // Show success notification
                alert('Share liked! ❤️');
            }
        } catch (error) {
            console.error('Error liking share:', error);
            alert('Failed to like share');
        }
    };

    const commentOnShare = async (shareId, content) => {
        try {
            const response = await fetch(`/api/social-shares/${shareId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'user_id_here', content })
            });
            const data = await response.json();
            
            if (data.message) {
                // Update the share in local state
                setShares(prev => prev.map(share => 
                    share._id === shareId ? { ...share, totalComments: data.totalComments } : share
                ));
                
                // Show success notification
                alert('Comment added! 💬');
            }
        } catch (error) {
            console.error('Error commenting on share:', error);
            alert('Failed to add comment');
        }
    };

    const createShare = async () => {
        try {
            const response = await fetch('/api/social-shares', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newShare,
                    userId: 'user_id_here'
                })
            });
            const data = await response.json();
            
            if (data.message) {
                setShares(prev => [data.share, ...prev]);
                setShowCreateModal(false);
                setNewShare({
                    title: '',
                    description: '',
                    shareType: 'custom',
                    emotionalTags: [],
                    moodBefore: 5,
                    moodAfter: 5,
                    visibility: 'public',
                    allowComments: true,
                    allowReactions: true
                });
                alert('Share created successfully! 🎉');
            }
        } catch (error) {
            console.error('Error creating share:', error);
            alert('Failed to create share');
        }
    };

    const reshare = async (originalShareId) => {
        try {
            const response = await fetch(`/api/social-shares/${originalShareId}/reshare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'user_id_here',
                    platform: 'telegram',
                    shareUrl: 'https://t.me/share_url'
                })
            });
            const data = await response.json();
            
            if (data.message) {
                setShares(prev => [data.share, ...prev]);
                alert('Share reshared! 🔄');
            }
        } catch (error) {
            console.error('Error resharing:', error);
            alert('Failed to reshare');
        }
    };

    const getViralPotentialColor = (potential) => {
        if (potential >= 1000) return '#FF6B6B'; // Super viral
        if (potential >= 500) return '#FF9800'; // Very viral
        if (potential >= 100) return '#FFD54F'; // Viral
        if (potential >= 50) return '#4CAF50'; // Moderate potential
        return '#9E9E9E'; // Low potential
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading shares...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">🌐 Deep Endless Social Sharing</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        ✨ Create Share
                    </button>
                </div>

                {/* Share Type Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {shareTypes.map(type => (
                        <button
                            key={type.value}
                            onClick={() => setSelectedShareType(type.value)}
                            className={`px-4 py-2 rounded-lg transition-all ${
                                selectedShareType === type.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span className="mr-2">{type.icon}</span>
                            {type.label}
                        </button>
                    ))}
                </div>

                {/* Trending Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">🔥 Trending Now</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trendingShares.slice(0, 6).map(share => (
                            <div key={share._id} className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 hover:shadow-lg transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{share.title}</h3>
                                        <p className="text-sm text-gray-600 line-clamp-2">{share.description}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-2">🔥</span>
                                        <span className="text-sm font-medium text-purple-600">Trending</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <div className="flex items-center space-x-4">
                                        <span>💖 {share.totalLikes} likes</span>
                                        <span>💬 {share.totalComments} comments</span>
                                        <span>🔄 {share.totalShares} shares</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {share.emotionalTags.map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                                {emotionalTags.find(t => t.value === tag)?.label || tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => likeShare(share._id)}
                                        className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        ❤️ Like
                                    </button>
                                    <button
                                        onClick={() => reshare(share._id)}
                                        className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        🔄 Reshare
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Feed */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">📱 Social Feed</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shares.map(share => (
                            <div key={share._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all">
                                {/* Share Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{share.title}</h3>
                                        <p className="text-sm text-gray-600 line-clamp-3">{share.description}</p>
                                        
                                        {/* Emotional Tags */}
                                        {share.emotionalTags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {share.emotionalTags.map(tag => (
                                                    <span key={tag} className="px-2 py-1 rounded text-xs text-white" 
                                                          style={{ backgroundColor: emotionalTags.find(t => t.value === tag)?.color || '#9E9E9E' }}>
                                                        {emotionalTags.find(t => t.value === tag)?.label || tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Viral Potential Indicator */}
                                    <div className="flex flex-col items-end ml-4">
                                        <div className="text-center mb-2">
                                            <div className="text-xs text-gray-500">Viral Potential</div>
                                            <div className={`text-2xl font-bold`} 
                                                 style={{ color: getViralPotentialColor(share.viralPotential) }}>
                                                {share.viralPotential >= 1000 ? '🔥' : 
                                                 share.viralPotential >= 500 ? '⚡' : 
                                                 share.viralPotential >= 100 ? '🌟' : '✨'}
                                            </div>
                                        </div>
                                        {share.isTrending && (
                                            <span className="px-2 py-1 bg-red-500 text-white rounded text-xs font-medium">
                                                🔥 Trending
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Media Content */}
                                {(share.imageUrl || share.videoUrl) && (
                                    <div className="mb-4 bg-gray-100 rounded-lg overflow-hidden">
                                        {share.videoUrl ? (
                                            <video 
                                                src={share.videoUrl} 
                                                controls 
                                                className="w-full h-48 object-cover"
                                            />
                                        ) : (
                                            <img 
                                                src={share.imageUrl} 
                                                alt={share.title}
                                                className="w-full h-48 object-cover"
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Engagement Stats */}
                                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                                    <div className="flex items-center space-x-4">
                                        <span className="flex items-center">
                                            ❤️ {share.totalLikes}
                                        </span>
                                        <span className="flex items-center">
                                            💬 {share.totalComments}
                                        </span>
                                        <span className="flex items-center">
                                            🔄 {share.totalShares}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span>Engagement Rate: {share.engagementRate}</span>
                                    </div>
                                </div>

                                {/* Emotional Impact */}
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-4">
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 mb-1">Emotional Impact</div>
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="text-center">
                                                <div className="text-xs text-gray-500">Before</div>
                                                <div className="text-lg font-bold">{share.moodBefore}/10</div>
                                            </div>
                                            <div className="text-2xl">→</div>
                                            <div className="text-center">
                                                <div className="text-xs text-gray-500">After</div>
                                                <div className={`text-lg font-bold ${
                                                    share.emotionalImpact > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {share.moodAfter}/10
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium mt-1">
                                            {share.emotionalImpact > 0 ? '😊 Positive Impact' : '😔 Challenging'}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => likeShare(share._id)}
                                        className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        ❤️ Like ({share.totalLikes})
                                    </button>
                                    <button
                                        onClick={() => setSelectedShare(share)}
                                        className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        💬 Comment ({share.totalComments})
                                    </button>
                                    <button
                                        onClick={() => reshare(share._id)}
                                        className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        🔄 Reshare ({share.totalShares})
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Empty State */}
                {shares.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🌐</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No shares found</h3>
                        <p className="text-gray-600 mb-4">Start sharing your achievements and experiences to build your social legacy!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create Your First Share
                        </button>
                    </div>
                )}
            </div>

            {/* Create Share Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">✨ Create New Share</h2>
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
                                    value={newShare.title}
                                    onChange={(e) => setNewShare(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="What do you want to share?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newShare.description}
                                    onChange={(e) => setNewShare(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    rows={4}
                                    placeholder="Share your story..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Share Type</label>
                                <select
                                    value={newShare.shareType}
                                    onChange={(e) => setNewShare(prev => ({ ...prev, shareType: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {shareTypes.filter(t => t.value !== 'all').map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.icon} {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Emotional Tags</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {emotionalTags.map(tag => (
                                        <button
                                            key={tag.value}
                                            type="button"
                                            onClick={() => {
                                                setNewShare(prev => ({
                                                    ...prev,
                                                    emotionalTags: prev.emotionalTags.includes(tag.value) 
                                                        ? prev.emotionalTags.filter(t => t !== tag.value)
                                                        : [...prev.emotionalTags, tag.value]
                                                }));
                                            }}
                                            className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                                                newShare.emotionalTags.includes(tag.value)
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mood Before</label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={newShare.moodBefore}
                                        onChange={(e) => setNewShare(prev => ({ ...prev, moodBefore: parseInt(e.target.value) }))}
                                        className="w-full"
                                    />
                                    <div className="text-center text-sm text-gray-600">{newShare.moodBefore}/10</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mood After</label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={newShare.moodAfter}
                                        onChange={(e) => setNewShare(prev => ({ ...prev, moodAfter: parseInt(e.target.value) }))}
                                        className="w-full"
                                    />
                                    <div className="text-center text-sm text-gray-600">{newShare.moodAfter}/10</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                                <select
                                    value={newShare.visibility}
                                    onChange={(e) => setNewShare(prev => ({ ...prev, visibility: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="public">🌍 Public - Everyone can see</option>
                                    <option value="friends">👥 Friends - Only friends can see</option>
                                    <option value="private">🔒 Private - Only you can see</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={newShare.allowComments}
                                            onChange={(e) => setNewShare(prev => ({ ...prev, allowComments: e.target.checked }))}
                                            className="mr-2"
                                        />
                                        Allow Comments
                                    </label>
                                </div>
                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={newShare.allowReactions}
                                            onChange={(e) => setNewShare(prev => ({ ...prev, allowReactions: e.target.checked }))}
                                            className="mr-2"
                                        />
                                        Allow Reactions
                                    </label>
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
                                onClick={createShare}
                                disabled={!newShare.title.trim()}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Create Share
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeepSocialSharing;
