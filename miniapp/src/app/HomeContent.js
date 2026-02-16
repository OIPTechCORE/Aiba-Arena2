'use client';

import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createApi, getErrorMessage } from '../lib/api';
import { getTelegramUserUnsafe, shareViaTelegram } from '../lib/telegram';
import { EXTERNAL_APPS } from '../config/navigation';
import { TabBackNav } from '../components/TabBackNav';

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
const IconCoe = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
        <path d="M12 16v-4" /><path d="M10 14h4" />
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
const IconTrophy = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v4a5 5 0 01-10 0V4z" /><path d="M5 4h2v2" /><path d="M17 4h2v2" /><path d="M12 7v4" /><path d="M7 10H5a3 3 0 003 3h2" /><path d="M17 10h2a3 3 0 01-3 3h-2" /><path d="M8 14h8" />
    </svg>
);
const IconBoss = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /><path d="M2 12h20" />
    </svg>
);
const IconBet = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
    </svg>
);
const IconPremium = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2L2 8l4 14h12l4-14L12 2z" /><path d="M12 2v20" /><path d="M2 8h20" /><path d="M6 22l6-14 6 14" />
    </svg>
);
const IconRent = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 22V12h6v10" />
    </svg>
);
const IconTrainer = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
        <path d="M12 12l2 4 4-2-2-4-2 2z" />
    </svg>
);
const IconTreasury = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M12 8v8" /><path d="M8 12h8" />
    </svg>
);
const IconBreed = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" /><circle cx="12" cy="12" r="3" />
    </svg>
);
const IconTasks = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 6h11" /><path d="M9 12h11" /><path d="M9 18h11" />
        <path d="M4 6h.01" /><path d="M4 12h.01" /><path d="M4 18h.01" />
    </svg>
);
const IconProfile = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
);
const IconSettings = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-1.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h1.09a1.65 1.65 0 001.51-1 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-1.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
);
const IconGames = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <rect x="2" y="2" width="9" height="9" rx="1" /><rect x="13" y="2" width="9" height="9" rx="1" /><rect x="2" y="13" width="9" height="9" rx="1" /><rect x="13" y="13" width="9" height="9" rx="1" />
    </svg>
);
const IconSearch = () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
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
    verified: { label: 'Verified', color: 'var(--accent-gold)', title: 'Verified identity' },
    early_adopter: { label: 'Early Adopter', color: 'var(--accent-gold)', title: 'Joined in early phase' },
    top_donor: { label: 'Top Donor', color: 'var(--accent-magenta)', title: 'Top charity donor' },
    guild_leader: { label: 'Guild Leader', color: 'var(--accent-green)', title: 'Leads a guild' },
    top_leader: { label: 'Top Leader', color: 'var(--accent-gold)', title: 'Top by total score' },
    champion: { label: 'Champion', color: 'var(--accent-magenta)', title: 'Champion status' },
    diamond_holder: { label: 'Diamond Holder', color: 'var(--accent-amber)', title: 'Holds TON ecosystem Diamonds' },
    university_graduate: { label: 'University Graduate', color: 'var(--accent-gold)', title: 'Completed all University modules' },
    course_completion: { label: 'Course Completion', color: 'var(--accent-green)', title: 'Minted after completing at least one course' },
    full_course_completion_certificate: { label: 'Full Course Certificate', color: 'var(--accent-gold)', title: 'Minted after completing all courses' },
    top_referrer: { label: 'Top Referrer', color: 'var(--accent-gold)', title: 'Top 3 on referral leaderboard' },
};

/* Short explanations for tabs (what brokers, arenas, guilds are) */
const BROKERS_EXPLANATION = 'Brokers are your AI agents that compete in arenas. Each has stats (INT, SPD, RISK), level, and energy. Train (+1 stat, NEUR), Repair (restore energy, NEUR), or Upgrade (+2 stat and +1 level, AIBA). Combine two to merge stats; mint as NFT or trade on the Market. Energy regens over time; each battle uses energy and has a short cooldown per mode.';
const ARENAS_EXPLANATION = 'Arenas are battle modes where your broker competes. Each mode has an arena (prediction, simulation, strategy wars, guild wars, arbitrage) and a league (rookie, pro, elite). Leagues increase rewards and require higher broker level. Each mode uses energy, a cooldown, and optional entry fees. Guild Wars requires a guild and shares NEUR with the guild. Run a battle to earn AIBA, NEUR, Stars, and sometimes Diamonds.';
const GUILDS_EXPLANATION = 'Guilds (groups) let you team up with others: create or join a group, deposit brokers into the shared pool, and compete in Guild Wars. Top leaders create free; others can pay TON to create. Boost a guild with TON to give it benefits.';

/* Fallback when game-modes API returns empty (arena:league to match backend defaults) */
const ARENA_OPTIONS_FALLBACK = [
    { value: 'prediction:rookie', label: 'Prediction (rookie)' },
    { value: 'prediction:pro', label: 'Prediction (pro)' },
    { value: 'prediction:elite', label: 'Prediction (elite)' },
    { value: 'simulation:rookie', label: 'Simulation (rookie)' },
    { value: 'simulation:pro', label: 'Simulation (pro)' },
    { value: 'simulation:elite', label: 'Simulation (elite)' },
    { value: 'strategyWars:rookie', label: 'Strategy Wars (rookie)' },
    { value: 'strategyWars:pro', label: 'Strategy Wars (pro)' },
    { value: 'strategyWars:elite', label: 'Strategy Wars (elite)' },
    { value: 'guildWars:rookie', label: 'Guild Wars (rookie)' },
    { value: 'guildWars:pro', label: 'Guild Wars (pro)' },
    { value: 'guildWars:elite', label: 'Guild Wars (elite)' },
    { value: 'arbitrage:rookie', label: 'Arbitrage (rookie)' },
    { value: 'arbitrage:pro', label: 'Arbitrage (pro)' },
    { value: 'arbitrage:elite', label: 'Arbitrage (elite)' },
];

/** Single source of truth: Super, futuristic, multi-tabbed, seamlessly extensible, full fledged — used in hero, marketplace section, and grid. */
const MARKETPLACE_TAGLINE = 'Super, futuristic, multi-tabbed, seamlessly extensible, full fledged.';

/* Hero banner content per tab */
const HERO_BY_TAB = {
    home: { title: 'AI BROKER ARENA', sub: 'Own AI brokers. Compete in 3D arenas. Earn NEUR & AIBA.', hint: 'Swipe the tab bar to explore Home, Brokers, Market, Racing, and more.', buttonLabel: 'FAQs', buttonAction: 'updates' },
    brokers: { title: 'BROKERS', sub: BROKERS_EXPLANATION, hint: 'New broker, tasks, run battle, vault. Combine or mint NFT.', buttonLabel: 'View', buttonAction: 'scroll' },
    tasks: { title: 'TASK CENTER', sub: 'Personalized mission queue for every player profile.', hint: 'Newcomer, fighter, trader, racer, social, scholar, and investor.', buttonLabel: 'View', buttonAction: 'scroll' },
    leaderboard: { title: 'LEADERBOARD', sub: 'Global ranks by score, AIBA, NEUR, or battles.', hint: 'Run battles to climb the ranks.', buttonLabel: 'View', buttonAction: 'scroll' },
    referrals: { title: 'REFERRALS', sub: 'Earn NEUR & AIBA when friends join.', hint: 'Share your link or apply a friend\'s code.', buttonLabel: 'View', buttonAction: 'scroll' },
    arenas: { title: 'ARENAS', sub: ARENAS_EXPLANATION, hint: 'Choose arena and run battle. Guild Wars needs a guild.', buttonLabel: 'View', buttonAction: 'scroll' },
    guilds: { title: 'GUILDS', sub: GUILDS_EXPLANATION, hint: 'Create or join a group; deposit brokers to the pool.', buttonLabel: 'View', buttonAction: 'scroll' },
    market: { title: 'SUPER FUTURISTIC UNIFIED MARKETPLACE', sub: `${MARKETPLACE_TAGLINE} Brokers, assets, rentals, system shop, boosts. TON + AIBA.`, hint: 'Overview · Trade · Rental · System · Boosts. List, buy, create — one hub.', buttonLabel: 'View', buttonAction: 'scroll' },
    tournaments: { title: 'TOURNAMENTS', sub: 'Enter AIBA tournaments. Compete, win prizes from the pool.', hint: 'Pay AIBA to enter; top 4 share the prize pool.', buttonLabel: 'View', buttonAction: 'scroll' },
    globalBoss: { title: 'GLOBAL BOSS', sub: 'Fight the community boss. Damage from battles counts. Share reward pool.', hint: 'Run battles to deal damage. When boss falls, top damagers earn AIBA.', buttonLabel: 'View', buttonAction: 'scroll' },
    carRacing: { title: 'CAR RACING', sub: 'Autonomous car racing. Create or buy a car, enter open races.', hint: 'Earn AIBA by finish position. System shop sells cars for AIBA.', buttonLabel: 'View', buttonAction: 'scroll' },
    bikeRacing: { title: 'BIKE RACING', sub: 'Autonomous motorcycle racing. Create or buy a bike, enter races.', hint: 'Earn AIBA by finish position.', buttonLabel: 'View', buttonAction: 'scroll' },
    multiverse: { title: 'NFT MULTIVERSE', sub: 'Own Broker NFTs, stake them to earn AIBA daily.', hint: 'Mint from Brokers tab (pay AIBA).', buttonLabel: 'View', buttonAction: 'scroll' },
    charity: { title: 'COMMUNITY IMPACT', sub: 'Unite for Good. Donate NEUR or AIBA to causes.', hint: 'Every contribution counts.', buttonLabel: 'View', buttonAction: 'scroll' },
    university: { title: 'AIBA ARENA UNIVERSITY', sub: 'Complete systematic guide. Learn brokers, arenas, economy, guilds.', hint: 'Expand courses below. Complete all to earn the University Graduate badge.', buttonLabel: 'View', buttonAction: 'scroll' },
    coe: { title: 'CENTER OF EXCELLENCE', sub: 'Learn · Train · Earn. Hub for University, Trainers & Creator Economy.', hint: 'Master the game, join the trainer network, grow your referrals.', buttonLabel: 'View', buttonAction: 'scroll' },
    realms: { title: 'AI REALMS', sub: 'Select a realm and complete missions to earn rewards.', hint: 'Explore AI Realms and complete missions.', buttonLabel: 'View', buttonAction: 'scroll' },
    assets: { title: 'AI ASSETS', sub: 'Mint, upgrade, list, buy, and rent AI assets.', hint: 'AI Agent, AI Brain, AI Creator, AI Workflow, AI System.', buttonLabel: 'View', buttonAction: 'scroll' },
    trainers: { title: 'TRAINERS & COACHES', sub: 'Global network of AIBA Arena trainers. Apply to earn AIBA when you help players learn. Recruit trainers, claim rewards.', hint: 'Network, leaderboard, dashboard. Apply with a trainer code or open the full portal.', buttonLabel: 'Open portal', buttonAction: 'trainers' },
    dao: { title: 'DAO', sub: 'Create proposals and vote. Stake AIBA for 30+ days to propose.', hint: 'Community-driven decisions. Governance tab.', buttonLabel: 'View', buttonAction: 'scroll' },
    governance: { title: 'GOVERNANCE', sub: 'Create proposals and vote. Community-driven decisions.', hint: 'Propose and vote on ecosystem changes.', buttonLabel: 'View', buttonAction: 'scroll' },
    updates: { title: 'UPDATES & FAQs', sub: 'Announcements, status & support.', hint: 'Stay informed. News, maintenance and answers to common questions.', buttonLabel: 'View', buttonAction: 'scroll' },
    profile: { title: 'PROFILE', sub: 'Your profile, balances, badges, and account details.', hint: 'Wallet & more.', buttonLabel: 'View', buttonAction: 'scroll' },
    settings: { title: 'SETTINGS', sub: 'App preferences, notifications, and account options.', hint: 'Theme, sound, privacy, and more.', buttonLabel: 'View', buttonAction: 'scroll' },
    games: { title: 'MORE GAMES', sub: 'Other apps and games in the AIBA ecosystem.', hint: 'Play other mini-apps from our platform. More coming soon.', buttonLabel: 'View', buttonAction: 'scroll' },
    wallet: { title: 'WALLET', sub: 'Claim AIBA on-chain. Stake, DAO, Stars, Diamonds.', hint: 'Connect wallet, create claim, sign tx. Daily NEUR, stake AIBA.', buttonLabel: 'View', buttonAction: 'scroll' },
    staking: { title: 'YIELD VAULT', sub: 'Lock AIBA, earn APY. Flexible or locked periods. Higher APY for longer locks.', hint: 'Stake, claim rewards, manage locks. Cancel early = 5% fee to Treasury.', buttonLabel: 'View', buttonAction: 'scroll' },
};

/* Tab bar (footer): core play flow first — Home → Brokers → Arenas → Market → Tasks … */
const TAB_LIST = [
    { id: 'home', label: 'Home', Icon: IconHome },
    { id: 'brokers', label: 'Brokers', Icon: IconBrokers },
    { id: 'arenas', label: 'Arenas', Icon: IconArena },
    { id: 'market', label: 'Market', Icon: IconMarket },
    { id: 'tasks', label: 'Tasks', Icon: IconTasks },
    { id: 'leaderboard', label: 'Leaderboard', Icon: IconLeaderboard },
    { id: 'tournaments', label: 'Tournaments', Icon: IconTrophy, badge: 'NEW' },
    { id: 'globalBoss', label: 'Global Boss', Icon: IconBoss, badge: 'NEW' },
    { id: 'predict', label: 'Predict', Icon: IconBet, badge: 'NEW' },
    { id: 'carRacing', label: 'Car Racing', Icon: IconCar },
    { id: 'bikeRacing', label: 'Bike Racing', Icon: IconBike },
    { id: 'referrals', label: 'Referrals', Icon: IconShare },
    { id: 'trainers', label: 'Trainers', Icon: IconTrainer, gridStyle: 'trainers' },
    { id: 'guilds', label: 'Guilds', Icon: IconGuilds },
    { id: 'multiverse', label: 'Multiverse', Icon: IconMultiverse },
    { id: 'nftGallery', label: 'NFT Gallery', Icon: IconMultiverse, badge: 'NEW' },
    { id: 'coe', label: 'CoE', Icon: IconCoe, badge: 'NEW' },
    { id: 'university', label: 'University', Icon: IconUniversity },
    { id: 'staking', label: 'Yield Vault', Icon: IconStake, badge: 'NEW' },
    { id: 'wallet', label: 'Wallet', Icon: IconWallet },
    { id: 'profile', label: 'Profile', Icon: IconProfile },
    { id: 'charity', label: 'Charity', Icon: IconHeart },
    { id: 'realms', label: 'Realms', Icon: IconWorld },
    { id: 'assets', label: 'Assets', Icon: IconAsset },
    { id: 'dao', label: 'DAO', Icon: IconGov, badge: 'NEW', gridStyle: 'dao' },
    { id: 'governance', label: 'Governance', Icon: IconGov },
    { id: 'updates', label: 'Updates', Icon: IconUpdates },
    { id: 'settings', label: 'Settings', Icon: IconSettings },
    { id: 'games', label: 'More games', Icon: IconGames, badge: 'NEW' },
];

/** Unified Marketplace: multi-tabbed flows. Add a new flow here + one panel (marketFlow === id) to extend seamlessly. */
const MARKET_FLOWS = [
    { id: 'overview', label: 'Overview' },
    { id: 'trade', label: 'Trade' },
    { id: 'rental', label: 'Rental', badge: 'NEW' },
    { id: 'system', label: 'System' },
    { id: 'boosts', label: 'Boosts' },
];

