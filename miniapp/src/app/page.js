'use client';

import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useEffect, useMemo, useState } from 'react';
import { createApi, getErrorMessage } from '../lib/api';
import { getTelegramUserUnsafe } from '../lib/telegram';
import { buildRewardClaimPayload } from '../lib/tonRewardClaim';
import { buildJettonTransferPayload, buildListingForwardPayload } from '../lib/tonJetton';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const IS_DEV = BACKEND_URL.includes('localhost');

/* Futuristic 24×24 icons (stroke, bold) for tabs and buttons */
const IconHome = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 12l8-8 8 8" /><path d="M6 10v10h4v-6h4v6h4V10" />
    </svg>
);
const IconBrokers = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);
const IconArena = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);
const IconGuilds = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <circle cx="9" cy="7" r="4" /><circle cx="15" cy="7" r="4" />
        <path d="M4 20c0-3 2.5-5 5-5s5 2 5 5" /><path d="M14 20c0-3 2.5-5 5-5s5 2 5 5" />
    </svg>
);
const IconMarket = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" />
    </svg>
);
const IconWallet = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M16 14h.01" />
    </svg>
);
const IconWorld = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2c3 3 3 17 0 20" /><path d="M12 2c-3 3-3 17 0 20" />
    </svg>
);
const IconAsset = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M12 2l8 4v12l-8 4-8-4V6l8-4z" /><path d="M12 22V12" /><path d="M20 6l-8 4-8-4" />
    </svg>
);
const IconGov = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M6 4h12" /><path d="M8 4v6" /><path d="M16 4v6" /><path d="M4 10h16" /><path d="M7 10l-3 6h6l-3-6z" /><path d="M17 10l-3 6h6l-3-6z" />
    </svg>
);
const IconRun = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M8 5v14l11-7z" />
    </svg>
);
const IconRefresh = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
);
const IconClaim = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
);
const IconMint = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M12 2l3 3-3 3-3-3z" /><path d="M12 14l3 3-3 3-3-3z" /><path d="M6 8l3 3-3 3-3-3z" /><path d="M18 8l3 3-3 3-3-3z" />
    </svg>
);
const IconStake = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 22V12h6v10" />
    </svg>
);
const IconList = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><path d="M3.27 6.96L12 12.01l8.73-5.05" />
    </svg>
);
const IconBuy = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M16 10a4 4 0 01-8 0" />
    </svg>
);
const IconShare = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><path d="M12 2v13" /><path d="M8 7l4-4 4 4" />
    </svg>
);
const IconVault = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);
const IconHeart = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
);
const IconUpdates = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13 13a2 2 0 01-3.41 1.41" />
    </svg>
);
const IconUniversity = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
);
const IconMultiverse = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
);
const IconCar = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 17h14v-5H5v5z" /><path d="M5 12l2-4h10l2 4" /><circle cx="7" cy="17" r="1" /><circle cx="17" cy="17" r="1" />
    </svg>
);
const IconBike = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M9 17l4-7 3 4" /><path d="M13 10l2-3" /><path d="M5.5 17.5h4l5-7" />
    </svg>
);
const IconLeaderboard = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2h-3v10.5a2.5 2.5 0 01-5 0V2H6v10.5a2.5 2.5 0 01-5 0" />
    </svg>
);
/* Futuristic Stars (Telegram Stars–style) */
const IconStar = () => (
    <svg className="icon-svg icon-svg--star" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);
/* Premium TON/Telegram Diamonds */
const IconDiamond = () => (
    <svg className="icon-svg icon-svg--diamond" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2L2 8l4 14h12l4-14L12 2z" /><path d="M12 2v20" /><path d="M2 8h20" /><path d="M6 22l6-14 6 14" />
    </svg>
);

/* X-style profile badges: id → { label, color, title (tooltip) } */
const BADGE_LABELS = {
    verified: { label: 'Verified', color: 'var(--accent-cyan)', title: 'Verified identity' },
    early_adopter: { label: 'Early Adopter', color: 'var(--accent-gold)', title: 'Joined in early phase' },
    top_donor: { label: 'Top Donor', color: 'var(--accent-magenta)', title: 'Top charity donor' },
    guild_leader: { label: 'Guild Leader', color: 'var(--accent-green)', title: 'Leads a guild' },
    top_leader: { label: 'Top Leader', color: 'var(--accent-gold)', title: 'Top by total score' },
    champion: { label: 'Champion', color: 'var(--accent-magenta)', title: 'Champion status' },
    diamond_holder: { label: 'Diamond Holder', color: 'var(--accent-cyan)', title: 'Holds TON ecosystem Diamonds' },
    university_graduate: { label: 'University Graduate', color: 'var(--accent-cyan)', title: 'Completed all University modules' },
    course_completion: { label: 'Course Completion', color: 'var(--accent-green)', title: 'Minted after completing at least one course' },
    full_course_completion_certificate: { label: 'Full Course Certificate', color: 'var(--accent-gold)', title: 'Minted after completing all courses' },
};

/* Short explanations for tabs (what brokers, arenas, guilds are) */
const BROKERS_EXPLANATION = 'Brokers are your AI agents that compete in 3D arenas. Each has stats (INT, SPD, RISK) and energy. They earn AIBA and NEUR from battles, can be combined to merge stats, minted as NFTs, or traded on the Market.';
const ARENAS_EXPLANATION = 'Arenas are battle modes where your broker competes. Choose prediction, simulation, strategyWars, arbitrage, or guildWars (requires a guild). Run a battle to earn AIBA, Stars, and sometimes Diamonds.';
const GUILDS_EXPLANATION = 'Guilds (groups) let you team up with others: create or join a group, deposit brokers into the shared pool, and compete in Guild Wars. Top leaders create free; others can pay TON to create. Boost a guild with TON to give it benefits.';

const TAB_LIST = [
    { id: 'home', label: 'Home', Icon: IconHome },
    { id: 'leaderboard', label: 'Leaderboard', Icon: IconLeaderboard },
    { id: 'brokers', label: 'Brokers', Icon: IconBrokers },
    { id: 'market', label: 'Market', Icon: IconMarket },
    { id: 'carRacing', label: 'Car Racing', Icon: IconCar },
    { id: 'bikeRacing', label: 'Bike Racing', Icon: IconBike },
    { id: 'multiverse', label: 'Multiverse', Icon: IconMultiverse },
    { id: 'arenas', label: 'Arenas', Icon: IconArena },
    { id: 'guilds', label: 'Guilds', Icon: IconGuilds },
    { id: 'charity', label: 'Charity', Icon: IconHeart },
    { id: 'university', label: 'University', Icon: IconUniversity },
    { id: 'realms', label: 'Realms', Icon: IconWorld },
    { id: 'assets', label: 'Assets', Icon: IconAsset },
    { id: 'governance', label: 'Governance', Icon: IconGov },
    { id: 'updates', label: 'Updates', Icon: IconUpdates },
    { id: 'wallet', label: 'Wallet', Icon: IconWallet },
];

