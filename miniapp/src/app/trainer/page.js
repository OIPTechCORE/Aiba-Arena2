'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { createApi, getErrorMessage } from '../../lib/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const APP_URL = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'https://aiba-arena2-miniapp.vercel.app';

const TRAINER_SPECIALTIES = ['general', 'crypto', 'gaming', 'trading', 'newcomer', 'strategy', 'guilds', 'marketplace', 'racing', 'nft'];
const TABS_APPROVED = ['dashboard', 'network', 'leaderboard'];
const TABS_PUBLIC = ['network', 'leaderboard'];

export default function TrainerPage() {
    const api = useMemo(() => createApi(BACKEND_URL), []);
    const [trainer, setTrainer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applyMsg, setApplyMsg] = useState('');
    const [claimMsg, setClaimMsg] = useState('');
    const [busy, setBusy] = useState(false);
    const [tab, setTab] = useState('network');
    const [network, setNetwork] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardBy, setLeaderboardBy] = useState('impact');
    const [networkSort, setNetworkSort] = useState('impact');
    const [profileDisplayName, setProfileDisplayName] = useState('');
    const [profileBio, setProfileBio] = useState('');
    const [profileSpecialty, setProfileSpecialty] = useState('general');
    const [profileRegion, setProfileRegion] = useState('');
    const [profileMsg, setProfileMsg] = useState('');

    const refCode = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('ref') || ''
        : '';

    useEffect(() => {
        api.get('/api/trainers/me', { timeout: 8000 })
            .then((res) => {
                setTrainer(res.data);
                if (res.data?.displayName) setProfileDisplayName(res.data.displayName);
                if (res.data?.bio) setProfileBio(res.data.bio);
                if (res.data?.specialty) setProfileSpecialty(res.data.specialty);
                if (res.data?.region) setProfileRegion(res.data.region);
                if (!res.data?.isTrainer || res.data?.status !== 'approved') setTab('network');
            })
            .catch(() => {
                setTrainer({ isTrainer: false });
                setTab('network');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (tab === 'network') {
            const sort = networkSort === 'referred' ? 'referred' : networkSort === 'recruited' ? 'recruited' : networkSort === 'rewards' ? 'rewards' : 'impact';
            api.get('/api/trainers/network', { params: { sort, limit: 50 }, timeout: 8000 })
                .then((res) => setNetwork(Array.isArray(res.data) ? res.data : []))
                .catch(() => setNetwork([]));
        }
    }, [tab, networkSort]);

    useEffect(() => {
        if (tab === 'leaderboard') {
            api.get('/api/trainers/leaderboard', { params: { by: leaderboardBy, limit: 50 }, timeout: 8000 })
                .then((res) => setLeaderboard(Array.isArray(res.data) ? res.data : []))
                .catch(() => setLeaderboard([]));
        }
    }, [tab, leaderboardBy]);

    async function applyTrainer(inviterCode) {
        setBusy(true);
        setApplyMsg('');
        try {
            const res = await api.post('/api/trainers/apply', { ref: inviterCode || refCode });
            setTrainer({
                isTrainer: true,
                code: res.data?.code,
                status: res.data?.status,
                recruitUrl: res.data?.url,
            });
            setApplyMsg(res.data?.alreadyTrainer ? 'You are already a trainer.' : 'Application submitted! Pending admin approval.');
        } catch (e) {
            setApplyMsg(getErrorMessage(e, 'Apply failed.'));
        } finally {
            setBusy(false);
        }
    }

    async function claimRewards() {
        setBusy(true);
        setClaimMsg('');
        try {
            const res = await api.post('/api/trainers/claim-rewards', { requestId: `trainer-${Date.now()}` });
            setClaimMsg(`Claimed ${res.data?.claimedAiba ?? 0} AIBA!`);
            if (trainer) setTrainer({ ...trainer, rewardsEarnedAiba: (trainer.rewardsEarnedAiba || 0) + (res.data?.claimedAiba || 0) });
        } catch (e) {
            setClaimMsg(getErrorMessage(e, 'Claim failed.'));
        } finally {
            setBusy(false);
        }
    }

    function shareRecruitLink() {
        const url = trainer?.recruitUrl || `${APP_URL}/trainer?ref=${trainer?.code || ''}`;
        const text = `Become an AIBA Arena Trainer! Earn AIBA by helping players learn the game. Apply: ${url}`;
        if (typeof window !== 'undefined' && window.Telegram?.WebApp?.shareViaTelegram) {
            window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
        } else if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(`${text}\n${url}`).then(() => setApplyMsg('Link copied!'));
        } else {
            setApplyMsg(url);
        }
    }

    async function saveProfile() {
        setBusy(true);
        setProfileMsg('');
        try {
            await api.patch('/api/trainers/profile', {
                displayName: profileDisplayName,
                bio: profileBio,
                specialty: profileSpecialty,
                region: profileRegion,
            });
            setProfileMsg('Profile saved.');
            const res = await api.get('/api/trainers/me');
            setTrainer(res.data);
        } catch (e) {
            setProfileMsg(getErrorMessage(e, 'Save failed.'));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ padding: 24, maxWidth: 640, margin: '0 auto', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                    <h1 style={{ marginTop: 0, marginBottom: 4 }}>Global Trainers &amp; Coaches</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>Network · Dashboard · Leaderboard</p>
                </div>
                <Link href="/" style={{ color: 'var(--accent-cyan)', fontSize: 14 }}>← Game</Link>
            </div>

            {trainer?.status !== 'suspended' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    {(trainer?.isTrainer && trainer.status === 'approved' ? TABS_APPROVED : TABS_PUBLIC).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            style={{
                                padding: '10px 16px',
                                borderRadius: 8,
                                border: `2px solid ${tab === t ? 'var(--accent-cyan)' : 'var(--border)'}`,
                                background: tab === t ? 'rgba(0,212,255,0.1)' : 'transparent',
                                color: tab === t ? 'var(--accent-cyan)' : 'var(--text)',
                                fontWeight: tab === t ? 600 : 400,
                                textTransform: 'capitalize',
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}

            {loading && trainer === null ? (
                <div style={{ padding: 16, border: '2px solid var(--border)', borderRadius: 12, marginBottom: 16, color: 'var(--text-muted)', fontSize: 14 }}>
                    Checking account…
                </div>
            ) : !trainer?.isTrainer ? (
                <div style={{ padding: 16, border: '2px solid var(--accent-cyan)', borderRadius: 12, marginBottom: 16 }}>
                    <h2 style={{ marginTop: 0, fontSize: 16 }}>Apply to become a trainer</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                        Earn AIBA for referred users and recruited trainers. Browse the network below.
                    </p>
                    {refCode ? (
                        <p style={{ fontSize: 12, color: 'var(--accent-cyan)', marginBottom: 8 }}>
                            Invited by <strong>{refCode}</strong> — they earn when you get approved.
                        </p>
                    ) : null}
                    <button type="button" className="btn btn--primary" onClick={() => applyTrainer(refCode || undefined)} disabled={busy} style={{ padding: '10px 16px', fontSize: 14 }}>
                        {busy ? 'Applying…' : 'Apply now'}
                    </button>
                    {applyMsg ? <p style={{ marginTop: 8, color: 'var(--accent-green)', fontSize: 13 }}>{applyMsg}</p> : null}
                </div>
            ) : trainer?.status === 'pending' ? (
                <div style={{ padding: 16, border: '2px solid var(--accent-gold)', borderRadius: 12, marginBottom: 16 }}>
                    <h2 style={{ marginTop: 0, fontSize: 16 }}>Pending approval</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Your code: <strong>{trainer.code}</strong>. Browse the network while you wait.</p>
                </div>
            ) : trainer?.status === 'suspended' ? (
                <div style={{ padding: 20, border: '2px solid #b45309', borderRadius: 12 }}>
                    <h2 style={{ marginTop: 0 }}>Suspended</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Your trainer account is suspended. Contact support.</p>
                </div>
            ) : null}

            {trainer?.status !== 'suspended' && tab === 'network' ? (
                <div style={{ padding: 20, border: '2px solid var(--accent-cyan)', borderRadius: 12 }}>
                    <h2 style={{ marginTop: 0, fontSize: 18 }}>Global Trainers Network</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
                        Discover approved trainers worldwide. Connect via their code to learn from or partner with them.
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Sort by:</span>
                        {['impact', 'referred', 'recruited', 'rewards'].map((b) => (
                            <button key={b} type="button" onClick={() => setNetworkSort(b)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${networkSort === b ? 'var(--accent-cyan)' : 'var(--border)'}`, background: networkSort === b ? 'rgba(0,212,255,0.1)' : 'transparent', color: networkSort === b ? 'var(--accent-cyan)' : 'var(--text)', textTransform: 'capitalize', fontSize: 13 }}>
                                {b}
                            </button>
                        ))}
                    </div>
                    {network.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No trainers in the network yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {network.map((t, i) => (
                                <div key={t.code || i} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-subtle)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                                        <div>
                                            <strong>{t.displayName || t.username || `Trainer ${t.code}`}</strong>
                                            {t.specialty ? <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>· {t.specialty}</span> : null}
                                            {t.region ? <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>· {t.region}</span> : null}
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{t.bio || 'No bio.'}</div>
                                            <div style={{ fontSize: 12, marginTop: 6 }}>
                                                Impact: {t.totalImpactScore ?? 0} · Referred: {t.referredUserCount ?? 0} · Recruited: {t.recruitedTrainerCount ?? 0} · Earned: {t.rewardsEarnedAiba ?? 0} AIBA
                                            </div>
                                        </div>
                                        <a href={`/trainer?ref=${t.code}`} style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--accent-cyan)', color: 'var(--bg)', fontSize: 12, textDecoration: 'none' }}>
                                            Apply with {t.code}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : tab === 'leaderboard' ? (
                <div style={{ padding: 20, border: '2px solid var(--accent-gold)', borderRadius: 12 }}>
                    <h2 style={{ marginTop: 0, fontSize: 18 }}>Trainers Leaderboard</h2>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Rank by:</span>
                        {['impact', 'referred', 'recruited', 'rewards'].map((b) => (
                            <button key={b} type="button" onClick={() => setLeaderboardBy(b)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${leaderboardBy === b ? 'var(--accent-gold)' : 'var(--border)'}`, background: leaderboardBy === b ? 'rgba(255,215,0,0.1)' : 'transparent', color: leaderboardBy === b ? 'var(--accent-gold)' : 'var(--text)', textTransform: 'capitalize', fontSize: 13 }}>
                                {b}
                            </button>
                        ))}
                    </div>
                    {leaderboard.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No trainers on the leaderboard yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {leaderboard.map((t, i) => (
                                <div key={t.code || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: t.telegramId === trainer?.telegramId ? 'rgba(0,212,255,0.08)' : 'transparent' }}>
                                    <span style={{ fontWeight: 700, minWidth: 32, color: i < 3 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>#{t.rank}</span>
                                    <span><strong>{t.displayName || t.username || t.code}</strong></span>
                                    {t.specialty ? <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.specialty}</span> : null}
                                    <span style={{ marginLeft: 'auto', fontSize: 13 }}>
                                        {leaderboardBy === 'referred' ? `${t.referredUserCount ?? 0} refs` : leaderboardBy === 'recruited' ? `${t.recruitedTrainerCount ?? 0} recruited` : leaderboardBy === 'rewards' ? `${t.rewardsEarnedAiba ?? 0} AIBA` : `Impact ${t.totalImpactScore ?? 0}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 12, marginBottom: 20 }}>
                        <h3 style={{ marginTop: 0 }}>Your profile (network visibility)</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>Other trainers see this in the Network. Optional.</p>
                        <div style={{ display: 'grid', gap: 10 }}>
                            <div>
                                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Display name</label>
                                <input value={profileDisplayName} onChange={(e) => setProfileDisplayName(e.target.value)} placeholder="Your name" style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 6, border: '1px solid var(--border)' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bio (500 chars)</label>
                                <textarea value={profileBio} onChange={(e) => setProfileBio(e.target.value)} placeholder="Short intro for other trainers" rows={3} style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 6, border: '1px solid var(--border)' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Specialty</label>
                                <select value={profileSpecialty} onChange={(e) => setProfileSpecialty(e.target.value)} style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 6, border: '1px solid var(--border)' }}>
                                    {TRAINER_SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Region</label>
                                <input value={profileRegion} onChange={(e) => setProfileRegion(e.target.value)} placeholder="e.g. Global, EU, Asia" style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 6, border: '1px solid var(--border)' }} />
                            </div>
                            <button type="button" className="btn btn--secondary" onClick={saveProfile} disabled={busy}>Save profile</button>
                            {profileMsg ? <p style={{ color: 'var(--accent-green)', fontSize: 13 }}>{profileMsg}</p> : null}
                        </div>
                    </div>
                    <div style={{ padding: 20, border: '2px solid var(--accent-green)', borderRadius: 12, marginBottom: 20 }}>
                        <h2 style={{ marginTop: 0, fontSize: 18 }}>Your impact</h2>
                        <div style={{ display: 'grid', gap: 8, fontSize: 15 }}>
                            <div>Referred users: <strong>{trainer.referredUserCount ?? 0}</strong></div>
                            <div>Qualified (3+ battles): <strong>{trainer.referredUsersWithBattles ?? 0}</strong></div>
                            <div>Trainers recruited: <strong>{trainer.recruitedTrainerCount ?? 0}</strong></div>
                            <div>Rewards earned: <strong>{trainer.rewardsEarnedAiba ?? 0} AIBA</strong></div>
                        </div>
                        <button
                            type="button"
                            className="btn btn--primary"
                            onClick={claimRewards}
                            disabled={busy}
                            style={{ marginTop: 16, padding: '10px 16px' }}
                        >
                            {busy ? 'Claiming…' : 'Claim rewards'}
                        </button>
                        {claimMsg ? <p style={{ marginTop: 10, color: 'var(--accent-green)' }}>{claimMsg}</p> : null}
                    </div>

                    <div style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 12, marginBottom: 20 }}>
                        <h3 style={{ marginTop: 0 }}>Viral trainer recruitment</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                            Share your link. When someone applies as trainer with your link, you earn {20} AIBA when they get approved.
                        </p>
                        <p style={{ wordBreak: 'break-all', fontSize: 13, color: 'var(--accent-cyan)' }}>
                            {trainer.recruitUrl || `${APP_URL}/trainer?ref=${trainer.code}`}
                        </p>
                        <button type="button" className="btn btn--secondary" onClick={shareRecruitLink} style={{ marginTop: 8 }}>
                            Share trainer link
                        </button>
                    </div>

                    <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 8 }}>
                        <h4 style={{ marginTop: 0 }}>Rewards formula</h4>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                            <li>5 AIBA per referred user who completes 3+ battles</li>
                            <li>20 AIBA per trainer you recruit (when approved)</li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}