/* Home grid: derived from TAB_LIST (minus home) so grid always has all features */
const HOME_GRID_ITEMS = TAB_LIST.filter((t) => t.id !== 'home');

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
    /* Same-origin proxy for broker endpoints to avoid CORS/405 when frontend and backend are on different origins */
    const proxyApi = useMemo(() => createApi(''), []);

    const [status, setStatus] = useState('');
    const [brokers, setBrokers] = useState([]);
    const [selectedBrokerId, setSelectedBrokerId] = useState('');
    const [combineBaseId, setCombineBaseId] = useState('');
    const [combineSacrificeId, setCombineSacrificeId] = useState('');
    const [combineMsg, setCombineMsg] = useState('');
    const [brokerActionMsg, setBrokerActionMsg] = useState('');
    const [trainStat, setTrainStat] = useState('intelligence');
    const [upgradeStat, setUpgradeStat] = useState('intelligence');
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
    const scrollToFaqRef = useRef(false);
    const nftGalleryDefaultAppliedRef = useRef(false);
    const currentTabRef = useRef('home');
    const previousTabRef = useRef('home');
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
    const [taskFeed, setTaskFeed] = useState([]);
    const [taskProfile, setTaskProfile] = useState(null);
    const [tasksMsg, setTasksMsg] = useState('');
    const [marketFlow, setMarketFlow] = useState('overview'); // overview | trade | system | boosts
    const [balanceStripVisible, setBalanceStripVisible] = useState(true);
    const [dashboardSearch, setDashboardSearch] = useState('');
    const lastScrollYRef = useRef(0);
    const [carFlow, setCarFlow] = useState('garage'); // garage | system | market | race | leaderboard
    const [bikeFlow, setBikeFlow] = useState('garage'); // garage | system | market | race | leaderboard
    const [tournaments, setTournaments] = useState([]);
    const [tournamentDetail, setTournamentDetail] = useState(null);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [tournamentBrokerId, setTournamentBrokerId] = useState('');
    const [tournamentsMsg, setTournamentsMsg] = useState('');
    const [globalBoss, setGlobalBoss] = useState(null);
    const [globalBossMsg, setGlobalBossMsg] = useState('');
    const [predictEvents, setPredictEvents] = useState([]);
    const [predictBetEventId, setPredictBetEventId] = useState('');
    const [predictBetBrokerId, setPredictBetBrokerId] = useState('');
    const [predictBetAmount, setPredictBetAmount] = useState('');
    const [predictMsg, setPredictMsg] = useState('');
    const [premiumStatus, setPremiumStatus] = useState(null);
    const [premiumTxHash, setPremiumTxHash] = useState('');
    const [premiumMsg, setPremiumMsg] = useState('');
    const [brokerRentals, setBrokerRentals] = useState([]);
    const [rentalPricePerHour, setRentalPricePerHour] = useState('');
    const [listRentalBrokerId, setListRentalBrokerId] = useState('');
    const [rentalMsg, setRentalMsg] = useState('');
    const [breedBrokerA, setBreedBrokerA] = useState('');
    const [breedBrokerB, setBreedBrokerB] = useState('');
    const [breedingMsg, setBreedingMsg] = useState('');
    const [comboClaimMsg, setComboClaimMsg] = useState('');
    const [walletFlow, setWalletFlow] = useState('overview');
    const [stakingPeriods, setStakingPeriods] = useState([]);
    const [stakingMinAiba, setStakingMinAiba] = useState(100);
    const [stakingLocks, setStakingLocks] = useState([]);
    const [stakingCountdownTick, setStakingCountdownTick] = useState(0);
    const [stakeLockAmount, setStakeLockAmount] = useState('');
    const [stakeLockPeriodDays, setStakeLockPeriodDays] = useState(30);
    const [stakingLockMsg, setStakingLockMsg] = useState('');
    const [gameModes, setGameModes] = useState([]);
    const [league, setLeague] = useState('rookie');
    const [treasurySummary, setTreasurySummary] = useState(null);
    const [oraclePrice, setOraclePrice] = useState(null);
    const [treasuryOps, setTreasuryOps] = useState([]);
    const [charityViewMode, setCharityViewMode] = useState('detailed');
    const [charityFavoritesOnly, setCharityFavoritesOnly] = useState(false);
    const [charityFavoriteIds, setCharityFavoriteIds] = useState([]);

    const arenaOptions = gameModes.length > 0
        ? gameModes.map((m) => ({ value: `${m.arena}:${m.league || 'rookie'}`, label: `${m.name || m.arena}${m.league && m.league !== 'rookie' ? ` (${m.league})` : ''}` }))
        : ARENA_OPTIONS_FALLBACK.map((o) => ({ value: o.value, label: o.label }));

    const currentMode =
        gameModes.length > 0 && arena
            ? gameModes.find((m) => `${m.arena}:${m.league || 'rookie'}` === arena)
            : null;

    // Leaderboard
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardBy, setLeaderboardBy] = useState('score');
    async function refreshGameModes() {
        try {
            const res = await api.get('/api/game-modes');
            const modes = Array.isArray(res.data) ? res.data : [];
            setGameModes(modes);
            if (modes.length > 0) {
                const match = modes.find((m) => arena === m.arena || arena === `${m.arena}:${m.league || 'rookie'}`);
                if (!match) setArena(`${modes[0].arena}:${modes[0].league || 'rookie'}`);
            }
        } catch {
            setGameModes([]);
        }
    }
    async function refreshTreasuryOracle() {
        try {
            const [tRes, oRes] = await Promise.all([
                api.get('/api/treasury/summary'),
                api.get('/api/oracle/price'),
            ]);
            setTreasurySummary(tRes?.data || null);
            setOraclePrice(oRes?.data || null);
        } catch {
            setTreasurySummary(null);
            setOraclePrice(null);
        }
    }
    async function refreshTreasuryOps() {
        try {
            const res = await api.get('/api/treasury/ops');
            setTreasuryOps(Array.isArray(res?.data?.ops) ? res.data.ops : []);
        } catch {
            setTreasuryOps([]);
        }
    }
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

    async function refreshTasks() {
        setBusy(true);
        setTasksMsg('');
        try {
            const res = await api.get('/api/tasks');
            if (Array.isArray(res.data)) {
                setTaskFeed(res.data);
                setTaskProfile(null);
            } else {
                setTaskFeed(Array.isArray(res.data?.tasks) ? res.data.tasks : []);
                setTaskProfile(res.data?.profile || null);
            }
        } catch (e) {
            setTaskFeed([]);
            setTaskProfile(null);
            setTasksMsg(getErrorMessage(e, 'Could not load tasks.'));
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
            const [listResult, sysResult] = await Promise.allSettled([
                api.get('/api/marketplace/listings'),
                api.get('/api/marketplace/system-brokers'),
            ]);
            if (listResult.status === 'fulfilled' && listResult.value?.data != null)
                setListings(Array.isArray(listResult.value.data) ? listResult.value.data : []);
            else
                setListings([]);
            if (sysResult.status === 'fulfilled' && sysResult.value?.data != null)
                setSystemBrokers(Array.isArray(sysResult.value.data) ? sysResult.value.data : []);
            else
                setSystemBrokers([]);
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
    async function delistBroker(listingId) {
        setBusy(true);
        setMarketMsg('');
        try {
            await api.post('/api/marketplace/delist', { listingId });
            setMarketMsg('Delisted.');
            await refreshListings();
            await refreshBrokers();
        } catch (e) {
            setMarketMsg(getErrorMessage(e, 'Delist failed.'));
        } finally {
            setBusy(false);
        }
    }

    // Tournaments
    async function refreshTournaments() {
        try {
            const res = await api.get('/api/tournaments', { params: { status: 'all' } });
            setTournaments(Array.isArray(res.data) ? res.data : []);
        } catch {
            setTournaments([]);
        }
    }
    async function fetchTournamentDetail(tId) {
        try {
            const res = await api.get(`/api/tournaments/${tId}`);
            setTournamentDetail(res.data || null);
        } catch {
            setTournamentDetail(null);
        }
    }
    async function enterTournament(tId, brokerId) {
        if (!brokerId) return;
        setBusy(true);
        setTournamentsMsg('');
        try {
            await api.post(`/api/tournaments/${tId}/enter`, { brokerId });
            setTournamentsMsg('Entered!');
            await refreshTournaments();
            await refreshEconomy();
        } catch (e) {
            setTournamentsMsg(getErrorMessage(e, 'Entry failed.'));
        } finally {
            setBusy(false);
        }
    }

    // Global Boss
    async function refreshGlobalBoss() {
        try {
            const res = await api.get('/api/global-boss');
            setGlobalBoss(res.data || null);
        } catch {
            setGlobalBoss(null);
        }
    }
    async function refreshPredictEvents() {
        try {
            const res = await api.get('/api/predict/events', { params: { status: 'open' } });
            setPredictEvents(Array.isArray(res.data) ? res.data : []);
        } catch {
            setPredictEvents([]);
        }
    }
    async function placePredictBet(eventId, brokerId, amountAiba) {
        if (!eventId || !brokerId || !amountAiba || parseInt(amountAiba, 10) < 1) return;
        setBusy(true);
        setPredictMsg('');
        try {
            await api.post(`/api/predict/events/${eventId}/bet`, { brokerId, amountAiba: parseInt(amountAiba, 10) });
            setPredictMsg('Bet placed!');
            setPredictBetEventId('');
            setPredictBetBrokerId('');
            setPredictBetAmount('');
            await refreshPredictEvents();
            await refreshEconomy();
        } catch (e) {
            setPredictMsg(getErrorMessage(e, 'Bet failed.'));
        } finally {
            setBusy(false);
        }
    }

    // Premium
    async function refreshPremiumStatus() {
        try {
            const res = await api.get('/api/premium/status');
            setPremiumStatus(res.data || null);
        } catch {
            setPremiumStatus(null);
        }
    }
    async function buyPremium() {
        if (!premiumTxHash.trim()) return;
        setBusy(true);
        setPremiumMsg('');
        try {
            const res = await api.post('/api/premium/buy', { txHash: premiumTxHash.trim() });
            setPremiumMsg(`Premium activated until ${res.data?.premiumUntil ? new Date(res.data.premiumUntil).toLocaleDateString() : '—'}.`);
            setPremiumTxHash('');
            await refreshPremiumStatus();
        } catch (e) {
            setPremiumMsg(getErrorMessage(e, 'Purchase failed.'));
        } finally {
            setBusy(false);
        }
    }

    // Broker Rental
    async function refreshBrokerRentals() {
        try {
            const res = await api.get('/api/broker-rental');
            setBrokerRentals(Array.isArray(res.data) ? res.data : []);
        } catch {
            setBrokerRentals([]);
        }
    }
    async function listBrokerForRent() {
        if (!listRentalBrokerId || !rentalPricePerHour.trim()) return;
        setBusy(true);
        setRentalMsg('');
        try {
            await api.post('/api/broker-rental/list', { brokerId: listRentalBrokerId, priceAibaPerHour: Number(rentalPricePerHour) });
            setRentalMsg('Listed for rent.');
            setListRentalBrokerId('');
            setRentalPricePerHour('');
            await refreshBrokerRentals();
            await refreshBrokers();
        } catch (e) {
            setRentalMsg(getErrorMessage(e, 'List failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function rentBroker(rentalId) {
        setBusy(true);
        setRentalMsg('');
        try {
            await api.post(`/api/broker-rental/${rentalId}/rent`);
            setRentalMsg('Rented for 1 hour.');
            await refreshBrokerRentals();
            await refreshBrokers();
            await refreshEconomy();
        } catch (e) {
            setRentalMsg(getErrorMessage(e, 'Rent failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function unlistRental(rentalId) {
        setBusy(true);
        setRentalMsg('');
        try {
            await api.post(`/api/broker-rental/${rentalId}/unlist`);
            setRentalMsg('Unlisted.');
            await refreshBrokerRentals();
            await refreshBrokers();
        } catch (e) {
            setRentalMsg(getErrorMessage(e, 'Unlist failed.'));
        } finally {
            setBusy(false);
        }
    }

    // Breeding
    async function breedBrokers() {
        if (!breedBrokerA || !breedBrokerB) return;
        setBusy(true);
        setBreedingMsg('');
        try {
            const res = await api.post('/api/breeding/breed', { brokerIdA: breedBrokerA, brokerIdB: breedBrokerB });
            setBreedingMsg(`Bred! New broker ID: ${res.data?.child?._id || '—'}.`);
            setBreedBrokerA('');
            setBreedBrokerB('');
            await refreshBrokers();
            await refreshEconomy();
        } catch (e) {
            setBreedingMsg(getErrorMessage(e, 'Breed failed.'));
        } finally {
            setBusy(false);
        }
    }

    // Daily Combo
    async function claimCombo() {
        setBusy(true);
        setComboClaimMsg('');
        try {
            const res = await api.post('/api/daily/combo-claim');
            setComboClaimMsg(`Claimed ${res.data?.bonusAiba ?? 0} AIBA!`);
            await refreshDailyStatus();
            await refreshEconomy();
        } catch (e) {
            setComboClaimMsg(getErrorMessage(e, 'Claim failed.'));
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

    // P2P AIBA send, Buy AIBA with TON, AIBA in gifts, Donate
    const [p2pConfig, setP2pConfig] = useState(null);
    const [donateConfig, setDonateConfig] = useState(null);
    const [p2pTo, setP2pTo] = useState('');
    const [p2pAmount, setP2pAmount] = useState('');
    const [p2pTxHash, setP2pTxHash] = useState('');
    const [p2pMsg, setP2pMsg] = useState('');
    const [giftAibaTo, setGiftAibaTo] = useState('');
    const [giftAibaAmount, setGiftAibaAmount] = useState('');
    const [giftAibaTxHash, setGiftAibaTxHash] = useState('');
    const [giftAibaMsg, setGiftAibaMsg] = useState('');
    const [buyAibaTxHash, setBuyAibaTxHash] = useState('');
    const [buyAibaMsg, setBuyAibaMsg] = useState('');
    const [donateBrokerId, setDonateBrokerId] = useState('');
    const [donateBrokerTxHash, setDonateBrokerTxHash] = useState('');
    const [donateCarId, setDonateCarId] = useState('');
    const [donateCarTxHash, setDonateCarTxHash] = useState('');
    const [donateBikeId, setDonateBikeId] = useState('');
    const [donateBikeTxHash, setDonateBikeTxHash] = useState('');
    const [donateGiftsTxHash, setDonateGiftsTxHash] = useState('');
    const [donateMsg, setDonateMsg] = useState('');
    async function refreshP2pConfig() {
        try {
            const [p2p, donate] = await Promise.all([
                api.get('/api/p2p-aiba/config'),
                api.get('/api/donate/config'),
            ]);
            setP2pConfig(p2p.data || null);
            setDonateConfig(donate.data || null);
        } catch {
            setP2pConfig(null);
            setDonateConfig(null);
        }
    }
    async function sendP2pAiba() {
        if (!p2pTxHash.trim() || !p2pTo.trim() || !p2pAmount || parseInt(p2pAmount, 10) < 1) return;
        setBusy(true);
        setP2pMsg('');
        try {
            const body = { txHash: p2pTxHash.trim(), amountAiba: parseInt(p2pAmount, 10) };
            if (/^\d+$/.test(p2pTo.trim())) body.toTelegramId = p2pTo.trim();
            else body.toUsername = p2pTo.trim().replace(/^@/, '');
            await api.post('/api/p2p-aiba/send', body);
            setP2pMsg('AIBA sent.');
            setP2pTo('');
            setP2pAmount('');
            setP2pTxHash('');
            await refreshEconomy();
        } catch (e) {
            setP2pMsg(getErrorMessage(e, 'Send failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function sendAibaGift() {
        if (!giftAibaTxHash.trim() || !giftAibaTo.trim() || !giftAibaAmount || parseInt(giftAibaAmount, 10) < 1) return;
        setBusy(true);
        setGiftAibaMsg('');
        try {
            const body = { txHash: giftAibaTxHash.trim(), amountAiba: parseInt(giftAibaAmount, 10) };
            if (/^\d+$/.test(giftAibaTo.trim())) body.toTelegramId = giftAibaTo.trim();
            else body.toUsername = giftAibaTo.trim().replace(/^@/, '');
            await api.post('/api/gifts/send-aiba', body);
            setGiftAibaMsg('AIBA gift sent.');
            setGiftAibaTo('');
            setGiftAibaAmount('');
            setGiftAibaTxHash('');
            await refreshGifts();
            await refreshEconomy();
        } catch (e) {
            setGiftAibaMsg(getErrorMessage(e, 'Send failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function buyAibaWithTon() {
        if (!buyAibaTxHash.trim()) return;
        setBusy(true);
        setBuyAibaMsg('');
        try {
            const res = await api.post('/api/p2p-aiba/buy', { txHash: buyAibaTxHash.trim() });
            setBuyAibaMsg(`Received ${res.data?.aibaCredited ?? 0} AIBA!`);
            setBuyAibaTxHash('');
            await refreshEconomy();
        } catch (e) {
            setBuyAibaMsg(getErrorMessage(e, 'Buy failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function donateBroker() {
        if (!donateBrokerId.trim() || !donateBrokerTxHash.trim()) return;
        setBusy(true);
        setDonateMsg('');
        try {
            await api.post('/api/donate/broker', { brokerId: donateBrokerId.trim(), txHash: donateBrokerTxHash.trim() });
            setDonateMsg('Broker donated.');
            setDonateBrokerId('');
            setDonateBrokerTxHash('');
            await refreshBrokers();
        } catch (e) {
            setDonateMsg(getErrorMessage(e, 'Donate failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function donateCar() {
        if (!donateCarId.trim() || !donateCarTxHash.trim()) return;
        setBusy(true);
        setDonateMsg('');
        try {
            await api.post('/api/donate/car', { carId: donateCarId.trim(), txHash: donateCarTxHash.trim() });
            setDonateMsg('Car donated.');
            setDonateCarId('');
            setDonateCarTxHash('');
            await refreshCarRacing();
        } catch (e) {
            setDonateMsg(getErrorMessage(e, 'Donate failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function donateBike() {
        if (!donateBikeId.trim() || !donateBikeTxHash.trim()) return;
        setBusy(true);
        setDonateMsg('');
        try {
            await api.post('/api/donate/bike', { bikeId: donateBikeId.trim(), txHash: donateBikeTxHash.trim() });
            setDonateMsg('Bike donated.');
            setDonateBikeId('');
            setDonateBikeTxHash('');
            await refreshBikeRacing();
        } catch (e) {
            setDonateMsg(getErrorMessage(e, 'Donate failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function donateGifts() {
        if (!donateGiftsTxHash.trim()) return;
        setBusy(true);
        setDonateMsg('');
        try {
            await api.post('/api/donate/gifts', { txHash: donateGiftsTxHash.trim() });
            setDonateMsg('Gifts donation recorded.');
            setDonateGiftsTxHash('');
        } catch (e) {
            setDonateMsg(getErrorMessage(e, 'Donate failed.'));
        } finally {
            setBusy(false);
        }
    }

    // NFT Multiverse: universes, my NFTs, stake/unstake, claim staking rewards
    const [multiverseUniverses, setMultiverseUniverses] = useState([]);
    const [multiverseMyNfts, setMultiverseMyNfts] = useState([]);
    const [multiverseStakingRewards, setMultiverseStakingRewards] = useState(null);
    const [multiverseMsg, setMultiverseMsg] = useState('');
    const [multiverseFlow, setMultiverseFlow] = useState('list'); // 'list' | 'gallery'
    const [nftGalleryFlow, setNftGalleryFlow] = useState('grid'); // 'grid' | 'list' — dedicated NFT Gallery view
    const [nftGalleryFilter, setNftGalleryFilter] = useState('all'); // 'all' | 'staked' | 'available'
    const [nftGalleryLoading, setNftGalleryLoading] = useState(false); // loading state for dedicated gallery
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
    const [listCarId, setListCarId] = useState('');
    const [listCarPriceAIBA, setListCarPriceAIBA] = useState('');
    async function refreshCarRacing() {
        try {
            const results = await Promise.allSettled([
                api.get('/api/car-racing/config'),
                api.get('/api/car-racing/tracks'),
                api.get('/api/car-racing/races'),
                api.get('/api/car-racing/cars'),
                api.get('/api/car-racing/listings'),
                api.get('/api/car-racing/leaderboard'),
                api.get('/api/car-racing/system-cars'),
            ]);
            const get = (i) => (results[i]?.status === 'fulfilled' && results[i].value?.data != null ? results[i].value.data : (i === 0 ? null : []));
            setCarRacingConfig(get(0));
            setCarTracks(Array.isArray(get(1)) ? get(1) : []);
            setCarRaces(Array.isArray(get(2)) ? get(2) : []);
            setMyCars(Array.isArray(get(3)) ? get(3) : []);
            setCarListings(Array.isArray(get(4)) ? get(4) : []);
            setCarLeaderboard(Array.isArray(get(5)) ? get(5) : []);
            setSystemCars(Array.isArray(get(6)) ? get(6) : []);
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
    async function listCar() {
        if (!listCarId || !listCarPriceAIBA.trim()) return;
        setBusy(true);
        setCarMsg('');
        try {
            await api.post('/api/car-racing/list', { carId: listCarId, priceAIBA: Number(listCarPriceAIBA) });
            setCarMsg('Car listed for sale.');
            setListCarId('');
            setListCarPriceAIBA('');
            await refreshCarRacing();
        } catch (e) {
            setCarMsg(getErrorMessage(e, 'List failed.'));
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
    const [listBikeId, setListBikeId] = useState('');
    const [listBikePriceAIBA, setListBikePriceAIBA] = useState('');
    async function refreshBikeRacing() {
        try {
            const results = await Promise.allSettled([
                api.get('/api/bike-racing/config'),
                api.get('/api/bike-racing/tracks'),
                api.get('/api/bike-racing/races'),
                api.get('/api/bike-racing/bikes'),
                api.get('/api/bike-racing/listings'),
                api.get('/api/bike-racing/leaderboard'),
                api.get('/api/bike-racing/system-bikes'),
            ]);
            const get = (i) => (results[i]?.status === 'fulfilled' && results[i].value?.data != null ? results[i].value.data : (i === 0 ? null : []));
            setBikeRacingConfig(get(0));
            setBikeTracks(Array.isArray(get(1)) ? get(1) : []);
            setBikeRaces(Array.isArray(get(2)) ? get(2) : []);
            setMyBikes(Array.isArray(get(3)) ? get(3) : []);
            setBikeListings(Array.isArray(get(4)) ? get(4) : []);
            setBikeLeaderboard(Array.isArray(get(5)) ? get(5) : []);
            setSystemBikes(Array.isArray(get(6)) ? get(6) : []);
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
    async function listBike() {
        if (!listBikeId || !listBikePriceAIBA.trim()) return;
        setBusy(true);
        setBikeMsg('');
        try {
            await api.post('/api/bike-racing/list', { bikeId: listBikeId, priceAIBA: Number(listBikePriceAIBA) });
            setBikeMsg('Bike listed for sale.');
            setListBikeId('');
            setListBikePriceAIBA('');
            await refreshBikeRacing();
        } catch (e) {
            setBikeMsg(getErrorMessage(e, 'List failed.'));
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
    const [boostConfig, setBoostConfig] = useState(null);
    const [boostTonTxHash, setBoostTonTxHash] = useState('');
    async function refreshBoostConfig() {
        try {
            const res = await api.get('/api/boosts/config');
            setBoostConfig(res.data || null);
        } catch {
            setBoostConfig(null);
        }
    }
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
            await api.post('/api/boosts/buy', { requestId: uuid(), boostKey: 'score_multiplier' });
            setBoostMsg('Boost activated.');
            await refreshBoosts();
            await refreshEconomy();
        } catch {
            setBoostMsg('Buy failed (insufficient NEUR?).');
        } finally {
            setBusy(false);
        }
    }
    async function buyBoostWithTon() {
        if (!boostTonTxHash.trim()) return;
        setBusy(true);
        setBoostMsg('');
        try {
            await api.post('/api/boosts/buy-with-ton', { boostKey: 'score_multiplier', txHash: boostTonTxHash.trim() });
            setBoostMsg('Boost activated (TON).');
            setBoostTonTxHash('');
            await refreshBoosts();
            await refreshEconomy();
        } catch (e) {
            setBoostMsg(getErrorMessage(e, 'Buy with TON failed.'));
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
    async function refreshStakingPeriods() {
        try {
            const res = await api.get('/api/staking/periods');
            setStakingPeriods(Array.isArray(res.data?.periods) ? res.data.periods : []);
            setStakingMinAiba(Math.max(1, Number(res.data?.minAiba ?? 100) || 100));
        } catch {
            setStakingPeriods([]);
            setStakingMinAiba(100);
        }
    }
    async function refreshStakingLocks() {
        try {
            const res = await api.get('/api/staking/locks');
            setStakingLocks(Array.isArray(res.data) ? res.data : []);
        } catch {
            setStakingLocks([]);
        }
    }
    async function stakeLocked() {
        const amt = Math.floor(Number(stakeLockAmount));
        if (!Number.isFinite(amt) || amt <= 0 || !stakeLockPeriodDays) return;
        setBusy(true);
        setStakingLockMsg('');
        try {
            const res = await api.post('/api/staking/stake-locked', {
                amount: amt,
                periodDays: stakeLockPeriodDays,
                requestId: uuid(),
            });
            setStakingLockMsg(`Locked ${amt} AIBA for ${stakeLockPeriodDays} days. Expected reward: ${res.data?.expectedRewardAiba ?? 0} AIBA.`);
            setStakeLockAmount('');
            await refreshStakingLocks();
            await refreshEconomy();
        } catch (err) {
            const d = err?.response?.data;
            setStakingLockMsg(d?.error === 'min_stake_required' ? (d.message || `Minimum ${(d.minAiba ?? 100).toLocaleString()} AIBA.`) : getErrorMessage(err, 'Lock failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function cancelStakeEarly(lockId) {
        setBusy(true);
        setStakingLockMsg('');
        try {
            const res = await api.post('/api/staking/cancel-early', { lockId, requestId: uuid() });
            setStakingLockMsg(res.data?.message || `Returned ${res.data?.returnedAiba ?? 0} AIBA. Fee ${res.data?.feeAiba ?? 0} → Super Admin.`);
            await refreshStakingLocks();
            await refreshEconomy();
        } catch (e) {
            setStakingLockMsg(getErrorMessage(e, 'Cancel failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function claimLock(lockId) {
        setBusy(true);
        setStakingLockMsg('');
        try {
            const res = await api.post('/api/staking/claim-lock', { lockId, requestId: uuid() });
            setStakingLockMsg(`Claimed ${res.data?.total ?? 0} AIBA (principal + reward).`);
            await refreshStakingLocks();
            await refreshEconomy();
        } catch (e) {
            setStakingLockMsg(getErrorMessage(e, 'Claim failed.'));
        } finally {
            setBusy(false);
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
        } catch (err) {
            const d = err?.response?.data;
            setStakeMsg(d?.error === 'min_stake_required' ? (d.message || `Minimum ${(d.minAiba ?? 100).toLocaleString()} AIBA.`) : 'Stake failed (insufficient AIBA?).');
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
    const [daoConfig, setDaoConfig] = useState(null);
    const [newProposalTitle, setNewProposalTitle] = useState('');
    const [newProposalDesc, setNewProposalDesc] = useState('');
    const [daoProposalDetail, setDaoProposalDetail] = useState(null);
    async function refreshDaoConfig() {
        try {
            const res = await api.get('/api/dao/config');
            setDaoConfig(res.data || null);
        } catch {
            setDaoConfig(null);
        }
    }
    async function refreshDaoProposals() {
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
    async function fetchDaoProposalDetail(proposalId) {
        try {
            const res = await api.get(`/api/dao/proposals/${proposalId}`);
            setDaoProposalDetail(res.data || null);
        } catch {
            setDaoProposalDetail(null);
        }
    }
    async function voteProposal(proposalId, support) {
        setDaoMsg('');
        try {
            await api.post('/api/dao/vote', { proposalId, support });
            setDaoMsg('Vote recorded.');
            await refreshDaoProposals();
            if (daoProposalDetail?._id === proposalId) fetchDaoProposalDetail(proposalId);
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
            await refreshDaoProposals();
        } catch (e) {
            const data = e?.response?.data;
            if (data?.error === 'staking_required') {
                setDaoMsg(data.message || `Stake ${(data.minStakedAiba || 10000).toLocaleString()} AIBA for ${data.minStakeDays || 30} days to create proposals.`);
            } else {
                setDaoMsg(getErrorMessage(e, 'Create failed.'));
            }
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
        refreshReferralMe().catch(() => {});
        try {
            const inIframe = typeof window !== 'undefined' && window.self !== window.top;
            const previewParam = typeof window !== 'undefined' && typeof window.location !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
            const skipOverlays = inIframe || previewParam;
            if (!skipOverlays && typeof localStorage !== 'undefined' && !localStorage.getItem('aiba_cinematic_seen')) {
                setShowCinematicIntro(true);
            } else if (!skipOverlays && !localStorage.getItem('aiba_tutorial_done')) {
                setTutorialStep(1);
            }
            const savedCharityView = localStorage.getItem('aiba_charity_view_mode');
            if (savedCharityView === 'compact' || savedCharityView === 'detailed') setCharityViewMode(savedCharityView);
            const savedFavoritesOnly = localStorage.getItem('aiba_charity_favorites_only');
            if (savedFavoritesOnly === '1') setCharityFavoritesOnly(true);
            const savedFavoriteIds = localStorage.getItem('aiba_charity_favorite_ids');
            if (savedFavoriteIds) {
                const parsed = JSON.parse(savedFavoriteIds);
                if (Array.isArray(parsed)) setCharityFavoriteIds(parsed.map((x) => String(x)));
            }
        } catch {
            // ignore
        }
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const ref = params.get('ref');
            if (ref) setRefCodeInput(String(ref).trim().toUpperCase());
            const trainer = params.get('trainer');
            if (trainer) {
                api.post('/api/trainers/register-use', { code: String(trainer).trim().toUpperCase() }).catch(() => {});
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('aiba_charity_view_mode', charityViewMode);
            localStorage.setItem('aiba_charity_favorites_only', charityFavoritesOnly ? '1' : '0');
            localStorage.setItem('aiba_charity_favorite_ids', JSON.stringify(charityFavoriteIds));
        } catch {
            // ignore
        }
    }, [charityViewMode, charityFavoritesOnly, charityFavoriteIds]);

    useEffect(() => {
        previousTabRef.current = currentTabRef.current;
        currentTabRef.current = tab;
        if (tab === 'brokers') {
            refreshBrokers().catch((e) => setStatus(getErrorMessage(e, 'Failed to load brokers.')));
            refreshGameModes().catch(() => {});
        }
        if (tab === 'leaderboard') refreshLeaderboard().catch((e) => setStatus(getErrorMessage(e, 'Failed to load leaderboard.')));
        if (tab === 'tasks') refreshTasks().catch((e) => setTasksMsg(getErrorMessage(e, 'Failed to load tasks.')));
        if (tab === 'guilds') refreshMyRank().catch(() => {});
        if (tab === 'arenas') refreshGameModes().catch(() => {});
        if (tab === 'wallet') { refreshTreasuryOracle().catch(() => {}); }
        if (tab === 'charity') refreshCharityAll().catch((e) => setStatus(getErrorMessage(e, 'Failed to load charity data.')));
        if (tab === 'university') refreshUniversity().catch((e) => setStatus(getErrorMessage(e, 'Failed to load university data.')));
        if (tab === 'coe') {
            refreshReferralMe().catch(() => {});
            refreshReferralCreatorStats().catch(() => {});
            refreshTopReferrers().catch(() => {});
            refreshUniversity().catch(() => setStatus('Failed to load university data.'));
            refreshTrainerMe().catch(() => {});
            refreshTrainersLeaderboard().catch(() => {});
        }
        if (tab === 'updates') refreshUpdatesAll().catch(() => setStatus('Failed to load updates.'));
        if (tab === 'home' || tab === 'referrals') { refreshReferralMe().catch(() => {}); refreshTopReferrers().catch(() => {}); }
        if (tab === 'trainers') { refreshTrainerMe().catch(() => {}); refreshTrainersNetwork().catch(() => {}); refreshTrainersLeaderboard().catch(() => {}); }
        if (tab === 'market') { refreshListings().catch(() => {}); refreshStarsStoreConfig().catch(() => {}); refreshReferralMe().catch(() => {}); refreshBrokerRentals().catch(() => {}); refreshBoostConfig().catch(() => {}); }
        if (tab === 'carRacing') refreshCarRacing().catch(() => {});
        if (tab === 'bikeRacing') refreshBikeRacing().catch(() => {});
        if (tab === 'multiverse') refreshMultiverse().catch(() => {});
        if (tab === 'nftGallery') { setMultiverseFlow('gallery'); setNftGalleryLoading(true); refreshMultiverse().finally(() => setNftGalleryLoading(false)); }
        if (tab === 'realms') { refreshRealms().catch(() => {}); refreshMissions(selectedRealmKey).catch(() => {}); refreshMentors().catch(() => {}); }
        if (tab === 'assets') { refreshAssets().catch(() => {}); refreshMarketListings().catch(() => {}); }
        if (tab === 'dao') { refreshDaoConfig().catch(() => {}); refreshDaoProposals().catch(() => {}); refreshTreasuryOracle().catch(() => {}); refreshTreasuryOps().catch(() => {}); }
        if (tab === 'governance') { refreshProposals().catch(() => {}); refreshTreasuryOracle().catch(() => {}); refreshTreasuryOps().catch(() => {}); }
        if (tab === 'wallet') { refreshGifts().catch(() => {}); refreshStarsStoreConfig().catch(() => {}); refreshDailyStatus().catch(() => {}); refreshPremiumStatus().catch(() => {}); refreshP2pConfig().catch(() => {}); refreshTreasuryOracle().catch(() => {}); refreshStaking(); refreshStakingPeriods(); refreshStakingLocks(); }
        if (tab === 'staking') { refreshStaking(); refreshStakingPeriods(); refreshStakingLocks(); refreshEconomy().catch(() => {}); }
        if (tab === 'guilds') { refreshGuilds().catch(() => {}); refreshAllGroups().catch(() => {}); }
        if (tab === 'tournaments') { refreshTournaments().catch(() => {}); refreshBrokers().catch(() => {}); }
        if (tab === 'globalBoss') { refreshGlobalBoss().catch(() => {}); }
        if (tab === 'predict') { refreshPredictEvents().catch(() => {}); }
        setBalanceStripVisible(true);
        // No automatic scroll on tab change — user keeps their scroll position; only scroll to FAQ when they tap "FAQs"
        if (tab === 'updates' && scrollToFaqRef.current) {
            scrollToFaqRef.current = false;
            const t = setTimeout(() => document.getElementById('faq-support')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
            return () => clearTimeout(t);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    useEffect(() => {
        if (multiverseMyNfts.length > 0 && !nftGalleryDefaultAppliedRef.current) {
            setMultiverseFlow('gallery');
            nftGalleryDefaultAppliedRef.current = true;
        }
    }, [multiverseMyNfts]);

    /* Scroll-based hide/show of balance strip removed: it changed document height (max-height 120px → 0)
       and caused scroll bar jitter (small steps up/down). Strip is always visible for a stable scroll. */

    useEffect(() => {
        const hasActiveLocks = stakingLocks.some((l) => l.status === 'active');
        if (!hasActiveLocks) return;
        const interval = setInterval(() => setStakingCountdownTick((t) => t + 1), 1000);
        return () => clearInterval(interval);
    }, [stakingLocks]);

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

    // Live countdown for staking locks (updates every second when viewing staking)
    useEffect(() => {
        const showStaking = (tab === 'staking' || (tab === 'wallet' && walletFlow === 'staking'));
        const hasActiveLocks = stakingLocks.some((l) => l.status === 'active');
        if (!showStaking || !hasActiveLocks) return;
        const iv = setInterval(() => setStakingCountdownTick((t) => t + 1), 1000);
        return () => clearInterval(iv);
    }, [tab, walletFlow, stakingLocks]);

    async function createStarterBroker() {
        setBusy(true);
        setStatus('');
        try {
            const res = await proxyApi.post('/api/brokers/starter', {});
            const created = res?.data;
            if (created && created._id) {
                setBrokers((prev) => [created, ...prev]);
                setSelectedBrokerId(created._id);
            }
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

    async function trainBroker() {
        if (!selectedBrokerId) return;
        setBusy(true);
        setBrokerActionMsg('');
        try {
            await api.post('/api/brokers/train', {
                requestId: uuid(),
                brokerId: selectedBrokerId,
                stat: trainStat,
            });
            setBrokerActionMsg(`Trained: +1 ${trainStat}.`);
            await refreshBrokers();
            await refreshEconomy();
        } catch (e) {
            setBrokerActionMsg(getErrorMessage(e, 'Train failed (need NEUR?).'));
        } finally {
            setBusy(false);
        }
    }

    async function repairBroker() {
        if (!selectedBrokerId) return;
        setBusy(true);
        setBrokerActionMsg('');
        try {
            await api.post('/api/brokers/repair', {
                requestId: uuid(),
                brokerId: selectedBrokerId,
            });
            setBrokerActionMsg('Repaired: energy 100, cooldowns cleared.');
            await refreshBrokers();
            await refreshEconomy();
        } catch (e) {
            setBrokerActionMsg(getErrorMessage(e, 'Repair failed (need NEUR?).'));
        } finally {
            setBusy(false);
        }
    }

    async function upgradeBroker() {
        if (!selectedBrokerId) return;
        setBusy(true);
        setBrokerActionMsg('');
        try {
            await api.post('/api/brokers/upgrade', {
                requestId: uuid(),
                brokerId: selectedBrokerId,
                stat: upgradeStat,
            });
            setBrokerActionMsg(`Upgraded: +2 ${upgradeStat}, +1 level.`);
            await refreshBrokers();
            await refreshEconomy();
        } catch (e) {
            setBrokerActionMsg(getErrorMessage(e, 'Upgrade failed (need AIBA?).'));
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
            const [a, l] = arena.includes(':') ? arena.split(':') : [arena, league || 'rookie'];
            const res = await api.post('/api/battle/run', {
                requestId: uuid(),
                brokerId: selectedBrokerId,
                arena: a,
                league: l,
                autoClaim: autoClaimOnBattle,
            });
            setBattle(res.data);
            const c = res.data?.claim?.vaultAddress ? res.data.claim : null;
            setLastClaim(c);
            await refreshBrokers();
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
    const [guildPoolBrokers, setGuildPoolBrokers] = useState([]);

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
    async function refreshGuildPool(guildId) {
        if (!guildId) { setGuildPoolBrokers([]); return; }
        try {
            const res = await api.get(`/api/guilds/${guildId}/pool`);
            setGuildPoolBrokers(Array.isArray(res.data?.brokers) ? res.data.brokers : []);
        } catch {
            setGuildPoolBrokers([]);
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

    async function leaveGuild() {
        if (!selectedGuildId) return;
        setBusy(true);
        setGuildMsg('');
        try {
            await api.post('/api/guilds/leave', { guildId: selectedGuildId });
            setGuildMsg('Left guild.');
            setSelectedGuildId('');
            await refreshGuilds();
        } catch {
            setGuildMsg('Leave failed.');
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
    const [charityCampaignDetail, setCharityCampaignDetail] = useState(null);
    const [charityCampaignSearch, setCharityCampaignSearch] = useState('');
    const [charityCauseFilter, setCharityCauseFilter] = useState('');
    const [charitySortBy, setCharitySortBy] = useState('name');
    async function refreshCharityCampaignDetail(campaignId) {
        if (!campaignId) { setCharityCampaignDetail(null); return; }
        setBusy(true);
        try {
            const res = await api.get(`/api/charity/campaigns/${campaignId}`, { params: { recentDonations: 20 } });
            setCharityCampaignDetail(res.data || null);
        } catch {
            setCharityCampaignDetail(null);
        } finally {
            setBusy(false);
        }
    }
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
    async function refreshCharityAll() {
        await Promise.all([
            refreshCharityCampaigns(),
            refreshCharityStats(),
            refreshCharityMyImpact(),
            refreshCharityLeaderboard(),
        ]);
    }
    function toggleCharityFavorite(campaignId) {
        const id = String(campaignId || '');
        if (!id) return;
        setCharityFavoriteIds((prev) => {
            const has = prev.includes(id);
            return has ? prev.filter((x) => x !== id) : [...prev, id];
        });
    }

    // ----- Updates (Unified Comms) -----
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsUnreadCount, setAnnouncementsUnreadCount] = useState(0);
    const [commsStatus, setCommsStatus] = useState(null);
    const [commsConfig, setCommsConfig] = useState(null);
    const [supportSubject, setSupportSubject] = useState('question');
    const [supportMessage, setSupportMessage] = useState('');
    const [supportMsg, setSupportMsg] = useState('');
    const [supportRequests, setSupportRequests] = useState([]);
    async function refreshAnnouncements() {
        try {
            const res = await api.get('/api/announcements', { params: { limit: 20 } });
            const data = res.data?.data ?? res.data;
            const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
            setAnnouncements(list);
            setAnnouncementsUnreadCount(Number(data?.unreadCount ?? 0));
        } catch {
            setAnnouncements([]);
            setAnnouncementsUnreadCount(0);
        }
    }
    async function markAnnouncementsSeen(announcementId) {
        if (!announcementId) return;
        try {
            await api.post('/api/announcements/seen', { announcementId });
            setAnnouncementsUnreadCount(0);
        } catch {
            /* ignore */
        }
    }
    async function refreshCommsStatus() {
        try {
            const res = await api.get('/api/comms/status');
            setCommsStatus(res.data?.data ?? res.data ?? null);
        } catch {
            setCommsStatus(null);
        }
    }
    async function refreshCommsConfig() {
        try {
            const res = await api.get('/api/comms/config');
            setCommsConfig(res.data?.data ?? res.data ?? null);
        } catch {
            setCommsConfig(null);
        }
    }
    async function refreshMySupportRequests() {
        try {
            const res = await api.get('/api/support/my');
            setSupportRequests(Array.isArray(res.data) ? res.data : []);
        } catch {
            setSupportRequests([]);
        }
    }
    async function refreshUpdatesAll() {
        await Promise.all([refreshAnnouncements(), refreshCommsStatus(), refreshCommsConfig(), refreshMySupportRequests()]);
    }
    async function markAllAnnouncementsSeen() {
        try {
            await api.post('/api/announcements/seen-all', { requestId: uuid() });
            await refreshAnnouncements();
        } catch (e) {
            setSupportMsg(getErrorMessage(e, 'Failed to mark announcements as read.'));
        }
    }
    async function submitSupportRequest() {
        if (!supportMessage.trim()) { setSupportMsg('Enter a message.'); return; }
        setSupportMsg('');
        setBusy(true);
        try {
            await api.post('/api/support/request', { subject: supportSubject, message: supportMessage.trim() });
            setSupportMsg('Support request submitted. We will respond via the channel or link in announcements.');
            setSupportMessage('');
            setSupportSubject('question');
            await refreshMySupportRequests();
        } catch (e) {
            setSupportMsg(getErrorMessage(e, 'Submission failed.'));
        } finally {
            setBusy(false);
        }
    }

    const [universityCourses, setUniversityCourses] = useState([]);
    const [universityTotalModules, setUniversityTotalModules] = useState(0);
    const [universityProgress, setUniversityProgress] = useState(null);
    const [universityMintInfo, setUniversityMintInfo] = useState(null);
    const [universityMintCertificateInfo, setUniversityMintCertificateInfo] = useState(null);
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
        try {
            const certRes = await api.get('/api/university/mint-full-certificate-info');
            setUniversityMintCertificateInfo(certRes.data || null);
        } catch {
            setUniversityMintCertificateInfo(null);
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
    async function upgradeMentor(mentorId) {
        setBusy(true);
        setStatus('');
        try {
            const res = await api.post('/api/mentors/upgrade', { mentorId });
            setStatus(`Upgraded. Cost: ${res.data?.costAiba ?? 0} AIBA.`);
            await refreshEconomy();
        } catch (e) {
            setStatus(getErrorMessage(e, 'Mentor upgrade failed.'));
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

            const { buildJettonTransferPayload, buildListingForwardPayload } = await import('../lib/tonJetton');
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

            const { buildJettonTransferPayload } = await import('../lib/tonJetton');
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

    // ----- Trainers (in-app) -----
    const [trainerMe, setTrainerMe] = useState(null);
    const [trainersNetwork, setTrainersNetwork] = useState([]);
    const [trainersLeaderboard, setTrainersLeaderboard] = useState([]);
    const [trainersSortBy, setTrainersSortBy] = useState('impact');
    const [trainerApplyMsg, setTrainerApplyMsg] = useState('');
    const [trainerClaimMsg, setTrainerClaimMsg] = useState('');
    async function refreshTrainerMe() {
        try {
            const res = await api.get('/api/trainers/me');
            setTrainerMe(res?.data ?? null);
        } catch {
            setTrainerMe(null);
        }
    }
    async function refreshTrainersNetwork() {
        try {
            const res = await api.get('/api/trainers/network', { params: { sort: trainersSortBy, limit: 30 } });
            setTrainersNetwork(Array.isArray(res?.data) ? res.data : []);
        } catch {
            setTrainersNetwork([]);
        }
    }
    async function refreshTrainersLeaderboard() {
        try {
            const res = await api.get('/api/trainers/leaderboard', { params: { by: trainersSortBy, limit: 30 } });
            setTrainersLeaderboard(Array.isArray(res?.data) ? res.data : []);
        } catch {
            setTrainersLeaderboard([]);
        }
    }
    async function applyAsTrainer() {
        setBusy(true);
        setTrainerApplyMsg('');
        try {
            const res = await api.post('/api/trainers/apply', {});
            if (res.data?.alreadyTrainer) {
                setTrainerApplyMsg(`Already a trainer. Status: ${res.data.status}. Code: ${res.data.code}.`);
            } else {
                setTrainerApplyMsg(`Application submitted. Code: ${res.data?.code ?? '—'}. Await approval.`);
            }
            await refreshTrainerMe();
        } catch (e) {
            setTrainerApplyMsg(getErrorMessage(e, 'Apply failed.'));
        } finally {
            setBusy(false);
        }
    }
    async function claimTrainerRewards() {
        setBusy(true);
        setTrainerClaimMsg('');
        try {
            const res = await api.post('/api/trainers/claim-rewards', { requestId: uuid() });
            setTrainerClaimMsg(`Claimed ${res.data?.claimedAiba ?? 0} AIBA.`);
            await refreshTrainerMe();
            await refreshEconomy();
        } catch (e) {
            setTrainerClaimMsg(getErrorMessage(e, 'Claim failed.'));
        } finally {
            setBusy(false);
        }
    }

    // ----- Referrals -----
    const [myReferral, setMyReferral] = useState(null);
    const [refCodeInput, setRefCodeInput] = useState('');
    const [refMsg, setRefMsg] = useState('');
    const [topReferrers, setTopReferrers] = useState([]);
    const [creatorStats, setCreatorStats] = useState(null);

    async function refreshReferralMe() {
        try {
            const res = await api.get('/api/referrals/me');
            setMyReferral(res?.data ?? null);
        } catch {
            setMyReferral(null);
        }
    }
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

    async function refreshTopReferrers() {
        try {
            const res = await api.get('/api/referrals/top');
            setTopReferrers(Array.isArray(res?.data) ? res.data : []);
        } catch {
            setTopReferrers([]);
        }
    }

    async function refreshReferralCreatorStats() {
        try {
            const res = await api.get('/api/referrals/me/stats');
            setCreatorStats(res?.data ?? null);
        } catch {
            setCreatorStats(null);
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

            const { buildRewardClaimPayload } = await import('../lib/tonRewardClaim');
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
    const tgUser = getTelegramUserUnsafe();

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
            <header className="app-header app-header--android">
                <div className="app-header__row">
                    <h1 className="aiba-app__title">AIBA</h1>
                    <button type="button" className="btn btn--ghost header-nav__btn" onClick={() => setTab('home')} aria-label="Go to Home" title="Home">
                        <span className="header-nav__label">Home</span>
                    </button>
                    <button type="button" className="btn btn--ghost header-nav__btn header-nav__btn--profile" onClick={() => setTab('profile')} aria-label="Profile" title="Profile">
                        {tgUser?.photo_url ? (
                            <img src={tgUser.photo_url} alt="" className="header-nav__avatar" />
                        ) : (
                            <span className="header-nav__avatar header-nav__avatar--fallback"><IconProfile /></span>
                        )}
                        <span className="header-nav__label">Profile</span>
                    </button>
                    <button type="button" className="btn btn--ghost header-nav__btn" onClick={() => setTab('university')} aria-label="Guide" title="Guide">
                        <span className="header-nav__label">Guide</span>
                    </button>
                    <button type="button" className="btn btn--ghost header-nav__btn" onClick={() => { scrollToFaqRef.current = true; setTab('updates'); }} aria-label="FAQs" title="FAQs">
                        <span className="header-nav__label">FAQs</span>
                    </button>
                    <button type="button" className="btn btn--ghost header-nav__btn quick-nav__btn--settings" onClick={() => setTab('settings')} aria-label="Settings" title="Settings">
                        <span className="header-nav__label">Settings</span>
                    </button>
                    <div className="app-header__wallet">
                        <button
                            type="button"
                            className={wallet ? 'btn btn--ghost connect-wallet-btn' : 'btn btn--primary connect-wallet-btn'}
                            onClick={() => tonConnectUI?.openModal?.()}
                            aria-label={wallet ? 'Wallet' : 'Connect TON wallet'}
                        >
                            <IconWallet />
                            <span>{wallet ? 'Wallet' : 'Connect Wallet'}</span>
                        </button>
                    </div>
                </div>
                {IS_DEV ? (
                    <p className="aiba-app__sub app-header__sub">
                        Backend: {BACKEND_URL}
                        <span style={{ display: 'block', marginTop: 2, color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            Connect Wallet: works best on deployed HTTPS app. On localhost use a wallet extension or ngrok.
                        </span>
                    </p>
                ) : null}
                {status ? <p className={`status-msg ${status.toLowerCase().includes('fail') ? 'status-msg--error' : ''}`} style={{ margin: 0, width: '100%' }}>{status}</p> : null}
            </header>

            <div className={`quick-nav-wrap ${!balanceStripVisible ? 'quick-nav-wrap--hidden' : ''}`}>
                <div className="balance-strip" style={{ marginTop: 0, marginBottom: 0 }}>
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
            </div>

            {(() => {
                const hero = HERO_BY_TAB[tab] || HERO_BY_TAB.home;
                const isTrainers = tab === 'trainers';
                return (
                    <div className={`hero-center hero-center--compact${isTrainers ? ' hero-center--trainers' : ''}`} aria-hidden="false">
                        {tab !== 'home' ? (
                            <TabBackNav
                                previousTab={previousTabRef.current}
                                onGoToPrevious={() => setTab(previousTabRef.current)}
                                onGoToHome={() => setTab('home')}
                                className="tab-back-nav--hero"
                            />
                        ) : null}
                        <h2 className="hero-center__title">{hero.title}</h2>
                        <p className="hero-center__sub">{hero.sub}</p>
                        <p className="hero-center__hint">{hero.hint}</p>
                        <button
                            type="button"
                            className="hero-center__enter hero-center__enter--btn"
                            onClick={() => hero.buttonAction === 'trainers' ? (typeof window !== 'undefined' && (window.location.href = '/trainer')) : hero.buttonAction === 'updates' ? setTab('updates') : document.querySelector('.tab-content')?.scrollIntoView({ behavior: 'smooth' })}
                            aria-label={hero.buttonLabel}
                        >
                            {hero.buttonLabel}
                        </button>
                    </div>
                );
            })()}

            <p className="guide-tip" style={{ marginTop: 0 }}>
                {tab === 'home' ? 'Browse features, referrals, and leaderboard. Go to Brokers to create, battle, and manage.' :
                 tab === 'tasks' ? 'Personalized tasks for every user type: newcomer, trader, racer, social, scholar, and investor.' :
                 tab === 'leaderboard' ? 'Global ranks by score, AIBA, NEUR, or battles. Run battles to climb.' :
                 tab === 'brokers' ? 'New broker, tasks, run battle, vault. Combine or mint NFT.' :
                 tab === 'arenas' ? 'Choose arena and run battle. Guild Wars needs a guild.' :
                 tab === 'guilds' ? 'Create or join a group; deposit brokers to the pool.' :
                 tab === 'market' ? 'Super Futuristic Unified Marketplace. Brokers, assets, rentals, system shop, boosts.' :
                 tab === 'carRacing' ? 'Autonomous car racing. Create a car (AIBA or TON), enter races, earn AIBA by position.' :
                 tab === 'bikeRacing' ? 'Autonomous bike racing. Create a bike (AIBA or TON), enter races, earn AIBA.' :
                 tab === 'multiverse' ? 'Own, stake & earn. Mint Broker NFTs with AIBA; stake to earn AIBA daily.' :
                 tab === 'nftGallery' ? 'My NFT collection. View, stake, unstake Broker NFTs. Earn AIBA daily when staked.' :
                 tab === 'charity' ? 'Unite for Good. Donate NEUR or AIBA to active campaigns.' :
                 tab === 'university' ? 'Learn the game. Courses and modules right here.' :
                 tab === 'coe' ? 'Center of Excellence: University, Trainers & Creator Economy in one hub.' :
                 tab === 'realms' ? 'Explore AI Realms and complete missions to earn rewards.' :
                 tab === 'assets' ? 'Mint, upgrade, list, buy, and rent AI assets.' :
                 tab === 'dao' || tab === 'governance' ? 'Propose and vote on ecosystem changes. Stake AIBA 30+ days to create proposals.' :
                 tab === 'updates' ? 'Stay informed. Announcements, status & support here.' :
                 tab === 'referrals' ? 'Share your link, earn NEUR & AIBA when friends join. Apply a friend\'s code for bonuses.' :
                 tab === 'tournaments' ? 'Enter tournaments with a broker. Prize pool split among top 4.' :
                 tab === 'globalBoss' ? 'Run battles to deal damage. Top damagers share reward pool when boss is defeated.' :
                 tab === 'predict' ? 'Bet AIBA on which broker scores higher. Battle of the hour—3% vig to treasury.' :
                 tab === 'trainers' ? 'Global trainers network. Apply to earn AIBA, recruit trainers, claim rewards.' :
                 tab === 'profile' ? 'Your profile, balances, badges, and account details.' :
                 tab === 'settings' ? 'App preferences, notifications, theme, and more.' :
                 tab === 'games' ? 'Other apps and games in the ecosystem. Add more in config.' :
                 tab === 'staking' ? 'Yield Vault: lock AIBA, earn APY. Flexible or locked periods. Higher APY for longer.' :
                 'Daily NEUR, stake AIBA, or claim on-chain after a battle.'}
            </p>

            <div className="tab-content">
                {/* ─── Home ───────────────────────────────────────────────────── */}
                <section className={`tab-panel major-tab major-tab--home ${tab === 'home' ? 'is-active' : ''}`} aria-hidden={tab !== 'home'}>
                    {/* 3D Super Power Arena showcase — visible on Home for discoverability */}
                    <button type="button" className="arena-visual arena-visual--hero" onClick={() => setTab('arenas')} style={{ cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left', background: 'transparent', padding: 0 }} aria-label="View 3D Super Power Arenas">
                        <span className="arena-visual__label">3D Super Power Futuristic Arenas</span>
                        <span className="arena-visual__cta" style={{ position: 'absolute', top: 12, right: 12, fontSize: '0.65rem', opacity: 0.9 }}>Battle →</span>
                    </button>
                    {/* Welcome message */}
                    <p className="home-welcome">
                        Welcome back {tgUser?.first_name || tgUser?.username || 'there'}!
                    </p>
                    {/* Global search bar */}
                    <div className="home-search-wrap">
                        <span className="home-search__icon" aria-hidden><IconSearch /></span>
                        <input
                            type="search"
                            className="home-search__input"
                            placeholder="Search brokers, market, arenas..."
                            value={dashboardSearch}
                            onChange={(e) => setDashboardSearch(e.target.value)}
                            aria-label="Search brokers, market, and arenas"
                        />
                    </div>
                    {/* Search results (when query present) */}
                    {dashboardSearch.trim() ? (() => {
                        const q = dashboardSearch.trim().toLowerCase();
                        const arenaMatches = arenaOptions.filter((a) => a.label.toLowerCase().includes(q) || a.value.toLowerCase().includes(q));
                        const brokerMatches = brokers.filter((b) => String(b._id).toLowerCase().includes(q) || String(`${b.intelligence}${b.speed}${b.risk}`).includes(q));
                        const gridMatches = HOME_GRID_ITEMS.filter((g) => g.label.toLowerCase().includes(q));
                        const marketMatch = /market|buy|sell|listing/i.test(q);
                        const hasResults = arenaMatches.length > 0 || brokerMatches.length > 0 || gridMatches.length > 0 || marketMatch;
                        if (!hasResults) return <p className="guide-tip" style={{ marginTop: 8 }}>No matches. Try arena names, broker IDs, or feature names.</p>;
                        return (
                            <div className="home-search-panel card" style={{ marginTop: 8 }}>
                                {arenaMatches.length > 0 ? (
                                    <div className="home-search-results__group">
                                        <span className="home-search-results__label">Arenas</span>
                                        {arenaMatches.map((a) => (
                                            <button key={a.value} type="button" className="home-search-results__item" onClick={() => { setArena(a.value); setTab('arenas'); setDashboardSearch(''); }}>{a.label}</button>
                                        ))}
                                    </div>
                                ) : null}
                                {brokerMatches.length > 0 ? (
                                    <div className="home-search-results__group">
                                        <span className="home-search-results__label">Brokers</span>
                                        {brokerMatches.slice(0, 5).map((b) => (
                                            <button key={b._id} type="button" className="home-search-results__item" onClick={() => { setSelectedBrokerId(b._id); setTab('brokers'); setDashboardSearch(''); }}>#{b._id.slice(-6)} INT{b.intelligence} SPD{b.speed}</button>
                                        ))}
                                    </div>
                                ) : null}
                                {marketMatch ? (
                                    <div className="home-search-results__group">
                                        <button type="button" className="home-search-results__item" onClick={() => { setTab('market'); setDashboardSearch(''); }}>Go to Super Futuristic Unified Marketplace</button>
                                    </div>
                                ) : null}
                                {gridMatches.length > 0 ? (
                                    <div className="home-search-results__group">
                                        <span className="home-search-results__label">Features</span>
                                        {gridMatches.map((g) => (
                                            <button key={g.id} type="button" className="home-search-results__item" onClick={() => { setTab(g.id); setDashboardSearch(''); }}>{g.label}</button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })() : null}
                    {/* 4×4 icon grid */}
                    <div className="home-grid" aria-label="Quick access to features">
                        {HOME_GRID_ITEMS.map(({ id, label, Icon, badge, gridStyle }) => (
                            <button
                                key={id}
                                type="button"
                                className={`home-grid__item ${gridStyle ? `home-grid__item--${gridStyle}` : ''}`}
                                onClick={() => setTab(id)}
                                aria-label={badge ? `${label} ${badge}` : label}
                            >
                                <span className="home-grid__icon"><Icon /></span>
                                <span className="home-grid__label">
                                    {label}
                                    {badge === 'NEW' ? <span className="badge-new">{badge}</span> : null}
                                </span>
                            </button>
                        ))}
                    </div>
                    {/* Quick-access strip: CoE · NFT Gallery · Yield Vault · DAO */}
                    <div className="home-featured-strip" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                        <button type="button" className="btn btn--secondary" onClick={() => setTab('coe')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconCoe /> CoE</button>
                        <button type="button" className="btn btn--secondary" onClick={() => setTab('nftGallery')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconMultiverse /> NFT Gallery</button>
                        <button type="button" className="btn btn--primary" onClick={() => setTab('staking')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconStake /> Yield Vault</button>
                        <button type="button" className="btn btn--secondary" onClick={() => setTab('dao')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconGov /> DAO</button>
                    </div>
                    <div className="card card--elevated home-overview__yield-vault" style={{ marginTop: 16 }}>
                        <div className="card__title"><IconStake /> Yield Vault — stake AIBA, earn APY</div>
                        <p className="card__hint">Lock AIBA for flexible or locked periods. Higher APY for longer locks.</p>
                        <button type="button" className="btn btn--primary" style={{ marginTop: 10 }} onClick={() => setTab('staking')}><IconStake /> Open Yield Vault</button>
                    </div>
                    <div className="card card--elevated home-overview major-tab__hero" style={{ borderLeft: '4px solid var(--accent-gold)', marginTop: 12 }}>
                        <div className="card__title">Home Command Center</div>
                        <p className="card__hint">Your dashboard. Go to Brokers for New broker, Tasks, Run battle, and Vault.</p>
                        <div className="home-overview__stats">
                            <span className="home-stat-pill">AIBA {Number(economyMe?.aibaBalance ?? 0)}</span>
                            <span className="home-stat-pill">NEUR {Number(economyMe?.neurBalance ?? 0)}</span>
                            <span className="home-stat-pill">Stars {Number(economyMe?.starsBalance ?? 0)}</span>
                            <span className="home-stat-pill">Brokers {brokers.length}</span>
                        </div>
                        <button type="button" className="btn btn--secondary" style={{ marginTop: 12 }} onClick={() => setTab('staking')}><IconStake /> Yield Vault</button>
                    </div>
                    <div className="card" style={{ marginTop: 12, borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title">Seasonal events <span className="badge-new">NEW</span></div>
                        <p className="card__hint">Limited-time modes, double rewards, and exclusive arenas. Check Tournaments and Global Boss for active events.</p>
                    </div>
                </section>

                {/* ─── Trainers ───────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'trainers' ? 'is-active' : ''}`} aria-hidden={tab !== 'trainers'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)', marginBottom: 16 }}>
                        <div className="card__title"><IconTrainer /> Global Trainers &amp; Coaches</div>
                        <p className="card__hint">Earn AIBA when you help players learn. Apply to become a trainer, recruit others, and claim rewards.</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                            {!trainerMe ? (
                                <button type="button" className="btn btn--primary" onClick={applyAsTrainer} disabled={busy}><IconTrainer /> Apply as trainer</button>
                            ) : (
                                <>
                                    {trainerMe.status === 'approved' ? (
                                        <>
                                            <button type="button" className="btn btn--success" onClick={claimTrainerRewards} disabled={busy || (trainerMe.rewardsEarnedAiba ?? 0) <= 0}>Claim {(trainerMe.rewardsEarnedAiba ?? 0) > 0 ? `${trainerMe.rewardsEarnedAiba} AIBA` : 'rewards'}</button>
                                            {trainerMe.code ? (
                                                <div style={{ flex: '1 1 100%', marginTop: 8 }}>
                                                    <p className="card__hint">Recruit link — share to invite new trainers:</p>
                                                    <code style={{ wordBreak: 'break-all', fontSize: '0.8rem', display: 'block', marginTop: 4 }}>
                                                        {typeof window !== 'undefined' ? `${window.location.origin}/trainer?ref=${String(trainerMe.code || '').toUpperCase()}` : `/trainer?ref=${trainerMe.code}`}
                                                    </code>
                                                    <button type="button" className="btn btn--ghost" style={{ marginTop: 6, fontSize: 12 }} onClick={() => { const u = typeof window !== 'undefined' ? `${window.location.origin}/trainer?ref=${String(trainerMe.code || '').toUpperCase()}` : ''; if (u && navigator?.clipboard) navigator.clipboard.writeText(u).then(() => setTrainerApplyMsg('Copied!')); }}>Copy link</button>
                                                </div>
                                            ) : null}
                                        </>
                                    ) : (
                                        <p className="card__hint" style={{ color: 'var(--accent-gold)' }}>Status: {trainerMe.status}. Awaiting approval. Code: {trainerMe.code || '—'}</p>
                                    )}
                                </>
                            )}
                            <Link href="/trainer" className="btn btn--secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><IconTrainer /> Full portal</Link>
                        </div>
                        {trainerApplyMsg ? <p className={`status-msg ${trainerApplyMsg.includes('Claimed') || trainerApplyMsg.includes('submitted') || trainerApplyMsg.includes('Already') ? 'status-msg--success' : ''}`} style={{ marginTop: 12 }}>{trainerApplyMsg}</p> : null}
                        {trainerClaimMsg ? <p className={`status-msg ${trainerClaimMsg.includes('Claimed') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{trainerClaimMsg}</p> : null}
                    </div>
                    <div className="card card--elevated" style={{ marginBottom: 12 }}>
                        <div className="card__title">Leaderboard</div>
                        <div style={{ marginBottom: 8 }}>
                            {['impact', 'referred', 'recruited', 'rewards'].map((b) => (
                                <button key={b} type="button" className={`btn btn--ghost ${trainersSortBy === b ? 'btn--primary' : ''}`} style={{ marginRight: 6, marginBottom: 4, fontSize: 12 }} onClick={() => { setTrainersSortBy(b); refreshTrainersLeaderboard(); }}>{b === 'impact' ? 'Impact' : b === 'referred' ? 'Referred' : b === 'recruited' ? 'Recruited' : 'Rewards'}</button>
                            ))}
                        </div>
                        {trainersLeaderboard.length === 0 ? (
                            <p className="card__hint">No trainers yet.</p>
                        ) : (
                            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                                {trainersLeaderboard.slice(0, 15).map((t, i) => (
                                    <div key={t._id || i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                                        #{t.rank ?? i + 1} {t.displayName || t.username || t.code} · {trainersSortBy === 'referred' ? `${t.referredUserCount ?? 0} refs` : trainersSortBy === 'recruited' ? `${t.recruitedTrainerCount ?? 0} recruited` : trainersSortBy === 'rewards' ? `${t.rewardsEarnedAiba ?? 0} AIBA` : `Impact ${t.totalImpactScore ?? 0}`}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title">Rewards</div>
                        <p className="card__hint">5 AIBA per referred user (3+ battles). 20 AIBA per trainer you recruit (when approved).</p>
                    </div>
                </section>

                {/* ─── Tasks (Personalized for all user kinds) ─────────────────── */}
                <section className={`tab-panel ${tab === 'tasks' ? 'is-active' : ''}`} aria-hidden={tab !== 'tasks'}>
                    <div className="card card--elevated tasks-hero" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title">Task Center</div>
                        <p className="card__hint">Personalized mission queue for every player profile: newcomer, fighter, trader, racer, social, scholar, and investor.</p>
                        <div className="action-row action-row--android">
                            <button type="button" className="btn btn--secondary" onClick={refreshTasks} disabled={busy}><IconRefresh /> Refresh tasks</button>
                            <TabBackNav previousTab={previousTabRef.current} onGoToPrevious={() => setTab(previousTabRef.current)} onGoToHome={() => setTab('home')} disabled={busy} />
                        </div>
                        {Array.isArray(taskProfile?.userKinds) && taskProfile.userKinds.length > 0 ? (
                            <div className="tasks-kinds">
                                {taskProfile.userKinds.map((k) => (
                                    <span key={k} className="task-chip">{k}</span>
                                ))}
                            </div>
                        ) : null}
                        {tasksMsg ? <p className="status-msg status-msg--error" style={{ marginTop: 8 }}>{tasksMsg}</p> : null}
                    </div>
                    <div className="card tasks-list-card">
                        <div className="card__title">Your task queue</div>
                        {taskFeed.length === 0 ? (
                            <p className="guide-tip">No tasks available yet. Tap Refresh tasks.</p>
                        ) : (
                            <ul className="tasks-list">
                                {taskFeed.map((t, i) => (
                                    <li key={t.id || i} className="task-item">
                                        <div className="task-item__head">
                                            <strong>{t.title || 'Task'}</strong>
                                            <span className={`badge-pill ${t.completed ? '' : 'badge-pill--inline'}`} style={{ borderColor: t.completed ? 'var(--accent-green)' : 'var(--border-subtle)', color: t.completed ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                                                {t.completed ? 'Completed' : 'Open'}
                                            </span>
                                        </div>
                                        {t.description ? <p className="card__hint task-item__desc">{t.description}</p> : null}
                                        <div className="task-item__meta">
                                            {t.category ? <span className="task-chip">Category: {t.category}</span> : null}
                                            {Array.isArray(t.userKinds) && t.userKinds.length > 0 ? <span className="task-chip">For: {t.userKinds.join(', ')}</span> : null}
                                            {(Number(t.rewardAiba || 0) > 0 || Number(t.rewardNeur || 0) > 0) ? (
                                                <span className="task-chip">Reward hint: {Number(t.rewardAiba || 0)} AIBA / {Number(t.rewardNeur || 0)} NEUR</span>
                                            ) : null}
                                        </div>
                                        {t.ctaTab ? (
                                            <button type="button" className="btn btn--primary" onClick={() => setTab(String(t.ctaTab))} disabled={busy || Boolean(t.completed)}>
                                                {t.ctaLabel || 'Open'}
                                            </button>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                {/* ─── Referrals (full) ─────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'referrals' ? 'is-active' : ''}`} aria-hidden={tab !== 'referrals'}>
                    {(myReferral?.uses ?? 0) < 3 ? (
                        <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)', marginBottom: 12 }}>
                            <div className="card__title">Invite 3 to unlock <span className="badge-new">NEW</span></div>
                            <p className="card__hint">Invite <strong>3 friends</strong> to unlock premium arena perks and bonus rewards. You have <strong>{myReferral?.uses ?? 0}/3</strong> — share your link below!</p>
                        </div>
                    ) : (
                        <div className="card" style={{ borderLeft: '4px solid var(--accent-green)', marginBottom: 12 }}>
                            <div className="card__title">Unlocked</div>
                            <p className="card__hint">You invited 3+ friends! Premium arena perks are unlocked. Keep sharing for 10× and 100× referral bonuses.</p>
                        </div>
                    )}
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title"><IconShare /> Referrals &amp; Creator Economy</div>
                        <p className="card__hint">Share your code or enter someone else&apos;s. You both earn NEUR and AIBA (wallet required to apply).</p>
                        <p className="card__hint" style={{ marginTop: 8, padding: 8, background: 'rgba(255, 204, 0, 0.12)', borderRadius: 8, borderLeft: '3px solid var(--accent-gold)' }}>
                            <strong>Creator Economy:</strong> Earn 2–7% of your referrals&apos; battle, race, tournament, and boss rewards.
                            {myReferral ? (
                                <span> Your tier: <strong>{(myReferral.uses ?? 0) >= 10000 ? '7%' : (myReferral.uses ?? 0) >= 1000 ? '5%' : (myReferral.uses ?? 0) >= 100 ? '3%' : '2%'}</strong>
                                    {(myReferral.uses ?? 0) < 100 ? ' · Reach 100 refs for 3%' : (myReferral.uses ?? 0) < 1000 ? ' · Reach 1k for 5%' : (myReferral.uses ?? 0) < 10000 ? ' · Reach 10k for 7%' : ' (max tier)'}</span>
                            ) : null}
                        </p>
                        <div className="action-row">
                            <button type="button" className="btn btn--secondary" onClick={createReferral} disabled={busy}><IconShare /> My code</button>
                        </div>
                        {myReferral?.code ? (
                            <>
                                <p className="card__hint" style={{ marginTop: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-gold)' }}>Your referral link</p>
                                <p className="card__hint" style={{ marginTop: 4 }}>Share this link — when friends open it and apply your code, you both get bonuses.</p>
                                {(() => {
                                    const base = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'https://aiba-arena2-miniapp.vercel.app').replace(/\/+$/, '');
                                    const refLink = `${base}/?ref=${encodeURIComponent(String(myReferral.code).toUpperCase())}`;
                                    return (
                                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <a href={refLink} target="_blank" rel="noopener noreferrer" className="card__hint" style={{ wordBreak: 'break-all', color: 'var(--accent-gold)', textDecoration: 'underline', fontSize: '0.85rem' }}>{refLink}</a>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                <button type="button" className="btn btn--primary" onClick={() => { if (shareViaTelegram({ text: `Join me on AIBA Arena! Use my referral code: ${String(myReferral.code).toUpperCase()}`, url: refLink })) setRefMsg('Share opened!'); else { if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) { navigator.clipboard.writeText(refLink).then(() => setRefMsg('Link copied!')).catch(() => setRefMsg('Copy failed.')); } else { setRefMsg(refLink); } } }}><IconShare /> Share via Telegram</button>
                                                <button type="button" className="btn btn--secondary" onClick={() => { if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) { navigator.clipboard.writeText(refLink).then(() => setRefMsg('Link copied!')).catch(() => setRefMsg('Copy failed.')); } else { setRefMsg(refLink); } }}>Copy link</button>
                                                <button type="button" className="btn btn--secondary" onClick={() => { const code = String(myReferral.code).toUpperCase(); const msg = `Join me on AIBA Arena! Use my referral code: ${code}\n${refLink}`; if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) { navigator.clipboard.writeText(msg).then(() => setRefMsg('Share message copied!')).catch(() => setRefMsg('Copy failed.')); } else { setRefMsg(msg); } }}>Copy message</button>
                                            </div>
                                            {(myReferral.uses ?? 0) > 0 ? (
                                                <p className="guide-tip" style={{ marginTop: 12 }}>
                                                    Milestones: <strong>10 referrals → 2× bonus</strong> · <strong>100 referrals → 5× bonus</strong>. You have {myReferral.uses ?? 0} — {myReferral.uses >= 100 ? '5× active!' : myReferral.uses >= 10 ? '2× active!' : 'reach 10 for 2×.'}
                                                </p>
                                            ) : (
                                                <p className="guide-tip" style={{ marginTop: 12 }}>Reach <strong>10 referrals</strong> for 2× bonus, <strong>100</strong> for 5× bonus.</p>
                                            )}
                                        </div>
                                    );
                                })()}
                            </>
                        ) : null}
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input className="input" value={refCodeInput} onChange={(e) => setRefCodeInput(e.target.value)} placeholder="Friend's code" style={{ flex: '1 1 180px' }} />
                            <button type="button" className="btn btn--primary" onClick={useReferral} disabled={busy || !refCodeInput.trim()}>Apply</button>
                        </div>
                        {refMsg ? <p className="status-msg status-msg--success" style={{ marginTop: 8 }}>{refMsg}</p> : null}
                    </div>
                    <div className="card" style={{ marginTop: 12 }}>
                        <div className="card__title">Top referrers</div>
                        <p className="card__hint">Users who referred the most friends. Share your link to climb the ranks.</p>
                        <button type="button" className="btn btn--secondary" onClick={refreshTopReferrers} disabled={busy} style={{ marginTop: 8 }}><IconRefresh /> Refresh</button>
                        {topReferrers.length > 0 ? (
                            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                                {topReferrers.map((r, i) => (
                                    <div key={r.telegramId || i} className="list-item">
                                        <span className="list-item__rank">#{i + 1}</span>
                                        <span className="list-item__name">
                                            {r.username || r.telegramId || 'Anonymous'}
                                            {i < 3 ? (
                                                <span className="badge-pill badge-pill--inline" style={{ marginLeft: 8, borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }} title="Top referrer">
                                                    {i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}
                                                </span>
                                            ) : null}
                                        </span>
                                        <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{r.uses ?? 0} referrals</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="guide-tip" style={{ marginTop: 12 }}>No referrers yet. Be the first — share your link!</p>
                        )}
                    </div>
                    <div className="card" style={{ marginTop: 12, borderLeft: '4px solid var(--border-subtle)' }}>
                        <div className="card__title">Viral K-factor <span className="badge-new">NEW</span></div>
                        <p className="card__hint">K = invites × conversion. Target K &gt; 0.3 for viral growth. You have {myReferral?.uses ?? 0} referrals. Invite 3 at 15% convert → K=0.45.</p>
                    </div>
                    <div className="card" style={{ marginTop: 12, borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title">Become a trainer</div>
                        <p className="card__hint">Train players, recruit trainers, earn AIBA. Exclusive digital portal.</p>
                        <a href="/trainer" className="btn btn--secondary" style={{ marginTop: 8, display: 'inline-block' }}>Open trainer portal</a>
                    </div>
                </section>

                {/* ─── Tournaments ───────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'tournaments' ? 'is-active' : ''}`} aria-hidden={tab !== 'tournaments'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title"><IconTrophy /> Tournaments <span className="badge-new">NEW</span></div>
                        <p className="card__hint">Enter tournaments with a broker. Pay AIBA to join; top 4 share the prize pool when full.</p>
                        <button type="button" className="btn btn--secondary" onClick={refreshTournaments} disabled={busy} style={{ marginTop: 8 }}><IconRefresh /> Refresh</button>
                        {tournamentsMsg ? <p className={`status-msg ${tournamentsMsg.includes('Entered') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{tournamentsMsg}</p> : null}
                    </div>
                    {tournaments.length === 0 ? (
                        <p className="guide-tip" style={{ marginTop: 12 }}>No tournaments yet. Admins create them.</p>
                    ) : (
                        <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                            {tournaments.map((t) => {
                                const detail = tournamentDetail?._id === t._id ? tournamentDetail : null;
                                const entryCount = detail?.entries?.length ?? t.entries?.length ?? 0;
                                return (
                                    <div key={t._id} className="card">
                                        <div className="card__title">{t.name || t.league || 'Tournament'}</div>
                                        <p className="card__hint">Pool: {t.prizePoolAiba ?? 0} AIBA · Entry: {t.entryCostAiba ?? 0} AIBA · Status: {t.status} · Entries: {detail ? `${detail.entries?.length ?? 0}/${t.maxEntries ?? 0}` : `${t.maxEntries ?? 0} max`}</p>
                                        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <button type="button" className="btn btn--ghost" onClick={() => tournamentDetail?._id === t._id ? setTournamentDetail(null) : fetchTournamentDetail(t._id)} disabled={busy}>{tournamentDetail?._id === t._id ? 'Hide details' : 'View details'}</button>
                                            {t.status === 'open' && entryCount < (t.maxEntries ?? 0) ? (
                                                <>
                                                    <select className="select" value={selectedTournament === t._id ? tournamentBrokerId : ''} onChange={(e) => { setSelectedTournament(t._id); setTournamentBrokerId(e.target.value); }}>
                                                        <option value="">Select broker</option>
                                                        {brokers.filter((b) => !b.guildId).map((b) => (
                                                            <option key={b._id} value={b._id}>{b.specialty || 'Broker'} #{String(b._id).slice(-6)}</option>
                                                        ))}
                                                    </select>
                                                    <button type="button" className="btn btn--primary" onClick={() => enterTournament(t._id, selectedTournament === t._id ? tournamentBrokerId : null)} disabled={busy || !(selectedTournament === t._id && tournamentBrokerId)}>Enter</button>
                                                </>
                                            ) : null}
                                        </div>
                                        {detail?.entries && Array.isArray(detail.entries) && detail.entries.length > 0 ? (
                                            <div style={{ marginTop: 12, padding: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                                                <p className="card__hint" style={{ marginBottom: 8 }}>Entered brokers:</p>
                                                <ol style={{ margin: 0, paddingLeft: 20, fontSize: '0.85rem' }}>
                                                    {detail.entries.slice(0, 20).map((e, i) => (
                                                        <li key={e._id || i}>#{e.brokerId?._id ? String(e.brokerId._id).slice(-6) : '—'} · {e.brokerId?.specialty || 'Broker'}</li>
                                                    ))}
                                                </ol>
                                                {detail.entries.length > 20 ? <p className="card__hint" style={{ marginTop: 6 }}>… and {detail.entries.length - 20} more</p> : null}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ─── Global Boss ──────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'globalBoss' ? 'is-active' : ''}`} aria-hidden={tab !== 'globalBoss'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-magenta)' }}>
                        <div className="card__title"><IconBoss /> Global Boss <span className="badge-new badge-new--magenta">NEW</span></div>
                        <p className="card__hint">Run battles to deal damage. When the boss is defeated, top damagers share the reward pool.</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                            <button type="button" className="btn btn--secondary" onClick={refreshGlobalBoss} disabled={busy}><IconRefresh /> Refresh</button>
                            {globalBoss?.active ? (
                                <button type="button" className="btn btn--primary" onClick={() => setTab('arenas')}><IconRun /> Run battle to deal damage</button>
                            ) : null}
                        </div>
                    </div>
                    {!globalBoss?.active ? (
                        <p className="guide-tip" style={{ marginTop: 12 }}>No active boss. Admins spawn bosses. Run battles when one is active—your score counts as damage.</p>
                    ) : (
                        <div style={{ marginTop: 12 }}>
                            <div className="card">
                                <div className="card__title">Boss: {globalBoss.name || 'Raid Boss'}</div>
                                <p className="card__hint">HP: {globalBoss.currentHp ?? 0} / {globalBoss.totalHp ?? 0} · Reward pool: {globalBoss.rewardPoolAiba ?? 0} AIBA</p>
                                {(() => {
                                    const myTgId = tgUser?.id ? String(tgUser.id) : '';
                                    const myDmg = Array.isArray(globalBoss.topDamagers) && myTgId ? globalBoss.topDamagers.find((d) => String(d._id) === myTgId) : null;
                                    return myDmg ? <p className="card__hint" style={{ marginTop: 6, color: 'var(--accent-magenta)', fontWeight: 600 }}>Your damage: {myDmg.totalDamage ?? 0}</p> : null;
                                })()}
                                <div style={{ marginTop: 8, height: 12, background: 'var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.max(0, Math.min(100, 100 * (globalBoss.currentHp ?? 0) / (globalBoss.totalHp || 1)))}%`, height: '100%', background: 'var(--accent-magenta)', borderRadius: 6 }} />
                                </div>
                            </div>
                            {Array.isArray(globalBoss.topDamagers) && globalBoss.topDamagers.length > 0 ? (
                                <div className="card" style={{ marginTop: 12 }}>
                                    <div className="card__title">Top damagers</div>
                                    {globalBoss.topDamagers.slice(0, 10).map((d, i) => {
                                        const myTgId = tgUser?.id ? String(tgUser.id) : '';
                                        const isYou = myTgId && String(d._id) === myTgId;
                                        return (
                                            <div key={d._id || i} className="list-item">
                                                <span className="list-item__rank">#{i + 1}</span>
                                                <span className="list-item__name">{isYou ? <strong style={{ color: 'var(--accent-magenta)' }}>You</strong> : `User ${String(d._id || '').slice(-8) || '—'}`}</span>
                                                <span style={{ color: 'var(--accent-magenta)', fontWeight: 600 }}>{d.totalDamage ?? 0} dmg</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    )}
                </section>

                {/* ─── Predict (Bet on battles) ──────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'predict' ? 'is-active' : ''}`} aria-hidden={tab !== 'predict'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title"><IconBet /> Predict <span className="badge-new badge-new--cyan">NEW</span></div>
                        <p className="card__hint">Battle of the hour: bet AIBA on which broker scores higher. Admins create events; 3% vig goes to treasury. Max bet per event in Admin → Economy.</p>
                        <button type="button" className="btn btn--secondary" onClick={refreshPredictEvents} disabled={busy} style={{ marginTop: 8 }}><IconRefresh /> Refresh</button>
                        {predictMsg ? <p className={`status-msg ${predictMsg.includes('placed') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{predictMsg}</p> : null}
                    </div>
                    {predictEvents.length === 0 ? (
                        <p className="guide-tip" style={{ marginTop: 12 }}>No open events. Admins create predict events in Admin → Predict.</p>
                    ) : (
                        <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                            {predictEvents.map((ev) => (
                                <div key={ev._id} className="card">
                                    <div className="card__title">Broker A vs Broker B</div>
                                    <p className="card__hint">
                                        A: #{ev.brokerAId?._id ? String(ev.brokerAId._id).slice(-6) : '—'} (INT{ev.brokerAId?.intelligence ?? '?'} SPD{ev.brokerAId?.speed ?? '?'}) · B: #{ev.brokerBId?._id ? String(ev.brokerBId._id).slice(-6) : '—'} (INT{ev.brokerBId?.intelligence ?? '?'} SPD{ev.brokerBId?.speed ?? '?'})
                                        {ev.maxBetAiba ? ` · Max bet: ${ev.maxBetAiba} AIBA` : ''}
                                    </p>
                                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <select className="select" value={predictBetEventId === ev._id ? predictBetBrokerId : ''} onChange={(e) => { setPredictBetEventId(ev._id); setPredictBetBrokerId(e.target.value); }}>
                                            <option value="">Pick winner</option>
                                            <option value={ev.brokerAId?._id}>Broker A</option>
                                            <option value={ev.brokerBId?._id}>Broker B</option>
                                        </select>
                                        <input className="input" type="number" min={1} value={predictBetEventId === ev._id ? predictBetAmount : ''} onChange={(e) => setPredictBetAmount(e.target.value)} placeholder="Amount AIBA" style={{ width: 100 }} />
                                        <button type="button" className="btn btn--primary" onClick={() => placePredictBet(ev._id, predictBetBrokerId, predictBetAmount)} disabled={busy || !predictBetBrokerId || !predictBetAmount || parseInt(predictBetAmount, 10) < 1}>Place bet</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title">What are brokers?</div>
                        <p className="card__hint">{BROKERS_EXPLANATION}</p>
                    </div>
                    <div className="action-row action-row--android">
                        <button type="button" className="btn btn--secondary" onClick={createStarterBroker} disabled={busy}><IconBrokers /> New broker</button>
                        <button type="button" className="btn btn--secondary" onClick={() => setTab('tasks')} disabled={busy}><IconTasks /> Tasks</button>
                        <button type="button" className="btn btn--secondary" onClick={refreshBrokers} disabled={busy}><IconRefresh /> Refresh</button>
                        <button type="button" className="btn btn--primary" onClick={runBattle} disabled={busy || !selectedBrokerId}><IconRun /> Run battle</button>
                        <button type="button" className="btn btn--secondary" onClick={refreshVaultInventory} disabled={busy}><IconVault /> Vault</button>
                    </div>
                    {status ? <p className={`status-msg ${status.toLowerCase().includes('fail') || status.includes('unreachable') ? 'status-msg--error' : ''}`} style={{ marginTop: 8, marginBottom: 0 }}>{status}</p> : null}
                    {vaultInfo ? (
                        <div className="card card--elevated">
                            <div className="card__title">Vault</div>
                            <p className="card__hint" style={{ wordBreak: 'break-all' }}>Address: {vaultInfo.vaultAddress}</p>
                            <p className="card__hint">TON (nano): {vaultInfo.tonBalanceNano} · Jetton: {vaultInfo.jettonBalance}</p>
                        </div>
                    ) : null}
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
                        {brokers.length >= 2 ? (
                            <div className="card" style={{ marginTop: 10, borderLeft: '4px solid var(--accent-magenta)' }}>
                                <div className="card__title"><IconBreed /> Breeding <span className="badge-new badge-new--magenta">NEW</span></div>
                                <p className="card__hint">Combine 2 brokers into 1 new broker (burns both). Cost: ~200 AIBA. Offspring inherits averaged stats.</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                                    <select className="select" value={breedBrokerA} onChange={(e) => setBreedBrokerA(e.target.value)}><option value="">Parent A</option>{brokers.map((b) => <option key={b._id} value={b._id}>#{b._id.slice(-6)}</option>)}</select>
                                    <select className="select" value={breedBrokerB} onChange={(e) => setBreedBrokerB(e.target.value)}><option value="">Parent B</option>{brokers.filter((b) => b._id !== breedBrokerA).map((b) => <option key={b._id} value={b._id}>#{b._id.slice(-6)}</option>)}</select>
                                    <button type="button" className="btn btn--primary" onClick={breedBrokers} disabled={busy || !breedBrokerA || !breedBrokerB}><IconBreed /> Breed</button>
                                </div>
                                {breedingMsg ? <p className={`status-msg ${breedingMsg.includes('Bred') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{breedingMsg}</p> : null}
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
                            <p className="guide-tip">No brokers. Create a starter broker above.</p>
                        ) : (
                            <select className="select" value={selectedBrokerId} onChange={(e) => setSelectedBrokerId(e.target.value)} style={{ minWidth: '100%', marginTop: 6 }}>
                                {brokers.map((b) => (
                                    <option key={b._id} value={b._id}>#{b._id.slice(-6)} INT{b.intelligence} SPD{b.speed} RISK{b.risk} Lv{b.level ?? 1} energy {b.energy}</option>
                                ))}
                            </select>
                        )}
                        {selectedBrokerId && brokers.length > 0 ? (
                            <div className="card" style={{ marginTop: 10, padding: 12, borderLeft: '4px solid var(--accent-cyan)' }}>
                                <div className="card__title">Improve broker</div>
                                <p className="card__hint">Train (+1 stat, NEUR) · Repair (energy 100, NEUR) · Upgrade (+2 stat, +1 level, AIBA).</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                                    <select className="select" value={trainStat} onChange={(e) => setTrainStat(e.target.value)} style={{ minWidth: 0 }}>
                                        <option value="intelligence">INT</option>
                                        <option value="speed">SPD</option>
                                        <option value="risk">RISK</option>
                                    </select>
                                    <button type="button" className="btn btn--secondary" onClick={trainBroker} disabled={busy} title={`${Number(economyMe?.economy?.trainNeurCost ?? 25)} NEUR`}>Train (+1)</button>
                                    <button type="button" className="btn btn--secondary" onClick={repairBroker} disabled={busy} title={`${Number(economyMe?.economy?.repairNeurCost ?? 15)} NEUR`}>Repair</button>
                                    <select className="select" value={upgradeStat} onChange={(e) => setUpgradeStat(e.target.value)} style={{ minWidth: 0 }}>
                                        <option value="intelligence">INT</option>
                                        <option value="speed">SPD</option>
                                        <option value="risk">RISK</option>
                                    </select>
                                    <button type="button" className="btn btn--primary" onClick={upgradeBroker} disabled={busy} title={`${Number(economyMe?.economy?.upgradeAibaCost ?? 50)} AIBA`}>Upgrade (+2)</button>
                                </div>
                                {brokerActionMsg ? <p className={`status-msg ${brokerActionMsg.includes('failed') ? 'status-msg--error' : 'status-msg--success'}`} style={{ marginTop: 8 }}>{brokerActionMsg}</p> : null}
                            </div>
                        ) : null}
                    </div>
                    <div className="card card--elevated">
                        <div className="card__title">Arena & battle</div>
                        <p className="card__hint">Pick broker above, then Run battle.</p>
                        <p className="card__hint" style={{ marginTop: 10 }}>Arena</p>
                        <select className="select" value={arena} onChange={(e) => setArena(e.target.value)} style={{ marginTop: 4, minWidth: '100%' }}>
                            {arenaOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        {currentMode ? (
                            <p className="card__hint" style={{ marginTop: 8, fontSize: '0.85rem' }}>
                                Energy {currentMode.energyCost ?? 1} · Cooldown {currentMode.cooldownSeconds ?? 30}s
                                {(currentMode.entryNeurCost > 0 || currentMode.entryAibaCost > 0) ? ` · Entry: ${currentMode.entryNeurCost > 0 ? `${currentMode.entryNeurCost} NEUR` : ''}${currentMode.entryNeurCost > 0 && currentMode.entryAibaCost > 0 ? ' / ' : ''}${currentMode.entryAibaCost > 0 ? `${currentMode.entryAibaCost} AIBA` : ''}` : ''}
                                {((currentMode.rewardMultiplierAiba ?? 1) !== 1 || (currentMode.rewardMultiplierNeur ?? 1) !== 1) ? ` · Rewards: Aiba×${Number(currentMode.rewardMultiplierAiba ?? 1)}, Neur×${Number(currentMode.rewardMultiplierNeur ?? 1)}` : ''}
                            </p>
                        ) : null}
                        {(arena === 'guildWars' || arena.startsWith?.('guildWars:')) ? <p className="guide-tip">Guild Wars requires a guild. Rewards go to guild treasury.</p> : null}
                    </div>
                    {battle ? (
                        <>
                            <div className="arena-visual" role="img" aria-label="Battle arena">
                                <span className="arena-visual__label">Victory</span>
                            </div>
                            <div className="card card--elevated">
                                <div className="card__title">Battle result</div>
                                <div className="victory-card">
                                    <div className="victory-card__badge">Victory</div>
                                    <div className="victory-card__score">Score {battle.score}</div>
                                    <div className="victory-card__meta">
                                        {(arena.includes(':') ? arena.split(':')[0] : arena)} · {Number(battle.rewardAiba ?? 0)} AIBA
                                        {Number(battle.starsGranted ?? 0) > 0 ? ` · +${battle.starsGranted} Stars` : ''}
                                        {Number(battle.firstWinDiamond ?? 0) > 0 ? ` · +${battle.firstWinDiamond} Diamond (first win!)` : ''}
                                    </div>
                                    <button type="button" className="btn btn--primary" onClick={() => { const text = `My broker scored ${battle.score} in ${arena}! Reward: ${battle.rewardAiba} AIBA.`; shareViaTelegram({ title: 'AIBA Arena', text, url: window?.location?.href || '' }); }}><IconShare /> Share</button>
                                </div>
                                {ad?.imageUrl ? (
                                    <div className="ad-box">
                                        <div className="ad-box__label">Sponsored</div>
                                        <img src={ad.imageUrl} alt="ad" onClick={() => { const u = String(ad?.linkUrl || '').trim(); if (u) (window?.Telegram?.WebApp?.openLink || window.open)(u, '_blank'); }} />
                                        {ad.linkUrl ? <button type="button" className="btn btn--secondary" style={{ marginTop: 8 }} onClick={() => { const u = String(ad?.linkUrl || '').trim(); if (u) (window?.Telegram?.WebApp?.openLink || window.open)(u, '_blank'); }}>Open link</button> : null}
                                    </div>
                                ) : null}
                            </div>
                        </>
                    ) : null}
                </section>

                {/* ─── Arenas (3D Super Power Futuristic — battle modes ready) ───── */}
                <section className={`tab-panel ${tab === 'arenas' ? 'is-active' : ''}`} aria-hidden={tab !== 'arenas'}>
                    <div className="arena-visual arena-visual--hero" role="img" aria-label="3D Super Power Futuristic Arena stage">
                        <span className="arena-visual__label">3D Super Power Futuristic Arenas</span>
                        <span className="arena-visual__cta">Battle ready</span>
                    </div>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title">What are arenas?</div>
                        <p className="card__hint">{ARENAS_EXPLANATION}</p>
                    </div>
                    <div className="card card--elevated">
                        <div className="card__title">Broker</div>
                        <p className="card__hint">Pick the broker that will compete in this arena.</p>
                        <select className="select" value={selectedBrokerId} onChange={(e) => setSelectedBrokerId(e.target.value)} style={{ marginTop: 6, minWidth: '100%' }}>
                            <option value="">— Select broker —</option>
                            {brokers.map((b) => (
                                <option key={b._id} value={b._id}>#{b._id.slice(-6)} INT{b.intelligence} SPD{b.speed} RISK{b.risk} · energy {b.energy}</option>
                            ))}
                        </select>
                        {brokers.length === 0 ? <p className="guide-tip" style={{ marginTop: 6 }}>No brokers. Go to Brokers tab → New broker.</p> : null}
                    </div>
                    <div className="card card--elevated">
                        <div className="card__title">Arena & league</div>
                        <p className="card__hint">Choose battle mode. Guild Wars requires a guild.</p>
                        <select className="select" value={arena} onChange={(e) => setArena(e.target.value)} style={{ marginTop: 6, minWidth: '100%' }}>
                            {arenaOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        {currentMode ? (
                            <p className="card__hint" style={{ marginTop: 8, fontSize: '0.85rem' }}>
                                Energy {currentMode.energyCost ?? 1} · Cooldown {currentMode.cooldownSeconds ?? 30}s
                                {(currentMode.entryNeurCost > 0 || currentMode.entryAibaCost > 0) ? ` · Entry: ${currentMode.entryNeurCost > 0 ? `${currentMode.entryNeurCost} NEUR` : ''}${currentMode.entryNeurCost > 0 && currentMode.entryAibaCost > 0 ? ' / ' : ''}${currentMode.entryAibaCost > 0 ? `${currentMode.entryAibaCost} AIBA` : ''}` : ''}
                                {((currentMode.rewardMultiplierAiba ?? 1) !== 1 || (currentMode.rewardMultiplierNeur ?? 1) !== 1) ? ` · Rewards: Aiba×${Number(currentMode.rewardMultiplierAiba ?? 1)}, Neur×${Number(currentMode.rewardMultiplierNeur ?? 1)}` : ''}
                            </p>
                        ) : null}
                        {(arena === 'guildWars' || arena.startsWith?.('guildWars:')) ? <p className="guide-tip">Rewards go to guild treasury.</p> : null}
                    </div>
                    <div className="action-row">
                        <button type="button" className="btn btn--primary" onClick={runBattle} disabled={busy || !selectedBrokerId}><IconRun /> Run battle</button>
                        <button type="button" className="btn btn--secondary" onClick={refreshBrokers} disabled={busy}><IconRefresh /> Refresh</button>
                    </div>
                    {battle ? (
                        <>
                            <div className="arena-visual" role="img" aria-label="Battle arena">
                                <span className="arena-visual__label">Battle Complete</span>
                            </div>
                            <div className="card card--elevated">
                                <div className="card__title">Battle result</div>
                                <div className="victory-card">
                                    <div className="victory-card__badge">Victory</div>
                                    <div className="victory-card__score">Score {battle.score}</div>
                                    <div className="victory-card__meta">
                                        {(arena.includes(':') ? arena.split(':')[0] : arena)} · {Number(battle.rewardAiba ?? 0)} AIBA
                                        {Number(battle.starsGranted ?? 0) > 0 ? <span className="victory-card__meta-stars"> · <IconStar /> +{battle.starsGranted} Stars</span> : ''}
                                        {Number(battle.firstWinDiamond ?? 0) > 0 ? <span className="victory-card__meta-diamond"> · <IconDiamond /> +{battle.firstWinDiamond} Diamond (first win!)</span> : ''}
                                    </div>
                                    <button type="button" className="btn btn--primary" onClick={() => { const text = `My broker scored ${battle.score} in ${arena}! Reward: ${battle.rewardAiba} AIBA.`; shareViaTelegram({ title: 'AIBA Arena', text, url: window?.location?.href }); }}><IconShare /> Share</button>
                                </div>
                            </div>
                        </>
                    ) : null}
                </section>

                {/* ─── Guilds (Groups) — global leaderboard, pay-to-create, boost ────────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'guilds' ? 'is-active' : ''}`} aria-hidden={tab !== 'guilds'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title">What are guilds?</div>
                        <p className="card__hint">{GUILDS_EXPLANATION}</p>
                    </div>
                    <div className="card card--elevated">
                        <div className="card__title">Groups</div>
                        <p className="card__hint">Top leaders create free; others pay TON. All groups visible globally. Anyone can join or boost.</p>
                        <div className="action-row">
                            <button type="button" className="btn btn--secondary" onClick={() => { refreshMyRank(); refreshGuilds(); }} disabled={busy}><IconRefresh /> My rank</button>
                            <button type="button" className="btn btn--secondary" onClick={refreshAllGroups} disabled={busy}>Discover all</button>
                            <button type="button" className="btn btn--secondary" onClick={async () => { setBusy(true); try { const r = await api.get('/api/guilds/top'); setAllGroups(Array.isArray(r.data) ? r.data : []); } catch { setAllGroups([]); } finally { setBusy(false); } }} disabled={busy}>Top boosted</button>
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
                        {selectedGuildId ? (
                            <>
                                <p className="card__hint" style={{ marginTop: 12 }}>Leave group</p>
                                <button type="button" className="btn btn--ghost" onClick={leaveGuild} disabled={busy} style={{ marginTop: 4, color: 'var(--text-muted)' }}>Leave selected group</button>
                            </>
                        ) : null}
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

                {/* ─── Super Futuristic Unified Marketplace (multi-tabbed, seamlessly extensible, full fledged) ─── */}
                <section className={`tab-panel major-tab major-tab--market unified-marketplace ${tab === 'market' ? 'is-active' : ''}`} aria-hidden={tab !== 'market'}>
                    <div className="card card--elevated major-tab__hero" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title">Super Futuristic Unified Marketplace</div>
                        <p className="card__hint">One place for brokers, assets, rentals, system shop, and boosts. Trade with TON + AIBA. List, buy, create — all in one hub.</p>
                        <p className="major-tab__subcopy" style={{ marginTop: 6, opacity: 0.95 }}>{MARKETPLACE_TAGLINE}</p>
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <button type="button" className="btn btn--secondary" onClick={async () => { setBusy(true); try { await Promise.all([refreshListings(), refreshBrokerRentals(), refreshBoostConfig(), refreshStarsStoreConfig()]); } finally { setBusy(false); } }} disabled={busy}><IconRefresh /> Refresh all</button>
                        </div>
                    </div>
                    <div className="flow-switch" role="tablist" aria-label="Marketplace tabs">
                        {MARKET_FLOWS.map((f) => (
                            <button key={f.id} type="button" role="tab" aria-selected={marketFlow === f.id} className={`flow-switch__btn ${marketFlow === f.id ? 'is-active' : ''}`} onClick={() => setMarketFlow(f.id)}>{f.label}{f.badge ? <><span className="badge-new badge-new--green" style={{ marginLeft: 6 }}>{f.badge}</span></> : ''}</button>
                        ))}
                    </div>
                    {marketFlow === 'overview' && (
                        <>
                            {Number(economyMe?.economy?.createBrokerCostTonNano) > 0 ? (
                                <div className="card card--elevated sheet-card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                                    <div className="card__title">Create your broker (pay TON)</div>
                                    <p className="card__hint">Pay TON to create a new broker. It is automatically listed on the marketplace so everyone can see it — you get global recognition.</p>
                                    <p className="card__hint" style={{ marginTop: 6 }}>Cost: <strong>{(economyMe.economy.createBrokerCostTonNano / 1e9).toFixed(1)} TON</strong>. Send exact amount to the wallet shown in the app, then paste the transaction hash below.</p>
                                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <input className="input" value={createBrokerTxHash} onChange={(e) => setCreateBrokerTxHash(e.target.value)} placeholder="Transaction hash (tx hash)" style={{ flex: '1 1 200px', minWidth: 0 }} />
                                        <button type="button" className="btn btn--primary" onClick={createBrokerWithTon} disabled={busy || !createBrokerTxHash.trim()}><IconMint /> Create broker</button>
                                    </div>
                                    {createBrokerMsg ? <p className={`status-banner ${createBrokerMsg.includes('created') ? 'status-banner--success' : 'status-banner--error'}`}>{createBrokerMsg}</p> : null}
                                </div>
                            ) : null}
                            {starsStoreConfig?.enabled ? (
                                <div className="card card--elevated sheet-card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
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
                                    {starsStoreMsg ? <p className={`status-banner ${starsStoreMsg.includes('Purchased') ? 'status-banner--success' : 'status-banner--error'}`}>{starsStoreMsg}</p> : null}
                                </div>
                            ) : null}
                            <div className="card sheet-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                                <div className="card__title">AI Assets</div>
                                <p className="card__hint">Mint, upgrade, list, buy, and rent AI assets (AI Agent, AI Brain, AI Creator, AI Workflow, AI System). All in one hub.</p>
                                <button type="button" className="btn btn--primary" onClick={() => setTab('assets')}>Go to AI Assets</button>
                            </div>
                        </>
                    )}
                    {marketFlow === 'trade' && (
                        <div className="card card--elevated sheet-card">
                            <div className="card__title">Super Futuristic Unified Marketplace — Trade</div>
                            <p className="card__hint">Sell brokers for AIBA or buy from others. One unified hub for all trading.</p>
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
                            {marketMsg ? <p className={`status-banner ${marketMsg.includes('Listed') || marketMsg.includes('Purchased') ? 'status-banner--success' : 'status-banner--error'}`}>{marketMsg}</p> : null}
                            {listings.length > 0 ? (
                                listings.map((l) => {
                                    const myId = getTelegramUserUnsafe()?.id?.toString() || '';
                                    const isMine = String(l.sellerTelegramId || '') === myId;
                                    return (
                                        <div key={l._id} className="list-item">
                                            <span>INT{l.broker?.intelligence} SPD{l.broker?.speed} RISK{l.broker?.risk} — {l.priceAIBA} AIBA{isMine ? ' (yours)' : ''}</span>
                                            {isMine ? (
                                                <button type="button" className="btn btn--secondary" onClick={() => delistBroker(l._id)} disabled={busy}>Delist</button>
                                            ) : (
                                                <button type="button" className="btn btn--primary" onClick={() => buyListing(l._id)} disabled={busy}><IconBuy /> Buy</button>
                                            )}
                                        </div>
                                    );
                                })
                            ) : <p className="guide-tip">No listings.</p>}
                        </div>
                    )}
                    {marketFlow === 'rental' && (
                        <div className="card card--elevated sheet-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                            <div className="card__title"><IconRent /> Broker Rental <span className="badge-new badge-new--green">NEW</span></div>
                            <p className="card__hint">List your broker for rent or rent one from others. Rent for 1 hour—cost goes to owner minus fee.</p>
                            <div className="action-row">
                                <button type="button" className="btn btn--secondary" onClick={refreshBrokerRentals} disabled={busy}><IconRefresh /> Refresh</button>
                            </div>
                            {rentalMsg ? <p className={`status-banner ${rentalMsg.includes('Rented') || rentalMsg.includes('Listed') || rentalMsg.includes('Unlisted') ? 'status-banner--success' : 'status-banner--error'}`}>{rentalMsg}</p> : null}
                            <p className="card__hint" style={{ marginTop: 12 }}>List your broker for rent</p>
                            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <select className="select" value={listRentalBrokerId} onChange={(e) => setListRentalBrokerId(e.target.value)}>
                                    <option value="">Select broker</option>
                                    {brokers.filter((b) => !b.guildId).map((b) => (
                                        <option key={b._id} value={b._id}>#{b._id.slice(-6)} INT{b.intelligence} SPD{b.speed} RISK{b.risk}</option>
                                    ))}
                                </select>
                                <input className="input" value={rentalPricePerHour} onChange={(e) => setRentalPricePerHour(e.target.value)} placeholder="Price (AIBA/hour)" style={{ width: 140 }} />
                                <button type="button" className="btn btn--primary" onClick={listBrokerForRent} disabled={busy || !listRentalBrokerId || !rentalPricePerHour.trim()}><IconRent /> List for rent</button>
                            </div>
                            <p className="card__hint" style={{ marginTop: 16 }}>Available rentals</p>
                            {brokerRentals.length === 0 ? (
                                <p className="guide-tip" style={{ marginTop: 8 }}>No brokers listed for rent. List yours above!</p>
                            ) : (
                                <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                                    {brokerRentals.map((r) => {
                                        const myId = getTelegramUserUnsafe()?.id?.toString() || '';
                                        const isMine = String(r.ownerTelegramId || '') === myId;
                                        return (
                                            <div key={r._id} className="list-item">
                                                <span>{r.brokerId ? `INT${r.brokerId.intelligence} SPD${r.brokerId.speed} RISK${r.brokerId.risk}` : 'Broker'} — {r.priceAibaPerHour ?? 0} AIBA/hr{isMine ? ' (yours)' : ''}</span>
                                                {isMine ? (
                                                    <button type="button" className="btn btn--secondary" onClick={() => unlistRental(r._id)} disabled={busy}>Unlist</button>
                                                ) : (
                                                    <button type="button" className="btn btn--primary" onClick={() => rentBroker(r._id)} disabled={busy}><IconRent /> Rent</button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    {marketFlow === 'system' && (
                        <div className="card sheet-card">
                            <div className="card__title">Buy from system</div>
                            <p className="card__hint">Purchase a broker from the system for AIBA.</p>
                            {systemBrokers.length === 0 ? (
                                <p className="guide-tip">No system brokers. Refresh to load.</p>
                            ) : (
                                <ul className="sheet-list">
                                    {systemBrokers.map((entry) => (
                                        <li key={entry.id} className="sheet-list-item">
                                            <span className="sheet-list-item__text">{entry.name} — INT{entry.intelligence} SPD{entry.speed} RISK{entry.risk} — {entry.priceAiba} AIBA</span>
                                            <button type="button" className="btn btn--primary" onClick={() => buySystemBroker(entry.id)} disabled={busy}><IconBuy /> Buy</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {marketMsg ? <p className={`status-banner ${marketMsg.includes('purchased') || marketMsg.includes('Purchased') ? 'status-banner--success' : 'status-banner--error'}`}>{marketMsg}</p> : null}
                        </div>
                    )}
                    {marketFlow === 'boosts' && (
                        <div className="card sheet-card">
                            <div className="card__title">Boosts</div>
                            <p className="card__hint">Multiply battle rewards for a period. Pay with NEUR or TON.</p>
                            <div className="action-row">
                                <button type="button" className="btn btn--secondary" onClick={refreshBoosts} disabled={busy}><IconRefresh /> Refresh</button>
                                <button type="button" className="btn btn--primary" onClick={buyBoost} disabled={busy}>Buy boost (NEUR)</button>
                                {boostConfig?.boostCostTonNano > 0 && boostConfig?.walletForTon ? (
                                    <>
                                        <span className="card__hint" style={{ margin: 0 }}>Or send {(boostConfig.boostCostTonNano / 1e9).toFixed(2)} TON to Boost wallet, then paste tx hash:</span>
                                        <input className="input" value={boostTonTxHash} onChange={(e) => setBoostTonTxHash(e.target.value)} placeholder="TON tx hash" style={{ flex: '1 1 180px', minWidth: 0 }} />
                                        <button type="button" className="btn btn--primary" onClick={buyBoostWithTon} disabled={busy || !boostTonTxHash.trim()}>Buy with TON</button>
                                    </>
                                ) : null}
                            </div>
                            {boostMsg ? <p className="status-banner status-banner--success">{boostMsg}</p> : null}
                            {boosts.length > 0 ? <p className="card__hint" style={{ marginTop: 8 }}>Active: {boosts.map((b) => `${b.multiplier}x until ${new Date(b.expiresAt).toLocaleString()}`).join('; ')}</p> : <p className="guide-tip">Buy a boost to multiply battle rewards.</p>}
                        </div>
                    )}
                </section>

                {/* ─── Car Racing (Autonomous) ───────────────────────────────────── */}
                <section className={`tab-panel major-tab major-tab--car ${tab === 'carRacing' ? 'is-active' : ''}`} aria-hidden={tab !== 'carRacing'}>
                    <div className="card card--elevated major-tab__hero" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title">Car Racing</div>
                        <p className="card__hint">Autonomous car racing. Create or buy a car, enter open races, earn AIBA by finish position.</p>
                        <p className="major-tab__subcopy">Inspired by the most powerful racing cars: Formula 1, Le Mans, Can-Am, IndyCar, Group B, GT1, Electric, Drag, Touring/DTM, Hillclimb, NASCAR, Historic, Hypercar, Extreme prototypes.</p>
                        <button type="button" className="btn btn--secondary" onClick={refreshCarRacing} disabled={busy}><IconRefresh /> Refresh</button>
                        {carMsg ? <p className={`status-banner ${carMsg.includes('Purchased') || carMsg.includes('Entered') || carMsg.includes('Created') ? 'status-banner--success' : carMsg.includes('failed') || carMsg.includes('Failed') ? 'status-banner--error' : 'status-banner--info'}`} style={{ marginTop: 8 }}>{carMsg}</p> : null}
                    </div>
                    <div className="flow-switch" role="group" aria-label="Car flow">
                        {['garage', 'system', 'market', 'race', 'leaderboard'].map((f) => (
                            <button key={f} type="button" className={`flow-switch__btn ${carFlow === f ? 'is-active' : ''}`} onClick={() => setCarFlow(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                        ))}
                    </div>
                    {carFlow === 'garage' && (
                        <>
                    <div className="card sheet-card">
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
                    <div className="card sheet-card">
                        <div className="card__title">My cars</div>
                        {myCars.length === 0 ? <p className="guide-tip">No cars. Create or buy one above.</p> : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>{myCars.map((c) => {
                                const classLabel = c.carClass && carRacingConfig?.carClasses?.find((x) => x.id === c.carClass)?.label ? carRacingConfig.carClasses.find((x) => x.id === c.carClass).label : (c.carClass || 'Racing car');
                                return <li key={c._id} className="sheet-list-row">#{String(c._id).slice(-6)} — {classLabel} — SPD{c.topSpeed} ACC{c.acceleration} HND{c.handling} DUR{c.durability}</li>;
                            })}</ul>
                        )}
                    </div>
                        </>
                    )}
                    {carFlow === 'system' && (
                    <div className="card sheet-card">
                        <div className="card__title">Buy a car from the system</div>
                        <p className="card__hint">Purchase a racing car from the system for AIBA.</p>
                        {systemCars.length === 0 ? (
                            <p className="guide-tip">No system cars. Refresh to load.</p>
                        ) : (
                            <ul className="sheet-list">
                                {systemCars.map((entry) => {
                                    const classLabel = entry.carClass && carRacingConfig?.carClasses?.find((x) => x.id === entry.carClass)?.label ? carRacingConfig.carClasses.find((x) => x.id === entry.carClass).label : (entry.carClass || '').replace(/([A-Z])/g, ' $1').trim() || 'Racing car';
                                    return (
                                        <li key={entry.id} className="sheet-list-item">
                                            <span className="sheet-list-item__text">{entry.name} — {classLabel} — SPD{entry.topSpeed} ACC{entry.acceleration} HND{entry.handling} DUR{entry.durability} — {entry.priceAiba} AIBA</span>
                                            <button type="button" className="btn btn--primary" onClick={() => buySystemCar(entry.id)} disabled={busy}>Buy</button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        {carMsg ? <p className={`status-banner ${carMsg.includes('Purchased') ? 'status-banner--success' : 'status-banner--error'}`} style={{ marginTop: 8 }}>{carMsg}</p> : null}
                    </div>
                    )}
                    {carFlow === 'market' && (
                    <>
                    <div className="card sheet-card">
                        <div className="card__title">1. List your car for sale</div>
                        <p className="card__hint">Sell a car from your garage for AIBA. Others can buy it here.</p>
                        {myCars.length === 0 ? (
                            <p className="guide-tip">No cars to list. Create or buy one in Garage or System first.</p>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', marginTop: 10 }}>
                                <select className="select" value={listCarId} onChange={(e) => setListCarId(e.target.value)} style={{ minWidth: 140 }}>
                                    <option value="">Select car</option>
                                    {myCars.map((c) => {
                                        const classLabel = c.carClass && carRacingConfig?.carClasses?.find((x) => x.id === c.carClass)?.label ? carRacingConfig.carClasses.find((x) => x.id === c.carClass).label : (c.carClass || 'Car');
                                        return <option key={c._id} value={c._id}>#{String(c._id).slice(-6)} — {classLabel}</option>;
                                    })}
                                </select>
                                <input className="input" type="number" min="0" value={listCarPriceAIBA} onChange={(e) => setListCarPriceAIBA(e.target.value)} placeholder="Price AIBA" style={{ width: 100 }} />
                                <button type="button" className="btn btn--primary" onClick={listCar} disabled={busy || !listCarId || !listCarPriceAIBA.trim()}><IconList /> List</button>
                            </div>
                        )}
                        {carMsg ? <p className={`status-banner ${carMsg.includes('listed') ? 'status-banner--success' : carMsg.includes('failed') || carMsg.includes('Failed') ? 'status-banner--error' : 'status-banner--info'}`} style={{ marginTop: 8 }}>{carMsg}</p> : null}
                    </div>
                    <div className="card sheet-card">
                        <div className="card__title">2. Buy a racing car</div>
                        <p className="card__hint">Purchase a car from other players with AIBA.</p>
                        {carListings.length === 0 ? (
                            <p className="guide-tip">No cars for sale. Check back later or create your own above.</p>
                        ) : (
                            <ul className="sheet-list">
                                {carListings.map((l) => {
                                    const car = l.car || l.carId;
                                    const classLabel = car?.carClass && carRacingConfig?.carClasses?.find((x) => x.id === car.carClass)?.label ? carRacingConfig.carClasses.find((x) => x.id === car.carClass).label : (car?.carClass || '').replace(/([A-Z])/g, ' $1').trim() || 'Racing car';
                                    return (
                                        <li key={l._id} className="sheet-list-item">
                                            <span className="sheet-list-item__text">Car #{String(l.carId?._id ?? l.carId).slice(-6)} — {classLabel} — {l.priceAIBA} AIBA</span>
                                            <button type="button" className="btn btn--primary" onClick={async () => { setBusy(true); setCarMsg(''); try { await api.post('/api/car-racing/buy-car', { requestId: uuid(), listingId: l._id }); setCarMsg('Purchased.'); await refreshCarRacing(); await refreshEconomy(); } catch (e) { setCarMsg(getErrorMessage(e, 'Buy failed.')); } finally { setBusy(false); } }} disabled={busy}>Buy</button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    </>
                    )}
                    {carFlow === 'race' && (
                        <div className="card sheet-card">
                            <div className="card__title">Enter race</div>
                            <p className="card__hint">Entry fee: {carRacingConfig?.entryFeeAiba ?? 10} AIBA. When 2+ have entered, the race runs and rewards are paid by finish position.</p>
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
                            {carMsg ? <p className={`status-banner ${carMsg.includes('Purchased') || carMsg.includes('Entered') ? 'status-banner--success' : carMsg.includes('failed') || carMsg.includes('Failed') ? 'status-banner--error' : 'status-banner--info'}`} style={{ marginTop: 8 }}>{carMsg}</p> : null}
                        </div>
                    )}
                    {carFlow === 'leaderboard' && (
                        <div className="card sheet-card">
                            <div className="card__title">Leaderboard</div>
                            <p className="card__hint">Top by total points.</p>
                            {carLeaderboard.length > 0 ? (
                                <ol style={{ margin: 0, paddingLeft: 20 }}>{carLeaderboard.slice(0, 10).map((r) => <li key={r.telegramId} className="sheet-list-row">#{r.rank} — {r.totalPoints} pts, {r.wins} wins, {r.aibaEarned} AIBA</li>)}</ol>
                            ) : <p className="guide-tip">No leaderboard data. Enter races to climb the ranks.</p>}
                        </div>
                    )}
                </section>

                {/* ─── Bike Racing (Autonomous) ───────────────────────────────────── */}
                <section className={`tab-panel major-tab major-tab--bike ${tab === 'bikeRacing' ? 'is-active' : ''}`} aria-hidden={tab !== 'bikeRacing'}>
                    <div className="card card--elevated major-tab__hero" style={{ borderLeft: '4px solid var(--accent-magenta)' }}>
                        <div className="card__title">Bike Racing</div>
                        <p className="card__hint">Autonomous motorcycle racing. Create or buy a bike, enter open races, earn AIBA.</p>
                        <p className="major-tab__subcopy">Inspired by the most powerful racing &amp; high-performance motorcycles: Hyper-Track (H2R, MTT 420RR), Superbikes (M 1000 RR, Fireblade, R1M), Sportbikes (Ninja H2, Hayabusa), Track Racing, Historic GP (NSR500, Desmosedici), Electric (Energica, LiveWire), Exotic (Bimota, NCR), Big Torque (Rocket 3, VMAX), MotoGP, Supersport, Hypersport, Classic TT, Concepts.</p>
                        <button type="button" className="btn btn--secondary" onClick={refreshBikeRacing} disabled={busy}><IconRefresh /> Refresh</button>
                        {bikeMsg ? <p className={`status-banner ${bikeMsg.includes('Purchased') || bikeMsg.includes('Entered') ? 'status-banner--success' : bikeMsg.includes('failed') || bikeMsg.includes('Failed') ? 'status-banner--error' : 'status-banner--info'}`} style={{ marginTop: 8 }}>{bikeMsg}</p> : null}
                    </div>
                    <div className="flow-switch" role="group" aria-label="Bike flow">
                        {['garage', 'system', 'market', 'race', 'leaderboard'].map((f) => (
                            <button key={f} type="button" className={`flow-switch__btn ${bikeFlow === f ? 'is-active' : ''}`} onClick={() => setBikeFlow(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                        ))}
                    </div>
                    {bikeFlow === 'garage' && (
                        <>
                            <div className="card sheet-card">
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
                            <div className="card sheet-card">
                                <div className="card__title">My bikes</div>
                                {myBikes.length === 0 ? <p className="guide-tip">No bikes. Create or buy one above.</p> : (
                                    <ul style={{ listStyle: 'none', padding: 0 }}>{myBikes.map((b) => {
                                        const classLabel = b.bikeClass && bikeRacingConfig?.bikeClasses?.find((x) => x.id === b.bikeClass)?.label ? bikeRacingConfig.bikeClasses.find((x) => x.id === b.bikeClass).label : (b.bikeClass || 'Racing bike');
                                        return <li key={b._id} className="sheet-list-row">#{String(b._id).slice(-6)} — {classLabel} — SPD{b.topSpeed} ACC{b.acceleration} HND{b.handling} DUR{b.durability}</li>;
                                    })}</ul>
                                )}
                            </div>
                        </>
                    )}
                    {bikeFlow === 'system' && (
                        <div className="card sheet-card">
                            <div className="card__title">Buy a bike from the system</div>
                            <p className="card__hint">Purchase a racing bike from the system for AIBA.</p>
                            {systemBikes.length === 0 ? (
                                <p className="guide-tip">No system bikes. Refresh to load.</p>
                            ) : (
                                <ul className="sheet-list">
                                    {systemBikes.map((entry) => {
                                        const classLabel = entry.bikeClass && bikeRacingConfig?.bikeClasses?.find((x) => x.id === entry.bikeClass)?.label ? bikeRacingConfig.bikeClasses.find((x) => x.id === entry.bikeClass).label : (entry.bikeClass || '').replace(/([A-Z])/g, ' $1').trim() || 'Racing bike';
                                        return (
                                            <li key={entry.id} className="sheet-list-item">
                                                <span className="sheet-list-item__text">{entry.name} — {classLabel} — SPD{entry.topSpeed} ACC{entry.acceleration} HND{entry.handling} DUR{entry.durability} — {entry.priceAiba} AIBA</span>
                                                <button type="button" className="btn btn--primary" onClick={() => buySystemBike(entry.id)} disabled={busy}>Buy</button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                            {bikeMsg ? <p className={`status-banner ${bikeMsg.includes('Purchased') ? 'status-banner--success' : 'status-banner--error'}`} style={{ marginTop: 8 }}>{bikeMsg}</p> : null}
                        </div>
                    )}
                    {bikeFlow === 'market' && (
                        <>
                        <div className="card sheet-card">
                            <div className="card__title">1. List your bike for sale</div>
                            <p className="card__hint">Sell a bike from your garage for AIBA. Others can buy it here.</p>
                            {myBikes.length === 0 ? (
                                <p className="guide-tip">No bikes to list. Create or buy one in Garage or System first.</p>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', marginTop: 10 }}>
                                    <select className="select" value={listBikeId} onChange={(e) => setListBikeId(e.target.value)} style={{ minWidth: 140 }}>
                                        <option value="">Select bike</option>
                                        {myBikes.map((b) => {
                                            const classLabel = b.bikeClass && bikeRacingConfig?.bikeClasses?.find((x) => x.id === b.bikeClass)?.label ? bikeRacingConfig.bikeClasses.find((x) => x.id === b.bikeClass).label : (b.bikeClass || 'Bike');
                                            return <option key={b._id} value={b._id}>#{String(b._id).slice(-6)} — {classLabel}</option>;
                                        })}
                                    </select>
                                    <input className="input" type="number" min="0" value={listBikePriceAIBA} onChange={(e) => setListBikePriceAIBA(e.target.value)} placeholder="Price AIBA" style={{ width: 100 }} />
                                    <button type="button" className="btn btn--primary" onClick={listBike} disabled={busy || !listBikeId || !listBikePriceAIBA.trim()}><IconList /> List</button>
                                </div>
                            )}
                            {bikeMsg ? <p className={`status-banner ${bikeMsg.includes('listed') ? 'status-banner--success' : bikeMsg.includes('failed') || bikeMsg.includes('Failed') ? 'status-banner--error' : 'status-banner--info'}`} style={{ marginTop: 8 }}>{bikeMsg}</p> : null}
                        </div>
                        <div className="card sheet-card">
                            <div className="card__title">2. Buy a racing bike</div>
                            <p className="card__hint">Purchase a bike from other players with AIBA.</p>
                            {bikeListings.length === 0 ? (
                                <p className="guide-tip">No bikes for sale. Check back later or create your own above.</p>
                            ) : (
                                <ul className="sheet-list">
                                    {bikeListings.map((l) => {
                                        const bike = l.bike || l.bikeId;
                                        const classLabel = bike?.bikeClass && bikeRacingConfig?.bikeClasses?.find((x) => x.id === bike.bikeClass)?.label ? bikeRacingConfig.bikeClasses.find((x) => x.id === bike.bikeClass).label : (bike?.bikeClass || '').replace(/([A-Z])/g, ' $1').trim() || 'Racing bike';
                                        return (
                                            <li key={l._id} className="sheet-list-item">
                                                <span className="sheet-list-item__text">Bike #{String(l.bikeId?._id ?? l.bikeId).slice(-6)} — {classLabel} — {l.priceAIBA} AIBA</span>
                                                <button type="button" className="btn btn--primary" onClick={async () => { setBusy(true); setBikeMsg(''); try { await api.post('/api/bike-racing/buy-bike', { requestId: uuid(), listingId: l._id }); setBikeMsg('Purchased.'); await refreshBikeRacing(); await refreshEconomy(); } catch (e) { setBikeMsg(getErrorMessage(e, 'Buy failed.')); } finally { setBusy(false); } }} disabled={busy}>Buy</button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                        </>
                    )}
                    {bikeFlow === 'race' && (
                        <div className="card sheet-card">
                            <div className="card__title">Enter race</div>
                            <p className="card__hint">Entry fee: {bikeRacingConfig?.entryFeeAiba ?? 10} AIBA. When race is full, it runs and rewards are paid.</p>
                            <select className="select" value={bikeEnterRaceId} onChange={(e) => setBikeEnterRaceId(e.target.value)} style={{ marginTop: 6, minWidth: '100%' }}>
                                <option value="">Select race</option>
                                {bikeRaces.map((r) => <option key={r._id} value={r._id}>{r.trackId} {r.league} — {r.entryCount ?? 0}/{r.maxEntries} — {r.entryFeeAiba ?? bikeRacingConfig?.entryFeeAiba ?? 10} AIBA</option>)}
                            </select>
                            <select className="select" value={bikeEnterBikeId} onChange={(e) => setBikeEnterBikeId(e.target.value)} style={{ marginTop: 8, minWidth: '100%' }}>
                                <option value="">Select bike</option>
                                {myBikes.map((b) => {
                                    const classLabel = b.bikeClass && bikeRacingConfig?.bikeClasses?.find((x) => x.id === b.bikeClass)?.label ? bikeRacingConfig.bikeClasses.find((x) => x.id === b.bikeClass).label : (b.bikeClass || 'Bike');
                                    return <option key={b._id} value={b._id}>#{String(b._id).slice(-6)} — {classLabel}</option>;
                                })}
                            </select>
                            <button type="button" className="btn btn--primary" onClick={enterBikeRace} disabled={busy || !bikeEnterRaceId || !bikeEnterBikeId} style={{ marginTop: 8 }}>Enter race</button>
                            {bikeMsg ? <p className={`status-banner ${bikeMsg.includes('Purchased') || bikeMsg.includes('Entered') ? 'status-banner--success' : bikeMsg.includes('failed') || bikeMsg.includes('Failed') ? 'status-banner--error' : 'status-banner--info'}`} style={{ marginTop: 8 }}>{bikeMsg}</p> : null}
                        </div>
                    )}
                    {bikeFlow === 'leaderboard' && (
                        <div className="card sheet-card">
                            <div className="card__title">Leaderboard</div>
                            <p className="card__hint">Top by total points.</p>
                            {bikeLeaderboard.length > 0 ? (
                                <ol style={{ margin: 0, paddingLeft: 20 }}>{bikeLeaderboard.slice(0, 10).map((r) => <li key={r.telegramId} className="sheet-list-row">#{r.rank} — {r.totalPoints} pts, {r.wins} wins, {r.aibaEarned} AIBA</li>)}</ol>
                            ) : <p className="guide-tip">No leaderboard data. Enter races to climb the ranks.</p>}
                        </div>
                    )}
                </section>

                {/* ─── Dedicated NFT Gallery (My NFTs in gallery view) ───────────── */}
                <section className={`tab-panel ${tab === 'nftGallery' ? 'is-active' : ''}`} aria-hidden={tab !== 'nftGallery'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title">My NFT Gallery</div>
                        <p className="card__hint">Your Broker NFT collection. Stake to earn {nftStakingRewardPerDay} AIBA per NFT per day. View, manage, and grow your collection.</p>
                        <div className="action-row">
                            <button type="button" className="btn btn--secondary" onClick={refreshMultiverse} disabled={busy}><IconRefresh /> Refresh</button>
                            <button type="button" className="btn btn--ghost" onClick={() => setTab('multiverse')}>Full Multiverse →</button>
                        </div>
                        {multiverseMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{multiverseMsg}</p> : null}
                    </div>
                    {multiverseStakingRewards != null && (multiverseStakingRewards.stakedCount > 0 || (multiverseStakingRewards.pendingRewardAiba ?? 0) > 0) ? (
                        <div className="card card--elevated">
                            <div className="card__title">NFT staking rewards</div>
                            <p className="card__hint">Staked: {multiverseStakingRewards.stakedCount ?? 0}. Pending: <strong>{multiverseStakingRewards.pendingRewardAiba ?? 0} AIBA</strong></p>
                            <button type="button" className="btn btn--primary" onClick={claimNftStaking} disabled={busy || (multiverseStakingRewards.pendingRewardAiba ?? 0) <= 0}><IconClaim /> Claim rewards</button>
                        </div>
                    ) : null}
                    <div className="card nft-gallery-dedicated">
                        <div className="card__title">Collection</div>
                        {multiverseMyNfts.length > 0 ? (
                            <>
                                <div className="flow-switch" role="group" aria-label="NFT view" style={{ marginBottom: 12 }}>
                                    {['grid', 'list'].map((f) => (
                                        <button key={f} type="button" className={`flow-switch__btn ${nftGalleryFlow === f ? 'is-active' : ''}`} onClick={() => setNftGalleryFlow(f)}>{f === 'grid' ? 'Gallery' : 'List'}</button>
                                    ))}
                                </div>
                                <div className="flow-switch" role="group" aria-label="Filter NFTs" style={{ marginBottom: 12 }}>
                                    {['all', 'staked', 'available'].map((f) => (
                                        <button key={f} type="button" className={`flow-switch__btn ${nftGalleryFilter === f ? 'is-active' : ''}`} onClick={() => setNftGalleryFilter(f)}>{f === 'all' ? 'All' : f === 'staked' ? 'Staked' : 'Available'}</button>
                                    ))}
                                </div>
                                {(() => {
                                    const filtered = nftGalleryFilter === 'all' ? multiverseMyNfts : nftGalleryFilter === 'staked' ? multiverseMyNfts.filter((n) => n.staked) : multiverseMyNfts.filter((n) => !n.staked);
                                    if (filtered.length === 0) return <p className="guide-tip">No NFTs match the filter.</p>;
                                    return nftGalleryFlow === 'grid' ? (
                                        <div className="nft-gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                                            {filtered.map((nft) => (
                                                <div key={nft.brokerId} className="nft-gallery-card nft-gallery-card--large" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--card-bg)', boxShadow: 'var(--shadow-3d-card)' }}>
                                                    <div style={{ aspectRatio: '1', background: 'var(--bg)', position: 'relative' }}>
                                                        <img src={`${BACKEND_URL}/api/metadata/brokers/${nft.brokerId}/image.svg`} alt={`Broker #${String(nft.brokerId).slice(-6)}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                                                    </div>
                                                    <div style={{ padding: 12 }}>
                                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Broker #{String(nft.brokerId).slice(-6)}</p>
                                                        <p className="card__hint" style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>Level {nft.level} · INT{nft.intelligence} SPD{nft.speed} RISK{nft.risk}</p>
                                                        {nft.staked ? <span className="badge-pill badge-pill--inline" style={{ marginTop: 8, display: 'inline-block', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', fontSize: '0.7rem' }}>Staked · {nftStakingRewardPerDay} AIBA/day</span> : null}
                                                        <div style={{ marginTop: 10 }}>
                                                            {nft.staked ? (
                                                                <button type="button" className="btn btn--secondary" onClick={() => unstakeNft(nft.brokerId)} disabled={busy} style={{ width: '100%' }}>Unstake</button>
                                                            ) : (
                                                                <button type="button" className="btn btn--primary" onClick={() => stakeNft(nft.brokerId)} disabled={busy} style={{ width: '100%' }}><IconStake /> Stake</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        filtered.map((nft) => (
                                            <div key={nft.brokerId} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, marginTop: 10, padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
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
                                    );
                                })()}
                            </>
                        ) : <p className="guide-tip">No Broker NFTs yet. Mint one from the Brokers tab (pay AIBA) or buy from the Market.</p>}
                    </div>
                </section>

                {/* ─── Multiverse (NFT: own, stake, earn) ────────────────────────── */}
                <section className={`tab-panel ${tab === 'multiverse' ? 'is-active' : ''}`} aria-hidden={tab !== 'multiverse'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
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
                        {multiverseMyNfts.length > 0 ? (
                            <>
                                <div className="flow-switch" role="group" aria-label="NFT view" style={{ marginBottom: 12 }}>
                                    {['list', 'gallery'].map((f) => (
                                        <button key={f} type="button" className={`flow-switch__btn ${multiverseFlow === f ? 'is-active' : ''}`} onClick={() => setMultiverseFlow(f)}>{f === 'gallery' ? 'Gallery' : 'List'}</button>
                                    ))}
                                </div>
                                {multiverseFlow === 'gallery' ? (
                                    <div className="nft-gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                                        {multiverseMyNfts.map((nft) => (
                                            <div key={nft.brokerId} className="nft-gallery-card" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
                                                <div style={{ aspectRatio: '1', background: 'var(--bg)', position: 'relative' }}>
                                                    <img src={`${BACKEND_URL}/api/metadata/brokers/${nft.brokerId}/image.svg`} alt={`Broker #${String(nft.brokerId).slice(-6)}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                                                </div>
                                                <div style={{ padding: 10 }}>
                                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>#{String(nft.brokerId).slice(-6)}</p>
                                                    <p className="card__hint" style={{ margin: '4px 0 0', fontSize: '0.75rem' }}>Lv{nft.level} · INT{nft.intelligence} SPD{nft.speed} RISK{nft.risk}</p>
                                                    {nft.staked ? <span className="card__hint" style={{ fontSize: '0.7rem', color: 'var(--accent-gold)' }}>Staked · {nftStakingRewardPerDay} AIBA/day</span> : null}
                                                    <div style={{ marginTop: 8 }}>
                                                        {nft.staked ? (
                                                            <button type="button" className="btn btn--secondary" onClick={() => unstakeNft(nft.brokerId)} disabled={busy} style={{ width: '100%', fontSize: 11 }}>Unstake</button>
                                                        ) : (
                                                            <button type="button" className="btn btn--primary" onClick={() => stakeNft(nft.brokerId)} disabled={busy} style={{ width: '100%', fontSize: 11 }}><IconStake /> Stake</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
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
                            </>
                        ) : <p className="guide-tip">No Broker NFTs. Mint one from the Brokers tab (pay AIBA for mint).</p>}
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
                                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <input className="input" value={charityCampaignSearch || ''} onChange={(e) => setCharityCampaignSearch(e.target.value)} placeholder="Search campaigns…" style={{ flex: '1 1 180px', minWidth: 0 }} />
                                    <select className="select" value={charityCauseFilter || ''} onChange={(e) => setCharityCauseFilter(e.target.value)} style={{ flex: '0 0 auto' }}>
                                        <option value="">All causes</option>
                                        <option value="education">Education</option>
                                        <option value="environment">Environment</option>
                                        <option value="health">Health</option>
                                        <option value="emergency">Emergency</option>
                                        <option value="community">Community</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <select className="select" value={charitySortBy || 'name'} onChange={(e) => setCharitySortBy(e.target.value)} style={{ flex: '0 0 auto' }} title="Sort campaigns">
                                        <option value="name">Sort: Name</option>
                                        <option value="progress">Sort: Progress %</option>
                                        <option value="raised">Sort: Raised</option>
                                        <option value="goal">Sort: Goal</option>
                                        <option value="donors">Sort: Donors</option>
                                    </select>
                                    <select className="select" value={charityViewMode} onChange={(e) => setCharityViewMode(e.target.value)} style={{ flex: '0 0 auto' }} title="View mode">
                                        <option value="detailed">View: Detailed</option>
                                        <option value="compact">View: Compact</option>
                                    </select>
                                    <label className="check-wrap" style={{ marginTop: 0 }}>
                                        <input type="checkbox" checked={charityFavoritesOnly} onChange={(e) => setCharityFavoritesOnly(e.target.checked)} />
                                        Favorites only
                                    </label>
                                </div>
                                {(() => {
                                    const filtered = charityCampaigns.filter((c) => c.status === 'active').filter((c) => {
                                    const q = (charityCampaignSearch || '').toLowerCase();
                                    const cause = (charityCauseFilter || '').toLowerCase();
                                    if (q && !(c.name || '').toLowerCase().includes(q) && !(c.cause || '').toLowerCase().includes(q) && !(c.description || '').toLowerCase().includes(q)) return false;
                                    if (cause && (c.cause || '').toLowerCase() !== cause) return false;
                                    if (charityFavoritesOnly && !charityFavoriteIds.includes(String(c._id))) return false;
                                    return true;
                                });
                                    const goalN = (c) => (c.goalNeur || 0) + (c.goalAiba || 0) * 10;
                                    const raisedN = (c) => (c.raisedNeur || 0) + (c.raisedAiba || 0) * 10;
                                    const pct = (c) => goalN(c) > 0 ? Math.min(100, Math.round((raisedN(c) / goalN(c)) * 100)) : 0;
                                    const sorted = [...filtered].sort((a, b) => {
                                        if (charitySortBy === 'progress') return pct(b) - pct(a);
                                        if (charitySortBy === 'raised') return raisedN(b) - raisedN(a);
                                        if (charitySortBy === 'goal') return goalN(b) - goalN(a);
                                        if (charitySortBy === 'donors') return (b.donorCount ?? 0) - (a.donorCount ?? 0);
                                        return (a.name || '').localeCompare(b.name || '');
                                    });
                                    return sorted.map((c) => {
                                    const goalNVal = goalN(c);
                                    const raisedNVal = raisedN(c);
                                    const pctVal = goalNVal > 0 ? Math.min(100, Math.round((raisedNVal / goalNVal) * 100)) : 0;
                                    return (
                                        <div key={c._id} className="card" style={{ marginTop: 10, padding: 12, borderLeft: `4px solid var(--accent-${c.cause === 'education' ? 'cyan' : c.cause === 'health' ? 'green' : 'magenta'})` }}>
                                            <div className="card__title" style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                                <span>{c.name}</span>
                                                <button type="button" className="btn btn--ghost" style={{ padding: '2px 8px', minHeight: 'unset', fontSize: 12 }} onClick={() => toggleCharityFavorite(c._id)}>
                                                    {charityFavoriteIds.includes(String(c._id)) ? '★ Favorite' : '☆ Favorite'}
                                                </button>
                                            </div>
                                            {charityViewMode === 'detailed' && c.description ? <p className="card__hint" style={{ marginTop: 4 }}>{c.description.slice(0, 120)}{c.description.length > 120 ? '…' : ''}</p> : null}
                                            <p className="card__hint" style={{ marginTop: 6 }}>
                                                <span className="cause-pill" style={{ background: 'var(--bg-glass)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem' }}>{c.cause}</span>
                                                {' '}Raised: {c.raisedNeur ?? 0} NEUR, {c.raisedAiba ?? 0} AIBA · {c.donorCount ?? 0} donors
                                            </p>
                                            {goalNVal > 0 ? <div style={{ marginTop: 8, height: 8, background: 'var(--bg-deep)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}><div style={{ width: `${pctVal}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-amber))', borderRadius: 'var(--radius-pill)' }} /></div> : null}
                                            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                <button type="button" className="btn btn--primary" onClick={() => setDonateCampaignId(c._id)}><IconHeart /> Donate</button>
                                                <button type="button" className="btn btn--ghost" onClick={() => refreshCharityCampaignDetail(charityCampaignDetail?._id === c._id ? null : c._id)} disabled={busy}>View details</button>
                                            </div>
                                            {charityViewMode === 'detailed' && charityCampaignDetail?._id === c._id && charityCampaignDetail?.recentDonations?.length > 0 ? (
                                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                                                    <p className="card__hint" style={{ marginBottom: 6 }}><strong>Recent donations</strong></p>
                                                    {charityCampaignDetail.recentDonations.slice(0, 10).map((d, i) => (
                                                        <p key={i} className="card__hint" style={{ margin: '2px 0', fontSize: '0.8rem' }}>
                                                            {d.amountNeur ? `${d.amountNeur} NEUR` : ''}{d.amountNeur && d.amountAiba ? ', ' : ''}{d.amountAiba ? `${d.amountAiba} AIBA` : ''}{d.donor ? ` · ${d.donor}` : ''} · {d.donatedAt ? new Date(d.donatedAt).toLocaleDateString() : ''}
                                                        </p>
                                                    ))}
                                                    <button type="button" className="btn btn--ghost" style={{ marginTop: 6, fontSize: 11 }} onClick={() => setCharityCampaignDetail(null)}>Close</button>
                                                </div>
                                            ) : charityViewMode === 'detailed' && charityCampaignDetail?._id === c._id ? (
                                                <p className="card__hint" style={{ marginTop: 12 }}>No recent donations yet.</p>
                                            ) : null}
                                        </div>
                                    );
                                });
                                })()}
                                {(() => {
                                    const q = (charityCampaignSearch || '').toLowerCase();
                                    const cause = (charityCauseFilter || '').toLowerCase();
                                    const count = charityCampaigns.filter((c) => c.status === 'active').filter((c) => {
                                        if (q && !(c.name || '').toLowerCase().includes(q) && !(c.cause || '').toLowerCase().includes(q) && !(c.description || '').toLowerCase().includes(q)) return false;
                                        if (cause && (c.cause || '').toLowerCase() !== cause) return false;
                                        if (charityFavoritesOnly && !charityFavoriteIds.includes(String(c._id))) return false;
                                        return true;
                                    }).length;
                                    return count === 0 ? <p className="guide-tip">No campaigns match your filters yet.</p> : null;
                                })()}
                            </div>
                            <div className="card">
                                <div className="card__title">Donate</div>
                                <p className="card__hint">Choose a campaign and amount (NEUR and/or AIBA from your balance).</p>
                                <select className="select" value={donateCampaignId} onChange={(e) => setDonateCampaignId(e.target.value)} style={{ marginTop: 8, minWidth: '100%' }}>
                                    <option value="">Select campaign</option>
                                    {charityCampaigns.filter((c) => c.status === 'active').filter((c) => {
                                        const q = (charityCampaignSearch || '').toLowerCase();
                                        const cause = (charityCauseFilter || '').toLowerCase();
                                        if (q && !(c.name || '').toLowerCase().includes(q) && !(c.cause || '').toLowerCase().includes(q) && !(c.description || '').toLowerCase().includes(q)) return false;
                                        if (cause && (c.cause || '').toLowerCase() !== cause) return false;
                                        return true;
                                    }).map((c) => <option key={c._id} value={c._id}>{c.name} ({c.cause})</option>)}
                                </select>
                                <p className="card__hint" style={{ marginTop: 8, marginBottom: 8, padding: 10, background: 'rgba(138,180,248,0.15)', borderRadius: 8, borderLeft: '4px solid var(--accent-cyan)', fontSize: '0.95rem' }}>
                                    <strong>Your balance (max donate):</strong> <span style={{ color: 'var(--accent-cyan)' }}>{Number(economyMe?.neurBalance ?? 0).toLocaleString()} NEUR</span> · <span style={{ color: 'var(--accent-gold)' }}>{Number(economyMe?.aibaBalance ?? 0).toLocaleString()} AIBA</span>
                                </p>
                                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span className="card__hint" style={{ margin: 0 }}>NEUR:</span>
                                    {[10, 25, 50, 75, 100, 250, 500, 1000, 2000, 2500, 5000, 10000].map((n) => (
                                        <button key={`n${n}`} type="button" className="btn btn--ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setDonateNeur(String(Math.min(Number(economyMe?.neurBalance ?? 0), Number(donateNeur || 0) + n)))} title={`+${n} (capped at balance)`}>+{n}</button>
                                    ))}
                                    <input className="input" value={donateNeur} onChange={(e) => setDonateNeur(e.target.value)} placeholder="NEUR" style={{ width: 100 }} />
                                    <button type="button" className="btn btn--ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setDonateNeur(String(Number(economyMe?.neurBalance ?? 0)))} title="Use full NEUR balance">Max</button>
                                    <span className="card__hint" style={{ margin: 0, marginLeft: 12 }}>AIBA:</span>
                                    {[10, 25, 50, 75, 100, 250, 500, 1000, 2000, 2500, 5000, 10000].map((a) => (
                                        <button key={`a${a}`} type="button" className="btn btn--ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setDonateAiba(String(Math.min(Number(economyMe?.aibaBalance ?? 0), Number(donateAiba || 0) + a)))} title={`+${a} (capped at balance)`}>+{a}</button>
                                    ))}
                                    <input className="input" value={donateAiba} onChange={(e) => setDonateAiba(e.target.value)} placeholder="AIBA" style={{ width: 100 }} />
                                    <button type="button" className="btn btn--ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setDonateAiba(String(Number(economyMe?.aibaBalance ?? 0)))} title="Use full AIBA balance">Max</button>
                                </div>
                                {(donateNeur || donateAiba) && (Number(donateNeur || 0) > 0 || Number(donateAiba || 0) > 0) ? (
                                    <p className="card__hint" style={{ marginTop: 8, padding: 8, background: 'rgba(138,180,248,0.12)', borderRadius: 8, borderLeft: '3px solid var(--accent-cyan)' }}>
                                        <strong>Impact preview:</strong> This donation adds ~{Number(donateNeur || 0) + Number(donateAiba || 0) * 10} to your impact score (NEUR + AIBA×10).
                                    </p>
                                ) : null}
                                <input className="input" value={donateMessage} onChange={(e) => setDonateMessage(e.target.value)} placeholder="Message (optional, e.g. dedication)" style={{ marginTop: 8, width: '100%' }} maxLength={500} />
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

                {/* ─── Center of Excellence ( branded: University + Trainers + Creator Economy ) ─ */}
                <section className={`tab-panel ${tab === 'coe' ? 'is-active' : ''}`} aria-hidden={tab !== 'coe'}>
                    <div className="card card--elevated coe-hero" style={{ borderLeft: '4px solid var(--accent-gold)', background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, transparent 50%)' }}>
                        <div className="card__title">AIBA Arena — Center of Excellence</div>
                        <p className="card__hint" style={{ fontWeight: 500 }}>Learn · Train · Earn. Master the game, join the trainer network, grow your Creator Economy.</p>
                        {/* Branded stats bar: University · Trainers · Creator at a glance */}
                        <div className="coe-stats-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, padding: '12px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <IconUniversity />
                                <span className="card__hint" style={{ margin: 0 }}><strong style={{ color: 'var(--accent-gold)' }}>{universityProgress?.completedCount ?? 0}</strong>/{universityTotalModules || universityCourses.reduce((n, c) => n + (c.modules?.length || 0), 0)} modules</span>
                                {universityProgress?.graduate ? <span className="badge-pill badge-pill--inline" style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', fontSize: 10 }}>Graduate</span> : null}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <IconTrainer />
                                <span className="card__hint" style={{ margin: 0 }}>{trainerMe?.status === 'approved' ? <strong style={{ color: 'var(--accent-green)' }}>Trainer</strong> : trainerMe?.status || 'Apply'}</span>
                                {trainerMe?.status === 'approved' && (trainerMe?.rewardsEarnedAiba ?? 0) > 0 ? <span className="card__hint" style={{ margin: 0, fontSize: '0.75rem' }}>· {trainerMe.rewardsEarnedAiba} AIBA</span> : null}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <IconShare />
                                <span className="card__hint" style={{ margin: 0 }}>Creator: <strong style={{ color: 'var(--accent-gold)' }}>{myReferral?.uses ?? 0}</strong> refs</span>
                                {creatorStats && ((creatorStats.earnedNeur ?? 0) + (creatorStats.earnedAiba ?? 0)) > 0 ? <span className="card__hint" style={{ margin: 0, fontSize: '0.75rem' }}>· {creatorStats.earnedNeur ?? 0} NEUR · {creatorStats.earnedAiba ?? 0} AIBA</span> : null}
                            </div>
                        </div>
                        <div className="action-row" style={{ marginTop: 10 }}>
                            <button type="button" className="btn btn--secondary" onClick={() => { refreshReferralMe(); refreshReferralCreatorStats(); refreshTrainerMe(); refreshUniversity(); }} disabled={busy}><IconRefresh /> Refresh</button>
                        </div>
                    </div>
                    <div className="coe-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
                        <button type="button" className="card card--elevated coe-card" style={{ textAlign: 'left', border: 'none', cursor: 'pointer', padding: 16 }} onClick={() => setTab('university')}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IconUniversity /><strong>University</strong>
                                {universityProgress?.graduate ? <span className="badge-pill badge-pill--inline" style={{ marginLeft: 6, borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>Graduate</span> : null}
                            </span>
                            <p className="card__hint" style={{ marginTop: 8 }}>Complete courses and earn the University Graduate badge.</p>
                            <span className="card__hint" style={{ fontSize: '0.8rem' }}>Progress: <strong>{universityProgress?.completedCount ?? 0}</strong> / {universityTotalModules || universityCourses.reduce((n, c) => n + (c.modules?.length || 0), 0)} modules</span>
                        </button>
                        <button type="button" className="card card--elevated coe-card" style={{ textAlign: 'left', border: 'none', cursor: 'pointer', padding: 16 }} onClick={() => typeof window !== 'undefined' && (window.location.href = '/trainer')}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <IconTrainer /><strong>Trainers</strong>
                                {trainerMe?.status === 'approved' ? <span className="badge-pill badge-pill--inline" style={{ marginLeft: 6, borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>Approved</span> : trainerMe?.status ? <span className="badge-pill badge-pill--inline" style={{ marginLeft: 6 }}>{trainerMe.status}</span> : null}
                            </span>
                            <p className="card__hint" style={{ marginTop: 8 }}>Apply to the global trainer network. Earn AIBA when you help players learn.</p>
                            <span className="card__hint" style={{ fontSize: '0.8rem' }}>Recruit trainers for 20 AIBA each.</span>
                            {trainerMe?.status === 'approved' && (trainerMe?.rewardsEarnedAiba ?? 0) > 0 ? (
                                <p className="card__hint" style={{ marginTop: 6, color: 'var(--accent-gold)' }}>Earned: <strong>{trainerMe.rewardsEarnedAiba} AIBA</strong> — claim from Trainers tab</p>
                            ) : null}
                        </button>
                        <div className="card card--elevated coe-card" style={{ padding: 16 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <IconShare /><strong>Creator Economy</strong>
                                {myReferral && (myReferral.uses ?? 0) >= 1000 ? <span className="badge-pill badge-pill--inline" style={{ marginLeft: 6, borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>Platinum</span> : myReferral && (myReferral.uses ?? 0) >= 100 ? <span className="badge-pill badge-pill--inline" style={{ marginLeft: 6, borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>Gold</span> : myReferral && (myReferral.uses ?? 0) >= 10 ? <span className="badge-pill badge-pill--inline" style={{ marginLeft: 6 }}>Silver</span> : null}
                            </span>
                            <p className="card__hint" style={{ marginTop: 8 }}>Share your link. Earn NEUR & AIBA when friends join. Tier: 10 refs=Silver, 100=Gold, 1000=Platinum.</p>
                            {myReferral ? (
                                <div style={{ marginTop: 10 }}>
                                    <p className="card__hint" style={{ fontSize: '0.85rem' }}>Your code: <strong>{myReferral.code || '—'}</strong></p>
                                    <p className="card__hint" style={{ fontSize: '0.85rem' }}>Uses: <strong>{myReferral.uses ?? 0}</strong></p>
                                    {creatorStats && ((creatorStats.earnedNeur ?? 0) > 0 || (creatorStats.earnedAiba ?? 0) > 0) ? (
                                        <p className="card__hint" style={{ marginTop: 6, color: 'var(--accent-gold)', fontSize: '0.85rem' }}>Earned: <strong>{creatorStats.earnedNeur ?? 0} NEUR</strong> · <strong>{creatorStats.earnedAiba ?? 0} AIBA</strong></p>
                                    ) : null}
                                    <button type="button" className="btn btn--secondary" style={{ marginTop: 8 }} onClick={() => setTab('referrals')}>Manage referrals →</button>
                                </div>
                            ) : (
                                <div style={{ marginTop: 10 }}>
                                    <p className="card__hint" style={{ fontSize: '0.85rem' }}>Create a referral code to start earning.</p>
                                    <button type="button" className="btn btn--primary" style={{ marginTop: 8 }} onClick={() => setTab('referrals')}>Get your link →</button>
                                </div>
                            )}
                            {topReferrers.length > 0 ? (
                                <div style={{ marginTop: 12 }}>
                                    <span className="card__hint" style={{ fontSize: '0.75rem' }}>Top referrers: {topReferrers.slice(0, 3).map((r) => r.code || r.telegramId).join(', ')}</span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>

                {/* ─── University (User Guide / AIBA ARENA UNIVERSITY) ─────────── */}
                <section className={`tab-panel ${tab === 'university' ? 'is-active' : ''}`} aria-hidden={tab !== 'university'}>
                    <div className="card card--elevated card--university university-hero">
                        <div className="card__title">Guide — AIBA ARENA UNIVERSITY</div>
                        <p className="card__hint" style={{ marginTop: 8 }}>Complete systematic guide. Learn brokers, arenas, economy, guilds, and pro tips. Expand courses below.</p>
                        <p className="card__hint" style={{ marginTop: 4 }}>
                            Progress: <strong>{universityProgress?.completedCount ?? 0}</strong> / <strong>{universityTotalModules || universityCourses.reduce((n, c) => n + (c.modules?.length || 0), 0)}</strong> modules
                            {universityProgress?.graduate ? <span className="university-hero__graduate"> · You graduated!</span> : ' · Complete all to earn the University Graduate badge.'}
                        </p>
                        <button type="button" className="btn btn--ghost" style={{ marginTop: 10 }} onClick={refreshUniversity} disabled={busy}><IconRefresh /> Refresh</button>
                    </div>
                    {universityCourses.length === 0 ? (
                        <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
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
                    {universityMintCertificateInfo?.canMint && !universityMintCertificateInfo?.alreadyMinted ? (
                        <div className="card card--elevated card--university" style={{ marginTop: 16 }}>
                            <div className="card__title">Mint Full Course Completion Certificate</div>
                            <p className="card__hint">You completed all courses. Pay <strong>{universityMintCertificateInfo.costTon ?? 15} TON</strong> to the University wallet and paste the transaction hash below to mint the certificate.</p>
                            {universityMintCertificateInfo.walletAddress ? <p className="card__hint" style={{ fontSize: 11, wordBreak: 'break-all' }}>Wallet: {universityMintCertificateInfo.walletAddress}</p> : null}
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
                        <p className="card__hint">Assign a mentor for guidance. Upgrade (pay AIBA) to unlock higher tiers.</p>
                        {mentors.length === 0 ? (
                            <p className="card__hint">No mentors available.</p>
                        ) : (
                            <div className="list">
                                {mentors.map((m) => (
                                    <div key={m._id || m.key} className="list-item">
                                        <div className="list-item__main">
                                            <div className="list-item__title">{m.name}</div>
                                            <div className="list-item__desc">{m.description}{m.stakingRequiredAiba ? ` · Upgrade: ${m.stakingRequiredAiba} AIBA` : ''}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <button type="button" className="btn btn--ghost" onClick={() => assignMentor(m._id)} disabled={busy}>Assign</button>
                                            {(m.stakingRequiredAiba || 0) > 0 ? (
                                                <button type="button" className="btn btn--secondary" onClick={() => upgradeMentor(m._id)} disabled={busy} title={`Cost: ${m.stakingRequiredAiba} AIBA`}>Upgrade</button>
                                            ) : null}
                                        </div>
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

                {/* ─── Governance / DAO ──────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'governance' || tab === 'dao' ? 'is-active' : ''}`} aria-hidden={tab !== 'governance' && tab !== 'dao'}>
                    {treasurySummary ? (
                        <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)', marginBottom: 12 }}>
                            <div className="card__title">Treasury</div>
                            <p className="card__hint">{Number(treasurySummary.balanceAiba ?? 0).toLocaleString()} AIBA · {Number(treasurySummary.balanceNeur ?? 0).toLocaleString()} NEUR · Cancelled-stakes wallet: {Number(treasurySummary.cancelledStakesAiba ?? 0).toLocaleString()} AIBA · Paid out: {Number(treasurySummary.totalPaidOutAiba ?? 0).toLocaleString()} AIBA</p>
                            <button type="button" className="btn btn--ghost" onClick={() => refreshTreasuryOps()} style={{ marginTop: 6, fontSize: 12 }}><IconRefresh /> Refresh ops</button>
                        </div>
                    ) : null}
                    {treasuryOps.length > 0 ? (
                        <div className="card card--elevated" style={{ marginBottom: 12 }}>
                            <div className="card__title">Recent Treasury Ops</div>
                            <p className="card__hint">Burn, rewards, staking flows. Transparency for DAO.</p>
                            <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 8 }}>
                                {treasuryOps.slice(0, 30).map((op) => (
                                    <div key={op._id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                                        <strong>{op.type || 'op'}</strong> · {Number(op.amountAiba ?? 0).toLocaleString()} AIBA{op.source ? ` · ${op.source}` : ''}{op.refId ? ` · ${String(op.refId).slice(-8)}` : ''}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                    {tab === 'dao' ? (
                        <div className="card card--elevated">
                            <div className="card__title">DAO — Create Proposal</div>
                            {daoConfig ? (
                                <p className="card__hint">Stake at least <strong>{daoConfig.daoProposalMinStakedAiba?.toLocaleString() ?? '100,000,000'}</strong> AIBA for <strong>{daoConfig.daoProposalMinStakeDays ?? 90}</strong> days to create proposals (see Yield Vault). Your qualifying stake: <strong>{daoConfig.yourQualifyingStake?.toLocaleString() ?? 0}</strong> AIBA.</p>
                            ) : (
                                <p className="card__hint">Stake AIBA for 90+ days to create proposals (see Yield Vault).</p>
                            )}
                            <input type="text" placeholder="Proposal title" value={newProposalTitle} onChange={(e) => setNewProposalTitle(e.target.value)} style={{ padding: 8, width: '100%' }} />
                            <textarea placeholder="Proposal description" value={newProposalDesc} onChange={(e) => setNewProposalDesc(e.target.value)} style={{ padding: 8, width: '100%', minHeight: 80, marginTop: 8 }} />
                            <button type="button" className="btn btn--primary" onClick={createProposal} disabled={busy || !newProposalTitle.trim() || (daoConfig && !daoConfig.canPropose)}>Create</button>
                            {daoConfig && !daoConfig.canPropose ? (
                                <p className="card__hint" style={{ marginTop: 8, padding: 8, background: 'rgba(255,100,100,0.15)', borderRadius: 8 }}>Staking required: stake {daoConfig.daoProposalMinStakedAiba?.toLocaleString()} AIBA for {daoConfig.daoProposalMinStakeDays} days to propose.</p>
                            ) : null}
                            {daoMsg ? <p className={`status-msg ${daoMsg.includes('created') || daoMsg.includes('recorded') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{daoMsg}</p> : null}
                        </div>
                    ) : (
                        <div className="card card--elevated">
                            <div className="card__title">Governance — Create Proposal</div>
                            <input type="text" placeholder="Proposal title" value={proposalTitle} onChange={(e) => setProposalTitle(e.target.value)} style={{ padding: 8, width: '100%' }} />
                            <textarea placeholder="Proposal description" value={proposalDescription} onChange={(e) => setProposalDescription(e.target.value)} style={{ padding: 8, width: '100%', minHeight: 80, marginTop: 8 }} />
                            <button type="button" className="btn btn--primary" onClick={propose} disabled={busy || !proposalTitle.trim()}>Propose</button>
                        </div>
                    )}
                    <div className="card card--elevated" style={{ marginTop: 12 }}>
                        <div className="card__title">{tab === 'dao' ? 'DAO' : 'Governance'} Proposals</div>
                        <button type="button" className="btn btn--ghost" style={{ marginBottom: 8 }} onClick={() => tab === 'dao' ? refreshDaoProposals() : refreshProposals()} disabled={busy}><IconRefresh /> Refresh</button>
                        {proposals.length === 0 ? (
                            <p className="card__hint">No proposals yet.</p>
                        ) : (
                            <div className="list">
                                {proposals.map((p) => (
                                    <div key={p._id} className="list-item">
                                        <div className="list-item__main">
                                            <div className="list-item__title">{p.title}</div>
                                            <div className="list-item__desc">{(daoProposalDetail?._id === p._id ? daoProposalDetail.description : p.description) || '—'}</div>
                                            {tab === 'dao' && (p.votesFor !== undefined || p.votesAgainst !== undefined || daoProposalDetail?._id === p._id) ? (
                                                <p className="card__hint" style={{ marginTop: 4 }}>
                                                    For: {(daoProposalDetail?._id === p._id ? daoProposalDetail.votesFor : p.votesFor) ?? 0} · Against: {(daoProposalDetail?._id === p._id ? daoProposalDetail.votesAgainst : p.votesAgainst) ?? 0}
                                                    {daoProposalDetail?._id === p._id && daoProposalDetail.myVote ? ` · Your vote: ${daoProposalDetail.myVote}` : ''} · {p.status}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {tab === 'dao' ? (
                                                <>
                                                    <button type="button" className="btn btn--ghost" onClick={() => daoProposalDetail?._id === p._id ? setDaoProposalDetail(null) : fetchDaoProposalDetail(p._id)} disabled={busy}>{daoProposalDetail?._id === p._id ? 'Collapse' : 'View'}</button>
                                                    {p.status === 'active' ? (
                                                        <>
                                                            <button type="button" className="btn btn--success" onClick={() => voteProposal(p._id, true)} disabled={busy}>Vote For</button>
                                                            <button type="button" className="btn btn--ghost" onClick={() => voteProposal(p._id, false)} disabled={busy}>Vote Against</button>
                                                        </>
                                                    ) : null}
                                                </>
                                            ) : (
                                                <>
                                                    <button type="button" className="btn btn--success" onClick={() => voteOnProposal(p._id, 'for')} disabled={busy}>Vote For</button>
                                                    <button type="button" className="btn btn--ghost" onClick={() => voteOnProposal(p._id, 'against')} disabled={busy}>Vote Against</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ─── Updates (Unified Comms) ────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'updates' ? 'is-active' : ''}`} aria-hidden={tab !== 'updates'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title">App sections overview</div>
                        <p className="card__hint">Quick reference to all sections. Use the tab bar or Home grid to navigate.</p>
                        <div style={{ overflowX: 'auto', marginTop: 12 }}>
                            <table className="sections-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                                        <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--accent-gold)' }}>Section</th>
                                        <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--accent-gold)' }}>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Home</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>AI BROKER ARENA. Own AI brokers. Compete in 3D arenas. Earn NEUR &amp; AIBA. Swipe the tab bar or Home grid to explore.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Brokers</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>New broker, tasks, run battle, vault. Combine, breed, or mint NFT. Brokers are your AI agents that compete in 3D arenas.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Tasks</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Personalized mission queue for every player profile: newcomer, fighter, trader, racer, social, scholar, and investor.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Leaderboard</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Global ranks by score, AIBA, NEUR, or battles. Run battles to climb the ranks.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Tournaments</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Seasonal events, brackets, and competitive battles. Earn rewards by ranking.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Global Boss</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Community boss battles. Join forces to defeat the boss and earn shared rewards.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Predict</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Bet AIBA on which broker scores higher. Battle of the hour — 3% vig to treasury.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Trainers</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Global trainers network. Apply as trainer, recruit others, claim AIBA rewards.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Referrals &amp; Creator Economy</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Earn NEUR &amp; AIBA when friends join. Creator tier: earn 2–7% of referees&apos; battle, race, tournament, and boss rewards (100 refs=3%, 1k=5%, 10k=7%).</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Arenas</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Battle modes: prediction, simulation, strategyWars, arbitrage, guildWars. Choose arena and run battle.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Guilds</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Create or join a group, deposit brokers into the shared pool. Guild Wars arena sends rewards to the guild.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Super Futuristic Unified Marketplace</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Brokers, assets, rentals, system shop, boosts. Trade with TON + AIBA.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Car Racing</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Autonomous car racing. Create or buy a car, enter open races, earn AIBA by finish position.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Bike Racing</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Autonomous motorcycle racing. Create or buy a bike, enter races, earn AIBA.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>NFT Multiverse</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Own Broker NFTs, stake them to earn AIBA daily. Mint from Brokers tab (pay AIBA).</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Community Impact</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Unite for Good. Donate NEUR or AIBA to causes. Every contribution counts.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>University</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Complete systematic guide. Learn brokers, arenas, economy, guilds. Complete all to earn the University Graduate badge.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>AI Realms</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Select a realm and complete missions to earn rewards.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>AI Assets</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Mint, upgrade, list, buy, and rent AI assets. AI Agent, AI Brain, AI Creator, AI Workflow, AI System.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Governance</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Create proposals and vote. Community-driven decisions.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Profile</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Your profile, balances, badges, and account details.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Settings</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>App preferences, notifications, theme, sound, privacy, and more.</td></tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}><td style={{ padding: '10px 12px', fontWeight: 600 }}>Wallet</td><td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Claim AIBA on-chain. Stake, DAO, Stars, Diamonds. Connect wallet, create claim, sign tx.</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
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
                        <p className="card__hint">News, maintenance and updates from the team. Unread: <strong>{announcementsUnreadCount}</strong></p>
                        <div className="action-row" style={{ marginTop: 6 }}>
                            <button type="button" className="btn btn--ghost" onClick={refreshAnnouncements} disabled={busy}><IconRefresh /> Refresh feed</button>
                            <button type="button" className="btn btn--secondary" onClick={markAllAnnouncementsSeen} disabled={busy || announcementsUnreadCount <= 0}>Mark all read</button>
                        </div>
                        {announcements.length === 0 ? (
                            <p className="guide-tip">No announcements yet.</p>
                        ) : (
                            <div className="comms-feed">
                                {announcements.map((a) => (
                                    <div
                                        key={a._id}
                                        className="comms-feed__item"
                                        style={!a.isRead ? { borderColor: 'var(--accent-gold)', boxShadow: '0 0 12px rgba(255,204,0,0.12)' } : undefined}
                                        onClick={() => markAnnouncementsSeen(a._id)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && markAnnouncementsSeen(a._id)}
                                    >
                                        <div className="comms-feed__item-title">
                                            {a.title}
                                            {!a.isRead ? <span className="badge-new badge-new--cyan" style={{ marginLeft: 8 }}>Unread</span> : null}
                                        </div>
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
                    <div className="card card--elevated" id="faq-support">
                        <div className="card__title">FAQs</div>
                        <p className="card__hint" style={{ marginBottom: 12 }}>Systematic answers to common questions. Tap to expand. For the full learning path, use <strong>Guide</strong> (University) from the header.</p>
                        <div className="comms-faq">
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">What is AI Broker Battle Arena?</summary>
                                <p className="card__hint">AI Broker Battle Arena (AIBA) is a Telegram Mini App where you own AI brokers, enter battle arenas, run fights, and earn NEUR and AIBA. It combines trading-sim AI agents (brokers) with competitive arenas and an economy you can withdraw on-chain.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">What is AI Broker?</summary>
                                <p className="card__hint">An AI Broker is your AI agent with stats (INT, SPD, RISK) and energy. You create, own, combine, trade, or mint brokers. They compete in arenas, earn AIBA and NEUR from battles, and can be listed on the Market.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">What is Battle Arena?</summary>
                                <p className="card__hint">A Battle Arena is a game mode where your broker competes—prediction, simulation, strategyWars, arbitrage, or guildWars. Run a battle, get a score, and earn AIBA, Stars, and sometimes Diamonds.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">How do I start?</summary>
                                <p className="card__hint">Go to Brokers → create a broker (New broker) if you have none → pick an arena → Run battle. Earn NEUR and AIBA. See Guide for step-by-step.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">How do I get a broker?</summary>
                                <p className="card__hint">Brokers: New broker (free starter). Or Market: buy from system (AIBA) or from other players. Brokers tab: combine two brokers.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">How do I earn NEUR / AIBA?</summary>
                                <p className="card__hint">Run battles (Home or Arenas). NEUR is off-chain; AIBA can be claimed on-chain via Wallet → Vault (connect wallet, create claim, sign tx).</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">How do I earn Stars?</summary>
                                <p className="card__hint">Win battles. Each win grants Stars (Telegram Stars–style currency).</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">Where is my AIBA?</summary>
                                <p className="card__hint">Balance shows off-chain credits. To receive on-chain: connect wallet, then after a battle use Create claim or enable Auto-claim. Wallet tab → Vault.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">What are Diamonds?</summary>
                                <p className="card__hint">Rare TON ecosystem asset. You get Diamonds on your first battle win.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">Badges?</summary>
                                <p className="card__hint">Profile badges (verified, top leader, etc.) are assigned by the team or earned (e.g. top leaderboard).</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">Referrals?</summary>
                                <p className="card__hint">Referrals tab: create your code (My code), share it. When someone applies your code, you both get bonuses (NEUR/AIBA if configured).</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">Creator Economy?</summary>
                                <p className="card__hint">As a referrer, you earn 2–7% of your referrals&apos; battle, race, tournament, and Global Boss rewards. Tier: 100 refs = 3%, 1k = 5%, 10k = 7%. Passive income from every referee who plays.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">Predict?</summary>
                                <p className="card__hint">Bet AIBA on which broker scores higher (Battle of the hour). Admins create events; you pick a side and amount. Winners split the pool minus 3% vig (to treasury). Max bet configurable in Admin → Economy.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">Car / Bike racing?</summary>
                                <p className="card__hint">Create or buy a car or bike (AIBA or TON), enter open races, earn AIBA by finish position. System shop sells cars/bikes for AIBA.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">Super Futuristic Unified Marketplace?</summary>
                                <p className="card__hint">One place for brokers, assets, rentals, system shop, and boosts. Sell or buy with AIBA. Create brokers with TON. Withdraw from guild first to list your broker.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">Guilds?</summary>
                                <p className="card__hint">Guilds tab: create or join a group. Guild Wars arena sends part of rewards to the guild. Deposit brokers into the guild pool for guild wars.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">Super Admin wallets?</summary>
                                <p className="card__hint">Transaction charges (P2P AIBA send, AIBA in gifts, Buy AIBA with TON, Donate broker/car/bike/gifts) go to configured env wallets. See <code>docs/SUPER-ADMIN-WALLETS.md</code> in the repo for full reference.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">Earnings disclaimer?</summary>
                                <p className="card__hint">Rewards (AIBA, NEUR, Stars) are not guaranteed. They depend on gameplay and participation. No financial advice. See <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
                            </details>
                            <details className="comms-faq__item">
                                <summary className="comms-faq__summary">Support?</summary>
                                <p className="card__hint">Check announcements above. For bugs or requests, contact the team via the channel or link provided in announcements.</p>
                            </details>
                        </div>
                    </div>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title">Contact support</div>
                        <p className="card__hint">Submit a support request. We will respond via the channel or link in announcements.</p>
                        {(commsConfig?.supportLink || commsConfig?.supportTelegramGroup) ? (
                            <p className="card__hint" style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                <span>Direct contact:</span>
                                {commsConfig?.supportLink ? (
                                    <a href={commsConfig.supportLink} target="_blank" rel="noopener noreferrer" className="comms-feed__item-link">Open support channel</a>
                                ) : null}
                                {commsConfig?.supportTelegramGroup ? (
                                    <a href={`https://t.me/${commsConfig.supportTelegramGroup.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="comms-feed__item-link">@{commsConfig.supportTelegramGroup.replace(/^@/, '')}</a>
                                ) : null}
                            </p>
                        ) : null}
                        <select className="select" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} style={{ marginTop: 8, minWidth: 160 }}>
                            <option value="question">Question</option>
                            <option value="bug">Bug report</option>
                            <option value="feature">Feature request</option>
                            <option value="account">Account</option>
                            <option value="other">Other</option>
                        </select>
                        <textarea className="input" value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} placeholder="Your message..." rows={4} style={{ marginTop: 8, width: '100%', resize: 'vertical' }} />
                        <button type="button" className="btn btn--primary" onClick={submitSupportRequest} disabled={busy || !supportMessage.trim()} style={{ marginTop: 8 }}>Submit</button>
                        {supportMsg ? <p className={`status-msg ${supportMsg.includes('submitted') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{supportMsg}</p> : null}
                        <div style={{ marginTop: 14 }}>
                            <div className="card__title" style={{ fontSize: '0.9rem' }}>My support requests</div>
                            {supportRequests.length === 0 ? (
                                <p className="card__hint">No support requests yet.</p>
                            ) : (
                                <div className="comms-feed">
                                    {supportRequests.slice(0, 10).map((r) => (
                                        <div key={r._id} className="comms-feed__item">
                                            <div className="comms-feed__item-title">{String(r.subject || 'other').toUpperCase()}</div>
                                            <div className="comms-feed__item-meta">Status: {r.status || 'open'} · {r.createdAt ? new Date(r.createdAt).toLocaleString() : 'now'}</div>
                                            <p className="comms-feed__item-body">{String(r.message || '').slice(0, 300)}{String(r.message || '').length > 300 ? '…' : ''}</p>
                                            {r.adminNote ? <p className="card__hint"><strong>Admin note:</strong> {r.adminNote}</p> : null}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ─── Profile ────────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'profile' ? 'is-active' : ''}`} aria-hidden={tab !== 'profile'}>
                    <div className="card card--elevated card--identity profile-panel">
                        <div className="profile-avatar-row">
                            {tgUser?.photo_url ? (
                                <img src={tgUser.photo_url} alt="" className="profile-avatar" />
                            ) : (
                                <span className="profile-avatar profile-avatar--fallback"><IconProfile /></span>
                            )}
                            <div className="profile-info">
                                <div className="profile-name">{tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || 'User' : 'User'}</div>
                                {tgUser?.username ? <div className="profile-username">@{tgUser.username}</div> : null}
                                {tgUser?.id ? <div className="profile-id">Telegram ID: {tgUser.id}</div> : null}
                            </div>
                        </div>
                        <div className="identity-badges" style={{ marginTop: 12 }}>
                            {Array.isArray(economyMe?.badges) && economyMe.badges.length > 0 ? (
                                economyMe.badges.map((badgeId) => {
                                    const meta = BADGE_LABELS[badgeId] || { label: badgeId, color: 'var(--text-muted)' };
                                    return (
                                        <span key={badgeId} className="badge-pill" style={{ borderColor: meta.color, color: meta.color }} title={meta.title || meta.label} data-badge={badgeId === 'verified' ? 'verified' : undefined}>{meta.label}</span>
                                    );
                                })
                            ) : (
                                <span className="card__hint">No badges yet. Earn or get assigned by admins.</span>
                            )}
                        </div>
                        {economyMe?.profileBoostedUntil && new Date(economyMe.profileBoostedUntil) > new Date() ? (
                            <p className="card__hint" style={{ marginTop: 8, color: 'var(--accent-gold)' }}>Profile boosted until {new Date(economyMe.profileBoostedUntil).toLocaleString()}</p>
                        ) : null}
                        <div className="profile-balances" style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                            <span className="home-stat-pill">NEUR {Number(economyMe?.neurBalance ?? 0)}</span>
                            <span className="home-stat-pill">AIBA {Number(economyMe?.aibaBalance ?? 0)}</span>
                            <span className="home-stat-pill"><IconStar /> Stars {Number(economyMe?.starsBalance ?? 0)}</span>
                            <span className="home-stat-pill"><IconDiamond /> Diamonds {Number(economyMe?.diamondsBalance ?? 0)}</span>
                            <span className="home-stat-pill">Brokers {brokers.length}</span>
                        </div>
                        <button type="button" className="btn btn--secondary" onClick={() => setTab('wallet')} style={{ marginTop: 16 }}><IconWallet /> Wallet &amp; more</button>
                    </div>
                </section>

                {/* ─── Settings ────────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'settings' ? 'is-active' : ''}`} aria-hidden={tab !== 'settings'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title"><IconSettings /> Settings</div>
                        <p className="card__hint">App preferences, notifications, and account options.</p>
                    </div>
                    <div className="card">
                        <div className="card__title">Notifications</div>
                        <p className="card__hint">Battle results, rewards, and announcements.</p>
                        <label className="check-wrap" style={{ marginTop: 8 }}>
                            <input type="checkbox" defaultChecked readOnly />
                            Push notifications
                        </label>
                        <label className="check-wrap" style={{ marginTop: 6 }}>
                            <input type="checkbox" defaultChecked readOnly />
                            Battle win alerts
                        </label>
                        <label className="check-wrap" style={{ marginTop: 6 }}>
                            <input type="checkbox" defaultChecked readOnly />
                            Reward &amp; claim reminders
                        </label>
                    </div>
                    <div className="card">
                        <div className="card__title">Appearance</div>
                        <p className="card__hint">Theme and display preferences.</p>
                        <div className="settings-options" style={{ marginTop: 8 }}>
                            <label className="check-wrap"><input type="radio" name="theme" defaultChecked /> Dark (default)</label>
                            <label className="check-wrap" style={{ marginTop: 6 }}><input type="radio" name="theme" /> Light</label>
                            <label className="check-wrap" style={{ marginTop: 6 }}><input type="radio" name="theme" /> System</label>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card__title">Sound &amp; haptics</div>
                        <p className="card__hint">Audio and vibration feedback.</p>
                        <label className="check-wrap" style={{ marginTop: 8 }}><input type="checkbox" defaultChecked readOnly /> Sound effects</label>
                        <label className="check-wrap" style={{ marginTop: 6 }}><input type="checkbox" defaultChecked readOnly /> Haptic feedback</label>
                    </div>
                    <div className="card">
                        <div className="card__title">Privacy &amp; data</div>
                        <p className="card__hint">Data handling and visibility.</p>
                        <p className="card__hint" style={{ marginTop: 8 }}>Profile visible on leaderboard: <strong>Yes</strong></p>
                        <p className="card__hint">Data is used for gameplay, rewards, and support.</p>
                        <div className="legal-page__links" style={{ marginTop: 12 }}>
                            <Link href="/privacy">Privacy Policy</Link>
                            <Link href="/terms">Terms of Service</Link>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card__title">About</div>
                        <p className="card__hint">AIBA Arena — Own AI brokers. Compete in 3D arenas. Earn NEUR &amp; AIBA.</p>
                        <p className="card__hint" style={{ marginTop: 6 }}>Version: 1.0.0</p>
                        <p className="card__hint">Backend: {BACKEND_URL}</p>
                    </div>
                    <div className="card">
                        <div className="card__title">Support</div>
                        <button type="button" className="btn btn--ghost" onClick={() => { scrollToFaqRef.current = true; setTab('updates'); }} style={{ marginTop: 6 }}>FAQs &amp; support</button>
                        <button type="button" className="btn btn--ghost" onClick={() => setTab('university')} style={{ marginTop: 6, marginLeft: 8 }}>Guide</button>
                    </div>
                </section>

                {/* ─── More games (extensible hub) ─────────────────────────────── */}
                <section className={`tab-panel ${tab === 'games' ? 'is-active' : ''}`} aria-hidden={tab !== 'games'}>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title"><IconGames /> More games</div>
                        <p className="card__hint">Other apps and games in the AIBA ecosystem. Play seamlessly from one platform — like LoveBank and Hamster Kombat.</p>
                    </div>
                    {Array.isArray(EXTERNAL_APPS) && EXTERNAL_APPS.length > 0 ? (
                        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                            {EXTERNAL_APPS.map((app) => (
                                <div key={app.id} className="card" style={{ padding: 16 }}>
                                    <div className="card__title" style={{ marginTop: 0 }}>{app.name}</div>
                                    {app.description ? <p className="card__hint" style={{ marginBottom: 10 }}>{app.description}</p> : null}
                                    <a href={app.url} target="_blank" rel="noopener noreferrer" className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                        Play
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card" style={{ marginTop: 16 }}>
                            <p className="card__hint">More games from our ecosystem will appear here. Add entries in <code style={{ fontSize: '0.8rem' }}>miniapp/src/config/navigation.js</code> (EXTERNAL_APPS) to list Telegram Mini Apps or web games.</p>
                        </div>
                    )}
                </section>

                {/* ─── Yield Vault (Staking) ─────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'staking' ? 'is-active' : ''}`} aria-hidden={tab !== 'staking'}>
                    <div className="card card--elevated major-tab__hero yield-vault-hero" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                        <div className="card__title"><IconStake /> Yield Vault</div>
                        <p className="card__hint">Lock AIBA for flexible or fixed periods. Higher APY for longer locks. Early cancel = 5% fee to Treasury.</p>
                        <p className="card__hint" style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(255,200,100,0.12)', borderRadius: 6, display: 'inline-block' }}><strong>Minimum stake:</strong> {stakingMinAiba.toLocaleString()} AIBA (ecosystem-aligned: 1T AIBA, broker mint cost)</p>
                        {(() => {
                            const activeLocks = stakingLocks.filter((l) => l.status === 'active');
                            const totalLocked = activeLocks.reduce((s, l) => s + (Number(l.amount) || 0), 0);
                            if (activeLocks.length > 0) {
                                return (
                                    <div className="coe-stats-bar yield-vault-stats" style={{ marginTop: 12, padding: '10px 0', borderTop: '1px solid var(--border-subtle)' }}>
                                        <span className="home-stat-pill">Active: {activeLocks.length} lock{activeLocks.length !== 1 ? 's' : ''}</span>
                                        <span className="home-stat-pill">Locked: {totalLocked.toLocaleString()} AIBA</span>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                        <button type="button" className="btn btn--secondary" onClick={() => { refreshStaking(); refreshStakingPeriods(); refreshStakingLocks(); refreshEconomy(); }} disabled={busy} style={{ marginTop: 12 }}><IconRefresh /> Refresh</button>
                    </div>
                    <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)', marginTop: 12 }}>
                        <div className="card__title"><IconStake /> Locked staking</div>
                        <p className="card__hint">Lock AIBA for a period. Higher APY for longer locks. Early cancel = fee to Super Admin (Cancelled Stakes).</p>
                        <p className="card__hint" style={{ marginTop: 8 }}><strong>All available balances:</strong></p>
                        <p className="card__hint" style={{ marginTop: 4 }}>AIBA: <strong>{Number(economyMe?.aibaBalance ?? 0).toLocaleString()}</strong> · NEUR: <strong>{Number(economyMe?.neurBalance ?? 0).toLocaleString()}</strong> (staking uses AIBA only)</p>
                        <p className="card__hint" style={{ marginTop: 4 }}><strong>Minimum stake:</strong> {stakingMinAiba.toLocaleString()} AIBA</p>
                        <div style={{ marginTop: 12 }}>
                            <label className="card__hint" style={{ display: 'block', marginBottom: 4 }}>Amount to stake (min {stakingMinAiba.toLocaleString()} AIBA)</label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <input className="input" type="number" min={stakingMinAiba} value={stakeLockAmount} onChange={(e) => setStakeLockAmount(e.target.value)} placeholder={`Min ${stakingMinAiba} AIBA`} style={{ width: 140 }} />
                                <button type="button" className="btn btn--ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setStakeLockAmount(String(Math.floor(Number(economyMe?.aibaBalance ?? 0))))} title="Use full AIBA balance">Max</button>
                            </div>
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <label className="card__hint" style={{ display: 'block', marginBottom: 4 }}>Period</label>
                            <select className="select" value={stakeLockPeriodDays} onChange={(e) => setStakeLockPeriodDays(Number(e.target.value))}>
                                {stakingPeriods.length > 0 ? stakingPeriods.map((p) => (
                                    <option key={p.days} value={p.days}>{p.days} days — {p.apyPercent}% APY</option>
                                )) : (
                                    <>
                                        <option value={30}>30 days — 10% APY</option>
                                        <option value={90}>90 days — 12% APY</option>
                                        <option value={180}>180 days — 15% APY</option>
                                        <option value={365}>365 days — 18% APY</option>
                                    </>
                                )}
                            </select>
                            <p className="card__hint" style={{ marginTop: 8 }}>
                                Available periods: {(stakingPeriods.length > 0 ? stakingPeriods : [{ days: 30, apyPercent: 10 }, { days: 90, apyPercent: 12 }, { days: 180, apyPercent: 15 }, { days: 365, apyPercent: 18 }])
                                    .map((p) => `${p.days}d (${p.apyPercent}% APY)`)
                                    .join(' · ')}
                            </p>
                        </div>
{stakeLockAmount && Number(stakeLockAmount) > 0 && stakeLockPeriodDays ? (
                                <p className="card__hint" style={{ marginTop: 12, padding: 10, background: 'rgba(255,200,100,0.15)', borderRadius: 8 }}>
                                    <strong>Preview:</strong> Lock {Number(stakeLockAmount).toLocaleString()} AIBA for {stakeLockPeriodDays} days at {(() => { const p = stakingPeriods.find((x) => Number(x.days) === Number(stakeLockPeriodDays)); const apy = Number(p?.apyPercent ?? ({ 30: 10, 90: 12, 180: 15, 365: 18 }[stakeLockPeriodDays] ?? 15)); return apy; })()}% APY → earn ~{(() => { const p = stakingPeriods.find((x) => Number(x.days) === Number(stakeLockPeriodDays)); const apy = Number(p?.apyPercent ?? ({ 30: 10, 90: 12, 180: 15, 365: 18 }[stakeLockPeriodDays] ?? 15)); return Math.floor(Number(stakeLockAmount) * (apy / 100) * Number(stakeLockPeriodDays) / 365).toLocaleString(); })()} AIBA reward.
                                    {' '}Total on maturity ≈ {(() => {
                                        const p = stakingPeriods.find((x) => Number(x.days) === Number(stakeLockPeriodDays));
                                        const apy = Number(p?.apyPercent ?? ({ 30: 10, 90: 12, 180: 15, 365: 18 }[stakeLockPeriodDays] ?? 15));
                                        const principal = Math.floor(Number(stakeLockAmount) || 0);
                                        const reward = Math.floor(principal * (apy / 100) * Number(stakeLockPeriodDays) / 365);
                                        return (principal + reward).toLocaleString();
                                    })()} AIBA.
                                </p>
                            ) : null}
                        <button type="button" className="btn btn--primary" onClick={stakeLocked} disabled={busy || !stakeLockAmount || Number(stakeLockAmount) < stakingMinAiba} style={{ marginTop: 12 }}><IconStake /> Confirm stake</button>
                        {stakingLockMsg ? <p className={`status-msg ${stakingLockMsg.includes('Locked') || stakingLockMsg.includes('Claimed') || stakingLockMsg.includes('Returned') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{stakingLockMsg}</p> : null}
                        <div style={{ marginTop: 20 }}>
                            <div className="card__title">Active locks (live countdown)</div>
                            {stakingLocks.filter((l) => l.status === 'active').length === 0 ? (
                                <p className="guide-tip">No active locks.</p>
                            ) : (
                                stakingLocks.filter((l) => l.status === 'active').map((lock) => {
                                    const now = Date.now();
                                    const unlocksAt = new Date(lock.unlocksAt).getTime();
                                    const canClaim = unlocksAt <= now;
                                    const msLeft = Math.max(0, unlocksAt - now);
                                    const days = Math.floor(msLeft / (24 * 60 * 60 * 1000));
                                    const hrs = Math.floor((msLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                                    const min = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));
                                    const sec = Math.floor((msLeft % (60 * 1000)) / 1000);
                                    return (
                                        <div key={lock._id} className="card" style={{ marginTop: 10, padding: 12 }}>
                                            <p className="card__hint">{lock.amount?.toLocaleString()} AIBA · {lock.periodDays}d · {lock.apyPercent}% APY</p>
                                            <p className="card__hint" style={{ marginTop: 6 }}>
                                                {canClaim ? (
                                                    <strong style={{ color: 'var(--accent-green)' }}>Ready to claim!</strong>
                                                ) : (
                                                    <>Live countdown: <strong>{days}d {hrs}h {min}m {sec}s</strong></>
                                                )}
                                            </p>
                                            {canClaim ? (
                                                <button type="button" className="btn btn--success" onClick={() => claimLock(lock._id)} disabled={busy}>Claim</button>
                                            ) : (
                                                <button type="button" className="btn btn--secondary" onClick={() => cancelStakeEarly(lock._id)} disabled={busy}>Cancel early (5% fee)</button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    <div className="card" style={{ marginTop: 12 }}>
                        <div className="card__title">Flexible staking</div>
                        <p className="card__hint">Stake or unstake anytime. Claim rewards when ready.</p>
                        <p className="card__hint" style={{ marginTop: 4 }}><strong>Minimum:</strong> {stakingMinAiba.toLocaleString()} AIBA</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 10 }}>
                            <button type="button" className="btn btn--secondary" onClick={refreshStaking} disabled={busy}><IconRefresh /> Refresh</button>
                        </div>
                        {stakingSummary ? (
                            <p className="card__hint" style={{ marginTop: 8 }}>Staked: {stakingSummary.stakedAmount} AIBA · APY: {stakingSummary.apyPercent}% · Pending: {stakingSummary.pendingReward} AIBA</p>
                        ) : null}
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input className="input" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder={`Min ${stakingMinAiba} AIBA`} style={{ width: 120 }} />
                            <button type="button" className="btn btn--ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setStakeAmount(String(Math.floor(Number(economyMe?.aibaBalance ?? 0))))} title="Use full AIBA balance">Max</button>
                            <button type="button" className="btn btn--primary" onClick={stake} disabled={busy || !stakeAmount.trim() || Number(stakeAmount) < stakingMinAiba}><IconStake /> Stake</button>
                            <input className="input" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)} placeholder="Unstake (AIBA)" style={{ width: 120 }} />
                            <button type="button" className="btn btn--secondary" onClick={unstake} disabled={busy || !unstakeAmount.trim()}>Unstake</button>
                            <button type="button" className="btn btn--success" onClick={claimStaking} disabled={busy}><IconClaim /> Claim reward</button>
                        </div>
                        {stakeMsg ? <p className="status-msg" style={{ marginTop: 8 }}>{stakeMsg}</p> : null}
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <button type="button" className="btn btn--ghost" onClick={() => setTab('wallet')}><IconWallet /> Wallet &amp; more</button>
                    </div>
                </section>

                {/* ─── Wallet ─────────────────────────────────────────────────── */}
                <section className={`tab-panel ${tab === 'wallet' ? 'is-active' : ''}`} aria-hidden={tab !== 'wallet'}>
                    <div className="flow-switch" role="group" aria-label="Wallet flow" style={{ marginBottom: 12 }}>
                        {['overview', 'staking'].map((f) => (
                            <button key={f} type="button" className={`flow-switch__btn ${walletFlow === f ? 'is-active' : ''}`} onClick={() => setWalletFlow(f)}>{f === 'staking' ? 'Staking' : 'Overview'}{f === 'staking' ? <span className="badge-new badge-new--gold" style={{ marginLeft: 6 }}>NEW</span> : ''}</button>
                        ))}
                    </div>
                    {walletFlow === 'staking' ? (
                        <div className="card card--elevated" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                            <div className="card__title"><IconStake /> Locked staking</div>
                            <p className="card__hint">Lock AIBA for a period. Higher APY for longer locks. Early cancel = fee to Super Admin (Cancelled Stakes).</p>
                            <p className="card__hint" style={{ marginTop: 8 }}><strong>All available balances:</strong></p>
                            <p className="card__hint" style={{ marginTop: 4 }}>AIBA: <strong>{Number(economyMe?.aibaBalance ?? 0).toLocaleString()}</strong> · NEUR: <strong>{Number(economyMe?.neurBalance ?? 0).toLocaleString()}</strong> (staking uses AIBA only)</p>
                            <p className="card__hint" style={{ marginTop: 4 }}><strong>Minimum stake:</strong> {stakingMinAiba.toLocaleString()} AIBA</p>
                            <div style={{ marginTop: 12 }}>
                                <label className="card__hint" style={{ display: 'block', marginBottom: 4 }}>Amount to stake (min {stakingMinAiba.toLocaleString()} AIBA)</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input className="input" type="number" min={stakingMinAiba} value={stakeLockAmount} onChange={(e) => setStakeLockAmount(e.target.value)} placeholder={`Min ${stakingMinAiba} AIBA`} style={{ width: 140 }} />
                                    <button type="button" className="btn btn--ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setStakeLockAmount(String(Math.floor(Number(economyMe?.aibaBalance ?? 0))))} title="Use full AIBA balance">Max</button>
                                </div>
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <label className="card__hint" style={{ display: 'block', marginBottom: 4 }}>Period</label>
                                <select className="select" value={stakeLockPeriodDays} onChange={(e) => setStakeLockPeriodDays(Number(e.target.value))}>
                                    {stakingPeriods.length > 0 ? stakingPeriods.map((p) => (
                                        <option key={p.days} value={p.days}>{p.days} days — {p.apyPercent}% APY</option>
                                    )) : (
                                        <>
                                            <option value={30}>30 days — 10% APY</option>
                                            <option value={90}>90 days — 12% APY</option>
                                            <option value={180}>180 days — 15% APY</option>
                                            <option value={365}>365 days — 18% APY</option>
                                        </>
                                    )}
                                </select>
                                <p className="card__hint" style={{ marginTop: 8 }}>
                                    Available periods: {(stakingPeriods.length > 0 ? stakingPeriods : [{ days: 30, apyPercent: 10 }, { days: 90, apyPercent: 12 }, { days: 180, apyPercent: 15 }, { days: 365, apyPercent: 18 }])
                                        .map((p) => `${p.days}d (${p.apyPercent}% APY)`)
                                        .join(' · ')}
                                </p>
                            </div>
                            {stakeLockAmount && Number(stakeLockAmount) > 0 && stakeLockPeriodDays ? (
                                <p className="card__hint" style={{ marginTop: 12, padding: 10, background: 'rgba(255,200,100,0.15)', borderRadius: 8 }}>
                                    <strong>Preview:</strong> Lock {Number(stakeLockAmount).toLocaleString()} AIBA for {stakeLockPeriodDays} days at {(() => { const p = stakingPeriods.find((x) => Number(x.days) === Number(stakeLockPeriodDays)); const apy = Number(p?.apyPercent ?? ({ 30: 10, 90: 12, 180: 15, 365: 18 }[stakeLockPeriodDays] ?? 15)); return apy; })()}% APY → earn ~{(() => { const p = stakingPeriods.find((x) => Number(x.days) === Number(stakeLockPeriodDays)); const apy = Number(p?.apyPercent ?? ({ 30: 10, 90: 12, 180: 15, 365: 18 }[stakeLockPeriodDays] ?? 15)); return Math.floor(Number(stakeLockAmount) * (apy / 100) * Number(stakeLockPeriodDays) / 365).toLocaleString(); })()} AIBA reward.
                                    {' '}Total on maturity ≈ {(() => {
                                        const p = stakingPeriods.find((x) => Number(x.days) === Number(stakeLockPeriodDays));
                                        const apy = Number(p?.apyPercent ?? ({ 30: 10, 90: 12, 180: 15, 365: 18 }[stakeLockPeriodDays] ?? 15));
                                        const principal = Math.floor(Number(stakeLockAmount) || 0);
                                        const reward = Math.floor(principal * (apy / 100) * Number(stakeLockPeriodDays) / 365);
                                        return (principal + reward).toLocaleString();
                                    })()} AIBA.
                                </p>
                            ) : null}
                            <button type="button" className="btn btn--primary" onClick={stakeLocked} disabled={busy || !stakeLockAmount || Number(stakeLockAmount) < stakingMinAiba} style={{ marginTop: 12 }}><IconStake /> Confirm stake</button>
                            {stakingLockMsg ? <p className={`status-msg ${stakingLockMsg.includes('Locked') || stakingLockMsg.includes('Claimed') || stakingLockMsg.includes('Returned') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{stakingLockMsg}</p> : null}
                            <div style={{ marginTop: 20 }}>
                                <div className="card__title">Active locks (live countdown)</div>
                                {stakingLocks.filter((l) => l.status === 'active').length === 0 ? (
                                    <p className="guide-tip">No active locks.</p>
                                ) : (
                                    stakingLocks.filter((l) => l.status === 'active').map((lock) => {
                                        const now = Date.now();
                                        const unlocksAt = new Date(lock.unlocksAt).getTime();
                                        const canClaim = unlocksAt <= now;
                                        const msLeft = Math.max(0, unlocksAt - now);
                                        const days = Math.floor(msLeft / (24 * 60 * 60 * 1000));
                                        const hrs = Math.floor((msLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                                        const min = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));
                                        const sec = Math.floor((msLeft % (60 * 1000)) / 1000);
                                        return (
                                            <div key={lock._id} className="card" style={{ marginTop: 10, padding: 12 }}>
                                                <p className="card__hint">{lock.amount?.toLocaleString()} AIBA · {lock.periodDays}d · {lock.apyPercent}% APY</p>
                                                <p className="card__hint" style={{ marginTop: 6 }}>
                                                    {canClaim ? (
                                                        <strong style={{ color: 'var(--accent-green)' }}>Ready to claim!</strong>
                                                    ) : (
                                                        <>Live countdown: <strong>{days}d {hrs}h {min}m {sec}s</strong></>
                                                    )}
                                                </p>
                                                {canClaim ? (
                                                    <button type="button" className="btn btn--success" onClick={() => claimLock(lock._id)} disabled={busy}>Claim</button>
                                                ) : (
                                                    <button type="button" className="btn btn--secondary" onClick={() => cancelStakeEarly(lock._id)} disabled={busy}>Cancel early (5% fee)</button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ) : null}
                    {walletFlow === 'overview' ? (
                    <>
                    <div className="status-banner status-banner--info" style={{ marginBottom: 12, fontSize: 12, padding: '10px 12px' }}>
                        <strong>Disclaimer:</strong> Rewards (AIBA, NEUR) are not guaranteed. They depend on gameplay and participation. No financial advice. See <Link href="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms of Service</Link>.
                    </div>
                    {(treasurySummary || oraclePrice) ? (
                        <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                            <div className="card__title"><IconTreasury /> Ecosystem</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
                                {treasurySummary ? (
                                    <div>
                                        <span className="card__hint">Treasury: </span>
                                        <strong>{Number(treasurySummary.balanceAiba ?? 0).toLocaleString()} AIBA</strong> · <strong>{Number(treasurySummary.balanceNeur ?? 0).toLocaleString()} NEUR</strong> · <strong>{Number(treasurySummary.cancelledStakesAiba ?? 0).toLocaleString()} cancelled-stakes AIBA</strong>
                                    </div>
                                ) : null}
                                {oraclePrice?.aibaPerTon ? (
                                    <div>
                                        <span className="card__hint">Live rate: </span>
                                        <strong>{oraclePrice.aibaPerTon} AIBA/TON</strong>
                                        {oraclePrice.updatedAt ? <span className="card__hint" style={{ marginLeft: 6 }}>({new Date(oraclePrice.updatedAt).toLocaleTimeString()})</span> : null}
                                    </div>
                                ) : null}
                            </div>
                            <button type="button" className="btn btn--ghost" onClick={() => refreshTreasuryOracle()} style={{ marginTop: 8, fontSize: 12 }}><IconRefresh /> Refresh</button>
                        </div>
                    ) : null}
                    <div className="card card--elevated card--identity">
                        <div className="card__title">Wallet &amp; profile</div>
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
                            <p className="card__hint" style={{ marginTop: 8, color: 'var(--accent-gold)' }}>Profile boosted until {new Date(economyMe.profileBoostedUntil).toLocaleString()}</p>
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
                    {p2pConfig?.p2pWallet ? (
                        <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                            <div className="card__title">1. P2P AIBA send</div>
                            <p className="card__hint">Send AIBA to another user. Transaction charge: <strong>{(p2pConfig.p2pSendFeeTonNano / 1e9).toFixed(2)} TON</strong> → Super Admin wallet (P2P AIBA send). Pay fee, paste tx hash, then send.</p>
                            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <input className="input" value={p2pTo} onChange={(e) => setP2pTo(e.target.value)} placeholder="Recipient: Telegram ID or @username" />
                                <input className="input" type="number" min={1} value={p2pAmount} onChange={(e) => setP2pAmount(e.target.value)} placeholder="Amount AIBA" />
                                <input className="input" value={p2pTxHash} onChange={(e) => setP2pTxHash(e.target.value)} placeholder="Tx hash (TON fee)" />
                                <button type="button" className="btn btn--primary" onClick={sendP2pAiba} disabled={busy || !p2pTxHash.trim() || !p2pTo.trim() || !p2pAmount}>Send AIBA</button>
                            </div>
                            {p2pMsg ? <p className={`status-msg ${p2pMsg.includes('sent') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{p2pMsg}</p> : null}
                        </div>
                    ) : null}
                    {p2pConfig?.buyWallet && (p2pConfig.oracleAibaPerTon || 0) > 0 ? (
                        <div className="card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                            <div className="card__title">3. Buy AIBA with TON</div>
                            <p className="card__hint">Send TON to purchase AIBA. Rate: <strong>{p2pConfig.oracleAibaPerTon} AIBA/TON</strong> (fee {(p2pConfig.buyFeeBps || 0) / 100}%). Transaction charge → Super Admin wallet (Buy AIBA with TON). Use any TON-supported wallet.</p>
                            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <input className="input" value={buyAibaTxHash} onChange={(e) => setBuyAibaTxHash(e.target.value)} placeholder="Transaction hash" style={{ flex: '1 1 200px', minWidth: 0 }} />
                                <button type="button" className="btn btn--primary" onClick={buyAibaWithTon} disabled={busy || !buyAibaTxHash.trim()}>Buy AIBA</button>
                            </div>
                            {buyAibaMsg ? <p className={`status-msg ${buyAibaMsg.includes('Received') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{buyAibaMsg}</p> : null}
                        </div>
                    ) : null}
                    {p2pConfig?.aibaInGiftsWallet && (p2pConfig.oracleAibaPerTon || 0) > 0 ? (
                        <div className="card" style={{ borderLeft: '4px solid var(--accent-magenta)' }}>
                            <div className="card__title">2. AIBA in gifts</div>
                            <p className="card__hint">Pay TON and send AIBA to a recipient. Cost = amount/rate + fee ({(p2pConfig.aibaInGiftsFeeTonNano ?? 100_000_000) / 1e9} TON). Transaction charge → Super Admin wallet (AIBA in gifts).</p>
                            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <input className="input" value={giftAibaTo} onChange={(e) => setGiftAibaTo(e.target.value)} placeholder="Recipient: Telegram ID or @username" />
                                <input className="input" type="number" min={1} value={giftAibaAmount} onChange={(e) => setGiftAibaAmount(e.target.value)} placeholder="Amount AIBA" />
                                <input className="input" value={giftAibaTxHash} onChange={(e) => setGiftAibaTxHash(e.target.value)} placeholder="Transaction hash (TON)" />
                                <button type="button" className="btn btn--secondary" onClick={sendAibaGift} disabled={busy || !giftAibaTxHash.trim() || !giftAibaTo.trim() || !giftAibaAmount}>Send AIBA gift</button>
                            </div>
                            {giftAibaMsg ? <p className={`status-msg ${giftAibaMsg.includes('sent') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{giftAibaMsg}</p> : null}
                        </div>
                    ) : null}
                    {donateConfig?.broker || donateConfig?.car || donateConfig?.bike || donateConfig?.gifts ? (
                        <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                            <div className="card__title">4. Donate</div>
                            <p className="card__hint">Donate brokers, cars, bikes, or TON to gifts fund. Transaction charge (TON) → Super Admin wallet per type below.</p>
                            <div style={{ marginTop: 8, marginBottom: 8 }}>
                                <button type="button" className="btn btn--ghost" onClick={() => { refreshBrokers().catch(() => {}); refreshCarRacing().catch(() => {}); refreshBikeRacing().catch(() => {}); }} disabled={busy} style={{ fontSize: '0.8rem' }}><IconRefresh /> Load my brokers, cars, bikes</button>
                            </div>
                            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {donateConfig?.broker ? (
                                    <div style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                                        <strong>A. Donate a broker</strong> · {(donateConfig.donateBrokerFeeTonNano / 1e9).toFixed(1)} TON → Super Admin (DONATE A BROKER)
                                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                            {brokers.filter((b) => !b.guildId).length > 0 ? (
                                                <select className="select" value={donateBrokerId} onChange={(e) => setDonateBrokerId(e.target.value)} style={{ flex: '1 1 140px', minWidth: 0 }}>
                                                    <option value="">Select broker</option>
                                                    {brokers.filter((b) => !b.guildId).map((b) => (
                                                        <option key={b._id} value={b._id}>#{String(b._id).slice(-6)} INT{b.intelligence} SPD{b.speed}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input className="input" value={donateBrokerId} onChange={(e) => setDonateBrokerId(e.target.value)} placeholder="Broker ID" style={{ flex: '1 1 120px', minWidth: 0 }} />
                                            )}
                                            <input className="input" value={donateBrokerTxHash} onChange={(e) => setDonateBrokerTxHash(e.target.value)} placeholder="Tx hash" style={{ flex: '1 1 160px', minWidth: 0 }} />
                                            <button type="button" className="btn btn--ghost" onClick={donateBroker} disabled={busy}>Donate</button>
                                        </div>
                                    </div>
                                ) : null}
                                {donateConfig?.car ? (
                                    <div style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                                        <strong>B. Donate a car</strong> · {(donateConfig.donateCarFeeTonNano / 1e9).toFixed(1)} TON → Super Admin (DONATE A CAR)
                                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                            {myCars.length > 0 ? (
                                                <select className="select" value={donateCarId} onChange={(e) => setDonateCarId(e.target.value)} style={{ flex: '1 1 140px', minWidth: 0 }}>
                                                    <option value="">Select car</option>
                                                    {myCars.map((c) => (
                                                        <option key={c._id} value={c._id}>#{String(c._id).slice(-6)}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input className="input" value={donateCarId} onChange={(e) => setDonateCarId(e.target.value)} placeholder="Car ID" style={{ flex: '1 1 120px', minWidth: 0 }} />
                                            )}
                                            <input className="input" value={donateCarTxHash} onChange={(e) => setDonateCarTxHash(e.target.value)} placeholder="Tx hash" style={{ flex: '1 1 160px', minWidth: 0 }} />
                                            <button type="button" className="btn btn--ghost" onClick={donateCar} disabled={busy}>Donate</button>
                                        </div>
                                    </div>
                                ) : null}
                                {donateConfig?.bike ? (
                                    <div style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                                        <strong>C. Donate a bike</strong> · {(donateConfig.donateBikeFeeTonNano / 1e9).toFixed(1)} TON → Super Admin (DONATE A BIKE)
                                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                            {myBikes.length > 0 ? (
                                                <select className="select" value={donateBikeId} onChange={(e) => setDonateBikeId(e.target.value)} style={{ flex: '1 1 140px', minWidth: 0 }}>
                                                    <option value="">Select bike</option>
                                                    {myBikes.map((b) => (
                                                        <option key={b._id} value={b._id}>#{String(b._id).slice(-6)}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input className="input" value={donateBikeId} onChange={(e) => setDonateBikeId(e.target.value)} placeholder="Bike ID" style={{ flex: '1 1 120px', minWidth: 0 }} />
                                            )}
                                            <input className="input" value={donateBikeTxHash} onChange={(e) => setDonateBikeTxHash(e.target.value)} placeholder="Tx hash" style={{ flex: '1 1 160px', minWidth: 0 }} />
                                            <button type="button" className="btn btn--ghost" onClick={donateBike} disabled={busy}>Donate</button>
                                        </div>
                                    </div>
                                ) : null}
                                {donateConfig?.gifts ? (
                                    <div style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                                        <strong>D. Donate gifts</strong> · {(donateConfig.donateGiftsFeeTonNano / 1e9).toFixed(1)} TON → Super Admin (DONATE GIFTS)
                                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                            <input className="input" value={donateGiftsTxHash} onChange={(e) => setDonateGiftsTxHash(e.target.value)} placeholder="Tx hash" style={{ flex: '1 1 200px', minWidth: 0 }} />
                                            <button type="button" className="btn btn--ghost" onClick={donateGifts} disabled={busy}>Donate</button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                            {donateMsg ? <p className={`status-msg ${donateMsg.includes('donated') || donateMsg.includes('recorded') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{donateMsg}</p> : null}
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
                        <>
                            <div className="card card--elevated">
                                <div className="card__title">Streaks <span className="badge-new badge-new--cyan">NEW</span></div>
                                <p className="card__hint">Login streak: <strong>{dailyStatus.loginStreakDays ?? 0}</strong> days · Battle win streak: <strong>{dailyStatus.battleWinStreak ?? 0}</strong> wins. Higher streaks increase battle rewards.</p>
                            </div>
                            <div className="card card--elevated">
                                <div className="card__title">Daily reward</div>
                                <p className="card__hint">
                                    {dailyStatus.alreadyClaimedToday ? 'Already claimed today.' : `Claim ${dailyStatus.dailyRewardNeur ?? 0} NEUR.`}
                                </p>
                                <button type="button" className="btn btn--success" onClick={claimDaily} disabled={busy || dailyStatus.alreadyClaimedToday}>
                                    <IconClaim /> {dailyStatus.alreadyClaimedToday ? 'Claimed' : 'Claim daily'}
                                </button>
                            </div>
                            {dailyStatus.dailyCombo ? (
                                <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                                    <div className="card__title">Daily Combo <span className="badge-new badge-new--gold">NEW</span></div>
                                    <p className="card__hint">Spend {dailyStatus.dailyCombo.requirementAiba ?? 0} AIBA today → claim {dailyStatus.dailyCombo.bonusAiba ?? 0} AIBA bonus. Progress: <strong>{dailyStatus.dailyCombo.spentTodayAiba ?? 0}/{dailyStatus.dailyCombo.requirementAiba ?? 0}</strong> AIBA.</p>
                                    <button type="button" className="btn btn--primary" onClick={claimCombo} disabled={busy || !dailyStatus.dailyCombo.canClaim || dailyStatus.dailyCombo.alreadyClaimed}>
                                        <IconClaim /> {dailyStatus.dailyCombo.alreadyClaimed ? 'Claimed' : dailyStatus.dailyCombo.canClaim ? 'Claim combo' : 'Not ready'}
                                    </button>
                                    {comboClaimMsg ? <p className={`status-msg ${comboClaimMsg.includes('Claimed') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{comboClaimMsg}</p> : null}
                                </div>
                            ) : null}
                        </>
                    ) : null}
                    {premiumStatus ? (
                        <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                            <div className="card__title"><IconPremium /> Premium <span className="badge-new badge-new--gold">NEW</span></div>
                            {premiumStatus.hasPremium ? (
                                <p className="card__hint" style={{ color: 'var(--accent-gold)' }}>Premium until {premiumStatus.premiumUntil ? new Date(premiumStatus.premiumUntil).toLocaleDateString() : '—'}. {premiumStatus.multiplier ? `${premiumStatus.multiplier}× battle rewards.` : ''}</p>
                            ) : (
                                <>
                                    <p className="card__hint">Get {premiumStatus.multiplier ?? 2}× battle rewards for {(premiumStatus.costTonNano ?? 5e9) / 1e9} TON · {premiumStatus.durationDays ?? 30} days.</p>
                                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <input className="input" value={premiumTxHash} onChange={(e) => setPremiumTxHash(e.target.value)} placeholder="Transaction hash" style={{ flex: '1 1 180px', minWidth: 0 }} />
                                        <button type="button" className="btn btn--primary" onClick={buyPremium} disabled={busy || !premiumTxHash.trim()}><IconPremium /> Buy premium</button>
                                    </div>
                                    {premiumMsg ? <p className={`status-msg ${premiumMsg.includes('activated') ? 'status-msg--success' : ''}`} style={{ marginTop: 8 }}>{premiumMsg}</p> : null}
                                </>
                            )}
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
                            <button type="button" className="btn btn--secondary" onClick={refreshDaoProposals} disabled={busy}><IconRefresh /> Refresh</button>
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
                    </>
                    ) : null}
                </section>
            </div>
            <nav className="android-bottom-nav" aria-label="Primary navigation">
                <div className="android-bottom-nav__track">
                    {TAB_LIST.map(({ id, label, Icon, badge }) => (
                        <button
                            key={id}
                            type="button"
                            className={`android-bottom-nav__btn ${tab === id ? 'android-bottom-nav__btn--active' : ''}`}
                            onClick={() => setTab(id)}
                            aria-pressed={tab === id}
                            aria-label={badge ? `${label} ${badge}` : (id === 'updates' && announcementsUnreadCount > 0 ? `${label} ${announcementsUnreadCount} unread` : label)}
                        >
                            <span className="android-bottom-nav__icon" style={{ position: 'relative' }}>
                                <Icon />
                                {id === 'updates' && announcementsUnreadCount > 0 ? <span className="badge-dot" style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)' }} aria-hidden /> : null}
                            </span>
                            <span className="android-bottom-nav__label">
                                {label}
                                {badge === 'NEW' ? <span className="badge-new">{badge}</span> : null}
                                {id === 'updates' && announcementsUnreadCount > 0 && badge !== 'NEW' ? <span className="badge-new badge-new--cyan" style={{ marginLeft: 4 }}>{announcementsUnreadCount}</span> : null}
                            </span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
}
