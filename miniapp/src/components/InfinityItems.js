import React, { useState, useEffect } from 'react';
import './InfinityItems.css';

const InfinityItems = ({ userTelegramId, onItemPurchased, onItemUsed }) => {
    const [activeTab, setActiveTab] = useState('inventory');
    const [userItems, setUserItems] = useState([]);
    const [catalogItems, setCatalogItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userBalance, setUserBalance] = useState({ aiba: 0, neur: 0, stars: 0, diamonds: 0 });

    // Item categories with icons
    const categories = {
        avatar: { name: 'Avatar', icon: '👤', color: '#FF6B6B' },
        profile_frame: { name: 'Frames', icon: '🖼️', color: '#3498DB' },
        background: { name: 'Backgrounds', icon: '🌌', color: '#1a1a2e' },
        effect: { name: 'Effects', icon: '✨', color: '#E74C3C' },
        tool: { name: 'Tools', icon: '🔧', color: '#F39C12' },
        consumable: { name: 'Consumables', icon: '💊', color: '#2ECC71' },
        decoration: { name: 'Decorations', icon: '🎨', color: '#9B59B6' },
        special: { name: 'Special', icon: '⭐', color: '#FFD700' }
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

    // Fetch user data on component mount
    useEffect(() => {
        fetchUserItems();
        fetchCatalogItems();
        fetchUserBalance();
    }, [userTelegramId]);

    const fetchUserItems = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/infinity-items/user?telegramId=${userTelegramId}`);
            const data = await response.json();
            setUserItems(data.data || []);
        } catch (error) {
            console.error('Error fetching user items:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCatalogItems = async () => {
        try {
            const response = await fetch('/api/infinity-items/catalog');
            const data = await response.json();
            setCatalogItems(data.data || []);
        } catch (error) {
            console.error('Error fetching catalog items:', error);
        }
    };

    const fetchUserBalance = async () => {
        try {
            const response = await fetch(`/api/user?telegramId=${userTelegramId}`);
            const data = await response.json();
            if (data.success) {
                setUserBalance({
                    aiba: data.data.aibaBalance || 0,
                    neur: data.data.neurBalance || 0,
                    stars: data.data.starsBalance || 0,
                    diamonds: data.data.diamondsBalance || 0
                });
            }
        } catch (error) {
            console.error('Error fetching user balance:', error);
        }
    };

    const handleItemClick = (item) => {
        setSelectedItem(item);
    };

    const handlePurchaseItem = async (itemId, currency, amount) => {
        try {
            const response = await fetch('/api/infinity-items/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ itemId, currency, amount })
            });
            const data = await response.json();
            
            if (data.success) {
                onItemPurchased && onItemPurchased(data.data);
                fetchUserItems(); // Refresh items
                fetchUserBalance(); // Refresh balance
            }
        } catch (error) {
            console.error('Error purchasing item:', error);
        }
    };

    const handleUseItem = async (itemInstanceId, context = 'general') => {
        try {
            const response = await fetch('/api/infinity-items/use', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ itemInstanceId, context })
            });
            const data = await response.json();
            
            if (data.success) {
                onItemUsed && onItemUsed(data.data);
                fetchUserItems(); // Refresh items
            }
        } catch (error) {
            console.error('Error using item:', error);
        }
    };

    const renderUserItem = (item) => {
        const isEquipped = item.equip?.isEquipped || false;
        const isFavorite = item.display?.isFavorite || false;
        const rarity = item.itemId?.rarity || 'common';
        const category = item.itemId?.category || 'avatar';
        
        return (
            <div 
                key={item._id}
                className={`item-card ${isEquipped ? 'equipped' : ''} ${isFavorite ? 'favorite' : ''}`}
                onClick={() => handleItemClick(item)}
                style={{
                    borderColor: rarityColors[rarity]
                }}
            >
                <div className="item-header">
                    <div className="item-icon">
                        {item.itemId?.appearance?.icon || '🎁'}
                    </div>
                    <div className="item-info">
                        <h3 className="item-name">{item.itemId?.name || 'Unknown Item'}</h3>
                        <p className="item-description">{item.itemId?.description || 'No description'}</p>
                    </div>
                    <div className="item-actions">
                        {item.itemId?.category && (
                            <span className="item-category" style={{ backgroundColor: categories[category]?.color }}>
                                {categories[category]?.icon}
                            </span>
                        )}
                        <span className="item-rarity" style={{ backgroundColor: rarityColors[rarity] }}>
                            {rarity.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="item-details">
                    <div className="item-stats">
                        {item.usage?.totalUses > 0 && (
                            <div className="stat">
                                <span className="stat-label">Uses:</span>
                                <span className="stat-value">{item.usage.totalUses}</span>
                            </div>
                        )}
                        {item.usage?.remainingUses >= 0 && (
                            <div className="stat">
                                <span className="stat-label">Remaining:</span>
                                <span className="stat-value">{item.usage.remainingUses}</span>
                            </div>
                        )}
                        {item.acquisitionCost && (
                            <div className="stat">
                                <span className="stat-label">Cost:</span>
                                <span className="stat-value">{item.acquisitionCost.amount} {item.acquisitionCost.currency}</span>
                            </div>
                        )}
                    </div>
                    <div className="item-effects">
                        {item.itemId?.effects?.map((effect, index) => (
                            <div key={index} className="effect">
                                <span className="effect-icon">⚡</span>
                                <span className="effect-description">{effect.type}: +{effect.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="item-actions-buttons">
                    {!isEquipped && item.itemId?.itemType === 'cosmetic' && (
                        <button className="equip-button">
                            Equip Item
                        </button>
                    )}
                    {item.itemId?.usage?.isConsumable && item.usage?.remainingUses > 0 && (
                        <button 
                            className="use-button"
                            onClick={() => handleUseItem(item._id)}
                        >
                            Use Item ({item.usage.remainingUses} left)
                        </button>
                    )}
                    <button className={`favorite-button ${isFavorite ? 'favorited' : ''}`}>
                        {isFavorite ? '❤️' : '🤍'}
                    </button>
                </div>
            </div>
        );
    };

    const renderCatalogItem = (item) => {
        const rarity = item.rarity || 'common';
        const category = item.category || 'avatar';
        const canAfford = checkAffordability(item);
        
        return (
            <div 
                key={item.itemId}
                className={`catalog-item ${!canAfford ? 'cannot-afford' : ''}`}
                onClick={() => handleItemClick(item)}
                style={{
                    borderColor: rarityColors[rarity]
                }}
            >
                <div className="catalog-item-header">
                    <div className="item-icon">
                        {item.appearance?.icon || '🎁'}
                    </div>
                    <div className="item-info">
                        <h3 className="item-name">{item.name || 'Unknown Item'}</h3>
                        <p className="item-description">{item.description || 'No description'}</p>
                    </div>
                    <div className="item-actions">
                        <span className="item-category" style={{ backgroundColor: categories[category]?.color }}>
                            {categories[category]?.icon}
                        </span>
                        <span className="item-rarity" style={{ backgroundColor: rarityColors[rarity] }}>
                            {rarity.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="catalog-item-details">
                    <div className="item-price">
                        {item.acquisition?.methods?.[0]?.requirements && (
                            <div className="price">
                                <span className="price-amount">
                                    {item.acquisition.methods[0].requirements.amount}
                                </span>
                                <span className="price-currency">
                                    {item.acquisition.methods[0].requirements.currency}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="item-effects">
                        {item.effects?.map((effect, index) => (
                            <div key={index} className="effect">
                                <span className="effect-icon">⚡</span>
                                <span className="effect-description">{effect.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="catalog-item-actions">
                    <button 
                        className={`purchase-button ${!canAfford ? 'disabled' : ''}`}
                        disabled={!canAfford}
                        onClick={() => {
                            const method = item.acquisition?.methods?.[0];
                            if (method) {
                                handlePurchaseItem(item.itemId, method.requirements.currency, method.requirements.amount);
                            }
                        }}
                    >
                        {canAfford ? 'Purchase' : 'Insufficient Balance'}
                    </button>
                </div>
            </div>
        );
    };

    const checkAffordability = (item) => {
        const method = item.acquisition?.methods?.[0];
        if (!method) return false;
        
        const { currency, amount } = method.requirements;
        
        switch (currency) {
            case 'AIBA':
                return userBalance.aiba >= amount;
            case 'NEUR':
                return userBalance.neur >= amount;
            case 'STARS':
                return userBalance.stars >= amount;
            case 'DIAMONDS':
                return userBalance.diamonds >= amount;
            default:
                return false;
        }
    };

    const renderBalance = () => (
        <div className="balance-container">
            <h3>💰 Your Balance</h3>
            <div className="balance-grid">
                <div className="balance-item">
                    <span className="balance-icon">💎</span>
                    <span className="balance-amount">{userBalance.aiba.toLocaleString()}</span>
                    <span className="balance-label">AIBA</span>
                </div>
                <div className="balance-item">
                    <span className="balance-icon">⚡</span>
                    <span className="balance-amount">{userBalance.neur.toLocaleString()}</span>
                    <span className="balance-label">NEUR</span>
                </div>
                <div className="balance-item">
                    <span className="balance-icon">⭐</span>
                    <span className="balance-amount">{userBalance.stars.toLocaleString()}</span>
                    <span className="balance-label">STARS</span>
                </div>
                <div className="balance-item">
                    <span className="balance-icon">💎</span>
                    <span className="balance-amount">{userBalance.diamonds.toLocaleString()}</span>
                    <span className="balance-label">DIAMONDS</span>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="infinity-items-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading Infinity Items...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="infinity-items-container">
            <div className="infinity-items-header">
                <h1>🎁 Infinity Items</h1>
                <p>Collect, trade, and use powerful items across the digital universe</p>
            </div>
            
            {renderBalance()}
            
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

            {activeTab === 'inventory' && (
                <div className="inventory-section">
                    <div className="section-header">
                        <h2>🎒 Your Inventory</h2>
                        <p>Items you own and can use</p>
                    </div>
                    <div className="items-grid">
                        {userItems.map(item => renderUserItem(item))}
                    </div>
                </div>
            )}

            {activeTab === 'catalog' && (
                <div className="catalog-section">
                    <div className="section-header">
                        <h2>🛍 Item Catalog</h2>
                        <p>Browse and purchase new items</p>
                    </div>
                    <div className="items-grid">
                        {catalogItems.map(item => renderCatalogItem(item))}
                    </div>
                </div>
            )}

            {selectedItem && (
                <div className="item-modal" onClick={() => setSelectedItem(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedItem.itemId?.name || 'Item Details'}</h2>
                            <button className="close-button" onClick={() => setSelectedItem(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="item-detail">
                                <div className="item-icon-large">
                                    {selectedItem.appearance?.icon || '🎁'}
                                </div>
                                <div className="item-info-detail">
                                    <p className="item-description-detail">
                                        {selectedItem.description || 'No description'}
                                    </p>
                                    <div className="item-stats-detail">
                                        <div className="stat">
                                            <span className="stat-label">Category:</span>
                                            <span className="stat-value">{categories[selectedItem.category]?.name}</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-label">Type:</span>
                                            <span className="stat-value">{selectedItem.itemType?.toUpperCase()}</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-label">Rarity:</span>
                                            <span className="stat-value" style={{ color: rarityColors[selectedItem.rarity] }}>
                                                {selectedItem.rarity?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="item-effects-detail">
                                        <h4>⚡ Effects</h4>
                                        {selectedItem.effects?.map((effect, index) => (
                                            <div key={index} className="effect-detail">
                                                <span className="effect-type">{effect.type}:</span>
                                                <span className="effect-value">+{effect.value}</span>
                                                <span className="effect-duration">
                                                    {effect.duration > 0 ? ` (${Math.round(effect.duration / 1000 / 60)}min)` : ' (Permanent)'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedItem.acquisition?.methods?.[0] && (
                                        <div className="item-purchase-detail">
                                            <h4>💰 Purchase</h4>
                                            <div className="purchase-info">
                                                <span className="price-large">
                                                    {selectedItem.acquisition.methods[0].requirements.amount} {selectedItem.acquisition.methods[0].requirements.currency}
                                                </span>
                                                <button 
                                                    className="purchase-modal-button"
                                                    disabled={!checkAffordability(selectedItem)}
                                                    onClick={() => {
                                                        const method = selectedItem.acquisition.methods[0];
                                                        handlePurchaseItem(selectedItem.itemId, method.requirements.currency, method.requirements.amount);
                                                    }}
                                                >
                                                    {checkAffordability(selectedItem) ? 'Purchase Now' : 'Insufficient Balance'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfinityItems;