function uuid() {
    try {
        return crypto.randomUUID();
    } catch {
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}

export default function HomePage() {
    const wallet = useTonWallet();
    const [tonConnectUI] = useTonConnectUI();
    const api = useMemo(() => createApi(BACKEND_URL), []);

    const [status, setStatus] = useState('');
    const [brokers, setBrokers] = useState([]);
    const [selectedBrokerId, setSelectedBrokerId] = useState('');
    const [combineBaseId, setCombineBaseId] = useState('');
    const [combineSacrificeId, setCombineSacrificeId] = useState('');
    const [combineMsg, setCombineMsg] = useState('');
    const [arena, setArena] = useState('prediction');
    const [battle, setBattle] = useState(null);
    const [busy, setBusy] = useState(false);
    const [claimStatus, setClaimStatus] = useState('');
    const [lastClaim, setLastClaim] = useState(null);
    const [claimAmount, setClaimAmount] = useState(''); // empty => claim all credits
    const [autoClaimOnBattle, setAutoClaimOnBattle] = useState(false);
    const [vaultInfo, setVaultInfo] = useState(null);
    const [ad, setAd] = useState(null);
    const [economyMe, setEconomyMe] = useState(null);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [tab, setTab] = useState('home');
    const [dailyStatus, setDailyStatus] = useState(null);
    const [showCinematicIntro, setShowCinematicIntro] = useState(false);
    const [mintNftMsg, setMintNftMsg] = useState('');
    const [realms, setRealms] = useState([]);
    const [selectedRealmKey, setSelectedRealmKey] = useState('');
    const [missions, setMissions] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [mentorStakes, setMentorStakes] = useState([]);
    const [mentorStakeAmount, setMentorStakeAmount] = useState('');
    const [mentorStakeMentorId, setMentorStakeMentorId] = useState('');
    const [assets, setAssets] = useState([]);
    const [marketListings, setMarketListings] = useState([]);
    const [assetCategory, setAssetCategory] = useState('agent');
    const [assetName, setAssetName] = useState('');
    const [listingPrice, setListingPrice] = useState('');
    const [proposalTitle, setProposalTitle] = useState('');
    const [proposalDescription, setProposalDescription] = useState('');

    // Leaderboard
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardBy, setLeaderboardBy] = useState('score');
    async function refreshLeaderboard() {
        setBusy(true);
        try {
            const res = await api.get('/api/leaderboard', { params: { by: leaderboardBy, limit: 100 } });
            setLeaderboard(Array.isArray(res.data) ? res.data : []);
        } catch {
            setLeaderboard([]);
        } finally {
            setBusy(false);
        }
    }

    // Marketplace
    const [listings, setListings] = useState([]);
    const [systemBrokers, setSystemBrokers] = useState([]);
    const [listPriceAIBA, setListPriceAIBA] = useState('');
    const [listBrokerId, setListBrokerId] = useState('');
    const [marketMsg, setMarketMsg] = useState('');
    async function refreshListings() {
        setBusy(true);
        try {
            const [listRes, sysRes] = await Promise.all([
                api.get('/api/marketplace/listings').catch(() => ({ data: [] })),
                api.get('/api/marketplace/system-brokers').catch(() => ({ data: [] })),
            ]);
            setListings(Array.isArray(listRes.data) ? listRes.data : []);
            setSystemBrokers(Array.isArray(sysRes.data) ? sysRes.data : []);
        } catch {
            setListings([]);
            setSystemBrokers([]);
        } finally {
            setBusy(false);
        }
    }
    async function buySystemBroker(catalogId) {
        setBusy(true);
        setMarketMsg('');
        try {
            await api.post('/api/marketplace/buy-system-broker', { catalogId });
            setMarketMsg('Broker purchased from system.');
            await refreshBrokers();
            await refreshListings();
            await refreshEconomy();
        } catch (e) {
            setMarketMsg(getErrorMessage(e, 'Purchase failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function listBroker() {
        if (!listBrokerId || !listPriceAIBA.trim()) return;
        setBusy(true);
        setMarketMsg('');
        try {
            await api.post('/api/marketplace/list', { brokerId: listBrokerId, priceAIBA: Number(listPriceAIBA) });
            setMarketMsg('Listed.');
            setListPriceAIBA('');
            setListBrokerId('');
            await refreshListings();
            await refreshBrokers();
        } catch {
            setMarketMsg('List failed (already listed? withdraw from guild first?).');
        } finally {
            setBusy(false);
        }
    }
    async function buyListing(listingId) {
        setBusy(true);
        setMarketMsg('');
        try {
            await api.post('/api/marketplace/buy', { requestId: uuid(), listingId });
            setMarketMsg('Purchased.');
            await refreshListings();
            await refreshBrokers();
            await refreshEconomy();
        } catch (e) {
            setMarketMsg(getErrorMessage(e, 'Buy failed.'));
        } finally {
            setBusy(false);
        }
    }

    // Stars Store (Marketplace): buy Stars with AIBA or TON. TON → Super Admin STARS_STORE_WALLET.
    const [starsStoreConfig, setStarsStoreConfig] = useState(null);
    const [starsStoreMsg, setStarsStoreMsg] = useState('');
    const [starsStoreTxHash, setStarsStoreTxHash] = useState('');
    async function refreshStarsStoreConfig() {
        try {
            const res = await api.get('/api/stars-store/config');
            setStarsStoreConfig(res.data || null);
        } catch {
            setStarsStoreConfig(null);
        }
    }
    async function buyStarsWithAiba() {
        setBusy(true);
        setStarsStoreMsg('');
        try {
            const res = await api.post('/api/stars-store/buy-with-aiba', { requestId: uuid() });
            setStarsStoreMsg(`Purchased ${res.data?.starsReceived ?? 0} Stars.`);
            await refreshEconomy();
            await refreshStarsStoreConfig();
        } catch (e) {
            setStarsStoreMsg(getErrorMessage(e, 'Purchase failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function buyStarsWithTon() {
        if (!starsStoreTxHash.trim()) return;
        setBusy(true);
        setStarsStoreMsg('');
        try {
            const res = await api.post('/api/stars-store/buy-with-ton', { txHash: starsStoreTxHash.trim() });
            setStarsStoreMsg(`Purchased ${res.data?.starsReceived ?? 0} Stars.`);
            setStarsStoreTxHash('');
            await refreshEconomy();
            await refreshStarsStoreConfig();
        } catch (e) {
            setStarsStoreMsg(getErrorMessage(e, 'Purchase failed.'));
        } finally {
            setBusy(false);
        }
    }

    // Create broker with TON (pay 1–10 TON → auto-listed on marketplace)
    const [createBrokerTxHash, setCreateBrokerTxHash] = useState('');
    const [createBrokerMsg, setCreateBrokerMsg] = useState('');
    async function createBrokerWithTon() {
        if (!createBrokerTxHash.trim()) return;
        setBusy(true);
        setCreateBrokerMsg('');
        try {
            const res = await api.post('/api/brokers/create-with-ton', { txHash: createBrokerTxHash.trim() });
            setCreateBrokerMsg(res.data?.message || 'Broker created and listed.');
            setCreateBrokerTxHash('');
            await refreshBrokers();
            await refreshListings();
            await refreshEconomy();
        } catch (e) {
            setCreateBrokerMsg(getErrorMessage(e, 'Create failed.'));
        } finally {
            setBusy(false);
        }
    }

    // Boost profile with TON
    const [profileBoostTxHash, setProfileBoostTxHash] = useState('');
    const [profileBoostMsg, setProfileBoostMsg] = useState('');
    async function buyProfileBoostWithTon() {
        if (!profileBoostTxHash.trim()) return;
        setBusy(true);
        setProfileBoostMsg('');
        try {
            await api.post('/api/boosts/buy-profile-with-ton', { txHash: profileBoostTxHash.trim() });
            setProfileBoostMsg('Profile boosted.');
            setProfileBoostTxHash('');
            await refreshEconomy();
        } catch (e) {
            setProfileBoostMsg(getErrorMessage(e, 'Boost failed.'));
        } finally {
            setBusy(false);
        }
    }

    // Gifts (send with TON; received/sent lists)
    const [giftTo, setGiftTo] = useState('');
    const [giftTxHash, setGiftTxHash] = useState('');
    const [giftMessage, setGiftMessage] = useState('');
    const [giftMsg, setGiftMsg] = useState('');
    const [giftsReceived, setGiftsReceived] = useState([]);
    const [giftsSent, setGiftsSent] = useState([]);
    async function refreshGifts() {
        try {
            const [rec, sent] = await Promise.all([
                api.get('/api/gifts/received'),
                api.get('/api/gifts/sent'),
            ]);
            setGiftsReceived(Array.isArray(rec.data) ? rec.data : []);
            setGiftsSent(Array.isArray(sent.data) ? sent.data : []);
        } catch {
            setGiftsReceived([]);
            setGiftsSent([]);
        }
    }
    async function sendGift() {
        if (!giftTxHash.trim() || !giftTo.trim()) return;
        setBusy(true);
        setGiftMsg('');
        try {
            const body = { txHash: giftTxHash.trim(), message: giftMessage.trim().slice(0, 200) };
            if (/^\d+$/.test(giftTo.trim())) body.toTelegramId = giftTo.trim();
            else body.toUsername = giftTo.trim().replace(/^@/, '');
            await api.post('/api/gifts/send', body);
            setGiftMsg('Gift sent.');
            setGiftTo('');
            setGiftTxHash('');
            setGiftMessage('');
            await refreshGifts();
        } catch (e) {
            setGiftMsg(getErrorMessage(e, 'Send failed.'));
        } finally {
            setBusy(false);
        }
    }

    // NFT Multiverse: universes, my NFTs, stake/unstake, claim staking rewards
    const [multiverseUniverses, setMultiverseUniverses] = useState([]);
    const [multiverseMyNfts, setMultiverseMyNfts] = useState([]);
    const [multiverseStakingRewards, setMultiverseStakingRewards] = useState(null);
    const [multiverseMsg, setMultiverseMsg] = useState('');
    const [nftStakingRewardPerDay, setNftStakingRewardPerDay] = useState(5);
    async function refreshMultiverse() {
        try {
            const [uRes, meRes, rewardsRes] = await Promise.all([
                api.get('/api/multiverse/universes'),
                api.get('/api/multiverse/me'),
                api.get('/api/multiverse/staking/rewards'),
            ]);
            setMultiverseUniverses(Array.isArray(uRes.data?.universes) ? uRes.data.universes : []);
            setNftStakingRewardPerDay(Number(uRes.data?.nftStakingRewardPerDayAiba) || 5);
            setMultiverseMyNfts(Array.isArray(meRes.data?.nfts) ? meRes.data.nfts : []);
            setMultiverseStakingRewards(rewardsRes.data || null);
        } catch {
            setMultiverseUniverses([]);
            setMultiverseMyNfts([]);
            setMultiverseStakingRewards(null);
        }
    }
    async function stakeNft(brokerId) {
        setBusy(true);
        setMultiverseMsg('');
        try {
            await api.post('/api/multiverse/stake', { brokerId });
            setMultiverseMsg('NFT staked. Earn AIBA daily.');
            await refreshMultiverse();
        } catch (e) {
            setMultiverseMsg(getErrorMessage(e, 'Stake failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function unstakeNft(brokerId) {
        setBusy(true);
        setMultiverseMsg('');
        try {
            await api.post('/api/multiverse/unstake', { brokerId });
            setMultiverseMsg('Unstaked.');
            await refreshMultiverse();
        } catch (e) {
            setMultiverseMsg(getErrorMessage(e, 'Unstake failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function claimNftStaking() {
        setBusy(true);
        setMultiverseMsg('');
        try {
            const res = await api.post('/api/multiverse/staking/claim', { requestId: uuid() });
            setMultiverseMsg(`Claimed ${res.data?.claimedAiba ?? 0} AIBA.`);
            await refreshMultiverse();
            await refreshEconomy();
        } catch (e) {
            setMultiverseMsg(getErrorMessage(e, 'Claim failed.'));
        } finally {
            setBusy(false);
        }
    }

    // Car Racing
    const [carRacingConfig, setCarRacingConfig] = useState(null);
    const [carTracks, setCarTracks] = useState([]);
    const [carRaces, setCarRaces] = useState([]);
    const [myCars, setMyCars] = useState([]);
    const [carListings, setCarListings] = useState([]);
    const [carLeaderboard, setCarLeaderboard] = useState([]);
    const [systemCars, setSystemCars] = useState([]);
    const [carMsg, setCarMsg] = useState('');
    const [carCreateTxHash, setCarCreateTxHash] = useState('');
    const [carEnterRaceId, setCarEnterRaceId] = useState('');
    const [carEnterCarId, setCarEnterCarId] = useState('');
    async function refreshCarRacing() {
        try {
            const [config, tracks, races, cars, listings, leaderboard, systemCars] = await Promise.all([
                api.get('/api/car-racing/config').then((r) => r.data).catch(() => null),
                api.get('/api/car-racing/tracks').then((r) => r.data).catch(() => []),
                api.get('/api/car-racing/races').then((r) => r.data).catch(() => []),
                api.get('/api/car-racing/cars').then((r) => r.data).catch(() => []),
                api.get('/api/car-racing/listings').then((r) => r.data).catch(() => []),
                api.get('/api/car-racing/leaderboard').then((r) => r.data).catch(() => []),
                api.get('/api/car-racing/system-cars').then((r) => r.data).catch(() => []),
            ]);
            setCarRacingConfig(config);
            setCarTracks(Array.isArray(tracks) ? tracks : []);
            setCarRaces(Array.isArray(races) ? races : []);
            setMyCars(Array.isArray(cars) ? cars : []);
            setCarListings(Array.isArray(listings) ? listings : []);
            setCarLeaderboard(Array.isArray(leaderboard) ? leaderboard : []);
            setSystemCars(Array.isArray(systemCars) ? systemCars : []);
        } catch {
            setCarRaces([]);
            setMyCars([]);
        }
    }
    async function buySystemCar(catalogId) {
        setBusy(true);
        setCarMsg('');
        try {
            await api.post('/api/car-racing/buy-system-car', { catalogId });
            setCarMsg('Car purchased from system.');
            await refreshCarRacing();
            await refreshEconomy();
        } catch (e) {
            setCarMsg(getErrorMessage(e, 'Purchase failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function createCarAiba() {
        setBusy(true);
        setCarMsg('');
        try {
            await api.post('/api/car-racing/create', { requestId: uuid() });
            setCarMsg('Car created.');
            await refreshCarRacing();
            await refreshEconomy();
        } catch (e) {
            setCarMsg(getErrorMessage(e, 'Create failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function createCarTon() {
        if (!carCreateTxHash.trim()) return;
        setBusy(true);
        setCarMsg('');
        try {
            await api.post('/api/car-racing/create-with-ton', { txHash: carCreateTxHash.trim() });
            setCarMsg('Car created.');
            setCarCreateTxHash('');
            await refreshCarRacing();
        } catch (e) {
            setCarMsg(getErrorMessage(e, 'Create failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function enterCarRace() {
        if (!carEnterRaceId || !carEnterCarId) return;
        setBusy(true);
        setCarMsg('');
        try {
            await api.post('/api/car-racing/enter', { requestId: uuid(), raceId: carEnterRaceId, carId: carEnterCarId });
            setCarMsg('Entered race.');
            setCarEnterRaceId('');
            setCarEnterCarId('');
            await refreshCarRacing();
            await refreshEconomy();
        } catch (e) {
            setCarMsg(getErrorMessage(e, 'Enter failed.'));
        } finally {
            setBusy(false);
        }
    }

    // Bike Racing
    const [bikeRacingConfig, setBikeRacingConfig] = useState(null);
    const [bikeTracks, setBikeTracks] = useState([]);
    const [bikeRaces, setBikeRaces] = useState([]);
    const [myBikes, setMyBikes] = useState([]);
    const [bikeListings, setBikeListings] = useState([]);
    const [bikeLeaderboard, setBikeLeaderboard] = useState([]);
    const [systemBikes, setSystemBikes] = useState([]);
    const [bikeMsg, setBikeMsg] = useState('');
    const [bikeCreateTxHash, setBikeCreateTxHash] = useState('');
    const [bikeEnterRaceId, setBikeEnterRaceId] = useState('');
    const [bikeEnterBikeId, setBikeEnterBikeId] = useState('');
    async function refreshBikeRacing() {
        try {
            const [config, tracks, races, bikes, listings, leaderboard, systemBikes] = await Promise.all([
                api.get('/api/bike-racing/config').then((r) => r.data).catch(() => null),
                api.get('/api/bike-racing/tracks').then((r) => r.data).catch(() => []),
                api.get('/api/bike-racing/races').then((r) => r.data).catch(() => []),
                api.get('/api/bike-racing/bikes').then((r) => r.data).catch(() => []),
                api.get('/api/bike-racing/listings').then((r) => r.data).catch(() => []),
                api.get('/api/bike-racing/leaderboard').then((r) => r.data).catch(() => []),
                api.get('/api/bike-racing/system-bikes').then((r) => r.data).catch(() => []),
            ]);
            setBikeRacingConfig(config);
            setBikeTracks(Array.isArray(tracks) ? tracks : []);
            setBikeRaces(Array.isArray(races) ? races : []);
            setMyBikes(Array.isArray(bikes) ? bikes : []);
            setBikeListings(Array.isArray(listings) ? listings : []);
            setBikeLeaderboard(Array.isArray(leaderboard) ? leaderboard : []);
            setSystemBikes(Array.isArray(systemBikes) ? systemBikes : []);
        } catch {
            setBikeRaces([]);
            setMyBikes([]);
        }
    }
    async function createBikeAiba() {
        setBusy(true);
        setBikeMsg('');
        try {
            await api.post('/api/bike-racing/create', { requestId: uuid() });
            setBikeMsg('Bike created.');
            await refreshBikeRacing();
            await refreshEconomy();
        } catch (e) {
            setBikeMsg(getErrorMessage(e, 'Create failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function createBikeTon() {
        if (!bikeCreateTxHash.trim()) return;
        setBusy(true);
        setBikeMsg('');
        try {
            await api.post('/api/bike-racing/create-with-ton', { txHash: bikeCreateTxHash.trim() });
            setBikeMsg('Bike created.');
            setBikeCreateTxHash('');
            await refreshBikeRacing();
        } catch (e) {
            setBikeMsg(getErrorMessage(e, 'Create failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function enterBikeRace() {
        if (!bikeEnterRaceId || !bikeEnterBikeId) return;
        setBusy(true);
        setBikeMsg('');
        try {
            await api.post('/api/bike-racing/enter', { requestId: uuid(), raceId: bikeEnterRaceId, bikeId: bikeEnterBikeId });
            setBikeMsg('Entered race.');
            setBikeEnterRaceId('');
            setBikeEnterBikeId('');
            await refreshBikeRacing();
            await refreshEconomy();
        } catch (e) {
            setBikeMsg(getErrorMessage(e, 'Enter failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function buySystemBike(catalogId) {
        setBusy(true);
        setBikeMsg('');
        try {
            await api.post('/api/bike-racing/buy-system-bike', { catalogId });
            setBikeMsg('Bike purchased from system.');
            await refreshBikeRacing();
            await refreshEconomy();
        } catch (e) {
            setBikeMsg(getErrorMessage(e, 'Purchase failed.'));
        } finally {
            setBusy(false);
        }
    }

    // Boosts
    const [boosts, setBoosts] = useState([]);
    const [boostMsg, setBoostMsg] = useState('');
    async function refreshBoosts() {
        try {
            const res = await api.get('/api/boosts/mine');
            setBoosts(Array.isArray(res.data) ? res.data : []);
        } catch {
            setBoosts([]);
        }
    }
    async function buyBoost() {
        setBusy(true);
        setBoostMsg('');
        try {
            await api.post('/api/boosts/buy', { requestId: uuid() });
            setBoostMsg('Boost activated.');
            await refreshBoosts();
            await refreshEconomy();
        } catch {
            setBoostMsg('Buy failed (insufficient NEUR?).');
        } finally {
            setBusy(false);
        }
    }

    // Staking
    const [stakingSummary, setStakingSummary] = useState(null);
    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [stakeMsg, setStakeMsg] = useState('');
    async function refreshStaking() {
        try {
            const res = await api.get('/api/staking/summary');
            setStakingSummary(res.data || null);
        } catch {
            setStakingSummary(null);
        }
    }
    async function stake() {
        const amt = Number(stakeAmount);
        if (!Number.isFinite(amt) || amt <= 0) return;
        setBusy(true);
        setStakeMsg('');
        try {
            await api.post('/api/staking/stake', { requestId: uuid(), amount: amt });
            setStakeMsg('Staked.');
            setStakeAmount('');
            await refreshStaking();
            await refreshEconomy();
        } catch {
            setStakeMsg('Stake failed (insufficient AIBA?).');
        } finally {
            setBusy(false);
        }
    }
    async function unstake() {
        const amt = Number(unstakeAmount);
        if (!Number.isFinite(amt) || amt <= 0) return;
        setBusy(true);
        setStakeMsg('');
        try {
            await api.post('/api/staking/unstake', { requestId: uuid(), amount: amt });
            setStakeMsg('Unstaked.');
            setUnstakeAmount('');
            await refreshStaking();
            await refreshEconomy();
        } catch {
            setStakeMsg('Unstake failed.');
        } finally {
            setBusy(false);
        }
    }
    async function claimStaking() {
        setBusy(true);
        setStakeMsg('');
        try {
            const res = await api.post('/api/staking/claim', { requestId: uuid() });
            setStakeMsg(res.data?.claimed ? `Claimed ${res.data.claimed} AIBA.` : 'No reward yet.');
            await refreshStaking();
            await refreshEconomy();
        } catch {
            setStakeMsg('Claim failed.');
        } finally {
            setBusy(false);
        }
    }

    // DAO
    const [proposals, setProposals] = useState([]);
    const [daoMsg, setDaoMsg] = useState('');
    const [newProposalTitle, setNewProposalTitle] = useState('');
    const [newProposalDesc, setNewProposalDesc] = useState('');
    async function refreshProposals() {
        setBusy(true);
        try {
            const res = await api.get('/api/dao/proposals');
            setProposals(Array.isArray(res.data) ? res.data : []);
        } catch {
            setProposals([]);
        } finally {
            setBusy(false);
        }
    }
    async function voteProposal(proposalId, support) {
        setDaoMsg('');
        try {
            await api.post('/api/dao/vote', { proposalId, support });
            setDaoMsg('Vote recorded.');
            await refreshProposals();
        } catch {
            setDaoMsg('Vote failed.');
        }
    }
    async function createProposal() {
        if (!newProposalTitle.trim()) return;
        setBusy(true);
        setDaoMsg('');
        try {
            await api.post('/api/dao/proposals', { title: newProposalTitle.trim(), description: newProposalDesc.trim() });
            setDaoMsg('Proposal created.');
            setNewProposalTitle('');
            setNewProposalDesc('');
            await refreshProposals();
        } catch {
            setDaoMsg('Create failed.');
        } finally {
            setBusy(false);
        }
    }

    function pickWeightedAd(list) {
        const items = Array.isArray(list) ? list : [];
        const weights = items.map((a) => Math.max(0, Number(a.weight ?? 1) || 0));
        const total = weights.reduce((s, w) => s + w, 0);
        if (!items.length || total <= 0) return null;
        let r = Math.random() * total;
        for (let i = 0; i < items.length; i++) {
            r -= weights[i];
            if (r <= 0) return items[i];
        }
        return items[items.length - 1];
    }

    async function refreshAd() {
        try {
            const res = await api.get('/api/ads', { params: { placement: 'between_battles' } });
            const list = Array.isArray(res.data) ? res.data : [];
            setAd(pickWeightedAd(list));
        } catch {
            setAd(null);
        }
    }

    async function refreshBrokers() {
        setBusy(true);
        try {
            const res = await api.get('/api/brokers/mine');
            const list = Array.isArray(res.data) ? res.data : [];
            setBrokers(list);
            if (!selectedBrokerId && list[0]?._id) setSelectedBrokerId(list[0]._id);
        } finally {
            setBusy(false);
        }
    }

    async function refreshEconomy() {
        try {
            const res = await api.get('/api/economy/me');
            setEconomyMe(res.data || null);
        } catch {
            setEconomyMe(null);
        }
    }

    async function refreshDailyStatus() {
        try {
            const res = await api.get('/api/daily/status');
            setDailyStatus(res.data || null);
        } catch {
            setDailyStatus(null);
        }
    }
    async function claimDaily() {
        setBusy(true);
        try {
            const res = await api.post('/api/daily/claim');
            await refreshDailyStatus();
            await refreshEconomy();
            if (res.data?.neurReward) setStatus(`Daily claimed: ${res.data.neurReward} NEUR.`);
        } catch {
            setStatus('Daily claim failed.');
        } finally {
            setBusy(false);
        }
    }
    async function mintNftBroker() {
        if (!selectedBrokerId) return;
        setBusy(true);
        setMintNftMsg('');
        try {
            await api.post('/api/brokers/mint-nft', { requestId: uuid(), brokerId: selectedBrokerId });
            setMintNftMsg('Mint job queued. NFT will be linked when ready.');
            await refreshEconomy();
        } catch (e) {
            setMintNftMsg(getErrorMessage(e, 'Mint failed.'));
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        refreshBrokers().catch(() => {});
        refreshEconomy().catch(() => {});
        refreshDailyStatus().catch(() => {});
        try {
            if (typeof localStorage !== 'undefined' && !localStorage.getItem('aiba_cinematic_seen')) {
                setShowCinematicIntro(true);
            } else if (!localStorage.getItem('aiba_tutorial_done')) {
                setTutorialStep(1);
            }
        } catch {
            // ignore
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (tab === 'leaderboard') refreshLeaderboard().catch(() => {});
        if (tab === 'guilds') refreshMyRank().catch(() => {});
        if (tab === 'charity') refreshCharityAll();
        if (tab === 'university') refreshUniversity();
        if (tab === 'updates') refreshUpdatesAll();
        if (tab === 'market') { refreshListings().catch(() => {}); refreshStarsStoreConfig().catch(() => {}); }
        if (tab === 'carRacing') refreshCarRacing().catch(() => {});
        if (tab === 'bikeRacing') refreshBikeRacing().catch(() => {});
        if (tab === 'multiverse') refreshMultiverse().catch(() => {});
        if (tab === 'realms') { refreshRealms().catch(() => {}); refreshMissions(selectedRealmKey).catch(() => {}); refreshMentors().catch(() => {}); }
        if (tab === 'assets') { refreshAssets().catch(() => {}); refreshMarketListings().catch(() => {}); }
        if (tab === 'governance') { refreshProposals().catch(() => {}); }
        if (tab === 'wallet') { refreshGifts().catch(() => {}); refreshStarsStoreConfig().catch(() => {}); }
        // Seamless UX: scroll active panel into view when tab changes
        const el = document.querySelector('.tab-content');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    useEffect(() => {
        if (!battle) return;
        refreshAd().catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [battle?._id]);

    useEffect(() => {
        if (!wallet?.account?.address) return;

        setStatus('Saving wallet…');
        api.post('/api/wallet/connect', {
            address: wallet.account.address,
        })
            .then(() => setStatus('Wallet connected.'))
            .catch(() => setStatus('Failed to save wallet (backend not running?).'));
    }, [wallet, api]);

    async function createStarterBroker() {
        setBusy(true);
        setStatus('');
        try {
            await api.post('/api/brokers/starter', {});
            await refreshBrokers();
            setStatus('Starter broker created.');
        } catch (e) {
            const isNetworkError = e?.code === 'ERR_NETWORK' || e?.message === 'Network Error';
            if (isNetworkError) {
                setStatus(`Backend unreachable at ${BACKEND_URL}. Start it: cd backend && npm start`);
            } else {
                setStatus(getErrorMessage(e, 'Failed to create broker.'));
            }
        } finally {
            setBusy(false);
        }
    }

    async function combineBrokers() {
        if (!combineBaseId || !combineSacrificeId) return;
        setBusy(true);
        setCombineMsg('');
        try {
            await api.post('/api/brokers/combine', {
                requestId: uuid(),
                baseBrokerId: combineBaseId,
                sacrificeBrokerId: combineSacrificeId,
            });
            setCombineMsg('Brokers combined.');
            setCombineBaseId('');
            setCombineSacrificeId('');
            await refreshBrokers();
            await refreshEconomy();
        } catch (e) {
            setCombineMsg(getErrorMessage(e, 'Combine failed (insufficient NEUR?).'));
        } finally {
            setBusy(false);
        }
    }

    async function runBattle() {
        if (!selectedBrokerId) {
            setStatus('Select a broker first.');
            return;
        }
        setBusy(true);
        try {
            setClaimStatus('');
            const res = await api.post('/api/battle/run', {
                requestId: uuid(),
                brokerId: selectedBrokerId,
                arena,
                league: 'rookie',
                autoClaim: autoClaimOnBattle,
            });
            setBattle(res.data);
            const c = res.data?.claim?.vaultAddress ? res.data.claim : null;
            setLastClaim(c);
            await refreshEconomy();
        } catch {
            setStatus('Battle failed. Is backend running and APP_ENV=dev set?');
        } finally {
            setBusy(false);
        }
    }

    // ----- Guilds (Groups) -----
    const [guilds, setGuilds] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [selectedGuildId, setSelectedGuildId] = useState('');
    const [newGuildName, setNewGuildName] = useState('');
    const [newGuildBio, setNewGuildBio] = useState('');
    const [createGroupTxHash, setCreateGroupTxHash] = useState('');
    const [joinGuildId, setJoinGuildId] = useState('');
    const [guildMsg, setGuildMsg] = useState('');
    const [myRank, setMyRank] = useState(null);
    const [boostGuildId, setBoostGuildId] = useState('');
    const [boostTxHash, setBoostTxHash] = useState('');
    const [boostGroupMsg, setBoostGroupMsg] = useState('');

    async function refreshMyRank() {
        try {
            const res = await api.get('/api/leaderboard/my-rank');
            setMyRank(res.data || null);
        } catch {
            setMyRank(null);
        }
    }

    async function refreshAllGroups() {
        setBusy(true);
        try {
            const res = await api.get('/api/guilds/list', { params: { limit: 200 } });
            setAllGroups(Array.isArray(res.data) ? res.data : []);
        } catch {
            setAllGroups([]);
        } finally {
            setBusy(false);
        }
    }

    async function refreshGuilds() {
        setBusy(true);
        try {
            const res = await api.get('/api/guilds/mine');
            const list = Array.isArray(res.data) ? res.data : [];
            setGuilds(list);
            if (!selectedGuildId && list[0]?._id) setSelectedGuildId(list[0]._id);
        } catch {
            setGuilds([]);
        } finally {
            setBusy(false);
        }
    }

    async function createGuild() {
        if (!newGuildName.trim()) return;
        setBusy(true);
        setGuildMsg('');
        try {
            const topFree = Number(economyMe?.economy?.leaderboardTopFreeCreate ?? 50);
            const needPayment = myRank && myRank.rank > topFree;
            const body = { name: newGuildName.trim(), bio: newGuildBio.trim() };
            if (needPayment && createGroupTxHash.trim()) body.txHash = createGroupTxHash.trim();
            const res = await api.post('/api/guilds/create', body);
            setGuildMsg(`Created group ${res.data?.name || ''}`);
            setNewGuildName('');
            setNewGuildBio('');
            setCreateGroupTxHash('');
            await refreshGuilds();
            await refreshAllGroups();
        } catch (e) {
            setGuildMsg(getErrorMessage(e, 'Create failed (name taken? pay TON if not top leader?).'));
        } finally {
            setBusy(false);
        }
    }

    async function boostGuild(guildId, txHash) {
        if (!guildId || !txHash?.trim()) return;
        setBoostGroupMsg('');
        try {
            await api.post(`/api/guilds/${guildId}/boost`, { txHash: txHash.trim() });
            setBoostGroupMsg('Group boosted.');
            setBoostGuildId('');
            setBoostTxHash('');
            await refreshAllGroups();
            await refreshGuilds();
        } catch (e) {
            setBoostGroupMsg(getErrorMessage(e, 'Boost failed.'));
        }
    }

    async function joinGuild() {
        setBusy(true);
        setGuildMsg('');
        try {
            await api.post('/api/guilds/join', { guildId: joinGuildId });
            setGuildMsg('Joined guild.');
            setJoinGuildId('');
            await refreshGuilds();
        } catch {
            setGuildMsg('Join failed (guildId wrong?).');
        } finally {
            setBusy(false);
        }
    }

    async function depositBrokerToGuild() {
        if (!selectedGuildId || !selectedBrokerId) return;
        setBusy(true);
        setGuildMsg('');
        try {
            await api.post('/api/guilds/deposit-broker', { guildId: selectedGuildId, brokerId: selectedBrokerId });
            setGuildMsg('Broker deposited into guild pool.');
            await refreshBrokers();
        } catch {
            setGuildMsg('Deposit failed.');
        } finally {
            setBusy(false);
        }
    }

    async function withdrawBrokerFromGuild() {
        if (!selectedGuildId || !selectedBrokerId) return;
        setBusy(true);
        setGuildMsg('');
        try {
            await api.post('/api/guilds/withdraw-broker', { guildId: selectedGuildId, brokerId: selectedBrokerId });
            setGuildMsg('Broker withdrawn from guild pool.');
            await refreshBrokers();
        } catch {
            setGuildMsg('Withdraw failed.');
        } finally {
            setBusy(false);
        }
    }

    // ----- Charity (Unite for Good) -----
    const [charityCampaigns, setCharityCampaigns] = useState([]);
    const [charityStats, setCharityStats] = useState(null);
    const [charityMyImpact, setCharityMyImpact] = useState(null);
    const [charityLeaderboard, setCharityLeaderboard] = useState([]);
    const [charityLeaderboardBy, setCharityLeaderboardBy] = useState('impact');
    const [donateCampaignId, setDonateCampaignId] = useState('');
    const [donateNeur, setDonateNeur] = useState('');
    const [donateAiba, setDonateAiba] = useState('');
    const [donateMessage, setDonateMessage] = useState('');
    const [donateAnonymous, setDonateAnonymous] = useState(false);
    const [charityMsg, setCharityMsg] = useState('');
    async function refreshCharityCampaigns() {
        try {
            const res = await api.get('/api/charity/campaigns', { params: { limit: 50 } });
            setCharityCampaigns(Array.isArray(res.data) ? res.data : []);
        } catch {
            setCharityCampaigns([]);
        }
    }
    async function refreshCharityStats() {
        try {
            const res = await api.get('/api/charity/stats');
            setCharityStats(res.data || null);
        } catch {
            setCharityStats(null);
        }
    }
    async function refreshCharityMyImpact() {
        try {
            const res = await api.get('/api/charity/my-impact');
            setCharityMyImpact(res.data || null);
        } catch {
            setCharityMyImpact(null);
        }
    }
    async function refreshCharityLeaderboard() {
        setBusy(true);
        try {
            const res = await api.get('/api/charity/leaderboard', { params: { by: charityLeaderboardBy, limit: 30 } });
            setCharityLeaderboard(Array.isArray(res.data) ? res.data : []);
        } catch {
            setCharityLeaderboard([]);
        } finally {
            setBusy(false);
        }
    }
    function refreshCharityAll() {
        refreshCharityCampaigns();
        refreshCharityStats();
        refreshCharityMyImpact();
        refreshCharityLeaderboard();
    }

    // ----- Updates (Unified Comms) -----
    const [announcements, setAnnouncements] = useState([]);
    const [commsStatus, setCommsStatus] = useState(null);
    async function refreshAnnouncements() {
        try {
            const res = await api.get('/api/announcements', { params: { limit: 20 } });
            setAnnouncements(Array.isArray(res.data) ? res.data : []);
        } catch {
            setAnnouncements([]);
        }
    }
    async function refreshCommsStatus() {
        try {
            const res = await api.get('/api/comms/status');
            setCommsStatus(res.data || null);
        } catch {
            setCommsStatus(null);
        }
    }
    function refreshUpdatesAll() {
        refreshAnnouncements();
        refreshCommsStatus();
    }

    const [universityCourses, setUniversityCourses] = useState([]);
    const [universityTotalModules, setUniversityTotalModules] = useState(0);
    const [universityProgress, setUniversityProgress] = useState(null);
    const [universityMintInfo, setUniversityMintInfo] = useState(null);
    const [universityExpandedCourseId, setUniversityExpandedCourseId] = useState('');
    const [universityExpandedModuleKey, setUniversityExpandedModuleKey] = useState('');
    const [universityBadgeTxHash, setUniversityBadgeTxHash] = useState('');
    const [universityCertificateTxHash, setUniversityCertificateTxHash] = useState('');
    const [universityMintMsg, setUniversityMintMsg] = useState('');
    async function refreshUniversity() {
        try {
            const res = await api.get('/api/university/courses');
            const data = res.data;
            const list = Array.isArray(data?.courses) ? data.courses : (Array.isArray(data) ? data : []);
            setUniversityCourses(list);
            setUniversityTotalModules(Number(data?.totalModules) || list.reduce((n, c) => n + (c.modules?.length || 0), 0));
        } catch {
            setUniversityCourses([]);
            setUniversityTotalModules(0);
        }
        try {
            const prog = await api.get('/api/university/progress');
            setUniversityProgress(prog.data || null);
        } catch {
            setUniversityProgress(null);
        }
        try {
            const mintRes = await api.get('/api/university/mint-course-badge-info');
            setUniversityMintInfo(mintRes.data || null);
        } catch {
            setUniversityMintInfo(null);
        }
    }
    async function mintCourseBadge() {
        const tx = universityBadgeTxHash.trim();
        if (!tx) { setUniversityMintMsg('Enter TON transaction hash.'); return; }
        setUniversityMintMsg('');
        setBusy(true);
        try {
            await api.post('/api/university/mint-course-badge', { txHash: tx });
            setUniversityMintMsg('Course Completion badge minted.');
            setUniversityBadgeTxHash('');
            await refreshUniversity();
            await refreshEconomy();
        } catch (e) {
            setUniversityMintMsg(getErrorMessage(e, 'Mint failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function mintFullCertificate() {
        const tx = universityCertificateTxHash.trim();
        if (!tx) { setUniversityMintMsg('Enter TON transaction hash.'); return; }
        setUniversityMintMsg('');
        setBusy(true);
        try {
            await api.post('/api/university/mint-full-certificate', { txHash: tx });
            setUniversityMintMsg('Full Course Completion Certificate minted.');
            setUniversityCertificateTxHash('');
            await refreshUniversity();
            await refreshEconomy();
        } catch (e) {
            setUniversityMintMsg(getErrorMessage(e, 'Mint failed.'));
        } finally {
            setBusy(false);
        }
    }
    function toggleUniversityCourse(courseId) {
        setUniversityExpandedCourseId((prev) => (prev === courseId ? '' : courseId));
        if (universityExpandedCourseId === courseId) setUniversityExpandedModuleKey('');
    }
    async function toggleUniversityModule(courseId, moduleId, key) {
        setUniversityExpandedModuleKey((prev) => (prev === key ? '' : key));
        const isOpening = universityExpandedModuleKey !== key;
        if (isOpening && courseId && moduleId) {
            try {
                await api.post('/api/university/progress', { courseId, moduleId });
                const prog = await api.get('/api/university/progress');
                setUniversityProgress(prog.data || null);
                if (prog.data?.graduate) await refreshEconomyMe();
            } catch {
                // ignore
            }
        }
    }

    async function refreshRealms() {
        try {
            const res = await api.get('/api/realms');
            const list = Array.isArray(res.data?.realms) ? res.data.realms : [];
            setRealms(list);
            if (!selectedRealmKey && list[0]?.key) {
                setSelectedRealmKey(list[0].key);
                refreshMissions(list[0].key).catch(() => {});
            }
        } catch {
            setRealms([]);
        }
    }
    async function refreshMissions(realmKey) {
        try {
            const res = await api.get('/api/missions', { params: { realmKey } });
            setMissions(Array.isArray(res.data?.missions) ? res.data.missions : []);
        } catch {
            setMissions([]);
        }
    }
    async function refreshMentors() {
        try {
            const res = await api.get('/api/mentors');
            setMentors(Array.isArray(res.data?.mentors) ? res.data.mentors : []);
        } catch {
            setMentors([]);
        }
    }
    async function refreshMentorStakes() {
        try {
            const res = await api.get('/api/mentors/stakes');
            setMentorStakes(Array.isArray(res.data?.stakes) ? res.data.stakes : []);
        } catch {
            setMentorStakes([]);
        }
    }
    async function refreshAssets() {
        try {
            const res = await api.get('/api/assets/mine');
            setAssets(Array.isArray(res.data?.assets) ? res.data.assets : []);
        } catch {
            setAssets([]);
        }
    }
    async function refreshMarketListings() {
        try {
            const res = await api.get('/api/asset-marketplace/listings');
            setMarketListings(Array.isArray(res.data?.listings) ? res.data.listings : []);
        } catch {
            setMarketListings([]);
        }
    }
    async function refreshProposals() {
        try {
            const res = await api.get('/api/governance/proposals');
            setProposals(Array.isArray(res.data?.proposals) ? res.data.proposals : []);
        } catch {
            setProposals([]);
        }
    }
    async function assignMentor(mentorId) {
        setBusy(true);
        try {
            await api.post('/api/mentors/assign', { mentorId });
            setStatus('Mentor assigned.');
        } catch (e) {
            setStatus(getErrorMessage(e, 'Mentor assignment failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function stakeMentorOffchain() {
        if (!mentorStakeMentorId || !mentorStakeAmount) return;
        setBusy(true);
        try {
            await api.post('/api/mentors/stake', { mentorId: mentorStakeMentorId, amountAiba: mentorStakeAmount });
            setMentorStakeAmount('');
            setStatus('Mentor staked.');
            await refreshMentorStakes();
            await refreshEconomy();
        } catch (e) {
            setStatus(getErrorMessage(e, 'Stake failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function unstakeMentor(stakeId) {
        setBusy(true);
        try {
            await api.post('/api/mentors/unstake', { stakeId });
            setStatus('Unstaked.');
            await refreshMentorStakes();
            await refreshEconomy();
        } catch (e) {
            setStatus(getErrorMessage(e, 'Unstake failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function stakeMentorOffchain() {
        if (!mentorStakeMentorId || !mentorStakeAmount) return;
        setBusy(true);
        try {
            await api.post('/api/mentors/stake', { mentorId: mentorStakeMentorId, amountAiba: mentorStakeAmount });
            setMentorStakeAmount('');
            setStatus('Mentor staked.');
            await refreshMentorStakes();
            await refreshEconomy();
        } catch (e) {
            setStatus(getErrorMessage(e, 'Stake failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function unstakeMentor(stakeId) {
        setBusy(true);
        try {
            await api.post('/api/mentors/unstake', { stakeId });
            setStatus('Unstaked.');
            await refreshMentorStakes();
            await refreshEconomy();
        } catch (e) {
            setStatus(getErrorMessage(e, 'Unstake failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function completeMission(missionId) {
        setBusy(true);
        try {
            const res = await api.post('/api/missions/complete', { missionId });
            if (res.data?.rewardAiba || res.data?.rewardNeur) {
                setStatus(`Mission complete: +${res.data.rewardAiba || 0} AIBA, +${res.data.rewardNeur || 0} NEUR`);
            }
            await refreshEconomy();
        } catch (e) {
            setStatus(getErrorMessage(e, 'Mission completion failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function mintAsset() {
        setBusy(true);
        try {
            const res = await api.post('/api/assets/mint', {
                category: assetCategory,
                name: assetName.trim(),
                realmKey: selectedRealmKey,
            });
            setAssetName('');
            await refreshAssets();
            await refreshEconomy();
            if (res.data?.asset) setStatus('Asset minted.');
        } catch (e) {
            setStatus(getErrorMessage(e, 'Asset mint failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function upgradeAsset(assetId) {
        setBusy(true);
        try {
            await api.post('/api/assets/upgrade', { assetId });
            await refreshAssets();
            await refreshEconomy();
        } catch (e) {
            setStatus(getErrorMessage(e, 'Asset upgrade failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function listAsset(assetId) {
        const price = Math.floor(Number(listingPrice) || 0);
        if (!price) return;
        setBusy(true);
        try {
            await api.post('/api/asset-marketplace/list', { assetId, priceAiba: price, listingType: 'secondary_sale' });
            setListingPrice('');
            await refreshMarketListings();
        } catch (e) {
            setStatus(getErrorMessage(e, 'Listing failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function buyListing(listingId) {
        setBusy(true);
        try {
            await api.post('/api/asset-marketplace/buy', { listingId });
            await refreshMarketListings();
            await refreshAssets();
            await refreshEconomy();
        } catch (e) {
            setStatus(getErrorMessage(e, 'Buy failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function rentListing(listingId) {
        setBusy(true);
        try {
            await api.post('/api/asset-marketplace/rent', { listingId, durationHours: 24 });
            await refreshMarketListings();
            await refreshEconomy();
        } catch (e) {
            setStatus(getErrorMessage(e, 'Rent failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function propose() {
        setBusy(true);
        try {
            await api.post('/api/governance/propose', {
                title: proposalTitle.trim(),
                description: proposalDescription.trim(),
                actions: [],
            });
            setProposalTitle('');
            setProposalDescription('');
            await refreshProposals();
        } catch (e) {
            setStatus(getErrorMessage(e, 'Proposal failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function voteOnProposal(proposalId, vote) {
        setBusy(true);
        try {
            await api.post('/api/governance/vote', { proposalId, vote });
            await refreshProposals();
        } catch (e) {
            setStatus(getErrorMessage(e, 'Vote failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function onchainBuyListing(listingId) {
        if (!wallet?.account?.address) {
            setStatus('Connect wallet first.');
            return;
        }
        setBusy(true);
        try {
            const res = await api.get('/api/asset-marketplace/onchain-info', { params: { listingId } });
            const info = res.data || {};
            if (!info.escrowJettonWallet || !info.escrowAddress) {
                setStatus('On-chain escrow not configured.');
                return;
            }

            const forwardCell = buildListingForwardPayload(info.listingId);
            const payload = buildJettonTransferPayload({
                destination: info.escrowAddress,
                responseAddress: wallet.account.address,
                amount: String(info.priceAiba || 0),
                forwardPayloadCell: forwardCell,
            });

            await tonConnectUI.sendTransaction({
                validUntil: Math.floor(Date.now() / 1000) + 300,
                messages: [
                    {
                        address: info.escrowJettonWallet,
                        amount: '50000000', // 0.05 TON for jetton transfer gas
                        payload,
                    },
                ],
            });
            setStatus('On-chain buy sent. Finalize in escrow if required.');
        } catch (e) {
            setStatus(e?.message || 'On-chain buy failed.');
        } finally {
            setBusy(false);
        }
    }

    async function onchainStakeMentor(amountAiba) {
        if (!wallet?.account?.address) {
            setStatus('Connect wallet first.');
            return;
        }
        setBusy(true);
        try {
            const res = await api.get('/api/mentors/stake-info');
            const info = res.data || {};
            if (!info.vaultAddress || !info.vaultJettonWallet) {
                setStatus('Mentor staking vault not configured.');
                return;
            }

            const payload = buildJettonTransferPayload({
                destination: info.vaultAddress,
                responseAddress: wallet.account.address,
                amount: String(amountAiba || 0),
            });

            await tonConnectUI.sendTransaction({
                validUntil: Math.floor(Date.now() / 1000) + 300,
                messages: [
                    {
                        address: info.vaultJettonWallet,
                        amount: '50000000', // 0.05 TON for jetton transfer gas
                        payload,
                    },
                ],
            });
            setStatus('On-chain mentor stake sent.');
        } catch (e) {
            setStatus(e?.message || 'On-chain stake failed.');
        } finally {
            setBusy(false);
        }
    }

    async function donateCharity() {
        const cId = donateCampaignId.trim();
        const neur = Math.floor(Number(donateNeur) || 0);
        const aiba = Math.floor(Number(donateAiba) || 0);
        if (!cId || (neur <= 0 && aiba <= 0)) {
            setCharityMsg('Select a campaign and enter NEUR and/or AIBA.');
            return;
        }
        setBusy(true);
        setCharityMsg('');
        try {
            await api.post('/api/charity/donate', {
                campaignId: cId,
                amountNeur: neur,
                amountAiba: aiba,
                message: donateMessage.trim().slice(0, 500),
                anonymous: donateAnonymous,
                requestId: uuid(),
            });
            setCharityMsg('Thank you! Your donation was recorded.');
            setDonateNeur('');
            setDonateAiba('');
            setDonateMessage('');
            await refreshCharityAll();
            await refreshEconomy();
        } catch (e) {
            setCharityMsg(getErrorMessage(e, 'Donation failed.'));
        } finally {
            setBusy(false);
        }
    }

    // ----- Referrals -----
    const [myReferral, setMyReferral] = useState(null);
    const [refCodeInput, setRefCodeInput] = useState('');
    const [refMsg, setRefMsg] = useState('');

    async function createReferral() {
        setBusy(true);
        setRefMsg('');
        try {
            const res = await api.post('/api/referrals/create', {});
            setMyReferral(res.data || null);
            setRefMsg('Referral code created.');
        } catch {
            setRefMsg('Could not create referral code.');
        } finally {
            setBusy(false);
        }
    }

    async function useReferral() {
        setBusy(true);
        setRefMsg('');
        try {
            const res = await api.post('/api/referrals/use', { code: refCodeInput });
            const r = res.data?.neurReward;
            const a = res.data?.aibaReward;
            const bonus = r ? ` NEUR: you ${r.referee || 0}, referrer ${r.referrer || 0}.` : '';
            const aibaBonus = a ? ` AIBA: you ${a.referee || 0}, referrer ${a.referrer || 0}.` : '';
            setRefMsg(`Referral applied.${bonus}${aibaBonus}`);
        } catch {
            setRefMsg('Referral failed (already used? wallet required? invalid code?).');
        } finally {
            setBusy(false);
        }
    }

    async function refreshVaultInventory() {
        setBusy(true);
        try {
            const res = await api.get('/api/vault/inventory');
            setVaultInfo(res.data);
        } catch {
            setVaultInfo(null);
            setStatus('Could not read vault inventory (configure TON_PROVIDER_URL/TON_API_KEY on backend).');
        } finally {
            setBusy(false);
        }
    }

    async function requestAibaClaim() {
        if (!wallet?.account?.address) {
            setStatus('Connect wallet first.');
            return;
        }
        setBusy(true);
        try {
            setStatus('Creating claim…');
            setClaimStatus('');

            const body = { requestId: uuid() };
            const amt = claimAmount.trim();
            if (amt) body.amount = Number(amt);

            const res = await api.post('/api/economy/claim-aiba', body);
            const claim = res.data?.claim?.vaultAddress ? res.data.claim : null;
            setLastClaim(claim);
            await refreshEconomy();
            if (claim) setStatus('Claim created.');
            else setStatus('No claim created.');
        } catch {
            setStatus('Could not create claim (backend not configured or insufficient AIBA?).');
        } finally {
            setBusy(false);
        }
    }

    async function checkClaimStatus() {
        const claim = lastClaim;
        if (!claim?.vaultAddress) return;

        setBusy(true);
        try {
            const res = await api.get('/api/vault/claim-status', {
                params: {
                    to: claim.toAddress,
                    seqno: String(claim.seqno),
                    validUntil: String(claim.validUntil),
                    amount: String(claim.amount || '0'),
                },
            });

            const s = String(res.data?.status || '');
            if (s === 'confirmed') setClaimStatus('Claim confirmed on-chain.');
            else if (s === 'pending') setClaimStatus('Pending on-chain confirmation…');
            else if (s === 'expired') setClaimStatus('Claim expired. Run a new battle to get a fresh claim.');
            else if (s === 'insufficient_inventory')
                setClaimStatus('Vault inventory too low to pay this claim. Try later.');
            else if (s === 'insufficient_ton')
                setClaimStatus('Vault has insufficient TON for gas. Ask admin to top it up.');
            else setClaimStatus('Unknown claim status.');
        } catch {
            setClaimStatus('Could not read vault status (configure TON_PROVIDER_URL/TON_API_KEY on backend).');
        } finally {
            setBusy(false);
        }
    }

    async function claimOnChain() {
        const claim = lastClaim;
        if (!claim?.vaultAddress) {
            setStatus('No claim yet. Create a claim first.');
            return;
        }
        if (!wallet?.account?.address) {
            setStatus('Connect wallet first.');
            return;
        }
        if (String(wallet.account.address) !== String(claim.toAddress)) {
            setStatus('Connected wallet does not match claim recipient. Reconnect the correct wallet.');
            return;
        }
        if (claim.validUntil && Math.floor(Date.now() / 1000) > Number(claim.validUntil)) {
            setStatus('Claim expired. Run a new battle to get a fresh claim.');
            return;
        }
        if (vaultInfo?.jettonBalance) {
            try {
                const bal = BigInt(vaultInfo.jettonBalance);
                const amt = BigInt(claim.amount);
                if (amt > bal) {
                    setStatus('Vault inventory is too low to pay this claim. Top up the vault.');
                    return;
                }
            } catch {
                // ignore parsing errors
            }
        }

        setBusy(true);
        try {
            setClaimStatus('');

            // Preflight (best-effort) status check
            try {
                const pre = await api.get('/api/vault/claim-status', {
                    params: {
                        to: claim.toAddress,
                        seqno: String(claim.seqno),
                        validUntil: String(claim.validUntil),
                        amount: String(claim.amount || '0'),
                    },
                });
                const s = String(pre.data?.status || '');
                if (s === 'expired') {
                    setStatus('Claim expired. Run a new battle.');
                    return;
                }
                if (s === 'insufficient_inventory') {
                    setStatus('Vault inventory too low to pay this claim.');
                    return;
                }
                if (s === 'insufficient_ton') {
                    setStatus('Vault has insufficient TON for gas. Ask admin to top it up.');
                    return;
                }
                if (s === 'confirmed') {
                    setClaimStatus('Already confirmed on-chain.');
                    return;
                }
            } catch {
                // ignore
            }

            const payload = buildRewardClaimPayload({
                toAddress: claim.toAddress,
                amount: claim.amount,
                seqno: claim.seqno,
                validUntil: claim.validUntil,
                signatureBase64: claim.signatureBase64,
            });

            await tonConnectUI.sendTransaction({
                validUntil: Math.floor(Date.now() / 1000) + 5 * 60,
                messages: [
                    {
                        address: claim.vaultAddress,
                        amount: '70000000', // 0.07 TON
                        payload,
                    },
                ],
            });

            setStatus('Claim transaction sent.');

            const start = Date.now();
            while (Date.now() - start < 60_000) {
                await new Promise((r) => setTimeout(r, 2500));
                try {
                    const res = await api.get('/api/vault/claim-status', {
                        params: {
                            to: claim.toAddress,
                            seqno: String(claim.seqno),
                            validUntil: String(claim.validUntil),
                            amount: String(claim.amount || '0'),
                        },
                    });
                    const s = String(res.data?.status || '');
                    if (s === 'confirmed') {
                        setClaimStatus('Claim confirmed on-chain.');
                        return;
                    }
                    if (s === 'expired') {
                        setClaimStatus('Claim expired.');
                        return;
                    }
                    if (s === 'insufficient_inventory') {
                        setClaimStatus('Vault inventory too low to pay.');
                        return;
                    }
                    if (s === 'insufficient_ton') {
                        setClaimStatus('Vault has insufficient TON for gas.');
                        return;
                    }
                    setClaimStatus('Pending on-chain confirmation…');
                } catch {
                    setClaimStatus('Pending (cannot read vault status).');
                }
            }

            setClaimStatus('Not confirmed yet (try again).');
        } catch {
            setStatus('Claim failed / rejected in wallet.');
        } finally {
            setBusy(false);
        }
    }

    const tutorialSteps = [
        { title: 'Welcome', text: 'Pick a broker (or create one). Then choose an arena and run a battle.' },
        { title: 'Arena', text: 'Prediction, simulation, arbitrage, guild wars—each has different rewards.' },
        { title: 'Battle', text: 'Run battle to compete. You earn NEUR and AIBA.' },
        { title: 'Next', text: 'Stake AIBA, mint NFTs, join groups, claim on-chain. Good luck!' },
    ];

    return (
        <div className="aiba-app">
            {showCinematicIntro ? (
                <div className="cinematic">
                    <div className="cinematic__inner">
                        <h1 className="cinematic__title">AI BROKER ARENA</h1>
                        <p className="cinematic__sub">Own AI brokers. Compete in 3D arenas. Earn NEUR &amp; AIBA.</p>
                        <p className="cinematic__hint">Swipe the tab bar to explore Home, Brokers, Market, Racing, and more.</p>
                        <button
                            type="button"
                            className="cinematic__enter"
                            onClick={() => {
                                try {
                                    localStorage.setItem('aiba_cinematic_seen', '1');
                                } catch {}
                                setShowCinematicIntro(false);
                                if (typeof localStorage !== 'undefined' && !localStorage.getItem('aiba_tutorial_done')) {
                                    setTutorialStep(1);
                                }
                            }}
                        >
                            Enter
                        </button>
                    </div>
                </div>
            ) : null}
            {tutorialStep >= 1 && tutorialStep <= 4 ? (
                <div className="tutorial-overlay">
                    <div className="tutorial-card">
                        <div className="tutorial-card__title">
                            <span className="guide-step" aria-hidden>{tutorialStep}</span>
                            {tutorialSteps[tutorialStep - 1]?.title || 'Tutorial'}
                        </div>
                        <div className="tutorial-card__text">
                            {tutorialSteps[tutorialStep - 1]?.text || ''}
                        </div>
                        <div className="tutorial-card__actions">
                            {tutorialStep < 4 ? (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn--secondary"
                                        onClick={() => setTutorialStep(0)}
                                    >
                                        Skip
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn--primary"
                                        onClick={() => setTutorialStep((s) => s + 1)}
                                    >
                                        Next
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn--success"
                                    onClick={() => {
                                        try {
                                            localStorage.setItem('aiba_tutorial_done', '1');
                                        } catch {
                                            // ignore
                                        }
                                        setTutorialStep(0);
                                    }}
                                >
                                    Done
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
            <header className="app-header">
                <div className="app-header__brand">
                    <h1 className="aiba-app__title">AIBA Arena</h1>
                </div>
                <div className="app-header__wallet">
                    {wallet ? (
                        <TonConnectButton />
                    ) : (
                        <button
                            type="button"
                            className="btn btn--primary connect-wallet-btn"
                            onClick={() => tonConnectUI?.openModal?.()}
                            aria-label="Connect TON wallet"
                        >
                            <IconWallet />
                            <span>Connect Wallet</span>
                        </button>
                    )}
                </div>
                {IS_DEV ? (
                    <p className="aiba-app__sub" style={{ marginTop: 4 }}>
                        Backend: {BACKEND_URL}
                        <span style={{ display: 'block', marginTop: 2, color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            Connect Wallet: works best on deployed HTTPS app. On localhost use a wallet extension or ngrok.
                        </span>
                    </p>
                ) : null}
                {status ? <p className={`status-msg ${status.toLowerCase().includes('fail') ? 'status-msg--error' : ''}`} style={{ margin: 0, width: '100%' }}>{status}</p> : null}
            </header>

            <div className="balance-strip" style={{ marginTop: 0, marginBottom: 8 }}>
                {Array.isArray(economyMe?.badges) && economyMe.badges.includes('verified') ? (
                    <span className="balance-strip__verified" title="Verified">✓</span>
                ) : null}
                <span className="balance-strip__label">NEUR</span>
                <span className="balance-strip__value balance-strip__value--neur">{Number(economyMe?.neurBalance ?? 0)}</span>
                <span className="balance-strip__label">AIBA</span>
                <span className="balance-strip__value balance-strip__value--aiba">{Number(economyMe?.aibaBalance ?? 0)}</span>
                <span className="balance-strip__label balance-strip__label--star" title="Telegram Stars–style in-app currency"><IconStar /></span>
                <span className="balance-strip__value balance-strip__value--stars">{Number(economyMe?.starsBalance ?? 0)}</span>
                <span className="balance-strip__label balance-strip__label--diamond" title="TON ecosystem premium asset"><IconDiamond /></span>
                <span className="balance-strip__value balance-strip__value--diamonds">{Number(economyMe?.diamondsBalance ?? 0)}</span>
                <label className="check-wrap" style={{ marginLeft: 'auto', marginTop: 0 }}>
                    <input type="checkbox" checked={autoClaimOnBattle} onChange={(e) => setAutoClaimOnBattle(Boolean(e.target.checked))} />
                    Auto-claim
                </label>
            </div>

            <div className="hero-center hero-center--compact" aria-hidden="false">
                <h2 className="hero-center__title">AI BROKER ARENA</h2>
                <p className="hero-center__sub">Own AI brokers. Compete in 3D arenas. Earn NEUR &amp; AIBA.</p>
                <p className="hero-center__hint">Swipe the tab bar to explore Home, Brokers, Market, Racing, and more.</p>
                <button
                    type="button"
                    className="hero-center__enter hero-center__enter--btn"
                    onClick={() => document.querySelector('.tab-content')?.scrollIntoView({ behavior: 'smooth' })}
                    aria-label="Scroll to content"
                >
                    Enter
                </button>
            </div>

            <nav className="nav-hub" aria-label="Main navigation">
                <div className="nav-hub__grid">
                    {TAB_LIST.map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            type="button"
                            className={`nav-hub__btn ${tab === id ? 'nav-hub__btn--active' : ''}`}
                            onClick={() => { setTab(id); }}
                            aria-pressed={tab === id}
                            aria-label={label}
                        >
                            <span className="nav-hub__icon"><Icon /></span>
                            <span className="nav-hub__label">{label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            <p className="guide-tip" style={{ marginTop: 0 }}>
                {tab === 'home' ? 'Pick a broker and arena, then hit Run battle to earn.' :
                 tab === 'leaderboard' ? 'Global ranks by score, AIBA, NEUR, or battles. Run battles to climb.' :
                 tab === 'brokers' ? 'Merge two brokers or mint one as NFT.' :
                 tab === 'arenas' ? 'Choose arena and run battle. Guild Wars needs a guild.' :
                 tab === 'guilds' ? 'Create or join a group; deposit brokers to the pool.' :
                 tab === 'market' ? 'Sell a broker for AIBA or buy one. Withdraw from guild first to list.' :
                 tab === 'carRacing' ? 'Autonomous car racing. Create a car (AIBA or TON), enter races, earn AIBA by position.' :
                 tab === 'bikeRacing' ? 'Autonomous bike racing. Create a bike (AIBA or TON), enter races, earn AIBA.' :
                 tab === 'multiverse' ? 'Own, stake & earn. Mint Broker NFTs with AIBA; stake to earn AIBA daily.' :
                 tab === 'charity' ? 'Unite for Good. Donate NEUR or AIBA to active campaigns.' :
                 tab === 'university' ? 'Learn the game. Courses and modules right here.' :
                 tab === 'realms' ? 'Explore AI Realms and complete missions to earn rewards.' :
                 tab === 'assets' ? 'Mint, upgrade, list, buy, and rent AI assets.' :
                 tab === 'governance' ? 'Propose and vote on ecosystem changes.' :
                 tab === 'updates' ? 'Stay informed. Announcements, status & support here.' :
                 'Daily NEUR, stake AIBA, or claim on-chain after a battle.'}
            </p>

            <div className="tab-content">
                {/* ─── Home ───────────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'home' ? 'is-active' : ''}`} aria-hidden={tab !== 'home'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                        <div className="card__title">What are brokers?</div>
                        <p className="card__hint">{BROKERS_EXPLANATION}</p>
                    </div>
                    <div className="action-row">
                        <button type="button" className="btn btn--secondary" onClick={createStarterBroker} disabled={busy}><IconBrokers /> New broker</button>
                        <button type="button" className="btn btn--secondary" onClick={refreshBrokers} disabled={busy}><IconRefresh /> Refresh</button>
                        <button type="button" className="btn btn--primary" onClick={runBattle} disabled={busy || !selectedBrokerId}><IconRun /> Run battle</button>
                        <button type="button" className="btn btn--secondary" onClick={refreshVaultInventory} disabled={busy}><IconVault /> Vault</button>
                    </div>
                    {vaultInfo ? (
                        <div className="card card--elevated">
                            <div className="card__title">Vault</div>
                            <p className="card__hint" style={{ wordBreak: 'break-all' }}>Address: {vaultInfo.vaultAddress}</p>
                            <p className="card__hint">TON (nano): {vaultInfo.tonBalanceNano} · Jetton: {vaultInfo.jettonBalance}</p>
                        </div>
                    ) : null}
                    <div className="card card--elevated">
                        <div className="card__title">Arena & battle</div>
                        <p className="card__hint">Pick broker and arena, then Run battle above.</p>
                        {brokers.length === 0 ? (
                            <p className="guide-tip">No brokers. Create a starter broker above.</p>
                        ) : (
                            <select className="select" value={selectedBrokerId} onChange={(e) => setSelectedBrokerId(e.target.value)} style={{ marginTop: 6, minWidth: '100%' }}>
                                {brokers.map((b) => (
                                    <option key={b._id} value={b._id}>#{b._id.slice(-6)} INT{b.intelligence} SPD{b.speed} RISK{b.risk} · energy {b.energy}</option>
                                ))}
                            </select>
                        )}
                        <p className="card__hint" style={{ marginTop: 10 }}>Arena</p>
                        <select className="select" value={arena} onChange={(e) => setArena(e.target.value)} style={{ marginTop: 4, minWidth: '100%' }}>
                            <option value="prediction">prediction</option>
                            <option value="simulation">simulation</option>
                            <option value="strategyWars">strategyWars</option>
                            <option value="arbitrage">arbitrage</option>
                            <option value="guildWars">guildWars</option>
                        </select>
                        {arena === 'guildWars' ? <p className="guide-tip">Guild Wars requires a guild. Rewards go to guild treasury.</p> : null}
                    </div>
                    {battle ? (
                        <div className="card card--elevated">
                            <div className="card__title">Battle result</div>
                            <div className="victory-card">
                                <div className="victory-card__badge">Victory</div>
                                <div className="victory-card__score">Score {battle.score}</div>
                                <div className="victory-card__meta">
                                {arena} · {Number(battle.rewardAiba ?? 0)} AIBA
                                {Number(battle.starsGranted ?? 0) > 0 ? ` · +${battle.starsGranted} Stars` : ''}
                                {Number(battle.firstWinDiamond ?? 0) > 0 ? ` · +${battle.firstWinDiamond} Diamond (first win!)` : ''}
                            </div>
                                <button type="button" className="btn btn--primary" onClick={() => { const text = `My broker scored ${battle.score} in ${arena}! Reward: ${battle.rewardAiba} AIBA.`; const url = window?.location?.href || ''; navigator?.share?.({ title: 'AIBA Arena', text, url }).catch(() => {}); navigator?.clipboard?.writeText?.(text + ' ' + url); }}><IconShare /> Share</button>
                            </div>
                            {ad?.imageUrl ? (
                                <div className="ad-box">
                                    <div className="ad-box__label">Sponsored</div>
                                    <img src={ad.imageUrl} alt="ad" onClick={() => { const u = String(ad?.linkUrl || '').trim(); if (u) (window?.Telegram?.WebApp?.openLink || window.open)(u, '_blank'); }} />
                                    {ad.linkUrl ? <button type="button" className="btn btn--secondary" style={{ marginTop: 8 }} onClick={() => { const u = String(ad?.linkUrl || '').trim(); if (u) (window?.Telegram?.WebApp?.openLink || window.open)(u, '_blank'); }}>Open link</button> : null}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    <div className="card">
                        <div className="card__title">Referrals</div>
                        <p className="card__hint">Share your code or enter someone else&apos;s.</p>
                        <div className="action-row">
                            <button type="button" className="btn btn--secondary" onClick={createReferral} disabled={busy}><IconShare /> My code</button>
                        </div>
                        {myReferral?.code ? <p className="card__hint" style={{ marginTop: 8 }}>Your code: <strong style={{ color: 'var(--accent-cyan)' }}>{String(myReferral.code).toUpperCase()}</strong></p> : null}
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input className="input" value={refCodeInput} onChange={(e) => setRefCodeInput(e.target.value)} placeholder="Friend's code" style={{ flex: '1 1 180px' }} />
                            <button type="button" className="btn btn--primary" onClick={useReferral} disabled={busy || !refCodeInput.trim()}>Apply</button>
                        </div>
                        {refMsg ? <p className="status-msg status-msg--success" style={{ marginTop: 8 }}>{refMsg}</p> : null}
                    </div>
                    <div className="card">
                        <div className="card__title">Leaderboard</div>
                        <p className="card__hint">Global ranks by score, AIBA, NEUR, or battles.</p>
                        <div className="action-row">
                            <select className="select" value={leaderboardBy} onChange={(e) => setLeaderboardBy(e.target.value)}><option value="score">By score</option><option value="aiba">By AIBA</option><option value="neur">By NEUR</option><option value="battles">By battles</option></select>
                            <button type="button" className="btn btn--secondary" onClick={refreshLeaderboard} disabled={busy}><IconRefresh /> Refresh</button>
                        </div>
                        {leaderboard.length > 0 ? (
                            leaderboard.slice(0, 12).map((row, i) => (
                                <div key={row.telegramId || i} className="list-item">
                                    <span className="list-item__rank">#{row.rank}</span>
                                    <span className="list-item__name">
                                        {row.username || row.telegramId}
                                        {Array.isArray(row.badges) && row.badges.length > 0 ? (
                                            <span className="list-item__badges">
                                                {row.badges.slice(0, 3).map((badgeId) => {
                                                    const meta = BADGE_LABELS[badgeId] || { label: badgeId, color: 'var(--text-muted)' };
                                                    return (
                                                        <span key={badgeId} className="badge-pill badge-pill--inline" style={{ borderColor: meta.color, color: meta.color }} title={meta.title || meta.label}>{meta.label}</span>
                                                    );
                                                })}
                                            </span>
                                        ) : null}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>score {row.totalScore} · AIBA {row.totalAiba}</span>
                                </div>
                            ))
                        ) : <p className="guide-tip">Run battles to appear on the board.</p>}
                    </div>
                </section>

                {/* ─── Global Leaderboard ──────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'leaderboard' ? 'is-active' : ''}`} aria-hidden={tab !== 'leaderboard'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title">Global Leaderboard</div>
                        <p className="card__hint">Top players by score, AIBA, NEUR, or battles. Run battles to climb the ranks.</p>
                        <div className="action-row">
                            <select className="select" value={leaderboardBy} onChange={(e) => setLeaderboardBy(e.target.value)}><option value="score">By score</option><option value="aiba">By AIBA</option><option value="neur">By NEUR</option><option value="battles">By battles</option></select>
                            <button type="button" className="btn btn--primary" onClick={refreshLeaderboard} disabled={busy}><IconRefresh /> Refresh</button>
                        </div>
                        {leaderboard.length > 0 ? (
                            leaderboard.slice(0, 20).map((row, i) => (
                                <div key={row.telegramId || i} className="list-item">
                                    <span className="list-item__rank">#{row.rank}</span>
                                    <span className="list-item__name">
                                        {row.username || row.telegramId}
                                        {Array.isArray(row.badges) && row.badges.length > 0 ? (
                                            <span className="list-item__badges">
                                                {row.badges.slice(0, 3).map((badgeId) => {
                                                    const meta = BADGE_LABELS[badgeId] || { label: badgeId, color: 'var(--text-muted)' };
                                                    return (
                                                        <span key={badgeId} className="badge-pill badge-pill--inline" style={{ borderColor: meta.color, color: meta.color }} title={meta.title || meta.label}>{meta.label}</span>
                                                    );
                                                })}
                                            </span>
                                        ) : null}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>score {row.totalScore} · AIBA {row.totalAiba}</span>
                                </div>
                            ))
                        ) : <p className="guide-tip">Run battles to appear on the board. Tap Refresh to load.</p>}
                    </div>
                </section>

                {/* ─── Brokers ────────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'brokers' ? 'is-active' : ''}`} aria-hidden={tab !== 'brokers'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                        <div className="card__title">What are brokers?</div>
                        <p className="card__hint">{BROKERS_EXPLANATION}</p>
                    </div>
                    <div className="card card--elevated">
                        <div className="card__title">My brokers</div>
                        <p className="card__hint">Fight, combine two to merge stats, or mint as NFT.</p>
                        {brokers.length >= 2 ? (
                            <div className="card" style={{ marginTop: 10, padding: 12 }}>
                                <div className="card__title">Combine brokers</div>
                                <p className="card__hint">Base keeps stats + XP; sacrifice is removed. Cost: {Number(economyMe?.economy?.combineNeurCost ?? 50)} NEUR.</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                                    <select className="select" value={combineBaseId} onChange={(e) => setCombineBaseId(e.target.value)}><option value="">Base</option>{brokers.map((b) => <option key={b._id} value={b._id}>#{b._id.slice(-6)}</option>)}</select>
                                    <select className="select" value={combineSacrificeId} onChange={(e) => setCombineSacrificeId(e.target.value)}><option value="">Sacrifice</option>{brokers.filter((b) => b._id !== combineBaseId).map((b) => <option key={b._id} value={b._id}>#{b._id.slice(-6)}</option>)}</select>
                                    <button type="button" className="btn btn--primary" onClick={combineBrokers} disabled={busy || !combineBaseId || !combineSacrificeId}><IconBrokers /> Combine</button>
                                </div>
                                {combineMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{combineMsg}</p> : null}
                            </div>
                        ) : null}
                        {selectedBrokerId && brokers.find((b) => b._id === selectedBrokerId && !b.nftItemAddress) ? (
                            <div className="card" style={{ marginTop: 10 }}>
                                <div className="card__title">Mint as NFT</div>
                                <p className="card__hint">Cost: {Number(economyMe?.economy?.mintAibaCost ?? 100)} AIBA. Job queued.</p>
                                <button type="button" className="btn btn--secondary" onClick={mintNftBroker} disabled={busy}><IconMint /> Mint NFT</button>
                                {mintNftMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{mintNftMsg}</p> : null}
                            </div>
                        ) : null}
                        {brokers.length === 0 ? (
                            <p className="guide-tip">No brokers. Go to Home and create a starter broker.</p>
                        ) : (
                            <select className="select" value={selectedBrokerId} onChange={(e) => setSelectedBrokerId(e.target.value)} style={{ minWidth: '100%', marginTop: 6 }}>
                                {brokers.map((b) => (
                                    <option key={b._id} value={b._id}>#{b._id.slice(-6)} INT{b.intelligence} SPD{b.speed} RISK{b.risk} energy {b.energy}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </section>

                {/* ─── Arenas ─────────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'arenas' ? 'is-active' : ''}`} aria-hidden={tab !== 'arenas'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                        <div className="card__title">What are arenas?</div>
                        <p className="card__hint">{ARENAS_EXPLANATION}</p>
                    </div>
                    <div className="card card--elevated">
                        <div className="card__title">Arena</div>
                        <p className="card__hint">Choose battle mode. Guild Wars requires a guild.</p>
                        <select className="select" value={arena} onChange={(e) => setArena(e.target.value)} style={{ marginTop: 6, minWidth: '100%' }}>
                            <option value="prediction">prediction</option>
                            <option value="simulation">simulation</option>
                            <option value="strategyWars">strategyWars</option>
                            <option value="arbitrage">arbitrage</option>
                            <option value="guildWars">guildWars</option>
                        </select>
                        {arena === 'guildWars' ? <p className="guide-tip">Rewards go to guild treasury.</p> : null}
                    </div>
                    <div className="action-row">
                        <button type="button" className="btn btn--primary" onClick={runBattle} disabled={busy || !selectedBrokerId}><IconRun /> Run battle</button>
                        <button type="button" className="btn btn--secondary" onClick={refreshBrokers} disabled={busy}><IconRefresh /> Refresh</button>
                    </div>
                    {battle ? (
                        <div className="card card--elevated">
                            <div className="card__title">Battle result</div>
                            <div className="victory-card">
                                <div className="victory-card__badge">Victory</div>
                                <div className="victory-card__score">Score {battle.score}</div>
                                <div className="victory-card__meta">
                                    {arena} · {Number(battle.rewardAiba ?? 0)} AIBA
                                    {Number(battle.starsGranted ?? 0) > 0 ? <span className="victory-card__meta-stars"> · <IconStar /> +{battle.starsGranted} Stars</span> : ''}
                                    {Number(battle.firstWinDiamond ?? 0) > 0 ? <span className="victory-card__meta-diamond"> · <IconDiamond /> +{battle.firstWinDiamond} Diamond (first win!)</span> : ''}
                                </div>
                                <button type="button" className="btn btn--primary" onClick={() => { const text = `My broker scored ${battle.score} in ${arena}! Reward: ${battle.rewardAiba} AIBA.`; navigator?.share?.({ title: 'AIBA Arena', text, url: window?.location?.href }).catch(() => {}); }}><IconShare /> Share</button>
                            </div>
                        </div>
                    ) : null}
                </section>

                {/* ─── Guilds (Groups) — global leaderboard, pay-to-create, boost ────────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'guilds' ? 'is-active' : ''}`} aria-hidden={tab !== 'guilds'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                        <div className="card__title">What are guilds?</div>
                        <p className="card__hint">{GUILDS_EXPLANATION}</p>
                    </div>
                    <div className="card card--elevated">
                        <div className="card__title">Groups</div>
                        <p className="card__hint">Top leaders create free; others pay TON. All groups visible globally. Anyone can join or boost.</p>
                        <div className="action-row">
                            <button type="button" className="btn btn--secondary" onClick={() => { refreshMyRank(); refreshGuilds(); }} disabled={busy}><IconRefresh /> My rank</button>
                            <button type="button" className="btn btn--secondary" onClick={refreshAllGroups} disabled={busy}>Discover all</button>
                            <button type="button" className="btn btn--secondary" onClick={depositBrokerToGuild} disabled={busy || !selectedGuildId || !selectedBrokerId}>Deposit broker</button>
                            <button type="button" className="btn btn--secondary" onClick={withdrawBrokerFromGuild} disabled={busy || !selectedGuildId || !selectedBrokerId}>Withdraw broker</button>
                        </div>
                        {myRank ? (
                            <p className="guide-tip" style={{ marginTop: 8 }}>
                                Your leaderboard rank: <strong>#{myRank.rank}</strong> (score {myRank.totalScore}). Top {economyMe?.economy?.leaderboardTopFreeCreate ?? 50} create a group for free.
                            </p>
                        ) : null}
                        {guildMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{guildMsg}</p> : null}
                        <p className="card__hint" style={{ marginTop: 12 }}>My groups</p>
                        {guilds.length === 0 ? <p className="guide-tip">No groups. Create one or join below.</p> : (
                            <select className="select" value={selectedGuildId} onChange={(e) => setSelectedGuildId(e.target.value)} style={{ minWidth: '100%' }}>
                                {guilds.map((g) => <option key={g._id} value={g._id}>{g.name} (members {g.members?.length ?? 0}) — boosts {g.boostCount ?? 0}</option>)}
                            </select>
                        )}
                        <p className="card__hint" style={{ marginTop: 12 }}>Create group</p>
                        <input className="input" value={newGuildName} onChange={(e) => setNewGuildName(e.target.value)} placeholder="Name (3-24 chars)" />
                        <input className="input" value={newGuildBio} onChange={(e) => setNewGuildBio(e.target.value)} placeholder="Bio (optional)" style={{ marginTop: 8 }} />
                        {myRank && economyMe?.economy && myRank.rank > (economyMe.economy.leaderboardTopFreeCreate ?? 50) && Number(economyMe.economy.createGroupCostTonNano) > 0 ? (
                            <>
                                <p className="card__hint" style={{ marginTop: 8 }}>Pay {(economyMe.economy.createGroupCostTonNano / 1e9).toFixed(1)} TON to create (send to Leader Board wallet, then paste tx hash)</p>
                                <input className="input" value={createGroupTxHash} onChange={(e) => setCreateGroupTxHash(e.target.value)} placeholder="Payment tx hash" style={{ marginTop: 4 }} />
                            </>
                        ) : null}
                        <button type="button" className="btn btn--primary" onClick={createGuild} disabled={busy || !newGuildName.trim()} style={{ marginTop: 8 }}>Create</button>
                        <p className="card__hint" style={{ marginTop: 12 }}>Join group (paste Guild ID)</p>
                        <input className="input" value={joinGuildId} onChange={(e) => setJoinGuildId(e.target.value)} placeholder="Guild ID" style={{ marginTop: 4 }} />
                        <button type="button" className="btn btn--secondary" onClick={joinGuild} disabled={busy || !joinGuildId.trim()} style={{ marginTop: 8 }}>Join</button>
                    </div>
                    {allGroups.length > 0 ? (
                        <div className="card">
                            <div className="card__title">All groups worldwide</div>
                            <p className="card__hint">Join any group. Boost a group with TON to give it benefits.</p>
                            {allGroups.slice(0, 30).map((g) => (
                                <div key={g._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                        <span><strong>{g.name}</strong> — members {g.members?.length ?? 0}, boosts {g.boostCount ?? 0}</span>
                                        <button type="button" className="btn btn--secondary" onClick={() => setJoinGuildId(g._id)}>Join</button>
                                    </div>
                                    {Number(economyMe?.economy?.boostGroupCostTonNano) > 0 ? (
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                            <input className="input" value={boostGuildId === g._id ? boostTxHash : ''} onChange={(e) => { setBoostGuildId(g._id); setBoostTxHash(e.target.value); }} placeholder={`Tx hash (${(economyMe?.economy?.boostGroupCostTonNano / 1e9).toFixed(1)} TON)`} style={{ flex: '1 1 180px', minWidth: 0 }} />
                                            <button type="button" className="btn btn--primary" onClick={() => boostGuild(g._id, boostGuildId === g._id ? boostTxHash : '')} disabled={!(boostGuildId === g._id && boostTxHash.trim())}>Boost</button>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                            {boostGroupMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{boostGroupMsg}</p> : null}
                        </div>
                    ) : null}
                </section>

                {/* ─── Market ─────────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'market' ? 'is-active' : ''}`} aria-hidden={tab !== 'market'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                        <div className="card__title">What are brokers?</div>
                        <p className="card__hint">{BROKERS_EXPLANATION}</p>
                    </div>
                    {Number(economyMe?.economy?.createBrokerCostTonNano) > 0 ? (
                        <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                            <div className="card__title">Create your broker (pay TON)</div>
                            <p className="card__hint">Pay TON to create a new broker. It is automatically listed on the marketplace so everyone can see it — you get global recognition.</p>
                            <p className="card__hint" style={{ marginTop: 6 }}>Cost: <strong>{(economyMe.economy.createBrokerCostTonNano / 1e9).toFixed(1)} TON</strong>. Send exact amount to the wallet shown in the app, then paste the transaction hash below.</p>
                            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <input className="input" value={createBrokerTxHash} onChange={(e) => setCreateBrokerTxHash(e.target.value)} placeholder="Transaction hash (tx hash)" style={{ flex: '1 1 200px', minWidth: 0 }} />
                                <button type="button" className="btn btn--primary" onClick={createBrokerWithTon} disabled={busy || !createBrokerTxHash.trim()}><IconMint /> Create broker</button>
                            </div>
                            {createBrokerMsg ? <p className={`status-msg ${createBrokerMsg.includes('created') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{createBrokerMsg}</p> : null}
                        </div>
                    ) : null}
                    {starsStoreConfig?.enabled ? (
                        <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                            <div className="card__title">Stars Store</div>
                            <p className="card__hint">Buy Stars with AIBA or TON. Stars are in-app recognition currency (also earned from battles).</p>
                            <p className="card__hint" style={{ marginTop: 6 }}><strong>{starsStoreConfig.packStars} Stars</strong> per pack — {starsStoreConfig.packPriceAiba > 0 ? `${starsStoreConfig.packPriceAiba} AIBA` : ''}{starsStoreConfig.packPriceAiba > 0 && starsStoreConfig.packPriceTonNano > 0 ? ' or ' : ''}{starsStoreConfig.packPriceTonNano > 0 ? `${starsStoreConfig.packPriceTonFormatted} TON` : ''}</p>
                            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                {starsStoreConfig.packPriceAiba > 0 ? (
                                    <button type="button" className="btn btn--primary" onClick={buyStarsWithAiba} disabled={busy}><IconStar /> Buy with AIBA</button>
                                ) : null}
                                {starsStoreConfig.packPriceTonNano > 0 && starsStoreConfig.walletForTon ? (
                                    <>
                                        <span className="card__hint" style={{ margin: 0 }}>Or send {starsStoreConfig.packPriceTonFormatted} TON to the Stars Store wallet, then paste tx hash:</span>
                                        <input className="input" value={starsStoreTxHash} onChange={(e) => setStarsStoreTxHash(e.target.value)} placeholder="Transaction hash" style={{ flex: '1 1 200px', minWidth: 0 }} />
                                        <button type="button" className="btn btn--primary" onClick={buyStarsWithTon} disabled={busy || !starsStoreTxHash.trim()}>Buy with TON</button>
                                    </>
                                ) : null}
                            </div>
                            {starsStoreMsg ? <p className={`status-msg ${starsStoreMsg.includes('Purchased') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{starsStoreMsg}</p> : null}
                        </div>
                    ) : null}
                    <div className="card card--elevated">
                        <div className="card__title">Marketplace</div>
                        <p className="card__hint">Sell brokers for AIBA or buy from others.</p>
                        <div className="action-row">
                            <button type="button" className="btn btn--secondary" onClick={refreshListings} disabled={busy}><IconRefresh /> Refresh</button>
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span className="card__hint" style={{ margin: 0 }}>Sell:</span>
                            <select className="select" value={listBrokerId} onChange={(e) => setListBrokerId(e.target.value)}>
                                <option value="">Select broker</option>
                                {brokers.map((b) => <option key={b._id} value={b._id}>#{b._id.slice(-6)} INT{b.intelligence} SPD{b.speed} RISK{b.risk}</option>)}
                            </select>
                            <input className="input" value={listPriceAIBA} onChange={(e) => setListPriceAIBA(e.target.value)} placeholder="Price (AIBA)" style={{ width: 100 }} />
                            <button type="button" className="btn btn--primary" onClick={listBroker} disabled={busy || !listBrokerId || !listPriceAIBA.trim()}><IconList /> List</button>
                        </div>
                        {marketMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{marketMsg}</p> : null}
                        {listings.length > 0 ? (
                            listings.map((l) => (
                                <div key={l._id} className="list-item">
                                    <span>INT{l.broker?.intelligence} SPD{l.broker?.speed} RISK{l.broker?.risk} — {l.priceAIBA} AIBA</span>
                                    <button type="button" className="btn btn--primary" onClick={() => buyListing(l._id)} disabled={busy}><IconBuy /> Buy</button>
                                </div>
                            ))
                        ) : <p className="guide-tip">No listings.</p>}
                    </div>
                    <div className="card">
                        <div className="card__title">Buy from system</div>
                        <p className="card__hint">Purchase a broker from the system for AIBA.</p>
                        {systemBrokers.length === 0 ? (
                            <p className="guide-tip">No system brokers. Refresh to load.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                                {systemBrokers.map((entry) => (
                                    <li key={entry.id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <span>{entry.name} — INT{entry.intelligence} SPD{entry.speed} RISK{entry.risk} — {entry.priceAiba} AIBA</span>
                                        <button type="button" className="btn btn--primary" onClick={() => buySystemBroker(entry.id)} disabled={busy}><IconBuy /> Buy</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {marketMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{marketMsg}</p> : null}
                    </div>
                    <div className="card">
                        <div className="card__title">Boosts</div>
                        <p className="card__hint">Multiply battle rewards for a period.</p>
                        <div className="action-row">
                            <button type="button" className="btn btn--secondary" onClick={refreshBoosts} disabled={busy}><IconRefresh /> Refresh</button>
                            <button type="button" className="btn btn--primary" onClick={buyBoost} disabled={busy}>Buy boost (NEUR)</button>
                        </div>
                        {boostMsg ? <p className="status-msg status-msg--success" style={{ marginTop: 8 }}>{boostMsg}</p> : null}
                        {boosts.length > 0 ? <p className="card__hint" style={{ marginTop: 8 }}>Active: {boosts.map((b) => `${b.multiplier}x until ${new Date(b.expiresAt).toLocaleString()}`).join('; ')}</p> : <p className="guide-tip">Buy a boost to multiply battle rewards.</p>}
                    </div>
                </section>

                {/* ─── Car Racing (Autonomous) ───────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'carRacing' ? 'is-active' : ''}`} aria-hidden={tab !== 'carRacing'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                        <div className="card__title">Car Racing</div>
                        <p className="card__hint">Autonomous car racing. Create or buy a car, enter open races, earn AIBA by finish position.</p>
                        <p className="card__hint" style={{ marginTop: 6, fontSize: 11, opacity: 0.9 }}>Inspired by the most powerful racing cars: Formula 1, Le Mans, Can-Am, IndyCar, Group B, GT1, Electric, Drag, Touring/DTM, Hillclimb, NASCAR, Historic, Hypercar, Extreme prototypes.</p>
                        <button type="button" className="btn btn--secondary" onClick={refreshCarRacing} disabled={busy}><IconRefresh /> Refresh</button>
                        {carMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{carMsg}</p> : null}
                    </div>
                    <div className="card">
                        <div className="card__title">1. Create a racing car</div>
                        {carRacingConfig ? (
                            <>
                                <p className="card__hint">Cost: {carRacingConfig.createCarCostAiba > 0 ? `${carRacingConfig.createCarCostAiba} AIBA` : ''}{carRacingConfig.createCarCostAiba > 0 && carRacingConfig.createCarCostTonNano > 0 ? ' or ' : ''}{carRacingConfig.createCarCostTonNano > 0 ? `${(carRacingConfig.createCarCostTonNano / 1e9).toFixed(1)} TON` : ''}</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                                    {carRacingConfig.createCarCostAiba > 0 ? <button type="button" className="btn btn--primary" onClick={createCarAiba} disabled={busy}><IconCar /> Create with AIBA</button> : null}
                                    {carRacingConfig.createCarCostTonNano > 0 && carRacingConfig.walletForTon ? (
                                        <>
                                            <input className="input" value={carCreateTxHash} onChange={(e) => setCarCreateTxHash(e.target.value)} placeholder="TON tx hash" style={{ flex: '1 1 180px', minWidth: 0 }} />
                                            <button type="button" className="btn btn--primary" onClick={createCarTon} disabled={busy || !carCreateTxHash.trim()}>Create with TON</button>
                                        </>
                                    ) : null}
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="card__hint">Loading racing config…</p>
                                <p className="card__hint" style={{ marginTop: 6 }}>Purchase a car from THE SYSTEM with AIBA.</p>
                                <button type="button" className="btn btn--secondary" onClick={refreshCarRacing} disabled={busy} style={{ marginTop: 8 }}><IconRefresh /> Refresh</button>
                            </>
                        )}
                    </div>
                    <div className="card">
                        <div className="card__title">Buy a car from the system</div>
                        <p className="card__hint">Purchase a racing car from the system for AIBA.</p>
                        {systemCars.length === 0 ? (
                            <p className="guide-tip">No system cars. Refresh to load.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                                {systemCars.map((entry) => {
                                    const classLabel = entry.carClass && carRacingConfig?.carClasses?.find((x) => x.id === entry.carClass)?.label ? carRacingConfig.carClasses.find((x) => x.id === entry.carClass).label : (entry.carClass || '').replace(/([A-Z])/g, ' $1').trim() || 'Racing car';
                                    return (
                                        <li key={entry.id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <span>{entry.name} — {classLabel} — SPD{entry.topSpeed} ACC{entry.acceleration} HND{entry.handling} DUR{entry.durability} — {entry.priceAiba} AIBA</span>
                                            <button type="button" className="btn btn--primary" onClick={() => buySystemCar(entry.id)} disabled={busy}>Buy</button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        {carMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{carMsg}</p> : null}
                    </div>
                    <div className="card">
                        <div className="card__title">2. Buy a racing car</div>
                        <p className="card__hint">Purchase a car from other players with AIBA.</p>
                        {carListings.length === 0 ? (
                            <p className="guide-tip">No cars for sale. Check back later or create your own above.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                                {carListings.map((l) => {
                                    const car = l.car || l.carId;
                                    const classLabel = car?.carClass && carRacingConfig?.carClasses?.find((x) => x.id === car.carClass)?.label ? carRacingConfig.carClasses.find((x) => x.id === car.carClass).label : (car?.carClass || '').replace(/([A-Z])/g, ' $1').trim() || 'Racing car';
                                    return (
                                        <li key={l._id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <span>Car #{String(l.carId?._id ?? l.carId).slice(-6)} — {classLabel} — {l.priceAIBA} AIBA</span>
                                            <button type="button" className="btn btn--primary" onClick={async () => { setBusy(true); setCarMsg(''); try { await api.post('/api/car-racing/buy-car', { requestId: uuid(), listingId: l._id }); setCarMsg('Purchased.'); await refreshCarRacing(); await refreshEconomy(); } catch (e) { setCarMsg(getErrorMessage(e, 'Buy failed.')); } finally { setBusy(false); } }} disabled={busy}>Buy</button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    <div className="card">
                        <div className="card__title">My cars</div>
                        {myCars.length === 0 ? <p className="guide-tip">No cars. Create or buy one above.</p> : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>{myCars.map((c) => {
                                const classLabel = c.carClass && carRacingConfig?.carClasses?.find((x) => x.id === c.carClass)?.label ? carRacingConfig.carClasses.find((x) => x.id === c.carClass).label : (c.carClass || 'Racing car');
                                return <li key={c._id}>#{String(c._id).slice(-6)} — {classLabel} — SPD{c.topSpeed} ACC{c.acceleration} HND{c.handling} DUR{c.durability}</li>;
                            })}</ul>
                        )}
                    </div>
                    <div className="card">
                        <div className="card__title">Enter race</div>
                        <p className="card__hint">Entry fee: {carRacingConfig?.entryFeeAiba ?? 10} AIBA. When race is full, it runs and rewards are paid.</p>
                        <select className="select" value={carEnterRaceId} onChange={(e) => setCarEnterRaceId(e.target.value)} style={{ marginTop: 6, minWidth: '100%' }}>
                            <option value="">Select race</option>
                            {carRaces.map((r) => <option key={r._id} value={r._id}>{r.trackId} {r.league} — {r.entryCount ?? 0}/{r.maxEntries} — {r.entryFeeAiba} AIBA</option>)}
                        </select>
                        <select className="select" value={carEnterCarId} onChange={(e) => setCarEnterCarId(e.target.value)} style={{ marginTop: 8, minWidth: '100%' }}>
                            <option value="">Select car</option>
                            {myCars.map((c) => {
                                const classLabel = c.carClass && carRacingConfig?.carClasses?.find((x) => x.id === c.carClass)?.label ? carRacingConfig.carClasses.find((x) => x.id === c.carClass).label : (c.carClass || 'Car');
                                return <option key={c._id} value={c._id}>#{String(c._id).slice(-6)} — {classLabel}</option>;
                            })}
                        </select>
                        <button type="button" className="btn btn--primary" onClick={enterCarRace} disabled={busy || !carEnterRaceId || !carEnterCarId} style={{ marginTop: 8 }}>Enter race</button>
                    </div>
                    {carLeaderboard.length > 0 ? (
                        <div className="card">
                            <div className="card__title">Leaderboard</div>
                            <p className="card__hint">Top by total points.</p>
                            <ol style={{ margin: 0, paddingLeft: 20 }}>{carLeaderboard.slice(0, 10).map((r) => <li key={r.telegramId}>#{r.rank} — {r.totalPoints} pts, {r.wins} wins, {r.aibaEarned} AIBA</li>)}</ol>
                        </div>
                    ) : null}
                </section>

                {/* ─── Bike Racing (Autonomous) ───────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'bikeRacing' ? 'is-active' : ''}`} aria-hidden={tab !== 'bikeRacing'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-magenta)' }}>
                        <div className="card__title">Bike Racing</div>
                        <p className="card__hint">Autonomous motorcycle racing. Create or buy a bike, enter open races, earn AIBA.</p>
                        <p className="card__hint" style={{ marginTop: 6, fontSize: 11, opacity: 0.9 }}>Inspired by the most powerful racing &amp; high-performance motorcycles: Hyper-Track (H2R, MTT 420RR), Superbikes (M 1000 RR, Fireblade, R1M), Sportbikes (Ninja H2, Hayabusa), Track Racing, Historic GP (NSR500, Desmosedici), Electric (Energica, LiveWire), Exotic (Bimota, NCR), Big Torque (Rocket 3, VMAX), MotoGP, Supersport, Hypersport, Classic TT, Concepts.</p>
                        <button type="button" className="btn btn--secondary" onClick={refreshBikeRacing} disabled={busy}><IconRefresh /> Refresh</button>
                        {bikeMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{bikeMsg}</p> : null}
                    </div>
                    <div className="card">
                        <div className="card__title">1. Create a racing bike</div>
                        {bikeRacingConfig ? (
                            <>
                                <p className="card__hint">Cost: {bikeRacingConfig.createBikeCostAiba > 0 ? `${bikeRacingConfig.createBikeCostAiba} AIBA` : ''}{bikeRacingConfig.createBikeCostAiba > 0 && bikeRacingConfig.createBikeCostTonNano > 0 ? ' or ' : ''}{bikeRacingConfig.createBikeCostTonNano > 0 ? `${(bikeRacingConfig.createBikeCostTonNano / 1e9).toFixed(1)} TON` : ''}</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                                    {bikeRacingConfig.createBikeCostAiba > 0 ? <button type="button" className="btn btn--primary" onClick={createBikeAiba} disabled={busy}><IconBike /> Create with AIBA</button> : null}
                                    {bikeRacingConfig.createBikeCostTonNano > 0 && bikeRacingConfig.walletForTon ? (
                                        <>
                                            <input className="input" value={bikeCreateTxHash} onChange={(e) => setBikeCreateTxHash(e.target.value)} placeholder="TON tx hash" style={{ flex: '1 1 180px', minWidth: 0 }} />
                                            <button type="button" className="btn btn--primary" onClick={createBikeTon} disabled={busy || !bikeCreateTxHash.trim()}>Create with TON</button>
                                        </>
                                    ) : null}
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="card__hint">Loading racing config…</p>
                                <p className="card__hint" style={{ marginTop: 6 }}>Purchase a BIKE from THE SYSTEM with AIBA.</p>
                                <button type="button" className="btn btn--secondary" onClick={refreshBikeRacing} disabled={busy} style={{ marginTop: 8 }}><IconRefresh /> Refresh</button>
                            </>
                        )}
                    </div>
                    <div className="card">
                        <div className="card__title">Buy a bike from the system</div>
                        <p className="card__hint">Purchase a racing bike from the system for AIBA.</p>
                        {systemBikes.length === 0 ? (
                            <p className="guide-tip">No system bikes. Refresh to load.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                                {systemBikes.map((entry) => {
                                    const classLabel = entry.bikeClass && bikeRacingConfig?.bikeClasses?.find((x) => x.id === entry.bikeClass)?.label ? bikeRacingConfig.bikeClasses.find((x) => x.id === entry.bikeClass).label : (entry.bikeClass || '').replace(/([A-Z])/g, ' $1').trim() || 'Racing bike';
                                    return (
                                        <li key={entry.id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <span>{entry.name} — {classLabel} — SPD{entry.topSpeed} ACC{entry.acceleration} HND{entry.handling} DUR{entry.durability} — {entry.priceAiba} AIBA</span>
                                            <button type="button" className="btn btn--primary" onClick={() => buySystemBike(entry.id)} disabled={busy}>Buy</button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        {bikeMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{bikeMsg}</p> : null}
                    </div>
                    <div className="card">
                        <div className="card__title">2. Buy a racing bike</div>
                        <p className="card__hint">Purchase a bike from other players with AIBA.</p>
                        {bikeListings.length === 0 ? (
                            <p className="guide-tip">No bikes for sale. Check back later or create your own above.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                                {bikeListings.map((l) => {
                                    const bike = l.bike || l.bikeId;
                                    const classLabel = bike?.bikeClass && bikeRacingConfig?.bikeClasses?.find((x) => x.id === bike.bikeClass)?.label ? bikeRacingConfig.bikeClasses.find((x) => x.id === bike.bikeClass).label : (bike?.bikeClass || '').replace(/([A-Z])/g, ' $1').trim() || 'Racing bike';
                                    return (
                                        <li key={l._id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <span>Bike #{String(l.bikeId?._id ?? l.bikeId).slice(-6)} — {classLabel} — {l.priceAIBA} AIBA</span>
                                            <button type="button" className="btn btn--primary" onClick={async () => { setBusy(true); setBikeMsg(''); try { await api.post('/api/bike-racing/buy-bike', { requestId: uuid(), listingId: l._id }); setBikeMsg('Purchased.'); await refreshBikeRacing(); await refreshEconomy(); } catch (e) { setBikeMsg(getErrorMessage(e, 'Buy failed.')); } finally { setBusy(false); } }} disabled={busy}>Buy</button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    <div className="card">
                        <div className="card__title">My bikes</div>
                        {myBikes.length === 0 ? <p className="guide-tip">No bikes. Create or buy one above.</p> : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>{myBikes.map((b) => {
                                const classLabel = b.bikeClass && bikeRacingConfig?.bikeClasses?.find((x) => x.id === b.bikeClass)?.label ? bikeRacingConfig.bikeClasses.find((x) => x.id === b.bikeClass).label : (b.bikeClass || 'Racing bike');
                                return <li key={b._id}>#{String(b._id).slice(-6)} — {classLabel} — SPD{b.topSpeed} ACC{b.acceleration} HND{b.handling} DUR{b.durability}</li>;
                            })}</ul>
                        )}
                    </div>
                    <div className="card">
                        <div className="card__title">Enter race</div>
                        <p className="card__hint">Entry fee: {bikeRacingConfig?.entryFeeAiba ?? 10} AIBA.</p>
                        <select className="select" value={bikeEnterRaceId} onChange={(e) => setBikeEnterRaceId(e.target.value)} style={{ marginTop: 6, minWidth: '100%' }}>
                            <option value="">Select race</option>
                            {bikeRaces.map((r) => <option key={r._id} value={r._id}>{r.trackId} {r.league} — {r.entryCount ?? 0}/{r.maxEntries}</option>)}
                        </select>
                        <select className="select" value={bikeEnterBikeId} onChange={(e) => setBikeEnterBikeId(e.target.value)} style={{ marginTop: 8, minWidth: '100%' }}>
                            <option value="">Select bike</option>
                            {myBikes.map((b) => {
                                const classLabel = b.bikeClass && bikeRacingConfig?.bikeClasses?.find((x) => x.id === b.bikeClass)?.label ? bikeRacingConfig.bikeClasses.find((x) => x.id === b.bikeClass).label : (b.bikeClass || 'Bike');
                                return <option key={b._id} value={b._id}>#{String(b._id).slice(-6)} — {classLabel}</option>;
                            })}
                        </select>
                        <button type="button" className="btn btn--primary" onClick={enterBikeRace} disabled={busy || !bikeEnterRaceId || !bikeEnterBikeId} style={{ marginTop: 8 }}>Enter race</button>
                    </div>
                    {bikeLeaderboard.length > 0 ? (
                        <div className="card">
                            <div className="card__title">Leaderboard</div>
                            <ol style={{ margin: 0, paddingLeft: 20 }}>{bikeLeaderboard.slice(0, 10).map((r) => <li key={r.telegramId}>#{r.rank} — {r.totalPoints} pts, {r.wins} wins, {r.aibaEarned} AIBA</li>)}</ol>
                        </div>
                    ) : null}
                </section>

                {/* ─── Multiverse (NFT: own, stake, earn) ────────────────────────── */}
                <section className={`tab-panel ${tab === 'multiverse' ? 'is-active' : ''}`} aria-hidden={tab !== 'multiverse'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                        <div className="card__title">NFT Multiverse</div>
                        <p className="card__hint">Own Broker NFTs, stake them to earn AIBA daily. Mint from Brokers tab (pay AIBA).</p>
                        <div className="action-row">
                            <button type="button" className="btn btn--secondary" onClick={refreshMultiverse} disabled={busy}><IconRefresh /> Refresh</button>
                        </div>
                        {multiverseMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{multiverseMsg}</p> : null}
                    </div>
                    {multiverseStakingRewards != null && (multiverseStakingRewards.stakedCount > 0 || (multiverseStakingRewards.pendingRewardAiba ?? 0) > 0) ? (
                        <div className="card card--elevated">
                            <div className="card__title">NFT staking rewards</div>
                            <p className="card__hint">{nftStakingRewardPerDay} AIBA per NFT per day. Staked: {multiverseStakingRewards.stakedCount ?? 0}. Pending: <strong>{multiverseStakingRewards.pendingRewardAiba ?? 0} AIBA</strong></p>
                            <button type="button" className="btn btn--primary" onClick={claimNftStaking} disabled={busy || (multiverseStakingRewards.pendingRewardAiba ?? 0) <= 0}><IconClaim /> Claim rewards</button>
                        </div>
                    ) : null}
                    <div className="card">
                        <div className="card__title">Universes</div>
                        <p className="card__hint">Each universe has its own mint cost and staking.</p>
                        {multiverseUniverses.length === 0 ? <p className="guide-tip">Loading…</p> : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {multiverseUniverses.map((u) => (
                                    <li key={u.slug} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4, marginTop: 8 }}>
                                        <strong>{u.name}</strong>
                                        {u.description ? <span className="card__hint">{u.description}</span> : null}
                                        <span className="card__hint">Mint: {u.mintCostAiba > 0 ? `${u.mintCostAiba} AIBA` : u.mintCostTonNano > 0 ? `${(u.mintCostTonNano / 1e9).toFixed(1)} TON` : '—'}. Staking: {u.stakingEnabled ? 'Yes' : 'No'}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="card">
                        <div className="card__title">My NFTs</div>
                        <p className="card__hint">Broker NFTs you own. Stake to earn AIBA daily; unstake anytime.</p>
                        {multiverseMyNfts.length === 0 ? <p className="guide-tip">No Broker NFTs. Mint one from the Brokers tab (pay AIBA for mint).</p> : (
                            multiverseMyNfts.map((nft) => (
                                <div key={nft.brokerId} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, marginTop: 10, padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                        <span>Broker #{String(nft.brokerId).slice(-6)} · Lv{nft.level} INT{nft.intelligence} SPD{nft.speed} RISK{nft.risk}</span>
                                        {nft.staked ? (
                                            <button type="button" className="btn btn--secondary" onClick={() => unstakeNft(nft.brokerId)} disabled={busy}>Unstake</button>
                                        ) : (
                                            <button type="button" className="btn btn--primary" onClick={() => stakeNft(nft.brokerId)} disabled={busy}><IconStake /> Stake</button>
                                        )}
                                    </div>
                                    {nft.staked ? <span className="card__hint">Staked · earning {nftStakingRewardPerDay} AIBA/day</span> : null}
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* ─── Charity (Unite for Good) ────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'charity' ? 'is-active' : ''}`} aria-hidden={tab !== 'charity'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-magenta)' }}>
                        <div className="card__title">Community Impact</div>
                        <p className="card__hint">Unite for Good. Donate NEUR or AIBA to causes. Every contribution counts.</p>
                        <div className="action-row">
                            <button type="button" className="btn btn--secondary" onClick={refreshCharityAll} disabled={busy}><IconRefresh /> Refresh</button>
                        </div>
                        {charityStats ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                                <span className="card__hint" style={{ margin: 0 }}><strong style={{ color: 'var(--accent-cyan)' }}>{charityStats.totalRaisedNeur ?? 0}</strong> NEUR raised</span>
                                <span className="card__hint" style={{ margin: 0 }}><strong style={{ color: 'var(--accent-gold)' }}>{charityStats.totalRaisedAiba ?? 0}</strong> AIBA raised</span>
                                <span className="card__hint" style={{ margin: 0 }}><strong>{charityStats.totalDonors ?? 0}</strong> donors</span>
                                <span className="card__hint" style={{ margin: 0 }}><strong>{charityStats.activeCampaignCount ?? 0}</strong> active campaigns</span>
                            </div>
                        ) : null}
                    </div>
                    {charityCampaigns.length > 0 ? (
                        <>
                            <div className="card card--elevated">
                                <div className="card__title">Active campaigns</div>
                                <p className="card__hint">Donate from your balance. Progress is transparent.</p>
                                {charityCampaigns.filter((c) => c.status === 'active').map((c) => {
                                    const goalN = (c.goalNeur || 0) + (c.goalAiba || 0) * 10;
                                    const raisedN = (c.raisedNeur || 0) + (c.raisedAiba || 0) * 10;
                                    const pct = goalN > 0 ? Math.min(100, Math.round((raisedN / goalN) * 100)) : 0;
                                    return (
                                        <div key={c._id} className="card" style={{ marginTop: 10, padding: 12, borderLeft: `4px solid var(--accent-${c.cause === 'education' ? 'cyan' : c.cause === 'health' ? 'green' : 'magenta'})` }}>
                                            <div className="card__title" style={{ marginBottom: 4 }}>{c.name}</div>
                                            {c.description ? <p className="card__hint" style={{ marginTop: 4 }}>{c.description.slice(0, 120)}{c.description.length > 120 ? '…' : ''}</p> : null}
                                            <p className="card__hint" style={{ marginTop: 6 }}>
                                                <span className="cause-pill" style={{ background: 'var(--bg-glass)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem' }}>{c.cause}</span>
                                                {' '}Raised: {c.raisedNeur ?? 0} NEUR, {c.raisedAiba ?? 0} AIBA · {c.donorCount ?? 0} donors
                                            </p>
                                            {goalN > 0 ? <div style={{ marginTop: 8, height: 8, background: 'var(--bg-deep)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-magenta))', borderRadius: 'var(--radius-pill)' }} /></div> : null}
                                            <button type="button" className="btn btn--primary" style={{ marginTop: 10 }} onClick={() => setDonateCampaignId(c._id)}><IconHeart /> Donate</button>
                                        </div>
                                    );
                                })}
                                {charityCampaigns.filter((c) => c.status === 'active').length === 0 ? <p className="guide-tip">No active campaigns. Check back soon.</p> : null}
                            </div>
                            <div className="card">
                                <div className="card__title">Donate</div>
                                <p className="card__hint">Choose a campaign and amount (NEUR and/or AIBA from your balance).</p>
                                <select className="select" value={donateCampaignId} onChange={(e) => setDonateCampaignId(e.target.value)} style={{ marginTop: 8, minWidth: '100%' }}>
                                    <option value="">Select campaign</option>
                                    {charityCampaigns.filter((c) => c.status === 'active').map((c) => <option key={c._id} value={c._id}>{c.name} ({c.cause})</option>)}
                                </select>
                                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <input className="input" value={donateNeur} onChange={(e) => setDonateNeur(e.target.value)} placeholder="NEUR" style={{ width: 100 }} />
                                    <input className="input" value={donateAiba} onChange={(e) => setDonateAiba(e.target.value)} placeholder="AIBA" style={{ width: 100 }} />
                                </div>
                                <input className="input" value={donateMessage} onChange={(e) => setDonateMessage(e.target.value)} placeholder="Message (optional)" style={{ marginTop: 8, width: '100%' }} />
                                <label className="check-wrap" style={{ marginTop: 8, display: 'flex', alignItems: 'center' }}>
                                    <input type="checkbox" checked={donateAnonymous} onChange={(e) => setDonateAnonymous(e.target.checked)} />
                                    Donate anonymously
                                </label>
                                <button type="button" className="btn btn--primary" onClick={donateCharity} disabled={busy || !donateCampaignId || (!donateNeur && !donateAiba)} style={{ marginTop: 10 }}><IconHeart /> Donate</button>
                                {charityMsg ? <p className={`status-msg ${charityMsg.includes('Thank') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{charityMsg}</p> : null}
                            </div>
                        </>
                    ) : (
                        <div className="card">
                            <div className="card__title">Campaigns</div>
                            <p className="guide-tip">No active campaigns yet. Check back soon or create one in the admin panel.</p>
                        </div>
                    )}
                    {charityMyImpact ? (
                        <div className="card">
                            <div className="card__title">My impact</div>
                            <p className="card__hint">You&apos;ve donated <strong style={{ color: 'var(--accent-cyan)' }}>{charityMyImpact.amountNeur ?? 0}</strong> NEUR and <strong style={{ color: 'var(--accent-gold)' }}>{charityMyImpact.amountAiba ?? 0}</strong> AIBA. Impact score: <strong>{charityMyImpact.impactScore ?? 0}</strong></p>
                            {charityMyImpact.byCampaign?.length > 0 ? <p className="card__hint" style={{ marginTop: 6 }}>By campaign: {charityMyImpact.byCampaign.map((c) => `${c.campaignName || c.campaignId}: ${c.amountNeur} NEUR, ${c.amountAiba} AIBA`).join('; ')}</p> : null}
                        </div>
                    ) : null}
                    <div className="card">
                        <div className="card__title">Charity leaderboard</div>
                        <p className="card__hint">Top donors by impact, NEUR, AIBA, or donation count.</p>
                        <div className="action-row">
                            <select className="select" value={charityLeaderboardBy} onChange={(e) => setCharityLeaderboardBy(e.target.value)}><option value="impact">By impact</option><option value="neur">By NEUR</option><option value="aiba">By AIBA</option><option value="count">By count</option></select>
                            <button type="button" className="btn btn--secondary" onClick={refreshCharityLeaderboard} disabled={busy}><IconRefresh /> Refresh</button>
                        </div>
                        {charityLeaderboard.length > 0 ? (
                            charityLeaderboard.slice(0, 15).map((row, i) => (
                                <div key={row.telegramId + i} className="list-item">
                                    <span className="list-item__rank">#{row.rank}</span>
                                    <span className="list-item__name">
                                        {row.telegramId}
                                        {Array.isArray(row.badges) && row.badges.length > 0 ? (
                                            <span className="list-item__badges">
                                                {row.badges.slice(0, 3).map((badgeId) => {
                                                    const meta = BADGE_LABELS[badgeId] || { label: badgeId, color: 'var(--text-muted)' };
                                                    return (
                                                        <span key={badgeId} className="badge-pill badge-pill--inline" style={{ borderColor: meta.color, color: meta.color }} title={meta.title || meta.label}>{meta.label}</span>
                                                    );
                                                })}
                                            </span>
                                        ) : null}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>impact {row.impactScore} · NEUR {row.amountNeur} · AIBA {row.amountAiba}</span>
                                </div>
                            ))
                        ) : <p className="guide-tip">Donate to appear on the leaderboard (unless anonymous).</p>}
                    </div>
                </section>

                {/* ─── University (AIBA ARENA UNIVERSITY) ─────────────────────── */}
                <section className={`tab-panel ${tab === 'university' ? 'is-active' : ''}`} aria-hidden={tab !== 'university'}>
                    <div className="card card--elevated card--university university-hero">
                        <div className="card__title">AIBA ARENA UNIVERSITY</div>
                        <p className="card__hint" style={{ marginTop: 8 }}>Super Futuristic learning hub. Learn, master, excel.</p>
                        <p className="card__hint" style={{ marginTop: 4 }}>
                            Progress: <strong>{universityProgress?.completedCount ?? 0}</strong> / <strong>{universityTotalModules || universityCourses.reduce((n, c) => n + (c.modules?.length || 0), 0)}</strong> modules
                            {universityProgress?.graduate ? <span className="university-hero__graduate"> · You graduated!</span> : ' · Complete all to earn the University Graduate badge.'}
                        </p>
                        <button type="button" className="btn btn--ghost" style={{ marginTop: 10 }} onClick={refreshUniversity} disabled={busy}><IconRefresh /> Refresh</button>
                    </div>
                    {universityCourses.length === 0 ? (
                        <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                            <div className="card__title">No courses loaded</div>
                            <p className="card__hint">Courses are loaded from the server. Tap Refresh below to load them. If you run locally, ensure the backend is running (e.g. <code style={{ fontSize: '0.75rem' }}>cd backend &amp;&amp; npm start</code>).</p>
                            <button type="button" className="btn btn--primary" onClick={refreshUniversity} disabled={busy} style={{ marginTop: 12 }}><IconRefresh /> Refresh courses</button>
                        </div>
                    ) : (
                        <div className="university-courses">
                            {universityCourses.map((course) => (
                                <div key={course.id} className="card card--elevated university-course">
                                    <button
                                        type="button"
                                        className="university-course__header"
                                        onClick={() => toggleUniversityCourse(course.id)}
                                        aria-expanded={universityExpandedCourseId === course.id}
                                    >
                                        <span className="university-course__title">{course.title}</span>
                                        <span className="university-course__chevron" aria-hidden>{universityExpandedCourseId === course.id ? '▼' : '▶'}</span>
                                    </button>
                                    <p className="university-course__short">{course.shortDescription}</p>
                                    {universityExpandedCourseId === course.id && Array.isArray(course.modules) ? (
                                        <div className="university-modules">
                                            {course.modules.map((mod) => {
                                                const key = `${course.id}-${mod.id}`;
                                                const isOpen = universityExpandedModuleKey === key;
                                                return (
                                                    <div key={key} className="university-module">
                                                        <button
                                                            type="button"
                                                            className="university-module__header"
                                                            onClick={() => toggleUniversityModule(course.id, mod.id, key)}
                                                            aria-expanded={isOpen}
                                                        >
                                                            <span className="university-module__title">{mod.title}</span>
                                                            <span className="university-module__chevron" aria-hidden>{isOpen ? '▼' : '▶'}</span>
                                                        </button>
                                                        {isOpen && mod.body ? (
                                                            <div className="university-module__body">{mod.body}</div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                    {universityMintMsg ? <p className="guide-tip" style={{ marginTop: 12 }}>{universityMintMsg}</p> : null}
                    {universityMintInfo?.canMint && !universityMintInfo?.alreadyMinted ? (
                        <div className="card card--elevated card--university" style={{ marginTop: 16 }}>
                            <div className="card__title">Mint Course Completion Badge</div>
                            <p className="card__hint">Complete at least one course, then pay <strong>{universityMintInfo.costTon ?? 10} TON</strong> to the University wallet and paste the transaction hash below to mint the badge.</p>
                            {universityMintInfo.walletAddress ? <p className="card__hint" style={{ fontSize: 11, wordBreak: 'break-all' }}>Wallet: {universityMintInfo.walletAddress}</p> : null}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                                <input
                                    type="text"
                                    placeholder="TON tx hash"
                                    value={universityBadgeTxHash}
                                    onChange={(e) => setUniversityBadgeTxHash(e.target.value)}
                                    style={{ flex: '1 1 200px', minWidth: 0, padding: 8 }}
                                />
                                <button type="button" className="btn btn--primary" onClick={mintCourseBadge} disabled={busy}>Mint badge</button>
                            </div>
                        </div>
                    ) : null}
                    {universityMintInfo?.canMintFullCertificate && !universityMintInfo?.alreadyMintedFullCertificate ? (
                        <div className="card card--elevated card--university" style={{ marginTop: 16 }}>
                            <div className="card__title">Mint Full Course Completion Certificate</div>
                            <p className="card__hint">You completed all courses. Pay <strong>{universityMintInfo.fullCertificateCostTon ?? 15} TON</strong> to the University wallet and paste the transaction hash below to mint the certificate.</p>
                            {universityMintInfo.walletAddress ? <p className="card__hint" style={{ fontSize: 11, wordBreak: 'break-all' }}>Wallet: {universityMintInfo.walletAddress}</p> : null}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                                <input
                                    type="text"
                                    placeholder="TON tx hash"
                                    value={universityCertificateTxHash}
                                    onChange={(e) => setUniversityCertificateTxHash(e.target.value)}
                                    style={{ flex: '1 1 200px', minWidth: 0, padding: 8 }}
                                />
                                <button type="button" className="btn btn--primary" onClick={mintFullCertificate} disabled={busy}>Mint certificate</button>
                            </div>
                        </div>
                    ) : null}
                </section>

                {/* ─── Realms ───────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'realms' ? 'is-active' : ''}`} aria-hidden={tab !== 'realms'}>
                    <div className="card card--elevated">
                        <div className="card__title">AI Realms</div>
                        <p className="card__hint">Select a realm and complete missions to earn rewards.</p>
                        <select
                            value={selectedRealmKey}
                            onChange={(e) => {
                                const key = e.target.value;
                                setSelectedRealmKey(key);
                                refreshMissions(key).catch(() => {});
                            }}
                            style={{ padding: 8, minWidth: 220 }}
                        >
                            {realms.map((r) => (
                                <option key={r.key} value={r.key}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="card card--elevated" style={{ marginTop: 12 }}>
                        <div className="card__title">Missions</div>
                        {missions.length === 0 ? (
                            <p className="card__hint">No missions available for this realm.</p>
                        ) : (
                            <div className="list">
                                {missions.map((m) => (
                                    <div key={m._id || m.title} className="list-item">
                                        <div className="list-item__main">
                                            <div className="list-item__title">{m.title}</div>
                                            <div className="list-item__desc">{m.description}</div>
                                        </div>
                                        <button type="button" className="btn btn--success" onClick={() => completeMission(m._id)} disabled={busy}>Complete</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card card--elevated" style={{ marginTop: 12 }}>
                        <div className="card__title">Mentors</div>
                        {mentors.length === 0 ? (
                            <p className="card__hint">No mentors available.</p>
                        ) : (
                            <div className="list">
                                {mentors.map((m) => (
                                    <div key={m._id || m.key} className="list-item">
                                        <div className="list-item__main">
                                            <div className="list-item__title">{m.name}</div>
                                            <div className="list-item__desc">{m.description}</div>
                                        </div>
                                        <button type="button" className="btn btn--ghost" onClick={() => assignMentor(m._id)} disabled={busy}>Assign</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ─── Assets ───────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'assets' ? 'is-active' : ''}`} aria-hidden={tab !== 'assets'}>
                    <div className="card card--elevated">
                        <div className="card__title">Mint AI Asset</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <select value={assetCategory} onChange={(e) => setAssetCategory(e.target.value)} style={{ padding: 8 }}>
                                <option value="agent">AI Agent</option>
                                <option value="brain">AI Brain</option>
                                <option value="creator">AI Creator</option>
                                <option value="workflow">AI Workflow</option>
                                <option value="system">AI System</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Asset name"
                                value={assetName}
                                onChange={(e) => setAssetName(e.target.value)}
                                style={{ padding: 8, flex: '1 1 200px', minWidth: 0 }}
                            />
                            <button type="button" className="btn btn--primary" onClick={mintAsset} disabled={busy || !assetName.trim()}>Mint</button>
                        </div>
                    </div>

                    <div className="card card--elevated" style={{ marginTop: 12 }}>
                        <div className="card__title">My Assets</div>
                        {assets.length === 0 ? (
                            <p className="card__hint">No assets yet. Mint your first asset above.</p>
                        ) : (
                            <div className="list">
                                {assets.map((a) => (
                                    <div key={a._id} className="list-item">
                                        <div className="list-item__main">
                                            <div className="list-item__title">{a.name}</div>
                                            <div className="list-item__desc">{a.category} · L{a.level} · {a.status}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="List price"
                                                value={listingPrice}
                                                onChange={(e) => setListingPrice(e.target.value)}
                                                style={{ width: 120, padding: 6 }}
                                            />
                                            <button type="button" className="btn btn--ghost" onClick={() => listAsset(a._id)} disabled={busy}>List</button>
                                            <button type="button" className="btn btn--secondary" onClick={() => upgradeAsset(a._id)} disabled={busy}>Upgrade</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card card--elevated" style={{ marginTop: 12 }}>
                        <div className="card__title">Marketplace Listings</div>
                        {marketListings.length === 0 ? (
                            <p className="card__hint">No listings available.</p>
                        ) : (
                            <div className="list">
                                {marketListings.map((l) => (
                                    <div key={l._id} className="list-item">
                                        <div className="list-item__main">
                                            <div className="list-item__title">Listing #{String(l._id).slice(-6)}</div>
                                            <div className="list-item__desc">{l.listingType} · {l.priceAiba} AIBA</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <button type="button" className="btn btn--primary" onClick={() => buyListing(l._id)} disabled={busy}>Buy</button>
                                            <button type="button" className="btn btn--ghost" onClick={() => onchainBuyListing(l._id)} disabled={busy}>On-chain Buy</button>
                                            <button type="button" className="btn btn--ghost" onClick={() => rentListing(l._id)} disabled={busy}>Rent</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ─── Governance ───────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'governance' ? 'is-active' : ''}`} aria-hidden={tab !== 'governance'}>
                    <div className="card card--elevated">
                        <div className="card__title">Create Proposal</div>
                        <input
                            type="text"
                            placeholder="Proposal title"
                            value={proposalTitle}
                            onChange={(e) => setProposalTitle(e.target.value)}
                            style={{ padding: 8, width: '100%' }}
                        />
                        <textarea
                            placeholder="Proposal description"
                            value={proposalDescription}
                            onChange={(e) => setProposalDescription(e.target.value)}
                            style={{ padding: 8, width: '100%', minHeight: 80, marginTop: 8 }}
                        />
                        <button type="button" className="btn btn--primary" onClick={propose} disabled={busy || !proposalTitle.trim()}>Propose</button>
                    </div>
                    <div className="card card--elevated" style={{ marginTop: 12 }}>
                        <div className="card__title">Active Proposals</div>
                        {proposals.length === 0 ? (
                            <p className="card__hint">No proposals yet.</p>
                        ) : (
                            <div className="list">
                                {proposals.map((p) => (
                                    <div key={p._id} className="list-item">
                                        <div className="list-item__main">
                                            <div className="list-item__title">{p.title}</div>
                                            <div className="list-item__desc">{p.description}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button type="button" className="btn btn--success" onClick={() => voteOnProposal(p._id, 'for')} disabled={busy}>Vote For</button>
                                            <button type="button" className="btn btn--ghost" onClick={() => voteOnProposal(p._id, 'against')} disabled={busy}>Vote Against</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ─── Updates (Unified Comms) ────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'updates' ? 'is-active' : ''}`} aria-hidden={tab !== 'updates'}>
                    <div className="card card--elevated card--comms-status">
                        <div className="card__title">System status</div>
                        <p className="card__hint" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="comms-status-dot" style={{ background: commsStatus?.status === 'operational' ? 'var(--accent-green)' : 'var(--text-muted)' }} aria-hidden />
                            {commsStatus?.status === 'operational' ? 'All systems operational' : commsStatus?.status || 'Checking…'}
                        </p>
                        <button type="button" className="btn btn--ghost" style={{ marginTop: 6 }} onClick={refreshUpdatesAll} disabled={busy}><IconRefresh /> Refresh</button>
                    </div>
                    <div className="card card--elevated">
                        <div className="card__title">Announcements</div>
                        <p className="card__hint">News, maintenance and updates from the team.</p>
                        {announcements.length === 0 ? (
                            <p className="guide-tip">No announcements yet.</p>
                        ) : (
                            <div className="comms-feed">
                                {announcements.map((a) => (
                                    <div key={a._id} className="comms-feed__item">
                                        <div className="comms-feed__item-title">{a.title}</div>
                                        <div className="comms-feed__item-meta">
                                            {a.type} · {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : new Date(a.createdAt).toLocaleDateString()}
                                        </div>
                                        {a.body ? <p className="comms-feed__item-body">{a.body.slice(0, 300)}{a.body.length > 300 ? '…' : ''}</p> : null}
                                        {a.link ? (
                                            <a href={a.link} target="_blank" rel="noopener noreferrer" className="comms-feed__item-link">Open link</a>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="card card--elevated">
                        <div className="card__title">FAQ &amp; support</div>
                        <div className="comms-faq">
                            <p className="card__hint"><strong>How do I earn Stars?</strong> Win battles. Each win grants Stars (Telegram Stars–style currency).</p>
                            <p className="card__hint"><strong>Where is my AIBA?</strong> After a battle, claim on-chain from the Vault or enable Auto-claim. Check Wallet → Vault.</p>
                            <p className="card__hint"><strong>What are Diamonds?</strong> Rare TON ecosystem asset. You get Diamonds on your first battle win.</p>
                            <p className="card__hint"><strong>Badges?</strong> Profile badges (verified, top leader, etc.) are assigned by the team or earned (e.g. top leaderboard).</p>
                        </div>
                    </div>
                </section>

                {/* ─── Wallet ─────────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'wallet' ? 'is-active' : ''}`} aria-hidden={tab !== 'wallet'}>
                    <div className="card card--elevated card--identity">
                        <div className="card__title">Profile</div>
                        <div className="identity-badges">
                            {Array.isArray(economyMe?.badges) && economyMe.badges.length > 0 ? (
                                economyMe.badges.map((badgeId) => {
                                    const meta = BADGE_LABELS[badgeId] || { label: badgeId, color: 'var(--text-muted)' };
                                    return (
                                        <span
                                            key={badgeId}
                                            className="badge-pill"
                                            style={{ borderColor: meta.color, color: meta.color }}
                                            title={meta.title || meta.label}
                                            data-badge={badgeId === 'verified' ? 'verified' : undefined}
                                        >
                                            {meta.label}
                                        </span>
                                    );
                                })
                            ) : (
                                <span className="card__hint">No badges yet. Earn or get assigned by admins.</span>
                            )}
                        </div>
                        {economyMe?.profileBoostedUntil && new Date(economyMe.profileBoostedUntil) > new Date() ? (
                            <p className="card__hint" style={{ marginTop: 8, color: 'var(--accent-cyan)' }}>Profile boosted until {new Date(economyMe.profileBoostedUntil).toLocaleString()}</p>
                        ) : null}
                    </div>
                    {Number(economyMe?.economy?.boostProfileCostTonNano) > 0 ? (
                        <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                            <div className="card__title">Boost your profile</div>
                            <p className="card__hint">Pay TON to boost your profile visibility. Cost: <strong>{(economyMe.economy.boostProfileCostTonNano / 1e9).toFixed(1)} TON</strong>. Send to the configured wallet, then paste the transaction hash.</p>
                            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <input className="input" value={profileBoostTxHash} onChange={(e) => setProfileBoostTxHash(e.target.value)} placeholder="Transaction hash" style={{ flex: '1 1 180px', minWidth: 0 }} />
                                <button type="button" className="btn btn--primary" onClick={buyProfileBoostWithTon} disabled={busy || !profileBoostTxHash.trim()}>Boost profile</button>
                            </div>
                            {profileBoostMsg ? <p className={`status-msg ${profileBoostMsg.includes('boosted') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{profileBoostMsg}</p> : null}
                        </div>
                    ) : null}
                    {starsStoreConfig?.enabled ? (
                        <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                            <div className="card__title">Stars Store</div>
                            <p className="card__hint">{starsStoreConfig.packStars} Stars for {starsStoreConfig.packPriceAiba > 0 ? `${starsStoreConfig.packPriceAiba} AIBA` : ''}{starsStoreConfig.packPriceAiba > 0 && starsStoreConfig.packPriceTonNano > 0 ? ' or ' : ''}{starsStoreConfig.packPriceTonNano > 0 ? `${starsStoreConfig.packPriceTonFormatted} TON` : ''}. Also in Market tab.</p>
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                {starsStoreConfig.packPriceAiba > 0 ? <button type="button" className="btn btn--secondary" onClick={buyStarsWithAiba} disabled={busy}><IconStar /> Buy with AIBA</button> : null}
                                {starsStoreConfig.packPriceTonNano > 0 && starsStoreConfig.walletForTon ? (
                                    <>
                                        <input className="input" value={starsStoreTxHash} onChange={(e) => setStarsStoreTxHash(e.target.value)} placeholder="Tx hash (TON)" style={{ flex: '1 1 160px', minWidth: 0 }} />
                                        <button type="button" className="btn btn--secondary" onClick={buyStarsWithTon} disabled={busy || !starsStoreTxHash.trim()}>Buy with TON</button>
                                    </>
                                ) : null}
                            </div>
                            {starsStoreMsg ? <p className={`status-msg ${starsStoreMsg.includes('Purchased') ? 'status-msg--success' : ''}`} style={{ marginTop: 6 }}>{starsStoreMsg}</p> : null}
                        </div>
                    ) : null}
                    {Number(economyMe?.economy?.giftCostTonNano) > 0 ? (
                        <div className="card" style={{ borderLeft: '4px solid var(--accent-magenta)' }}>
                            <div className="card__title"><IconHeart /> Gifts</div>
                            <p className="card__hint">Send a gift to another user (Telegram ID or @username). Cost: <strong>{(economyMe.economy.giftCostTonNano / 1e9).toFixed(1)} TON</strong> per gift. Pay, then paste tx hash.</p>
                            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <input className="input" value={giftTo} onChange={(e) => setGiftTo(e.target.value)} placeholder="Recipient: Telegram ID or @username" />
                                <input className="input" value={giftTxHash} onChange={(e) => setGiftTxHash(e.target.value)} placeholder="Transaction hash" />
                                <input className="input" value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} placeholder="Message (optional)" />
                                <button type="button" className="btn btn--primary" onClick={sendGift} disabled={busy || !giftTxHash.trim() || !giftTo.trim()}><IconHeart /> Send gift</button>
                            </div>
                            {giftMsg ? <p className={`status-msg ${giftMsg.includes('sent') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{giftMsg}</p> : null}
                            {giftsReceived.length > 0 ? (
                                <div style={{ marginTop: 12 }}>
                                    <div className="card__title" style={{ marginBottom: 6 }}>Received</div>
                                    {giftsReceived.slice(0, 10).map((g) => (
                                        <div key={g._id} className="card__hint" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                            {(g.amountNano / 1e9).toFixed(1)} TON · {g.message ? `"${g.message}"` : 'No message'} · {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : ''}
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                            {giftsSent.length > 0 ? (
                                <div style={{ marginTop: 12 }}>
                                    <div className="card__title" style={{ marginBottom: 6 }}>Sent</div>
                                    {giftsSent.slice(0, 10).map((g) => (
                                        <div key={g._id} className="card__hint" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                            {(g.amountNano / 1e9).toFixed(1)} TON → {g.toTelegramId} · {g.message ? `"${g.message}"` : ''} · {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : ''}
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    <div className="card card--stars">
                        <div className="card__title"><IconStar /> Stars</div>
                        <p className="card__hint">Telegram Stars–style in-app currency. Earn from every battle win; use for digital value, tips & perks in the ecosystem.</p>
                        <p className="balance-display balance-display--stars">
                            <IconStar /> <strong>{Number(economyMe?.starsBalance ?? 0)}</strong> Stars
                        </p>
                    </div>
                    <div className="card card--diamonds">
                        <div className="card__title"><IconDiamond /> Diamonds</div>
                        <p className="card__hint">Rare TON ecosystem asset. Earned on first win and exclusive milestones. Premium status.</p>
                        <p className="balance-display balance-display--diamonds">
                            <IconDiamond /> <strong>{Number(economyMe?.diamondsBalance ?? 0)}</strong> Diamonds
                        </p>
                    </div>
                    {dailyStatus ? (
                        <div className="card card--elevated">
                            <div className="card__title">Daily reward</div>
                            <p className="card__hint">
                                {dailyStatus.alreadyClaimedToday ? 'Already claimed today.' : `Claim ${dailyStatus.dailyRewardNeur ?? 0} NEUR.`}
                            </p>
                            <button type="button" className="btn btn--success" onClick={claimDaily} disabled={busy || dailyStatus.alreadyClaimedToday}>
                                <IconClaim /> {dailyStatus.alreadyClaimedToday ? 'Claimed' : 'Claim daily'}
                            </button>
                        </div>
                    ) : null}
                    {vaultInfo ? (
                        <div className="card">
                            <div className="card__title">Vault</div>
                            <p className="card__hint" style={{ wordBreak: 'break-all' }}>Address: {vaultInfo.vaultAddress}</p>
                            <p className="card__hint">TON (nano): {vaultInfo.tonBalanceNano} · Jetton: {vaultInfo.jettonBalance}</p>
                        </div>
                    ) : null}
                    <div className="card">
                        <div className="card__title">Staking</div>
                        <p className="card__hint">Lock AIBA, earn APY. Unstake or claim rewards anytime.</p>
                        <div className="action-row">
                            <button type="button" className="btn btn--secondary" onClick={refreshStaking} disabled={busy}><IconRefresh /> Refresh</button>
                        </div>
                        {stakingSummary ? (
                            <p className="card__hint" style={{ marginTop: 8 }}>Staked: {stakingSummary.stakedAmount} AIBA · APY: {stakingSummary.apyPercent}% · Pending: {stakingSummary.pendingReward} AIBA</p>
                        ) : null}
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input className="input" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="Stake (AIBA)" style={{ width: 120 }} />
                            <button type="button" className="btn btn--primary" onClick={stake} disabled={busy || !stakeAmount.trim()}><IconStake /> Stake</button>
                            <input className="input" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)} placeholder="Unstake (AIBA)" style={{ width: 120 }} />
                            <button type="button" className="btn btn--secondary" onClick={unstake} disabled={busy || !unstakeAmount.trim()}>Unstake</button>
                            <button type="button" className="btn btn--success" onClick={claimStaking} disabled={busy}><IconClaim /> Claim reward</button>
                        </div>
                        {stakeMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{stakeMsg}</p> : null}
                    </div>
                    <div className="card">
                        <div className="card__title">DAO</div>
                        <p className="card__hint">Create proposals and vote. Community-driven decisions.</p>
                        <div className="action-row">
                            <button type="button" className="btn btn--secondary" onClick={refreshProposals} disabled={busy}><IconRefresh /> Refresh</button>
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input className="input" value={newProposalTitle} onChange={(e) => setNewProposalTitle(e.target.value)} placeholder="New proposal title" />
                            <input className="input" value={newProposalDesc} onChange={(e) => setNewProposalDesc(e.target.value)} placeholder="Description (optional)" />
                            <button type="button" className="btn btn--primary" onClick={createProposal} disabled={busy || !newProposalTitle.trim()}>Create</button>
                        </div>
                        {daoMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{daoMsg}</p> : null}
                        {proposals.length > 0 ? (
                            proposals.map((p) => (
                                <div key={p._id} className="card" style={{ padding: 12, marginTop: 10 }}>
                                    <div className="card__title" style={{ marginBottom: 4 }}>{p.title}</div>
                                    {p.description ? <p className="card__hint" style={{ marginTop: 4 }}>{p.description}</p> : null}
                                    <p className="card__hint" style={{ marginTop: 6 }}>For: {p.votesFor} · Against: {p.votesAgainst} · {p.status}</p>
                                    {p.status === 'active' ? (
                                        <div style={{ marginTop: 8 }}>
                                            <button type="button" className="btn btn--success" onClick={() => voteProposal(p._id, true)} disabled={busy} style={{ marginRight: 8 }}>Vote For</button>
                                            <button type="button" className="btn btn--danger" onClick={() => voteProposal(p._id, false)} disabled={busy}>Vote Against</button>
                                        </div>
                                    ) : null}
                                </div>
                            ))
                        ) : <p className="guide-tip">No proposals.</p>}
                    </div>
                    {battle && lastClaim?.vaultAddress ? (
                        <div className="card card--elevated">
                            <div className="card__title">On-chain claim</div>
                            <p className="card__hint" style={{ wordBreak: 'break-all' }}>To: {lastClaim.toAddress}</p>
                            <p className="card__hint">Amount: {lastClaim.amount} · validUntil: {lastClaim.validUntil}</p>
                            <div className="action-row">
                                <button type="button" className="btn btn--primary" onClick={claimOnChain} disabled={busy}>Claim on-chain (TonConnect)</button>
                                <button type="button" className="btn btn--secondary" onClick={checkClaimStatus} disabled={busy}>Check status</button>
                            </div>
                            {claimStatus ? <p className="status-msg" style={{ marginTop: 8 }}>{claimStatus}</p> : null}
                        </div>
                    ) : battle && !lastClaim?.vaultAddress ? (
                        <div className="card">
                            <div className="card__title">Create AIBA claim</div>
                            <p className="card__hint">Create a claim from AIBA credits (balance: {Number(economyMe?.aibaBalance ?? 0)}).</p>
                            <div className="action-row" style={{ marginTop: 10 }}>
                                <input className="input" value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} placeholder="Amount (blank = all)" style={{ minWidth: 160 }} />
                                <button type="button" className="btn btn--primary" onClick={requestAibaClaim} disabled={busy}>Create claim</button>
                            </div>
                            <p className="guide-tip" style={{ borderLeftColor: 'var(--accent-gold)' }}>Requires backend vault + oracle and a saved wallet.</p>
                        </div>
                    ) : null}
                </section>
            </div>
        </div>
    );
}
