'use client';

import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';

const ADMIN_URL = 'https://aiba-arena2-admin-panel.vercel.app';
const DEFAULT_BACKEND_URL = 'https://aiba-arena2-backend.vercel.app';

function getBackendUrl() {
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BACKEND_URL)
        return process.env.NEXT_PUBLIC_BACKEND_URL;
    if (typeof window !== 'undefined' && window.location?.origin === ADMIN_URL) return DEFAULT_BACKEND_URL;
    return 'http://localhost:5000';
}

function getAdminErrorMessage(error, fallback = 'Request failed.') {
    if (!error?.response && (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error'))) {
        return `Backend unreachable. Is the API running at ${getBackendUrl()}? Start it with: npm run dev (from project root) or npm start (from backend/).`;
    }
    const data = error?.response?.data || {};
    if (data?.error && typeof data.error === 'object') {
        return data.error.message || data.error.code || fallback;
    }
    if (data?.error) return data.error;
    return error?.message || fallback;
}

export default function AdminHome() {
    const [token, setToken] = useState('');
    const [tab, setTab] = useState('tasks'); // tasks | ads | modes | economy | mod | stats | treasury | realms | marketplace | treasuryOps | governance | dao | charity | comms | university | referrals | brokers | tournaments | globalBoss | predict | trainers | support | oracle | audit | economyAutomation | multiverse

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [authError, setAuthError] = useState('');
    const [globalError, setGlobalError] = useState('');
    const [tabLoading, setTabLoading] = useState(false);
    const [realms, setRealms] = useState([]);
    const [realmKey, setRealmKey] = useState('');
    const [realmName, setRealmName] = useState('');
    const [realmLevel, setRealmLevel] = useState(1);
    const [marketMetrics, setMarketMetrics] = useState(null);
    const [treasuryOpsSummary, setTreasuryOpsSummary] = useState(null);
    const [govProposals, setGovProposals] = useState([]);

    const logout = useCallback(() => {
        setToken('');
        setAuthError('');
        try {
            localStorage.removeItem('aiba_admin_token');
        } catch {
            // ignore
        }
    }, []);

    const handleApiError = (error, fallback = 'Request failed.') => {
        setGlobalError(getAdminErrorMessage(error, fallback));
    };

    const api = useMemo(() => {
        const a = axios.create({ baseURL: getBackendUrl() });
        a.interceptors.request.use((cfg) => {
            if (token) cfg.headers.Authorization = `Bearer ${token}`;
            return cfg;
        });
        a.interceptors.response.use(
            (response) => {
                const data = response?.data;
                if (data && data.ok === false && data.error) {
                    const err = new Error(data.error.message || data.error.code || 'Request failed');
                    err.code = data.error.code;
                    err.details = data.error.details;
                    err.requestId = data.requestId || response?.headers?.['x-request-id'] || '';
                    return Promise.reject(err);
                }
                if (data && data.ok === true && Object.prototype.hasOwnProperty.call(data, 'data')) {
                    return { ...response, data: data.data };
                }
                return response;
            },
            (error) => {
                const status = Number(error?.response?.status || 0);
                if (status === 401 || status === 403) {
                    setGlobalError('');
                    logout();
                    setAuthError('Session expired or unauthorized. Please sign in again.');
                }
                return Promise.reject(error);
            },
        );
        return a;
    }, [token, logout]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('aiba_admin_token');
            if (saved) setToken(saved);
        } catch {
            // ignore
        }
    }, []);

    const login = async () => {
        setAuthError('');
        try {
            const res = await axios.post(`${getBackendUrl()}/api/admin/auth/login`, { email, password });
            const t = String(res.data?.token || '');
            if (!t) throw new Error('no token');
            setToken(t);
            localStorage.setItem('aiba_admin_token', t);
        } catch (e) {
            setAuthError(getAdminErrorMessage(e, 'Login failed (check ADMIN_EMAIL / password).'));
        }
    };

    // ----- Realms -----
    const fetchRealms = async () => {
        try {
            const res = await api.get('/api/admin/realms');
            setRealms(Array.isArray(res.data?.realms) ? res.data.realms : []);
        } catch (e) {
            setRealms([]);
            handleApiError(e, 'Failed to load realms.');
        }
    };
    const upsertRealm = async () => {
        if (!realmKey.trim() || !realmName.trim()) return;
        await api.post('/api/admin/realms', {
            key: realmKey.trim(),
            name: realmName.trim(),
            level: Number(realmLevel) || 1,
            active: true,
        });
        setRealmKey('');
        setRealmName('');
        await fetchRealms();
    };

    // ----- Marketplace metrics -----
    const fetchMarketMetrics = async () => {
        try {
            const res = await api.get('/api/admin/marketplace/metrics');
            setMarketMetrics(res.data || null);
        } catch (e) {
            setMarketMetrics(null);
            handleApiError(e, 'Failed to load marketplace metrics.');
        }
    };

    // ----- Treasury ops metrics -----
    const fetchTreasuryOpsMetrics = async () => {
        try {
            const res = await api.get('/api/admin/treasury-ops/metrics');
            setTreasuryOpsSummary(res.data?.summary || null);
        } catch (e) {
            setTreasuryOpsSummary(null);
            handleApiError(e, 'Failed to load treasury ops metrics.');
        }
    };

    // ----- Governance -----
    const fetchGovProposals = async () => {
        try {
            const res = await api.get('/api/admin/governance/proposals');
            setGovProposals(Array.isArray(res.data?.proposals) ? res.data.proposals : []);
        } catch (e) {
            setGovProposals([]);
            handleApiError(e, 'Failed to load governance proposals.');
        }
    };
    const executeProposal = async (proposalId) => {
        await api.post('/api/admin/governance/execute', { proposalId });
        await fetchGovProposals();
    };

    // ----- DAO (community proposals: close, execute) -----
    const [daoProposals, setDaoProposals] = useState([]);
    const [daoMsg, setDaoMsg] = useState('');
    const fetchDaoProposals = async () => {
        try {
            const res = await api.get('/api/admin/dao/proposals', { params: { limit: 50 } });
            setDaoProposals(Array.isArray(res.data) ? res.data : []);
        } catch {
            setDaoProposals([]);
        }
        setDaoMsg('');
    };
    const closeDaoProposal = async (id) => {
        try {
            await api.patch(`/api/dao/proposals/${id}/close`);
            setDaoMsg('Proposal closed.');
            await fetchDaoProposals();
        } catch (e) {
            setDaoMsg(getAdminErrorMessage(e, 'Close failed.'));
        }
    };
    const executeDaoProposal = async (id) => {
        try {
            await api.post(`/api/dao/proposals/${id}/execute`);
            setDaoMsg('Proposal executed.');
            await fetchDaoProposals();
        } catch (e) {
            setDaoMsg(getAdminErrorMessage(e, 'Execute failed.'));
        }
    };

    // ----- Oracle -----
    const [oracleStatus, setOracleStatus] = useState(null);
    const [oracleMsg, setOracleMsg] = useState('');
    const fetchOracleStatus = async () => {
        try {
            const res = await api.get('/api/admin/oracle/status');
            setOracleStatus(res.data || null);
        } catch {
            setOracleStatus(null);
        }
        setOracleMsg('');
    };
    const runOracleUpdate = async () => {
        setOracleMsg('Running…');
        try {
            const res = await api.post('/api/admin/oracle/update');
            setOracleMsg(
                res.data?.ok
                    ? `Updated. AIBA/TON: ${res.data.oracleAibaPerTon ?? '—'}`
                    : res.data?.error || 'Update failed.',
            );
            await fetchOracleStatus();
        } catch (e) {
            setOracleMsg(getAdminErrorMessage(e, 'Update failed.'));
        }
    };

    // ----- Audit -----
    const [auditItems, setAuditItems] = useState([]);
    const [auditTotal, setAuditTotal] = useState(0);
    const fetchAudit = async () => {
        try {
            const res = await api.get('/api/admin/audit', { params: { limit: 100 } });
            setAuditItems(res.data?.items || []);
            setAuditTotal(res.data?.total ?? 0);
        } catch {
            setAuditItems([]);
            setAuditTotal(0);
        }
    };

    // ----- Economy Automation -----
    const [economyAllocation, setEconomyAllocation] = useState(null);
    const [economyAutoMsg, setEconomyAutoMsg] = useState('');
    const fetchEconomyAutomation = async () => {
        try {
            const res = await api.get('/api/admin/economy-automation/allocation');
            setEconomyAllocation(res.data || null);
        } catch {
            setEconomyAllocation(null);
        }
        setEconomyAutoMsg('');
    };
    const runEconomyAutomation = async () => {
        setEconomyAutoMsg('Running…');
        try {
            const res = await api.post('/api/admin/economy-automation/run');
            setEconomyAutoMsg(
                res.data?.adjusted
                    ? `Cap adjusted: ${res.data.cap ?? res.data.dailyCapAiba ?? '—'} AIBA`
                    : res.data?.message || 'No change.',
            );
            await fetchEconomyAutomation();
        } catch (e) {
            setEconomyAutoMsg(getAdminErrorMessage(e, 'Run failed.'));
        }
    };

    // ----- Multiverse -----
    const [multiverseUniverses, setMultiverseUniverses] = useState([]);
    const fetchMultiverseUniverses = async () => {
        try {
            const res = await api.get('/api/admin/multiverse/universes');
            setMultiverseUniverses(Array.isArray(res.data) ? res.data : []);
        } catch {
            setMultiverseUniverses([]);
        }
    };

    // ----- Tasks -----
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [tasksError, setTasksError] = useState('');

    const fetchTasks = async () => {
        setLoadingTasks(true);
        setTasksError('');
        try {
            const res = await api.get('/api/admin/tasks');
            setTasks(Array.isArray(res.data) ? res.data : []);
        } catch {
            setTasksError('Failed to load tasks (missing/invalid admin token?)');
        } finally {
            setLoadingTasks(false);
        }
    };

    const createTask = async () => {
        if (!newTaskTitle.trim()) return;
        await api.post('/api/admin/tasks', {
            title: newTaskTitle.trim(),
            description: newTaskDescription.trim(),
            enabled: true,
        });
        setNewTaskTitle('');
        setNewTaskDescription('');
        await fetchTasks();
    };

    const toggleTask = async (t) => {
        await api.patch(`/api/admin/tasks/${t._id}`, { enabled: !t.enabled });
        await fetchTasks();
    };

    // ----- Ads -----
    const [ads, setAds] = useState([]);
    const [loadingAds, setLoadingAds] = useState(false);
    const [adsError, setAdsError] = useState('');
    const [newAdImageUrl, setNewAdImageUrl] = useState('');
    const [newAdLinkUrl, setNewAdLinkUrl] = useState('');

    const fetchAds = async () => {
        setLoadingAds(true);
        setAdsError('');
        try {
            const res = await api.get('/api/admin/ads');
            setAds(Array.isArray(res.data) ? res.data : []);
        } catch {
            setAdsError('Failed to load ads (missing/invalid admin token?)');
        } finally {
            setLoadingAds(false);
        }
    };

    const createAd = async () => {
        if (!newAdImageUrl.trim()) return;
        await api.post('/api/admin/ads', {
            imageUrl: newAdImageUrl.trim(),
            linkUrl: newAdLinkUrl.trim(),
            placement: 'between_battles',
            weight: 1,
            active: true,
        });
        setNewAdImageUrl('');
        setNewAdLinkUrl('');
        await fetchAds();
    };

    const toggleAd = async (a) => {
        await api.patch(`/api/admin/ads/${a._id}`, { active: !a.active });
        await fetchAds();
    };

    // ----- Game Modes -----
    const [modes, setModes] = useState([]);
    const [loadingModes, setLoadingModes] = useState(false);
    const [modesError, setModesError] = useState('');
    const [newModeKey, setNewModeKey] = useState('');
    const [newModeName, setNewModeName] = useState('');
    const [newModeArena, setNewModeArena] = useState('arbitrage');
    const [newModeLeague, setNewModeLeague] = useState('rookie');

    const fetchModes = async () => {
        setLoadingModes(true);
        setModesError('');
        try {
            const res = await api.get('/api/admin/game-modes');
            setModes(Array.isArray(res.data) ? res.data : []);
        } catch {
            setModesError('Failed to load game modes (missing/invalid admin token?)');
        } finally {
            setLoadingModes(false);
        }
    };

    const createMode = async () => {
        if (!newModeKey.trim() || !newModeName.trim() || !newModeArena.trim()) return;
        await api.post('/api/admin/game-modes', {
            key: newModeKey.trim(),
            name: newModeName.trim(),
            arena: newModeArena.trim(),
            league: newModeLeague.trim() || 'rookie',
            enabled: true,
        });
        setNewModeKey('');
        setNewModeName('');
        await fetchModes();
    };

    const toggleMode = async (m) => {
        await api.patch(`/api/admin/game-modes/${m._id}`, { enabled: !m.enabled });
        await fetchModes();
    };

    // ----- Economy config -----
    const [economyJson, setEconomyJson] = useState('');
    const [economyConfigObj, setEconomyConfigObj] = useState(null);
    const [economyDay, setEconomyDay] = useState(null);
    const [loadingEconomy, setLoadingEconomy] = useState(false);
    const [economyError, setEconomyError] = useState('');

    const fetchEconomy = async () => {
        setLoadingEconomy(true);
        setEconomyError('');
        try {
            const res = await api.get('/api/admin/economy/config');
            const cfg = res.data || {};
            setEconomyConfigObj(cfg);
            setEconomyJson(JSON.stringify(cfg, null, 2));
        } catch {
            setEconomyError('Failed to load economy config (missing/invalid admin token?)');
        } finally {
            setLoadingEconomy(false);
        }
    };

    const fetchEconomyDay = async () => {
        const today = new Date().toISOString().slice(0, 10);
        try {
            const res = await api.get('/api/admin/economy/day', { params: { day: today } });
            setEconomyDay(res.data || null);
        } catch {
            setEconomyDay(null);
        }
    };

    const saveEconomy = async () => {
        setEconomyError('');
        try {
            const parsed = JSON.parse(economyJson || '{}');
            await api.patch('/api/admin/economy/config', parsed);
            await fetchEconomy();
        } catch {
            setEconomyError('Failed to save (invalid JSON or backend error).');
        }
    };

    // ----- Moderation -----
    const [modError, setModError] = useState('');
    const [flaggedBrokers, setFlaggedBrokers] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [banUserTelegramId, setBanUserTelegramId] = useState('');
    const [banUserMinutes, setBanUserMinutes] = useState('1440');
    const [banUserReason, setBanUserReason] = useState('banned');
    const [banBrokerId, setBanBrokerId] = useState('');
    const [banBrokerReason, setBanBrokerReason] = useState('broker banned');
    const [badgeTelegramId, setBadgeTelegramId] = useState('');
    const [badgeList, setBadgeList] = useState('verified,early_adopter');
    const [badgeMsg, setBadgeMsg] = useState('');
    const [userDetailTelegramId, setUserDetailTelegramId] = useState('');
    const [userDetail, setUserDetail] = useState(null);
    const [userDetailError, setUserDetailError] = useState('');
    const [syncTopLeaderMsg, setSyncTopLeaderMsg] = useState('');
    const [syncingTopLeader, setSyncingTopLeader] = useState(false);

    const setUserBadges = async () => {
        setBadgeMsg('');
        const telegramId = badgeTelegramId.trim();
        if (!telegramId) return;
        const badges = badgeList
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter(Boolean);
        try {
            await api.post('/api/admin/mod/user-badges', { telegramId, badges });
            setBadgeMsg('Badges updated.');
        } catch {
            setBadgeMsg('Failed to set badges.');
        }
    };

    const fetchFlaggedBrokers = async () => {
        setModError('');
        try {
            const res = await api.get('/api/admin/mod/flagged-brokers', { params: { minFlags: 1, limit: 100 } });
            setFlaggedBrokers(Array.isArray(res.data) ? res.data : []);
        } catch {
            setModError('Failed to load flagged brokers (missing/invalid admin token?)');
        }
    };

    const fetchAnomalies = async () => {
        setModError('');
        try {
            const res = await api.get('/api/admin/mod/recent-anomalies', { params: { limit: 100 } });
            setAnomalies(Array.isArray(res.data) ? res.data : []);
        } catch {
            setModError('Failed to load recent anomalies (missing/invalid admin token?)');
        }
    };

    const banUser = async () => {
        setModError('');
        const telegramId = banUserTelegramId.trim();
        if (!telegramId) return;
        try {
            await api.post('/api/admin/mod/ban-user', {
                telegramId,
                minutes: Number(banUserMinutes || 0),
                reason: banUserReason,
            });
            await fetchAnomalies();
        } catch {
            setModError('Ban user failed.');
        }
    };

    const unbanUser = async () => {
        setModError('');
        const telegramId = banUserTelegramId.trim();
        if (!telegramId) return;
        try {
            await api.post('/api/admin/mod/unban-user', { telegramId });
        } catch {
            setModError('Unban user failed.');
        }
    };

    const banBroker = async () => {
        setModError('');
        const brokerId = banBrokerId.trim();
        if (!brokerId) return;
        try {
            await api.post('/api/admin/mod/ban-broker', { brokerId, reason: banBrokerReason });
            await fetchFlaggedBrokers();
        } catch {
            setModError('Ban broker failed.');
        }
    };

    const unbanBroker = async () => {
        setModError('');
        const brokerId = banBrokerId.trim();
        if (!brokerId) return;
        try {
            await api.post('/api/admin/mod/unban-broker', { brokerId });
            await fetchFlaggedBrokers();
        } catch {
            setModError('Unban broker failed.');
        }
    };

    const fetchUserDetail = async () => {
        const telegramId = userDetailTelegramId.trim();
        setUserDetailError('');
        setUserDetail(null);
        if (!telegramId) return;
        try {
            const res = await api.get('/api/admin/mod/user', { params: { telegramId } });
            setUserDetail(res.data);
        } catch (e) {
            const msg = getAdminErrorMessage(e, 'Failed to load user.');
            setUserDetailError(msg === 'user not found' ? 'User not found.' : msg);
        }
    };

    const syncTopLeaderBadges = async () => {
        setSyncTopLeaderMsg('');
        setSyncingTopLeader(true);
        try {
            const res = await api.post('/api/admin/mod/sync-top-leader-badges');
            setSyncTopLeaderMsg(`Done. Removed: ${res.data?.removed ?? '-'}, Granted: ${res.data?.granted ?? '-'}.`);
        } catch {
            setSyncTopLeaderMsg('Sync failed.');
        } finally {
            setSyncingTopLeader(false);
        }
    };

    const [announcements, setAnnouncements] = useState([]);
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementBody, setAnnouncementBody] = useState('');
    const [announcementType, setAnnouncementType] = useState('announcement');
    const [announcementLink, setAnnouncementLink] = useState('');
    const [announcementActive, setAnnouncementActive] = useState(true);
    const [commsMsg, setCommsMsg] = useState('');
    const [broadcastingId, setBroadcastingId] = useState('');
    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/api/admin/announcements', { params: { limit: 50 } });
            setAnnouncements(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            setAnnouncements([]);
        }
    };
    const createAnnouncement = async () => {
        if (!announcementTitle.trim()) return;
        setCommsMsg('');
        try {
            await api.post('/api/admin/announcements', {
                title: announcementTitle.trim(),
                body: announcementBody.trim(),
                type: announcementType,
                link: announcementLink.trim(),
                active: announcementActive,
            });
            setCommsMsg('Created.');
            setAnnouncementTitle('');
            setAnnouncementBody('');
            setAnnouncementLink('');
            await fetchAnnouncements();
        } catch (e) {
            setCommsMsg(getAdminErrorMessage(e, 'Create failed.'));
        }
    };
    const broadcastAnnouncement = async (id) => {
        setCommsMsg('');
        setBroadcastingId(id);
        try {
            const res = await api.post(`/api/admin/announcements/${id}/broadcast`);
            setCommsMsg(`Broadcast sent to ${res.data?.sent ?? 0} users.`);
            setBroadcastingId('');
        } catch (e) {
            setCommsMsg(getAdminErrorMessage(e, 'Broadcast failed.'));
            setBroadcastingId('');
        }
    };

    const [referralStats, setReferralStats] = useState(null);
    const [referralList, setReferralList] = useState([]);
    const [referralUses, setReferralUses] = useState([]);
    const [mintJobs, setMintJobs] = useState([]);
    const [mintJobCompleteId, setMintJobCompleteId] = useState('');
    const [mintJobNftCollection, setMintJobNftCollection] = useState('');
    const [mintJobNftItem, setMintJobNftItem] = useState('');
    const [mintJobMsg, setMintJobMsg] = useState('');
    const [tournamentMsg, setTournamentMsg] = useState('');
    const [tournamentName, setTournamentName] = useState('');
    const [tournamentArena, setTournamentArena] = useState('prediction');
    const [tournamentMaxEntries, setTournamentMaxEntries] = useState(16);
    const [tournamentEntryCost, setTournamentEntryCost] = useState(100);
    const [globalBossMsg, setGlobalBossMsg] = useState('');
    const [bossName, setBossName] = useState('');
    const [bossHp, setBossHp] = useState('10000');
    const [bossRewardPool, setBossRewardPool] = useState('1000');
    const [predictEvents, setPredictEvents] = useState([]);
    const [predictBrokerA, setPredictBrokerA] = useState('');
    const [predictBrokerB, setPredictBrokerB] = useState('');
    const [predictMsg, setPredictMsg] = useState('');
    const [trainers, setTrainers] = useState([]);
    const [supportRequests, setSupportRequests] = useState([]);
    const [supportMsg, setSupportMsg] = useState('');
    const [adminStats, setAdminStats] = useState(null);
    const [charityCampaigns, setCharityCampaigns] = useState([]);
    const [charityStats, setCharityStats] = useState(null);
    const [charityDonations, setCharityDonations] = useState([]);
    const [charityNewName, setCharityNewName] = useState('');
    const [charityNewDesc, setCharityNewDesc] = useState('');
    const [charityNewCause, setCharityNewCause] = useState('community');
    const [charityNewGoalNeur, setCharityNewGoalNeur] = useState('0');
    const [charityNewGoalAiba, setCharityNewGoalAiba] = useState('0');
    const [charityNewStatus, setCharityNewStatus] = useState('draft');
    const [charityMsg, setCharityMsg] = useState('');
    const [treasuryData, setTreasuryData] = useState(null);
    const [reserveData, setReserveData] = useState(null);
    const [buybackData, setBuybackData] = useState(null);
    const [universityStats, setUniversityStats] = useState(null);
    const [universityCourses, setUniversityCourses] = useState([]);
    const [universityGraduates, setUniversityGraduates] = useState([]);
    const fetchUniversityAll = async () => {
        try {
            const [statsRes, coursesRes, graduatesRes] = await Promise.all([
                api.get('/api/admin/university/stats'),
                api.get('/api/admin/university/courses'),
                api.get('/api/admin/university/graduates', { params: { limit: 100 } }),
            ]);
            setUniversityStats(statsRes.data || null);
            setUniversityCourses(Array.isArray(coursesRes.data?.courses) ? coursesRes.data.courses : []);
            setUniversityGraduates(Array.isArray(graduatesRes.data) ? graduatesRes.data : []);
        } catch (e) {
            setUniversityStats(null);
            setUniversityCourses([]);
            setUniversityGraduates([]);
            handleApiError(e, 'Failed to load university data.');
        }
    };
    const fetchReferralStats = async () => {
        try {
            const res = await api.get('/api/admin/referrals/stats');
            setReferralStats(res.data || null);
        } catch (e) {
            setReferralStats(null);
            handleApiError(e, 'Failed to load referral stats.');
        }
    };
    const fetchReferralList = async () => {
        try {
            const res = await api.get('/api/admin/referrals', { params: { limit: 100 } });
            setReferralList(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            setReferralList([]);
            handleApiError(e, 'Failed to load referral list.');
        }
    };
    const fetchReferralUses = async () => {
        try {
            const res = await api.get('/api/admin/referrals/uses', { params: { limit: 50 } });
            setReferralUses(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            setReferralUses([]);
            handleApiError(e, 'Failed to load referral uses.');
        }
    };
    const deactivateReferral = async (id) => {
        try {
            await api.patch(`/api/admin/referrals/${id}`, { active: false });
            await fetchReferralList();
            await fetchReferralStats();
        } catch (e) {
            handleApiError(e, 'Failed to deactivate referral.');
        }
    };
    const fetchMintJobs = async () => {
        try {
            const res = await api.get('/api/admin/brokers/mint-jobs', { params: { status: 'pending' } });
            setMintJobs(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            setMintJobs([]);
            handleApiError(e, 'Failed to load mint jobs.');
        }
    };
    const completeMintJob = async (jobId) => {
        setMintJobMsg('');
        const nftCollection = mintJobNftCollection.trim();
        const nftItem = mintJobNftItem.trim();
        if (!nftCollection || !nftItem) {
            setMintJobMsg('Enter NFT collection and item address.');
            return;
        }
        try {
            await api.post(`/api/admin/brokers/mint-jobs/${jobId}/complete`, {
                nftCollectionAddress: nftCollection,
                nftItemAddress: nftItem,
            });
            setMintJobMsg('Job completed.');
            setMintJobCompleteId('');
            setMintJobNftCollection('');
            setMintJobNftItem('');
            await fetchMintJobs();
        } catch (e) {
            setMintJobMsg(getAdminErrorMessage(e, 'Complete failed.'));
        }
    };
    const createTournament = async () => {
        setTournamentMsg('');
        if (!tournamentName.trim()) {
            setTournamentMsg('Name required.');
            return;
        }
        try {
            await api.post('/api/admin/tournaments', {
                name: tournamentName.trim(),
                arena: tournamentArena,
                maxEntries: Number(tournamentMaxEntries) || 16,
                entryCostAiba: Number(tournamentEntryCost) || 0,
            });
            setTournamentMsg('Tournament created.');
            setTournamentName('');
        } catch (e) {
            setTournamentMsg(getAdminErrorMessage(e, 'Create failed.'));
        }
    };
    const createGlobalBoss = async () => {
        setGlobalBossMsg('');
        if (!bossName.trim() || !bossHp) {
            setGlobalBossMsg('Name and HP required.');
            return;
        }
        try {
            await api.post('/api/admin/global-boss', {
                name: bossName.trim(),
                totalHp: Number(bossHp) || 10000,
                rewardPoolAiba: Number(bossRewardPool) || 0,
            });
            setGlobalBossMsg('Boss created.');
            setBossName('');
            setBossHp('10000');
            setBossRewardPool('1000');
        } catch (e) {
            setGlobalBossMsg(getAdminErrorMessage(e, 'Create failed.'));
        }
    };
    const fetchPredictEvents = async () => {
        try {
            const res = await api.get('/api/predict/events', { params: { status: 'all' } });
            setPredictEvents(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            setPredictEvents([]);
            handleApiError(e, 'Failed to load predict events.');
        }
    };
    const createPredictEvent = async () => {
        setPredictMsg('');
        if (!predictBrokerA.trim() || !predictBrokerB.trim()) {
            setPredictMsg('Broker A and B IDs required.');
            return;
        }
        try {
            await api.post('/api/admin/predict/events', {
                brokerAId: predictBrokerA.trim(),
                brokerBId: predictBrokerB.trim(),
            });
            setPredictMsg('Event created.');
            setPredictBrokerA('');
            setPredictBrokerB('');
            await fetchPredictEvents();
        } catch (e) {
            setPredictMsg(getAdminErrorMessage(e, 'Create failed.'));
        }
    };
    const resolvePredictEvent = async (id) => {
        setPredictMsg('');
        try {
            await api.post(`/api/admin/predict/events/${id}/resolve`);
            setPredictMsg('Event resolved.');
            await fetchPredictEvents();
        } catch (e) {
            setPredictMsg(getAdminErrorMessage(e, 'Resolve failed.'));
        }
    };
    const fetchTrainers = async () => {
        try {
            const res = await api.get('/api/admin/trainers');
            setTrainers(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            setTrainers([]);
            handleApiError(e, 'Failed to load trainers.');
        }
    };
    const updateTrainerStatus = async (id, status) => {
        try {
            await api.patch(`/api/admin/trainers/${id}`, { status });
            await fetchTrainers();
        } catch (e) {
            handleApiError(e, 'Failed to update trainer status.');
        }
    };
    const fetchSupportRequests = async () => {
        try {
            const res = await api.get('/api/admin/support', { params: { limit: 100 } });
            setSupportRequests(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            setSupportRequests([]);
            handleApiError(e, 'Failed to load support requests.');
        }
    };
    const updateSupportStatus = async (id, status) => {
        try {
            await api.patch(`/api/admin/support/${id}`, { status });
            await fetchSupportRequests();
        } catch (e) {
            setSupportMsg(getAdminErrorMessage(e, 'Update failed.'));
        }
    };
    const fetchAdminStats = async () => {
        try {
            const res = await api.get('/api/admin/stats');
            setAdminStats(res.data);
        } catch (e) {
            setAdminStats(null);
            handleApiError(e, 'Failed to load admin stats.');
        }
    };
    const fetchTreasury = async () => {
        try {
            const [t, r, b] = await Promise.all([
                api.get('/api/admin/treasury'),
                api.get('/api/admin/treasury/reserve'),
                api.get('/api/admin/treasury/buyback'),
            ]);
            setTreasuryData(t.data);
            setReserveData(r.data);
            setBuybackData(b.data);
        } catch (e) {
            setTreasuryData(null);
            setReserveData(null);
            setBuybackData(null);
            handleApiError(e, 'Failed to load treasury data.');
        }
    };
    const fundTreasury = async (aibaDelta, neurDelta) => {
        try {
            await api.post('/api/admin/treasury/fund', { aibaDelta: aibaDelta || 0, neurDelta: neurDelta || 0 });
            await fetchTreasury();
        } catch (e) {
            handleApiError(e, 'Failed to fund treasury.');
        }
    };

    const fetchCharityCampaigns = async () => {
        try {
            const res = await api.get('/api/admin/charity/campaigns');
            setCharityCampaigns(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            setCharityCampaigns([]);
            handleApiError(e, 'Failed to load charity campaigns.');
        }
    };
    const fetchCharityStats = async () => {
        try {
            const res = await api.get('/api/admin/charity/stats');
            setCharityStats(res.data || null);
        } catch (e) {
            setCharityStats(null);
            handleApiError(e, 'Failed to load charity stats.');
        }
    };
    const fetchCharityDonations = async () => {
        try {
            const res = await api.get('/api/admin/charity/donations', { params: { limit: 200 } });
            setCharityDonations(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            setCharityDonations([]);
            handleApiError(e, 'Failed to load charity donations.');
        }
    };
    const createCharityCampaign = async () => {
        if (!charityNewName.trim()) return;
        setCharityMsg('');
        try {
            await api.post('/api/admin/charity/campaigns', {
                name: charityNewName.trim(),
                description: charityNewDesc.trim(),
                cause: charityNewCause,
                goalNeur: Number(charityNewGoalNeur) || 0,
                goalAiba: Number(charityNewGoalAiba) || 0,
                status: charityNewStatus,
            });
            setCharityMsg('Campaign created.');
            setCharityNewName('');
            setCharityNewDesc('');
            setCharityNewGoalNeur('0');
            setCharityNewGoalAiba('0');
            await fetchCharityCampaigns();
            await fetchCharityStats();
        } catch (e) {
            setCharityMsg(getAdminErrorMessage(e, 'Create failed.'));
        }
    };
    const updateCharityCampaign = async (id, patch) => {
        setCharityMsg('');
        try {
            await api.patch(`/api/admin/charity/campaigns/${id}`, patch);
            setCharityMsg('Updated.');
            await fetchCharityCampaigns();
        } catch (e) {
            setCharityMsg(getAdminErrorMessage(e, 'Update failed.'));
        }
    };
    const closeCharityCampaign = async (id) => {
        setCharityMsg('');
        try {
            await api.post(`/api/admin/charity/campaigns/${id}/close`);
            setCharityMsg('Campaign closed.');
            await fetchCharityCampaigns();
            await fetchCharityStats();
        } catch (e) {
            setCharityMsg(getAdminErrorMessage(e, 'Close failed.'));
        }
    };
    const disburseCharityCampaign = async (id) => {
        setCharityMsg('');
        try {
            await api.post(`/api/admin/charity/campaigns/${id}/disburse`);
            setCharityMsg('Marked as disbursed.');
            await fetchCharityCampaigns();
            await fetchCharityStats();
        } catch (e) {
            setCharityMsg(getAdminErrorMessage(e, 'Disburse failed.'));
        }
    };

    useEffect(() => {
        if (!token) return;
        setGlobalError('');
        setTabLoading(true);
        const run = async () => {
            try {
                if (tab === 'tasks') await fetchTasks();
                if (tab === 'ads') await fetchAds();
                if (tab === 'modes') await fetchModes();
                if (tab === 'economy') await Promise.all([fetchEconomy(), fetchEconomyDay()]);
                if (tab === 'mod') await Promise.all([fetchFlaggedBrokers(), fetchAnomalies()]);
                if (tab === 'stats') await fetchAdminStats();
                if (tab === 'treasury') await fetchTreasury();
                if (tab === 'realms') await fetchRealms();
                if (tab === 'marketplace') await fetchMarketMetrics();
                if (tab === 'treasuryOps') await fetchTreasuryOpsMetrics();
                if (tab === 'governance') await fetchGovProposals();
                if (tab === 'charity') await Promise.all([fetchCharityCampaigns(), fetchCharityStats()]);
                if (tab === 'comms') await fetchAnnouncements();
                if (tab === 'referrals')
                    await Promise.all([fetchReferralStats(), fetchReferralList(), fetchReferralUses()]);
                if (tab === 'university') await fetchUniversityAll();
                if (tab === 'brokers') await fetchMintJobs();
                if (tab === 'tournaments') setTournamentMsg('');
                if (tab === 'globalBoss') setGlobalBossMsg('');
                if (tab === 'predict') await fetchPredictEvents();
                if (tab === 'trainers') await fetchTrainers();
                if (tab === 'support') await fetchSupportRequests();
                if (tab === 'dao') await fetchDaoProposals();
                if (tab === 'oracle') await fetchOracleStatus();
                if (tab === 'audit') await fetchAudit();
                if (tab === 'economyAutomation') await fetchEconomyAutomation();
                if (tab === 'multiverse') await fetchMultiverseUniverses();
            } finally {
                setTabLoading(false);
            }
        };
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, tab]);

    return (
        <div className="admin-app">
            <header className="admin-header">
                <h1 className="admin-header__title">Admin Panel</h1>
                <p className="admin-header__sub">AIBA Arena · Backend: {getBackendUrl()}</p>
                {token && tabLoading ? <p className="admin-header__sub">Loading {tab}...</p> : null}
                {globalError ? (
                    <p className="admin-auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{globalError}</span>
                        <button
                            type="button"
                            onClick={() => setGlobalError('')}
                            style={{ padding: '2px 8px', fontSize: 12 }}
                            aria-label="Dismiss"
                        >
                            Dismiss
                        </button>
                    </p>
                ) : null}
            </header>

            {!token ? (
                <div className="admin-login-section">
                    <div className="admin-login-hero">
                        <h1 className="admin-login-hero__title">AIBA Admin</h1>
                        <p className="admin-login-hero__sub">Secure access to the Arena control panel</p>
                    </div>
                    <div className="admin-login-card">
                        <div className="admin-login-card__title">Sign in</div>
                        <p className="admin-login-card__hint">
                            Backend must be running. Use ADMIN_EMAIL and ADMIN_PASSWORD from backend/.env.
                        </p>
                        <div className="admin-login-form">
                            <label className="admin-label">Email</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                type="email"
                                className="admin-input"
                                autoComplete="email"
                            />
                            <label className="admin-label">Password</label>
                            <div className="admin-password-wrap">
                                <input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="admin-input"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className={`admin-password-toggle${showPassword ? ' is-visible' : ''}`}
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <>
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden
                                            >
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                            <span className="admin-password-toggle__label">Hide</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden
                                            >
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                            <span className="admin-password-toggle__label">Show</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="admin-password-hint">
                                Click <strong>Show</strong> / <strong>Hide</strong> to reveal or mask your password
                            </p>
                            <button onClick={login} className="admin-btn admin-btn--primary admin-login-btn">
                                Sign in
                            </button>
                            {authError ? <div className="admin-auth-error">{authError}</div> : null}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <nav className="admin-tabs" role="tablist">
                        <div className="admin-tabs-group">
                            <span className="admin-tabs-group__label">Core</span>
                            <button
                                onClick={() => setTab('tasks')}
                                className={`admin-tab ${tab === 'tasks' ? 'is-active' : ''}`}
                            >
                                Tasks
                            </button>
                            <button
                                onClick={() => setTab('ads')}
                                className={`admin-tab ${tab === 'ads' ? 'is-active' : ''}`}
                            >
                                Ads
                            </button>
                            <button
                                onClick={() => setTab('modes')}
                                className={`admin-tab ${tab === 'modes' ? 'is-active' : ''}`}
                            >
                                Modes
                            </button>
                            <button
                                onClick={() => setTab('economy')}
                                className={`admin-tab ${tab === 'economy' ? 'is-active' : ''}`}
                            >
                                Economy
                            </button>
                            <button
                                onClick={() => setTab('mod')}
                                className={`admin-tab ${tab === 'mod' ? 'is-active' : ''}`}
                            >
                                Mod
                            </button>
                            <button
                                onClick={() => setTab('stats')}
                                className={`admin-tab ${tab === 'stats' ? 'is-active' : ''}`}
                            >
                                Stats
                            </button>
                        </div>
                        <div className="admin-tabs-group">
                            <span className="admin-tabs-group__label">Treasury</span>
                            <button
                                onClick={() => setTab('treasury')}
                                className={`admin-tab ${tab === 'treasury' ? 'is-active' : ''}`}
                            >
                                Treasury
                            </button>
                            <button
                                onClick={() => setTab('treasuryOps')}
                                className={`admin-tab ${tab === 'treasuryOps' ? 'is-active' : ''}`}
                            >
                                Treasury Ops
                            </button>
                            <button
                                onClick={() => setTab('realms')}
                                className={`admin-tab ${tab === 'realms' ? 'is-active' : ''}`}
                            >
                                Realms
                            </button>
                            <button
                                onClick={() => setTab('marketplace')}
                                className={`admin-tab ${tab === 'marketplace' ? 'is-active' : ''}`}
                            >
                                Marketplace
                            </button>
                        </div>
                        <div className="admin-tabs-group">
                            <span className="admin-tabs-group__label">Governance</span>
                            <button
                                onClick={() => setTab('governance')}
                                className={`admin-tab ${tab === 'governance' ? 'is-active' : ''}`}
                            >
                                Governance
                            </button>
                            <button
                                onClick={() => setTab('dao')}
                                className={`admin-tab ${tab === 'dao' ? 'is-active' : ''}`}
                            >
                                DAO
                            </button>
                        </div>
                        <div className="admin-tabs-group">
                            <span className="admin-tabs-group__label">Community</span>
                            <button
                                onClick={() => setTab('charity')}
                                className={`admin-tab ${tab === 'charity' ? 'is-active' : ''}`}
                            >
                                Charity
                            </button>
                            <button
                                onClick={() => setTab('comms')}
                                className={`admin-tab ${tab === 'comms' ? 'is-active' : ''}`}
                            >
                                Comms
                            </button>
                            <button
                                onClick={() => setTab('university')}
                                className={`admin-tab ${tab === 'university' ? 'is-active' : ''}`}
                            >
                                University
                            </button>
                            <button
                                onClick={() => setTab('referrals')}
                                className={`admin-tab ${tab === 'referrals' ? 'is-active' : ''}`}
                            >
                                Referrals
                            </button>
                        </div>
                        <div className="admin-tabs-group">
                            <span className="admin-tabs-group__label">Events</span>
                            <button
                                onClick={() => setTab('tournaments')}
                                className={`admin-tab ${tab === 'tournaments' ? 'is-active' : ''}`}
                            >
                                Tournaments
                            </button>
                            <button
                                onClick={() => setTab('globalBoss')}
                                className={`admin-tab ${tab === 'globalBoss' ? 'is-active' : ''}`}
                            >
                                Global Boss
                            </button>
                            <button
                                onClick={() => setTab('predict')}
                                className={`admin-tab ${tab === 'predict' ? 'is-active' : ''}`}
                            >
                                Predict
                            </button>
                            <button
                                onClick={() => setTab('trainers')}
                                className={`admin-tab ${tab === 'trainers' ? 'is-active' : ''}`}
                            >
                                Trainers
                            </button>
                        </div>
                        <div className="admin-tabs-group">
                            <span className="admin-tabs-group__label">Ops</span>
                            <button
                                onClick={() => setTab('support')}
                                className={`admin-tab ${tab === 'support' ? 'is-active' : ''}`}
                            >
                                Support
                            </button>
                            <button
                                onClick={() => setTab('brokers')}
                                className={`admin-tab ${tab === 'brokers' ? 'is-active' : ''}`}
                            >
                                Mint jobs
                            </button>
                        </div>
                        <div className="admin-tabs-group">
                            <span className="admin-tabs-group__label">System</span>
                            <button
                                onClick={() => setTab('oracle')}
                                className={`admin-tab ${tab === 'oracle' ? 'is-active' : ''}`}
                            >
                                Oracle
                            </button>
                            <button
                                onClick={() => setTab('audit')}
                                className={`admin-tab ${tab === 'audit' ? 'is-active' : ''}`}
                            >
                                Audit
                            </button>
                            <button
                                onClick={() => setTab('economyAutomation')}
                                className={`admin-tab ${tab === 'economyAutomation' ? 'is-active' : ''}`}
                            >
                                Econ Auto
                            </button>
                            <button
                                onClick={() => setTab('multiverse')}
                                className={`admin-tab ${tab === 'multiverse' ? 'is-active' : ''}`}
                            >
                                Multiverse
                            </button>
                        </div>
                        <div className="admin-tabs__spacer" />
                        <button onClick={logout} className="admin-tab admin-tab--logout">
                            Logout
                        </button>
                    </nav>

                    <main className="admin-content">
                        {tab === 'tasks' ? (
                            <div className="admin-card">
                                <h2 className="admin-card__title">Tasks</h2>
                                <p className="admin-card__hint">Create and toggle tasks for the miniapp.</p>
                                <div className="admin-action-row">
                                    <button
                                        onClick={fetchTasks}
                                        disabled={loadingTasks}
                                        style={{ padding: '8px 12px' }}
                                    >
                                        {loadingTasks ? 'Loading…' : 'Refresh'}
                                    </button>
                                    <input
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        placeholder="New task title"
                                        style={{ padding: 10, minWidth: 240 }}
                                    />
                                    <input
                                        value={newTaskDescription}
                                        onChange={(e) => setNewTaskDescription(e.target.value)}
                                        placeholder="Description (optional)"
                                        style={{ padding: 10, minWidth: 260 }}
                                    />
                                    <button onClick={createTask} style={{ padding: '8px 12px' }}>
                                        Create
                                    </button>
                                </div>
                                {tasksError ? <p style={{ color: 'crimson' }}>{tasksError}</p> : null}
                                <div style={{ marginTop: 12 }}>
                                    {tasks.map((t) => (
                                        <div
                                            key={t._id}
                                            style={{
                                                padding: 12,
                                                border: '1px solid #eee',
                                                borderRadius: 8,
                                                marginTop: 8,
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                                                    {t.description ? (
                                                        <div style={{ color: '#444', marginTop: 4 }}>
                                                            {t.description}
                                                        </div>
                                                    ) : null}
                                                    {t.enabled === false ? (
                                                        <div style={{ color: '#b45309', marginTop: 6 }}>Disabled</div>
                                                    ) : null}
                                                </div>
                                                <button onClick={() => toggleTask(t)} style={{ padding: '8px 12px' }}>
                                                    {t.enabled ? 'Disable' : 'Enable'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {tab === 'ads' ? (
                            <div className="admin-card">
                                <h2 className="admin-card__title">Ads</h2>
                                <p className="admin-card__hint">
                                    Manage between-battles ads. Image URL and optional link.
                                </p>
                                <div className="admin-action-row">
                                    <button onClick={fetchAds} disabled={loadingAds} className="admin-btn">
                                        {loadingAds ? 'Loading…' : 'Refresh'}
                                    </button>
                                    <input
                                        value={newAdImageUrl}
                                        onChange={(e) => setNewAdImageUrl(e.target.value)}
                                        placeholder="Image URL"
                                        style={{ padding: 10, minWidth: 280 }}
                                    />
                                    <input
                                        value={newAdLinkUrl}
                                        onChange={(e) => setNewAdLinkUrl(e.target.value)}
                                        placeholder="Link URL (optional)"
                                        style={{ padding: 10, minWidth: 280 }}
                                    />
                                    <button onClick={createAd} style={{ padding: '8px 12px' }}>
                                        Create
                                    </button>
                                </div>
                                {adsError ? <p style={{ color: 'crimson' }}>{adsError}</p> : null}
                                <div style={{ marginTop: 12 }}>
                                    {ads.map((a) => (
                                        <div
                                            key={a._id}
                                            style={{
                                                padding: 12,
                                                border: '1px solid #eee',
                                                borderRadius: 8,
                                                marginTop: 8,
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, wordBreak: 'break-all' }}>
                                                        {a.imageUrl}
                                                    </div>
                                                    {a.linkUrl ? (
                                                        <div
                                                            style={{
                                                                color: '#444',
                                                                marginTop: 4,
                                                                wordBreak: 'break-all',
                                                            }}
                                                        >
                                                            {a.linkUrl}
                                                        </div>
                                                    ) : null}
                                                    <div style={{ color: '#666', marginTop: 6, fontSize: 12 }}>
                                                        placement: {a.placement} | weight: {a.weight} |{' '}
                                                        {a.active ? 'active' : 'inactive'}
                                                    </div>
                                                </div>
                                                <button onClick={() => toggleAd(a)} style={{ padding: '8px 12px' }}>
                                                    {a.active ? 'Disable' : 'Enable'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {tab === 'modes' ? (
                            <>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <button
                                        onClick={fetchModes}
                                        disabled={loadingModes}
                                        style={{ padding: '8px 12px' }}
                                    >
                                        {loadingModes ? 'Loading…' : 'Refresh'}
                                    </button>
                                    <input
                                        value={newModeKey}
                                        onChange={(e) => setNewModeKey(e.target.value)}
                                        placeholder="key (e.g. prediction)"
                                        style={{ padding: 10, minWidth: 220 }}
                                    />
                                    <input
                                        value={newModeName}
                                        onChange={(e) => setNewModeName(e.target.value)}
                                        placeholder="name"
                                        style={{ padding: 10, minWidth: 220 }}
                                    />
                                    <select
                                        value={newModeArena}
                                        onChange={(e) => setNewModeArena(e.target.value)}
                                        style={{ padding: 10, minWidth: 180 }}
                                    >
                                        <option value="prediction">prediction</option>
                                        <option value="simulation">simulation</option>
                                        <option value="strategyWars">strategyWars</option>
                                        <option value="guildWars">guildWars</option>
                                        <option value="arbitrage">arbitrage</option>
                                    </select>
                                    <select
                                        value={newModeLeague}
                                        onChange={(e) => setNewModeLeague(e.target.value)}
                                        style={{ padding: 10, minWidth: 120 }}
                                    >
                                        <option value="rookie">rookie</option>
                                        <option value="pro">pro</option>
                                        <option value="elite">elite</option>
                                    </select>
                                    <button onClick={createMode} style={{ padding: '8px 12px' }}>
                                        Create
                                    </button>
                                </div>
                                <p style={{ color: '#666', fontSize: 12, marginTop: 6 }}>
                                    Arena <strong>arbitrage</strong> is available; defaults also seed arbitrage/rookie,
                                    arbitrage-pro, arbitrage-elite on first DB connect.
                                </p>
                                {modesError ? <p style={{ color: 'crimson' }}>{modesError}</p> : null}
                                <div style={{ marginTop: 12 }}>
                                    {modes.map((m) => (
                                        <div
                                            key={m._id}
                                            style={{
                                                padding: 12,
                                                border: '1px solid #eee',
                                                borderRadius: 8,
                                                marginTop: 8,
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600 }}>
                                                        {m.key} — {m.name}
                                                    </div>
                                                    <div style={{ color: '#666', marginTop: 6, fontSize: 12 }}>
                                                        arena: {m.arena} | league: {m.league} |{' '}
                                                        {m.enabled ? 'enabled' : 'disabled'}
                                                    </div>
                                                </div>
                                                <button onClick={() => toggleMode(m)} style={{ padding: '8px 12px' }}>
                                                    {m.enabled ? 'Disable' : 'Enable'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : null}

                        {tab === 'economy' ? (
                            <>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <button
                                        onClick={() => {
                                            fetchEconomy();
                                            fetchEconomyDay();
                                        }}
                                        disabled={loadingEconomy}
                                        style={{ padding: '8px 12px' }}
                                    >
                                        {loadingEconomy ? 'Loading…' : 'Refresh'}
                                    </button>
                                    <button onClick={saveEconomy} style={{ padding: '8px 12px' }}>
                                        Save
                                    </button>
                                </div>
                                {economyError ? <p style={{ color: 'crimson' }}>{economyError}</p> : null}
                                {economyConfigObj ? (
                                    <div
                                        style={{
                                            marginTop: 12,
                                            padding: 12,
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 8,
                                            background: '#f8f9fa',
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, marginBottom: 8 }}>
                                            Staking — Min AIBA (Super Admin)
                                        </div>
                                        <div
                                            style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                                        >
                                            <label style={{ fontSize: 13 }}>Minimum stake AIBA:</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={economyConfigObj.stakingMinAiba ?? 1000}
                                                onChange={(e) => {
                                                    const v = Number(e.target.value);
                                                    if (Number.isFinite(v) && v >= 1) {
                                                        setEconomyConfigObj((c) =>
                                                            c ? { ...c, stakingMinAiba: v } : null,
                                                        );
                                                        setEconomyJson((j) => {
                                                            try {
                                                                const o = JSON.parse(j || '{}');
                                                                o.stakingMinAiba = v;
                                                                return JSON.stringify(o, null, 2);
                                                            } catch {
                                                                return j;
                                                            }
                                                        });
                                                    }
                                                }}
                                                style={{ width: 100, padding: '6px 8px' }}
                                            />
                                            <span style={{ fontSize: 12, color: '#666' }}>
                                                AIBA (flexible + locked). Apply via Save below or edit JSON.
                                            </span>
                                        </div>
                                    </div>
                                ) : null}
                                {economyDay && economyConfigObj ? (
                                    <div
                                        style={{
                                            marginTop: 12,
                                            padding: 12,
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 8,
                                            background: '#fafafa',
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>
                                            Emission dashboard (today UTC)
                                        </div>
                                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                                            Day: {economyDay.day} · Window: {economyConfigObj.emissionStartHourUtc ?? 0}
                                            :00–{economyConfigObj.emissionEndHourUtc ?? 24}:00 UTC
                                        </div>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                                gap: 12,
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600 }}>AIBA</div>
                                                <div style={{ fontSize: 13 }}>
                                                    {economyDay.emittedAiba ?? 0} / {economyConfigObj.dailyCapAiba ?? 0}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>NEUR</div>
                                                <div style={{ fontSize: 13 }}>
                                                    {economyDay.emittedNeur ?? 0} / {economyConfigObj.dailyCapNeur ?? 0}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>Burned AIBA</div>
                                                <div style={{ fontSize: 13 }}>{economyDay.burnedAiba ?? 0}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>Spent NEUR</div>
                                                <div style={{ fontSize: 13 }}>{economyDay.spentNeur ?? 0}</div>
                                            </div>
                                        </div>
                                        {economyDay.emittedAibaByArena &&
                                        Object.keys(economyDay.emittedAibaByArena).length > 0 ? (
                                            <div style={{ marginTop: 10, fontSize: 12 }}>
                                                <div style={{ fontWeight: 600 }}>AIBA by arena</div>
                                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                                    {JSON.stringify(economyDay.emittedAibaByArena, null, 2)}
                                                </pre>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                                <textarea
                                    value={economyJson}
                                    onChange={(e) => setEconomyJson(e.target.value)}
                                    spellCheck={false}
                                    style={{
                                        marginTop: 12,
                                        width: '100%',
                                        minHeight: 420,
                                        padding: 12,
                                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                        fontSize: 12,
                                        border: '1px solid #eee',
                                        borderRadius: 8,
                                    }}
                                />
                                <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                                    Tip: edit <code>stakingMinAiba</code> (min AIBA to stake; use quick-edit above or
                                    here), <code>baseRewardAibaPerScore</code>, <code>baseRewardNeurPerScore</code>,
                                    caps,
                                    <code>dailyCap*ByArena</code> maps, <code>starRewardPerBattle</code> (Stars per
                                    battle),
                                    <code>diamondRewardFirstWin</code> (Diamonds on first win),
                                    <code>topLeaderBadgeTopN</code> (top N by score get &quot;top_leader&quot; badge;
                                    synced every 6h or via Moderation),
                                    <code>courseCompletionBadgeMintCostTonNano</code> (Course completion badge mint cost
                                    in TON; value in nanoTON, e.g. 10000000000 = 10 TON; default 10 TON), and{' '}
                                    <code>fullCourseCompletionCertificateMintCostTonNano</code> (Full course completion
                                    certificate mint cost in TON; value in nanoTON, e.g. 15000000000 = 15 TON; default
                                    15 TON).
                                </div>
                            </>
                        ) : null}

                        {tab === 'mod' ? (
                            <>
                                <div style={{ display: 'grid', gap: 12, maxWidth: 980 }}>
                                    <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Ban / unban user</div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <input
                                                value={banUserTelegramId}
                                                onChange={(e) => setBanUserTelegramId(e.target.value)}
                                                placeholder="Telegram ID"
                                                style={{ padding: 10, minWidth: 220 }}
                                            />
                                            <input
                                                value={banUserMinutes}
                                                onChange={(e) => setBanUserMinutes(e.target.value)}
                                                placeholder="Minutes"
                                                style={{ padding: 10, width: 120 }}
                                            />
                                            <input
                                                value={banUserReason}
                                                onChange={(e) => setBanUserReason(e.target.value)}
                                                placeholder="Reason"
                                                style={{ padding: 10, minWidth: 260 }}
                                            />
                                            <button onClick={banUser} style={{ padding: '8px 12px' }}>
                                                Ban
                                            </button>
                                            <button onClick={unbanUser} style={{ padding: '8px 12px' }}>
                                                Unban
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Ban / unban broker</div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <input
                                                value={banBrokerId}
                                                onChange={(e) => setBanBrokerId(e.target.value)}
                                                placeholder="Broker ID"
                                                style={{ padding: 10, minWidth: 300 }}
                                            />
                                            <input
                                                value={banBrokerReason}
                                                onChange={(e) => setBanBrokerReason(e.target.value)}
                                                placeholder="Reason"
                                                style={{ padding: 10, minWidth: 300 }}
                                            />
                                            <button onClick={banBroker} style={{ padding: '8px 12px' }}>
                                                Ban
                                            </button>
                                            <button onClick={unbanBroker} style={{ padding: '8px 12px' }}>
                                                Unban
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>User detail (lookup)</div>
                                        <div
                                            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
                                        >
                                            <input
                                                value={userDetailTelegramId}
                                                onChange={(e) => setUserDetailTelegramId(e.target.value)}
                                                placeholder="Telegram ID"
                                                style={{ padding: 10, minWidth: 220 }}
                                            />
                                            <button onClick={fetchUserDetail} style={{ padding: '8px 12px' }}>
                                                Look up
                                            </button>
                                        </div>
                                        {userDetailError ? (
                                            <p style={{ marginTop: 8, color: 'crimson' }}>{userDetailError}</p>
                                        ) : null}
                                        {userDetail ? (
                                            <div
                                                style={{
                                                    marginTop: 10,
                                                    padding: 10,
                                                    background: '#f9f9f9',
                                                    borderRadius: 8,
                                                    fontSize: 13,
                                                }}
                                            >
                                                <div>
                                                    <strong>Username</strong>: {userDetail.username || '—'}
                                                </div>
                                                <div>
                                                    <strong>Stars</strong>: {userDetail.starsBalance ?? 0} ·{' '}
                                                    <strong>Diamonds</strong>: {userDetail.diamondsBalance ?? 0}
                                                </div>
                                                <div>
                                                    <strong>Badges</strong>:{' '}
                                                    {Array.isArray(userDetail.badges) && userDetail.badges.length
                                                        ? userDetail.badges.join(', ')
                                                        : '—'}
                                                </div>
                                                {userDetail.firstWinDiamondAwardedAt ? (
                                                    <div style={{ color: '#666' }}>
                                                        First-win diamond awarded at:{' '}
                                                        {new Date(userDetail.firstWinDiamondAwardedAt).toISOString()}
                                                    </div>
                                                ) : null}
                                                {userDetail.bannedUntil ? (
                                                    <div style={{ color: '#b45309' }}>
                                                        Banned until: {new Date(userDetail.bannedUntil).toISOString()} —{' '}
                                                        {userDetail.bannedReason || ''}
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>
                                            User profile badges (X-style)
                                        </div>
                                        <div
                                            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
                                        >
                                            <input
                                                value={badgeTelegramId}
                                                onChange={(e) => setBadgeTelegramId(e.target.value)}
                                                placeholder="Telegram ID"
                                                style={{ padding: 10, minWidth: 220 }}
                                            />
                                            <input
                                                value={badgeList}
                                                onChange={(e) => setBadgeList(e.target.value)}
                                                placeholder="Badges: verified, early_adopter, top_donor, ..."
                                                style={{ padding: 10, minWidth: 320 }}
                                            />
                                            <button onClick={setUserBadges} style={{ padding: '8px 12px' }}>
                                                Set badges
                                            </button>
                                        </div>
                                        {badgeMsg ? (
                                            <p
                                                style={{
                                                    marginTop: 8,
                                                    color: badgeMsg.startsWith('Failed') ? 'crimson' : '#333',
                                                }}
                                            >
                                                {badgeMsg}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Top leader badge sync</div>
                                        <p style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                                            Awards &quot;top_leader&quot; badge to top N users by total score (N =
                                            economy config <code>topLeaderBadgeTopN</code>). Also runs every 6 hours.
                                        </p>
                                        <button
                                            onClick={syncTopLeaderBadges}
                                            disabled={syncingTopLeader}
                                            style={{ padding: '8px 12px' }}
                                        >
                                            {syncingTopLeader ? 'Syncing…' : 'Sync now'}
                                        </button>
                                        {syncTopLeaderMsg ? (
                                            <span style={{ marginLeft: 8, color: '#333' }}>{syncTopLeaderMsg}</span>
                                        ) : null}
                                    </div>

                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <button onClick={fetchFlaggedBrokers} style={{ padding: '8px 12px' }}>
                                            Refresh flagged brokers
                                        </button>
                                        <button onClick={fetchAnomalies} style={{ padding: '8px 12px' }}>
                                            Refresh anomalies
                                        </button>
                                    </div>

                                    {modError ? <p style={{ color: 'crimson' }}>{modError}</p> : null}

                                    <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Flagged brokers</div>
                                        {flaggedBrokers.length === 0 ? (
                                            <div style={{ color: '#666' }}>No flagged brokers.</div>
                                        ) : (
                                            <div style={{ display: 'grid', gap: 8 }}>
                                                {flaggedBrokers.map((b) => (
                                                    <div
                                                        key={b._id}
                                                        style={{
                                                            padding: 10,
                                                            border: '1px solid #f2f2f2',
                                                            borderRadius: 8,
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 600 }}>
                                                            {b._id} — owner {b.ownerTelegramId}
                                                        </div>
                                                        <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                                                            flags: {b.anomalyFlags} | banned:{' '}
                                                            {String(Boolean(b.banned))} | energy: {b.energy}
                                                        </div>
                                                        {b.banReason ? (
                                                            <div
                                                                style={{ color: '#b45309', fontSize: 12, marginTop: 4 }}
                                                            >
                                                                reason: {b.banReason}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Recent anomalies</div>
                                        {anomalies.length === 0 ? (
                                            <div style={{ color: '#666' }}>No anomalies.</div>
                                        ) : (
                                            <div style={{ display: 'grid', gap: 8 }}>
                                                {anomalies.map((a) => (
                                                    <div
                                                        key={a._id}
                                                        style={{
                                                            padding: 10,
                                                            border: '1px solid #f2f2f2',
                                                            borderRadius: 8,
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 600 }}>
                                                            {a.arena} / {a.league} — score {a.score}
                                                        </div>
                                                        <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                                                            owner: {a.ownerTelegramId} | broker: {a.brokerId} |
                                                            requestId: {a.requestId}
                                                        </div>
                                                        {a.anomalyReason ? (
                                                            <div
                                                                style={{ color: '#b45309', fontSize: 12, marginTop: 4 }}
                                                            >
                                                                {a.anomalyReason}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : null}

                        {tab === 'stats' ? (
                            <>
                                <button onClick={fetchAdminStats} style={{ padding: '8px 12px' }}>
                                    Refresh
                                </button>
                                {adminStats ? (
                                    <div
                                        style={{
                                            marginTop: 12,
                                            padding: 12,
                                            border: '1px solid #eee',
                                            borderRadius: 8,
                                            maxWidth: 480,
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Dashboard stats</div>
                                        <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                                            <div>
                                                DAU (today): <strong>{adminStats.dau ?? 0}</strong>
                                            </div>
                                            <div>
                                                Total users: <strong>{adminStats.totalUsers ?? 0}</strong>
                                            </div>
                                            <div>
                                                Total battles: <strong>{adminStats.totalBattles ?? 0}</strong>
                                            </div>
                                            <div>
                                                Battles today: <strong>{adminStats.battlesToday ?? 0}</strong>
                                            </div>
                                            <div>
                                                Today emitted AIBA: <strong>{adminStats.todayEmittedAiba ?? 0}</strong>
                                            </div>
                                            <div>
                                                Today emitted NEUR: <strong>{adminStats.todayEmittedNeur ?? 0}</strong>
                                            </div>
                                            <div style={{ color: '#666', fontSize: 12 }}>Day: {adminStats.day}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: 12, color: '#666' }}>Load stats.</div>
                                )}
                                <div style={{ marginTop: 12, fontSize: 12 }}>
                                    <a
                                        href={`${getBackendUrl()}/api/admin/economy/simulate?days=30`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Economy simulator (30 days)
                                    </a>
                                </div>
                            </>
                        ) : null}

                        {tab === 'treasury' ? (
                            <>
                                <button onClick={fetchTreasury} style={{ padding: '8px 12px' }}>
                                    Refresh
                                </button>
                                {treasuryData ? (
                                    <div
                                        style={{
                                            marginTop: 12,
                                            padding: 12,
                                            border: '1px solid #eee',
                                            borderRadius: 8,
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>DAO Treasury</div>
                                        <div>
                                            Balance AIBA: {treasuryData.balanceAiba ?? 0} | NEUR:{' '}
                                            {treasuryData.balanceNeur ?? 0}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#666' }}>
                                            Paid out AIBA: {treasuryData.totalPaidOutAiba ?? 0} | NEUR:{' '}
                                            {treasuryData.totalPaidOutNeur ?? 0}
                                        </div>
                                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                            <input
                                                type="number"
                                                id="treasury-aiba"
                                                placeholder="AIBA to add"
                                                style={{ padding: 8, width: 120 }}
                                            />
                                            <input
                                                type="number"
                                                id="treasury-neur"
                                                placeholder="NEUR to add"
                                                style={{ padding: 8, width: 120 }}
                                            />
                                            <button
                                                onClick={() =>
                                                    fundTreasury(
                                                        Number(document.getElementById('treasury-aiba')?.value || 0),
                                                        Number(document.getElementById('treasury-neur')?.value || 0),
                                                    )
                                                }
                                                style={{ padding: '8px 12px' }}
                                            >
                                                Fund
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                                {reserveData ? (
                                    <div
                                        style={{
                                            marginTop: 12,
                                            padding: 12,
                                            border: '1px solid #eee',
                                            borderRadius: 8,
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Stability reserve</div>
                                        <div>
                                            AIBA: {reserveData.aibaBalance ?? 0} | NEUR: {reserveData.neurBalance ?? 0}
                                        </div>
                                    </div>
                                ) : null}
                                {buybackData ? (
                                    <div
                                        style={{
                                            marginTop: 12,
                                            padding: 12,
                                            border: '1px solid #eee',
                                            borderRadius: 8,
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Buyback pool</div>
                                        <div>
                                            AIBA: {buybackData.aibaBalance ?? 0} | NEUR: {buybackData.neurBalance ?? 0}{' '}
                                            | Total bought back: {buybackData.totalBoughtBackAiba ?? 0}
                                        </div>
                                    </div>
                                ) : null}
                            </>
                        ) : null}

                        {tab === 'realms' ? (
                            <>
                                <button onClick={fetchRealms} style={{ padding: '8px 12px' }}>
                                    Refresh
                                </button>
                                <div style={{ marginTop: 12, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Create / Update Realm</div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <input
                                            value={realmKey}
                                            onChange={(e) => setRealmKey(e.target.value)}
                                            placeholder="realm key"
                                            style={{ padding: 8 }}
                                        />
                                        <input
                                            value={realmName}
                                            onChange={(e) => setRealmName(e.target.value)}
                                            placeholder="realm name"
                                            style={{ padding: 8 }}
                                        />
                                        <input
                                            value={realmLevel}
                                            onChange={(e) => setRealmLevel(e.target.value)}
                                            type="number"
                                            min="1"
                                            max="3"
                                            placeholder="level"
                                            style={{ padding: 8, width: 80 }}
                                        />
                                        <button onClick={upsertRealm} style={{ padding: '8px 12px' }}>
                                            Save
                                        </button>
                                    </div>
                                </div>
                                <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                                    {realms.map((r) => (
                                        <div
                                            key={r.key}
                                            style={{ padding: 10, border: '1px solid #f2f2f2', borderRadius: 8 }}
                                        >
                                            <div style={{ fontWeight: 600 }}>
                                                {r.name} ({r.key})
                                            </div>
                                            <div style={{ color: '#666', fontSize: 12 }}>
                                                Level {r.level} · active {String(r.active)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : null}

                        {tab === 'marketplace' ? (
                            <>
                                <button onClick={fetchMarketMetrics} style={{ padding: '8px 12px' }}>
                                    Refresh
                                </button>
                                <div
                                    style={{
                                        marginTop: 12,
                                        padding: 12,
                                        border: '1px solid #eee',
                                        borderRadius: 8,
                                        maxWidth: 420,
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Marketplace metrics</div>
                                    <div>Active listings: {marketMetrics?.activeListings ?? 0}</div>
                                    <div>Sold listings: {marketMetrics?.soldListings ?? 0}</div>
                                    <div>Active rentals: {marketMetrics?.activeRentals ?? 0}</div>
                                </div>
                            </>
                        ) : null}

                        {tab === 'treasuryOps' ? (
                            <>
                                <button onClick={fetchTreasuryOpsMetrics} style={{ padding: '8px 12px' }}>
                                    Refresh
                                </button>
                                <div
                                    style={{
                                        marginTop: 12,
                                        padding: 12,
                                        border: '1px solid #eee',
                                        borderRadius: 8,
                                        maxWidth: 420,
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Treasury ops summary</div>
                                    <div>Burn: {treasuryOpsSummary?.burn ?? 0}</div>
                                    <div>Treasury: {treasuryOpsSummary?.treasury ?? 0}</div>
                                    <div>Rewards: {treasuryOpsSummary?.rewards ?? 0}</div>
                                    <div>Staking: {treasuryOpsSummary?.staking ?? 0}</div>
                                    <div
                                        style={{
                                            marginTop: 8,
                                            paddingTop: 8,
                                            borderTop: '1px solid #eee',
                                            color: 'var(--accent-gold)',
                                        }}
                                    >
                                        <strong>Cancelled Stakes (Super Admin)</strong>:{' '}
                                        {treasuryOpsSummary?.staking_cancel_early_fee ?? 0} AIBA
                                    </div>
                                    {treasuryOpsSummary &&
                                    Object.keys(treasuryOpsSummary).filter(
                                        (k) =>
                                            ![
                                                'burn',
                                                'treasury',
                                                'rewards',
                                                'staking',
                                                'staking_cancel_early_fee',
                                            ].includes(k),
                                    ).length > 0 ? (
                                        <div
                                            style={{
                                                marginTop: 8,
                                                paddingTop: 8,
                                                borderTop: '1px solid #eee',
                                                fontSize: 12,
                                                color: '#666',
                                            }}
                                        >
                                            Other:{' '}
                                            {Object.entries(treasuryOpsSummary)
                                                .filter(
                                                    ([k]) =>
                                                        ![
                                                            'burn',
                                                            'treasury',
                                                            'rewards',
                                                            'staking',
                                                            'staking_cancel_early_fee',
                                                        ].includes(k),
                                                )
                                                .map(([k, v]) => `${k}: ${v}`)
                                                .join(' · ')}
                                        </div>
                                    ) : null}
                                </div>
                            </>
                        ) : null}

                        {tab === 'governance' ? (
                            <>
                                <button onClick={fetchGovProposals} style={{ padding: '8px 12px' }}>
                                    Refresh
                                </button>
                                <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                                    {govProposals.length === 0 ? (
                                        <div style={{ color: '#666' }}>No proposals.</div>
                                    ) : (
                                        govProposals.map((p) => (
                                            <div
                                                key={p._id}
                                                style={{ padding: 10, border: '1px solid #f2f2f2', borderRadius: 8 }}
                                            >
                                                <div style={{ fontWeight: 600 }}>{p.title}</div>
                                                <div style={{ color: '#666', fontSize: 12 }}>{p.description}</div>
                                                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                                                    status: {p.status}
                                                </div>
                                                {p.status === 'voting' ? (
                                                    <button
                                                        onClick={() => executeProposal(p._id)}
                                                        style={{ padding: '6px 10px', marginTop: 8 }}
                                                    >
                                                        Execute
                                                    </button>
                                                ) : null}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : null}

                        {tab === 'charity' ? (
                            <>
                                <button onClick={fetchCharityCampaigns} style={{ padding: '8px 12px' }}>
                                    Refresh campaigns
                                </button>
                                <button onClick={fetchCharityStats} style={{ padding: '8px 12px' }}>
                                    Refresh stats
                                </button>
                                <button onClick={fetchCharityDonations} style={{ padding: '8px 12px' }}>
                                    List donations
                                </button>
                                {charityMsg ? (
                                    <span style={{ marginLeft: 12, color: '#066' }}>{charityMsg}</span>
                                ) : null}
                                {charityStats ? (
                                    <div
                                        style={{
                                            marginTop: 12,
                                            padding: 12,
                                            border: '1px solid #eee',
                                            borderRadius: 8,
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Charity stats</div>
                                        <div>
                                            Total raised NEUR: {charityStats.totalRaisedNeur ?? 0} | AIBA:{' '}
                                            {charityStats.totalRaisedAiba ?? 0}
                                        </div>
                                        <div>
                                            Total donors: {charityStats.totalDonors ?? 0} | Campaigns:{' '}
                                            {charityStats.campaignCount ?? 0}
                                        </div>
                                    </div>
                                ) : null}
                                <div style={{ marginTop: 12, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Create campaign</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                        <input
                                            value={charityNewName}
                                            onChange={(e) => setCharityNewName(e.target.value)}
                                            placeholder="Name"
                                            style={{ padding: 8, minWidth: 160 }}
                                        />
                                        <input
                                            value={charityNewDesc}
                                            onChange={(e) => setCharityNewDesc(e.target.value)}
                                            placeholder="Description"
                                            style={{ padding: 8, minWidth: 200 }}
                                        />
                                        <select
                                            value={charityNewCause}
                                            onChange={(e) => setCharityNewCause(e.target.value)}
                                            style={{ padding: 8 }}
                                        >
                                            <option value="education">education</option>
                                            <option value="environment">environment</option>
                                            <option value="health">health</option>
                                            <option value="emergency">emergency</option>
                                            <option value="community">community</option>
                                            <option value="other">other</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={charityNewGoalNeur}
                                            onChange={(e) => setCharityNewGoalNeur(e.target.value)}
                                            placeholder="Goal NEUR"
                                            style={{ padding: 8, width: 100 }}
                                        />
                                        <input
                                            type="number"
                                            value={charityNewGoalAiba}
                                            onChange={(e) => setCharityNewGoalAiba(e.target.value)}
                                            placeholder="Goal AIBA"
                                            style={{ padding: 8, width: 100 }}
                                        />
                                        <select
                                            value={charityNewStatus}
                                            onChange={(e) => setCharityNewStatus(e.target.value)}
                                            style={{ padding: 8 }}
                                        >
                                            <option value="draft">draft</option>
                                            <option value="active">active</option>
                                        </select>
                                        <button onClick={createCharityCampaign} style={{ padding: '8px 12px' }}>
                                            Create
                                        </button>
                                    </div>
                                </div>
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Campaigns</div>
                                    {charityCampaigns.map((c) => (
                                        <div
                                            key={c._id}
                                            style={{
                                                padding: 12,
                                                border: '1px solid #eee',
                                                borderRadius: 8,
                                                marginTop: 8,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    flexWrap: 'wrap',
                                                    gap: 8,
                                                }}
                                            >
                                                <div>
                                                    <strong>{c.name}</strong> — {c.cause} · status: {c.status}
                                                    <div style={{ fontSize: 12, color: '#666' }}>
                                                        Raised: {c.raisedNeur ?? 0} NEUR, {c.raisedAiba ?? 0} AIBA ·{' '}
                                                        {c.donorCount ?? 0} donors
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {c.status === 'active' ? (
                                                        <button
                                                            onClick={() => closeCharityCampaign(c._id)}
                                                            style={{ padding: '6px 10px' }}
                                                        >
                                                            Close
                                                        </button>
                                                    ) : null}
                                                    {c.status === 'ended' || c.status === 'funded' ? (
                                                        <button
                                                            onClick={() => disburseCharityCampaign(c._id)}
                                                            style={{ padding: '6px 10px' }}
                                                        >
                                                            Mark disbursed
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        onClick={() =>
                                                            updateCharityCampaign(c._id, { status: 'active' })
                                                        }
                                                        style={{ padding: '6px 10px' }}
                                                        disabled={c.status === 'active'}
                                                    >
                                                        Set active
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {charityCampaigns.length === 0 ? (
                                        <div style={{ color: '#666' }}>No campaigns. Create one above.</div>
                                    ) : null}
                                </div>
                                {charityDonations.length > 0 ? (
                                    <div style={{ marginTop: 12 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Recent donations</div>
                                        {charityDonations.slice(0, 50).map((d) => (
                                            <div
                                                key={d._id}
                                                style={{ fontSize: 12, padding: 6, borderBottom: '1px solid #eee' }}
                                            >
                                                {d.telegramId} →{' '}
                                                {typeof d.campaignId === 'object' && d.campaignId?.name
                                                    ? d.campaignId.name
                                                    : d.campaignId}{' '}
                                                · {d.amountNeur ?? 0} NEUR, {d.amountAiba ?? 0} AIBA ·{' '}
                                                {d.donatedAt ? new Date(d.donatedAt).toISOString().slice(0, 19) : ''}
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </>
                        ) : null}

                        {tab === 'comms' ? (
                            <>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <button onClick={fetchAnnouncements} style={{ padding: '8px 12px' }}>
                                        Refresh
                                    </button>
                                    {commsMsg ? <span style={{ color: '#066' }}>{commsMsg}</span> : null}
                                </div>
                                <div style={{ marginTop: 12, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Create announcement</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                        <input
                                            value={announcementTitle}
                                            onChange={(e) => setAnnouncementTitle(e.target.value)}
                                            placeholder="Title"
                                            style={{ padding: 8, minWidth: 200 }}
                                        />
                                        <select
                                            value={announcementType}
                                            onChange={(e) => setAnnouncementType(e.target.value)}
                                            style={{ padding: 8 }}
                                        >
                                            <option value="announcement">announcement</option>
                                            <option value="maintenance">maintenance</option>
                                            <option value="status">status</option>
                                        </select>
                                        <input
                                            value={announcementLink}
                                            onChange={(e) => setAnnouncementLink(e.target.value)}
                                            placeholder="Link (optional)"
                                            style={{ padding: 8, minWidth: 220 }}
                                        />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <input
                                                type="checkbox"
                                                checked={announcementActive}
                                                onChange={(e) => setAnnouncementActive(e.target.checked)}
                                            />
                                            Active
                                        </label>
                                        <button
                                            onClick={createAnnouncement}
                                            style={{ padding: '8px 12px' }}
                                            disabled={!announcementTitle.trim()}
                                        >
                                            Create
                                        </button>
                                    </div>
                                    <textarea
                                        value={announcementBody}
                                        onChange={(e) => setAnnouncementBody(e.target.value)}
                                        placeholder="Body (optional)"
                                        rows={3}
                                        style={{ marginTop: 8, width: '100%', padding: 8 }}
                                    />
                                </div>
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Announcements</div>
                                    {announcements.length === 0 ? (
                                        <div style={{ color: '#666' }}>No announcements.</div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            {announcements.map((a) => (
                                                <div
                                                    key={a._id}
                                                    style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}
                                                >
                                                    <div style={{ fontWeight: 600 }}>{a.title}</div>
                                                    <div style={{ fontSize: 12, color: '#666' }}>
                                                        {a.type} · active: {String(a.active)} ·{' '}
                                                        {a.publishedAt ? new Date(a.publishedAt).toLocaleString() : '—'}
                                                    </div>
                                                    {a.body ? (
                                                        <div style={{ marginTop: 6, fontSize: 13 }}>
                                                            {a.body.slice(0, 200)}
                                                            {a.body.length > 200 ? '…' : ''}
                                                        </div>
                                                    ) : null}
                                                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                                        <button
                                                            onClick={() => broadcastAnnouncement(a._id)}
                                                            disabled={!!broadcastingId}
                                                            style={{ padding: '6px 10px' }}
                                                        >
                                                            {broadcastingId === a._id
                                                                ? 'Sending…'
                                                                : 'Broadcast to Telegram'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}

                        {tab === 'university' ? (
                            <>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <button onClick={fetchUniversityAll} style={{ padding: '8px 12px' }}>
                                        Refresh
                                    </button>
                                </div>
                                {universityStats ? (
                                    <div
                                        style={{
                                            marginTop: 12,
                                            padding: 12,
                                            border: '1px solid #eee',
                                            borderRadius: 8,
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>University stats</div>
                                        <div>
                                            Total courses: {universityStats.totalCourses ?? 0} · Total modules:{' '}
                                            {universityStats.totalModules ?? 0}
                                        </div>
                                        <div>
                                            Users with progress: {universityStats.usersWithProgress ?? 0} · Graduates
                                            (badge): {universityStats.graduates ?? 0}
                                        </div>
                                    </div>
                                ) : null}
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Courses (read-only)</div>
                                    {universityCourses.length === 0 ? (
                                        <div style={{ color: '#666' }}>No courses loaded.</div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            {universityCourses.map((c) => (
                                                <div
                                                    key={c.id}
                                                    style={{ padding: 10, border: '1px solid #eee', borderRadius: 8 }}
                                                >
                                                    <strong>{c.title}</strong> — {c.moduleCount ?? 0} modules
                                                    {Array.isArray(c.modules) ? (
                                                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                                            {c.modules.map((m) => m.title).join(' · ')}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                                        Graduates (users with university_graduate badge)
                                    </div>
                                    {universityGraduates.length === 0 ? (
                                        <div style={{ color: '#666' }}>No graduates yet.</div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: 6 }}>
                                            {universityGraduates.slice(0, 50).map((u, i) => (
                                                <div
                                                    key={u.telegramId || i}
                                                    style={{ fontSize: 13, padding: 6, borderBottom: '1px solid #eee' }}
                                                >
                                                    {u.telegramId} · {u.username || '—'}{' '}
                                                    {u.graduatedAt
                                                        ? ` · ${new Date(u.graduatedAt).toISOString().slice(0, 10)}`
                                                        : ''}
                                                </div>
                                            ))}
                                            {universityGraduates.length > 50 ? (
                                                <div style={{ color: '#666', fontSize: 12 }}>
                                                    … and {universityGraduates.length - 50} more
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}

                        {tab === 'referrals' ? (
                            <>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => {
                                            fetchReferralStats();
                                            fetchReferralList();
                                            fetchReferralUses();
                                        }}
                                        style={{ padding: '8px 12px' }}
                                    >
                                        Refresh
                                    </button>
                                </div>
                                {referralStats ? (
                                    <div
                                        style={{
                                            marginTop: 12,
                                            padding: 12,
                                            border: '1px solid #eee',
                                            borderRadius: 8,
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Referral stats</div>
                                        <div>
                                            Active codes: {referralStats.totalActiveCodes ?? 0} · Total uses:{' '}
                                            {referralStats.totalReferralUses ?? 0}
                                        </div>
                                        {referralStats.topReferrers?.length > 0 ? (
                                            <div style={{ marginTop: 8, fontSize: 12 }}>
                                                <div style={{ fontWeight: 600 }}>Top referrers</div>
                                                {referralStats.topReferrers.map((r, i) => (
                                                    <div key={r.ownerTelegramId} style={{ padding: 4 }}>
                                                        #{i + 1} {r.username || r.ownerTelegramId} — {r.uses ?? 0} uses
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>All referral codes</div>
                                    {referralList.length === 0 ? (
                                        <div style={{ color: '#666' }}>No codes.</div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            {referralList.map((r) => (
                                                <div
                                                    key={r._id}
                                                    style={{ padding: 10, border: '1px solid #eee', borderRadius: 8 }}
                                                >
                                                    <div>
                                                        <strong>{r.code}</strong> · owner: {r.ownerTelegramId} · uses:{' '}
                                                        {r.uses ?? 0}/{r.maxUses ?? 1000} ·{' '}
                                                        {r.active ? 'active' : 'inactive'}
                                                    </div>
                                                    {r.active ? (
                                                        <button
                                                            onClick={() => deactivateReferral(r._id)}
                                                            style={{ padding: '4px 8px', marginTop: 4 }}
                                                        >
                                                            Deactivate
                                                        </button>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Recent uses</div>
                                    {referralUses.length === 0 ? (
                                        <div style={{ color: '#666' }}>No uses.</div>
                                    ) : (
                                        <div style={{ fontSize: 12 }}>
                                            {referralUses.slice(0, 30).map((u) => (
                                                <div key={u._id} style={{ padding: 4, borderBottom: '1px solid #eee' }}>
                                                    {u.code} · referrer: {u.referrerTelegramId} → referee:{' '}
                                                    {u.refereeTelegramId} ·{' '}
                                                    {u.createdAt
                                                        ? new Date(u.createdAt).toISOString().slice(0, 19)
                                                        : ''}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}

                        {tab === 'brokers' ? (
                            <>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button onClick={fetchMintJobs} style={{ padding: '8px 12px' }}>
                                        Refresh
                                    </button>
                                </div>
                                {mintJobMsg ? (
                                    <p
                                        style={{
                                            marginTop: 8,
                                            color: mintJobMsg.startsWith('Job') ? '#066' : 'crimson',
                                        }}
                                    >
                                        {mintJobMsg}
                                    </p>
                                ) : null}
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Pending broker mint jobs</div>
                                    <p style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                                        Complete each job by entering the NFT collection and item address after minting
                                        on-chain.
                                    </p>
                                    {mintJobs.length === 0 ? (
                                        <div style={{ color: '#666' }}>No pending jobs.</div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {mintJobs.map((j) => (
                                                <div
                                                    key={j._id}
                                                    style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}
                                                >
                                                    <div>
                                                        <strong>Broker:</strong> {j.brokerId} · created:{' '}
                                                        {j.createdAt
                                                            ? new Date(j.createdAt).toISOString().slice(0, 19)
                                                            : ''}
                                                    </div>
                                                    {mintJobCompleteId === j._id ? (
                                                        <div
                                                            style={{
                                                                marginTop: 8,
                                                                display: 'flex',
                                                                gap: 8,
                                                                flexWrap: 'wrap',
                                                                alignItems: 'center',
                                                            }}
                                                        >
                                                            <input
                                                                value={mintJobNftCollection}
                                                                onChange={(e) =>
                                                                    setMintJobNftCollection(e.target.value)
                                                                }
                                                                placeholder="NFT collection address"
                                                                style={{ padding: 8, minWidth: 300 }}
                                                            />
                                                            <input
                                                                value={mintJobNftItem}
                                                                onChange={(e) => setMintJobNftItem(e.target.value)}
                                                                placeholder="NFT item address"
                                                                style={{ padding: 8, minWidth: 300 }}
                                                            />
                                                            <button
                                                                onClick={() => completeMintJob(j._id)}
                                                                style={{ padding: '8px 12px' }}
                                                            >
                                                                Complete
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setMintJobCompleteId('');
                                                                    setMintJobNftCollection('');
                                                                    setMintJobNftItem('');
                                                                }}
                                                                style={{ padding: '8px 12px' }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setMintJobCompleteId(j._id)}
                                                            style={{ padding: '6px 10px', marginTop: 8 }}
                                                        >
                                                            Complete job
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}

                        {tab === 'dao' ? (
                            <div className="admin-card">
                                <h3 className="admin-card__title">DAO proposals</h3>
                                <p className="admin-card__hint">
                                    Close active proposals or execute treasury_payout proposals. Close is required
                                    before execute.
                                </p>
                                <div className="admin-action-row">
                                    <button onClick={fetchDaoProposals}>Refresh</button>
                                    {daoMsg ? (
                                        <span
                                            style={{
                                                color: daoMsg.startsWith('Proposal')
                                                    ? 'var(--accent-green)'
                                                    : 'var(--accent-red)',
                                            }}
                                        >
                                            {daoMsg}
                                        </span>
                                    ) : null}
                                </div>
                                {daoProposals.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)' }}>No proposals.</div>
                                ) : (
                                    <div style={{ display: 'grid', gap: 12 }}>
                                        {daoProposals.map((p) => (
                                            <div
                                                key={p._id}
                                                className="admin-card"
                                                style={{ marginBottom: 0, padding: 16 }}
                                            >
                                                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                                    {p.title || '(Untitled)'}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        color: 'var(--text-muted)',
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    {p.description?.slice(0, 200)}
                                                    {(p.description?.length || 0) > 200 ? '…' : ''}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                    status: <strong>{p.status}</strong> · type: {p.type || '—'} · votes:{' '}
                                                    {p.votesFor ?? 0} for / {p.votesAgainst ?? 0} against (total{' '}
                                                    {p.totalVotes ?? 0})
                                                    {p.recipientTelegramId
                                                        ? ` · recipient: ${p.recipientTelegramId}`
                                                        : ''}
                                                    {p.amountAiba ? ` · amount: ${p.amountAiba} AIBA` : ''}
                                                </div>
                                                <div
                                                    style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}
                                                >
                                                    {p.status === 'active' ? (
                                                        <>
                                                            <button onClick={() => closeDaoProposal(p._id)}>
                                                                Close proposal
                                                            </button>
                                                            {p.type === 'treasury_payout' ? (
                                                                <button
                                                                    onClick={() => executeDaoProposal(p._id)}
                                                                    style={{
                                                                        background: 'rgba(34, 197, 94, 0.2)',
                                                                        borderColor: 'var(--accent-green)',
                                                                    }}
                                                                >
                                                                    Execute
                                                                </button>
                                                            ) : null}
                                                        </>
                                                    ) : p.status === 'closed' && p.type === 'treasury_payout' ? (
                                                        <button
                                                            onClick={() => executeDaoProposal(p._id)}
                                                            style={{
                                                                background: 'rgba(34, 197, 94, 0.2)',
                                                                borderColor: 'var(--accent-green)',
                                                            }}
                                                        >
                                                            Execute
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {tab === 'oracle' ? (
                            <div className="admin-card">
                                <h3 className="admin-card__title">Oracle</h3>
                                <p className="admin-card__hint">
                                    AIBA/TON exchange rate. Run update to fetch latest from external source.
                                </p>
                                <div className="admin-action-row">
                                    <button onClick={fetchOracleStatus}>Refresh status</button>
                                    <button onClick={runOracleUpdate}>Run update</button>
                                    {oracleMsg ? (
                                        <span style={{ marginLeft: 8, color: 'var(--accent-gold)' }}>{oracleMsg}</span>
                                    ) : null}
                                </div>
                                {oracleStatus ? (
                                    <div
                                        style={{
                                            padding: 16,
                                            background: 'rgba(0,0,0,0.2)',
                                            borderRadius: 'var(--radius-sm)',
                                            marginTop: 12,
                                        }}
                                    >
                                        <div>
                                            <strong>AIBA per TON:</strong>{' '}
                                            {oracleStatus.oracleAibaPerTon ?? oracleStatus.aibaPerTon ?? '—'}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                            Last updated:{' '}
                                            {(oracleStatus.oracleLastUpdatedAt ?? oracleStatus.updatedAt)
                                                ? new Date(
                                                      oracleStatus.oracleLastUpdatedAt ?? oracleStatus.updatedAt,
                                                  ).toISOString()
                                                : '—'}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: 'var(--text-muted)' }}>
                                        No status yet. Run update to fetch.
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {tab === 'audit' ? (
                            <div className="admin-card">
                                <h3 className="admin-card__title">Audit log</h3>
                                <p className="admin-card__hint">Admin actions (last 100). Total: {auditTotal}</p>
                                <div className="admin-action-row">
                                    <button onClick={fetchAudit}>Refresh</button>
                                </div>
                                {auditItems.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)' }}>No audit entries.</div>
                                ) : (
                                    <div
                                        style={{
                                            display: 'grid',
                                            gap: 8,
                                            maxHeight: 400,
                                            overflowY: 'auto',
                                            marginTop: 12,
                                        }}
                                    >
                                        {auditItems.map((a) => (
                                            <div
                                                key={a._id}
                                                style={{
                                                    padding: 10,
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: 13,
                                                }}
                                            >
                                                <div>
                                                    <strong>{a.action}</strong> · {a.adminEmail ?? a.adminId ?? '—'}
                                                </div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                                    {a.details ? JSON.stringify(a.details).slice(0, 120) : ''} ·{' '}
                                                    {a.createdAt
                                                        ? new Date(a.createdAt).toISOString().slice(0, 19)
                                                        : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {tab === 'economyAutomation' ? (
                            <div className="admin-card">
                                <h3 className="admin-card__title">Economy automation</h3>
                                <p className="admin-card__hint">
                                    Adjusts daily AIBA cap based on treasury balance. Run manually or wait for scheduled
                                    job.
                                </p>
                                <div className="admin-action-row">
                                    <button onClick={fetchEconomyAutomation}>Refresh</button>
                                    <button onClick={runEconomyAutomation}>Run now</button>
                                    {economyAutoMsg ? (
                                        <span style={{ marginLeft: 8, color: 'var(--accent-gold)' }}>
                                            {economyAutoMsg}
                                        </span>
                                    ) : null}
                                </div>
                                {economyAllocation ? (
                                    <div
                                        style={{
                                            padding: 16,
                                            background: 'rgba(0,0,0,0.2)',
                                            borderRadius: 'var(--radius-sm)',
                                            marginTop: 12,
                                        }}
                                    >
                                        <div>
                                            <strong>Daily cap (AIBA):</strong>{' '}
                                            {economyAllocation.dailyCapAiba ?? economyAllocation.dailyCap ?? '—'}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                            Treasury / allocation info may appear here.
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: 'var(--text-muted)' }}>
                                        No allocation data. Run to refresh.
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {tab === 'multiverse' ? (
                            <div className="admin-card">
                                <h3 className="admin-card__title">Multiverse</h3>
                                <p className="admin-card__hint">Universes (realms/worlds) in the multiverse.</p>
                                <div className="admin-action-row">
                                    <button onClick={fetchMultiverseUniverses}>Refresh</button>
                                </div>
                                {multiverseUniverses.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)' }}>No universes.</div>
                                ) : (
                                    <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                                        {multiverseUniverses.map((u) => (
                                            <div
                                                key={u._id || u.key}
                                                style={{
                                                    padding: 14,
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderRadius: 'var(--radius-sm)',
                                                }}
                                            >
                                                <div style={{ fontWeight: 600 }}>{u.name ?? u.key ?? u._id}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                    key: {u.key ?? u._id} · level: {u.level ?? '—'} · active:{' '}
                                                    {String(u.active ?? true)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </main>
                </>
            )}
        </div>
    );
}
