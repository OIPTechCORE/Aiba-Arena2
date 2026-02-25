import React, { useState, useEffect } from 'react';
import './InfinityBadges.css';

const InfinityBadges = ({ userTelegramId, onBadgeAwarded, onBadgeEquipped }) => {
    const [activeTab, setActiveTab] = useState('badges');
    const [userBadges, setUserBadges] = useState([]);
    const [availableBadges, setAvailableBadges] = useState([]);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);

    // Badge categories with icons
    const categories = {
        leadership: { name: 'Leadership', icon: '👑', color: '#FFD700' },
        organizer: { name: 'Organizer', icon: '📋', color: '#3498DB' },
        rank: { name: 'Rank', icon: '🏆', color: '#FFD700' },
        profile: { name: 'Profile', icon: '👤', color: '#2ECC71' },
        achievement: { name: 'Achievement', icon: '🏅', color: '#F39C12' },
        item: { name: 'Items', icon: '🎁', color: '#E74C3C' }
    };

    // Rarity colors
    const rarityColors = {
        common: '#95A5A6',
        uncommon: '#C0C0C0',
        rare: '#F39C12',
        epic: '#9B59B6',
        legendary: '#FFD700',
        mythic: '#9B59B6',
        infinity: '#1a1a2e'
    };

    // Fetch user badges on component mount
    useEffect(() => {
        fetchUserBadges();
        fetchAvailableBadges();
        fetchBadgeStats();
    }, [userTelegramId]);

    const fetchUserBadges = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/infinity-badges/user?telegramId=${userTelegramId}`);
            const data = await response.json();
            setUserBadges(data.data || []);
        } catch (error) {
            console.error('Error fetching user badges:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableBadges = async () => {
        try {
            const response = await fetch(`/api/infinity-badges/available?telegramId=${userTelegramId}`);
            const data = await response.json();
            setAvailableBadges(data.data || []);
        } catch (error) {
            console.error('Error fetching available badges:', error);
        }
    };

    const fetchBadgeStats = async () => {
        try {
            const response = await fetch('/api/infinity-badges/stats');
            const data = await response.json();
            setStats(data.data);
        } catch (error) {
            console.error('Error fetching badge stats:', error);
        }
    };

    const handleBadgeClick = (badge) => {
        setSelectedBadge(badge);
    };

    const handleEquipBadge = async (badgeInstanceId) => {
        try {
            const response = await fetch('/api/infinity-badges/equip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ badgeInstanceId })
            });
            const data = await response.json();
            
            if (data.success) {
                onBadgeEquipped && onBadgeEquipped(badge);
                fetchUserBadges(); // Refresh badges
            }
        } catch (error) {
            console.error('Error equipping badge:', error);
        }
    };

    const handleFavoriteBadge = async (badgeInstanceId, isFavorite) => {
        try {
            const response = await fetch('/api/infinity-badges/favorite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ badgeInstanceId, isFavorite })
            });
            const data = await response.json();
            
            if (data.success) {
                fetchUserBadges(); // Refresh badges
            }
        } catch (error) {
            console.error('Error updating badge favorite:', error);
        }
    };

    const renderBadge = (badge) => {
        const isEquipped = badge.display?.isEquipped || false;
        const isFavorite = badge.display?.isFavorite || false;
        const rarity = badge.badgeId?.rarity || 'common';
        
        return (
            <div 
                key={badge._id}
                className={`badge-card ${isEquipped ? 'equipped' : ''} ${isFavorite ? 'favorite' : ''}`}
                onClick={() => handleBadgeClick(badge)}
                style={{
                    borderColor: rarityColors[rarity],
                    boxShadow: badge.visualEffects?.glow ? `0 0 20px ${rarityColors[rarity]}40` : 'none'
                }}
            >
                <div className="badge-header">
                    <div className="badge-icon" style={{ fontSize: '24px' }}>
                        {badge.badgeId?.icon || '🏆'}
                    </div>
                    <div className="badge-info">
                        <h3 className="badge-name">{badge.badgeId?.name || 'Unknown Badge'}</h3>
                        <p className="badge-description">{badge.badgeId?.description || 'No description'}</p>
                    </div>
                    <div className="badge-actions">
                        {badge.badgeId?.category && (
                            <span className="badge-category" style={{ backgroundColor: categories[badge.badgeId.category]?.color }}>
                                {categories[badge.badgeId.category]?.icon}
                            </span>
                        )}
                        <span className="badge-rarity" style={{ backgroundColor: rarityColors[rarity] }}>
                            {rarity.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="badge-progress">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ 
                                width: `${badge.progress?.percentage || 0}%`,
                                backgroundColor: rarityColors[rarity]
                            }}
                        />
                    </div>
                    <span className="progress-text">{badge.progress?.percentage || 0}%</span>
                </div>
                <div className="badge-rewards">
                    {badge.badgeId?.rewards && (
                        <div className="rewards-grid">
                            {badge.badgeId.rewards.aibaReward > 0 && (
                                <div className="reward-item">
                                    <span className="reward-icon">💎</span>
                                    <span className="reward-value">+{badge.badgeId.rewards.aibaReward}</span>
                                </div>
                            )}
                            {badge.badgeId.rewards.neurReward > 0 && (
                                <div className="reward-item">
                                    <span className="reward-icon">⚡</span>
                                    <span className="reward-value">+{badge.badgeId.rewards.neurReward}</span>
                                </div>
                            )}
                            {badge.badgeId.rewards.xpBonus > 0 && (
                                <div className="reward-item">
                                    <span className="reward-icon">⭐</span>
                                    <span className="reward-value">+{badge.badgeId.rewards.xpBonus} XP</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="badge-actions-buttons">
                    {!isEquipped && (
                        <button 
                            className="equip-button"
                            onClick={() => handleEquipBadge(badge._id)}
                        >
                            Equip Badge
                        </button>
                    )}
                    <button 
                        className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
                        onClick={() => handleFavoriteBadge(badge._id, !isFavorite)}
                    >
                        {isFavorite ? '❤️' : '🤍'}
                    </button>
                </div>
            </div>
        );
    };

    const renderStats = () => {
        if (!stats) return null;
        
        return (
            <div className="stats-container">
                <h2>📊 Badge Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Badges</h3>
                        <p className="stat-value">{stats.totalBadges || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Earned</h3>
                        <p className="stat-value">{stats.totalEarned || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Categories</h3>
                        <div className="category-stats">
                            {Object.entries(stats.categoryDistribution || {}).map(([category, count]) => (
                                <div key={category} className="category-stat">
                                    <span className="category-icon">{categories[category]?.icon}</span>
                                    <span className="category-count">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="stat-card">
                        <h3>Rarity Distribution</h3>
                        <div className="rarity-stats">
                            {Object.entries(stats.rarityDistribution || {}).map(([rarity, count]) => (
                                <div key={rarity} className="rarity-stat">
                                    <span 
                                        className="rarity-dot" 
                                        style={{ backgroundColor: rarityColors[rarity] }}
                                    />
                                    <span className="rarity-count">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="infinity-badges-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading Infinity Badges...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="infinity-badges-container">
            <div className="infinity-badges-header">
                <h1>♾️ Infinity Badges System</h1>
                <p>Collect, equip, and showcase your achievements across the digital universe</p>
            </div>
            
            <div className="tabs-container">
                <div className="tabs">
                    {Object.entries(categories).map(([key, category]) => (
                        <button
                            key={key}
                            className={`tab-button ${activeTab === key ? 'active' : ''}`}
                            onClick={() => setActiveTab(key)}
                            style={{ borderColor: category.color }}
                        >
                            <span className="tab-icon">{category.icon}</span>
                            <span className="tab-label">{category.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'stats' && renderStats()}

            {activeTab === 'badges' && (
                <div className="badges-grid">
                    <div className="section-header">
                        <h2>🏆 Your Badges</h2>
                        <p>Badges you've earned and equipped</p>
                    </div>
                    <div className="badges-list">
                        {userBadges.map(badge => renderBadge(badge))}
                    </div>
                </div>
            )}

            {activeTab === 'available' && (
                <div className="available-badges">
                    <div className="section-header">
                        <h2>🎯 Available Badges</h2>
                        <p>Badges you can unlock and earn</p>
                    </div>
                    <div className="badges-list">
                        {availableBadges.map(badge => renderBadge(badge))}
                    </div>
                </div>
            )}

            {selectedBadge && (
                <div className="badge-modal" onClick={() => setSelectedBadge(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedBadge.badgeId?.name || 'Badge Details'}</h2>
                            <button className="close-button" onClick={() => setSelectedBadge(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="badge-detail">
                                <div className="badge-icon-large">
                                    {selectedBadge.badgeId?.icon || '🏆'}
                                </div>
                                <div className="badge-info-detail">
                                    <p className="badge-description-detail">
                                        {selectedBadge.badgeId?.description || 'No description'}
                                    </p>
                                    <div className="badge-requirements">
                                        <h4>📋 Requirements</h4>
                                        {selectedBadge.badgeId?.requirements?.conditions?.map((condition, index) => (
                                            <p key={index}>
                                                {condition.type}: {condition.value} {condition.operator}
                                            </p>
                                        ))}
                                    </div>
                                    <div className="badge-rewards-detail">
                                        <h4>🎁 Rewards</h4>
                                        {selectedBadge.badgeId?.rewards && (
                                            <div className="rewards-detail-grid">
                                                {selectedBadge.badgeId.rewards.aibaReward > 0 && (
                                                    <div className="reward-detail">
                                                        <span>💎 AIBA: +{selectedBadge.badgeId.rewards.aibaReward}</span>
                                                    </div>
                                                )}
                                                {selectedBadge.badgeId.rewards.neurReward > 0 && (
                                                    <div className="reward-detail">
                                                        <span>⚡ NEUR: +{selectedBadge.badgeId.rewards.neurReward}</span>
                                                    </div>
                                                )}
                                                {selectedBadge.badgeId.rewards.xpBonus > 0 && (
                                                    <div className="reward-detail">
                                                        <span>⭐ XP Bonus: +{selectedBadge.badgeId.rewards.xpBonus}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfinityBadges;
