'use client';

import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useEffect, useMemo, useState } from 'react';
import { createApi } from '../lib/api';
import { getTelegramUserUnsafe } from '../lib/telegram';
import { buildRewardClaimPayload } from '../lib/tonRewardClaim';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

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

    useEffect(() => {
        refreshBrokers().catch(() => {});
        refreshEconomy().catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        try {
            await api.post('/api/brokers/starter', {});
            await refreshBrokers();
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

    // ----- Guilds -----
    const [guilds, setGuilds] = useState([]);
    const [selectedGuildId, setSelectedGuildId] = useState('');
    const [newGuildName, setNewGuildName] = useState('');
    const [newGuildBio, setNewGuildBio] = useState('');
    const [joinGuildId, setJoinGuildId] = useState('');
    const [guildMsg, setGuildMsg] = useState('');

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
        setBusy(true);
        setGuildMsg('');
        try {
            const res = await api.post('/api/guilds/create', { name: newGuildName, bio: newGuildBio });
            setGuildMsg(`Created guild ${res.data?.name || ''}`);
            setNewGuildName('');
            setNewGuildBio('');
            await refreshGuilds();
        } catch {
            setGuildMsg('Create guild failed (name taken? too short?).');
        } finally {
            setBusy(false);
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
            const bonus = r ? ` NEUR bonus: you ${r.referee || 0}, referrer ${r.referrer || 0}.` : '';
            setRefMsg(`Referral applied.${bonus}`);
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

    return (
        <div style={{ padding: 16 }}>
            <h1 style={{ marginTop: 0 }}>AIBA Arena</h1>
            <div style={{ color: '#666', marginBottom: 12 }}>Backend: {BACKEND_URL}</div>
            <TonConnectButton />
            {status ? <p style={{ marginTop: 12 }}>{status}</p> : null}

            <hr style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={createStarterBroker} disabled={busy} style={{ padding: '8px 12px' }}>
                    Create starter broker
                </button>
                <button onClick={refreshBrokers} disabled={busy} style={{ padding: '8px 12px' }}>
                    Refresh brokers
                </button>
                <button onClick={runBattle} disabled={busy || !selectedBrokerId} style={{ padding: '8px 12px' }}>
                    Run battle
                </button>
                <button onClick={refreshVaultInventory} disabled={busy} style={{ padding: '8px 12px' }}>
                    Vault inventory
                </button>
            </div>

            <div style={{ marginTop: 10, color: '#666', fontSize: 12 }}>
                <div>
                    Balances — NEUR: {Number(economyMe?.neurBalance ?? 0)} | AIBA credits:{' '}
                    {Number(economyMe?.aibaBalance ?? 0)}
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <input
                        type="checkbox"
                        checked={autoClaimOnBattle}
                        onChange={(e) => setAutoClaimOnBattle(Boolean(e.target.checked))}
                    />
                    Auto-claim AIBA on battle (withdraw immediately)
                </label>
            </div>

            {vaultInfo ? (
                <div style={{ marginTop: 10, color: '#666', fontSize: 12 }}>
                    <div style={{ wordBreak: 'break-all' }}>Vault: {vaultInfo.vaultAddress}</div>
                    <div>Vault TON balance (nano): {vaultInfo.tonBalanceNano}</div>
                    <div style={{ wordBreak: 'break-all' }}>
                        Vault Jetton wallet:{' '}
                        {vaultInfo.vaultJettonWallet?.userFriendly || vaultInfo.vaultJettonWallet?.raw}
                    </div>
                    <div>Vault Jetton balance: {vaultInfo.jettonBalance}</div>
                </div>
            ) : null}

            <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>My brokers</div>
                {brokers.length === 0 ? (
                    <div style={{ color: '#666' }}>No brokers yet. Create a starter broker.</div>
                ) : (
                    <select
                        value={selectedBrokerId}
                        onChange={(e) => setSelectedBrokerId(e.target.value)}
                        style={{ padding: 8, minWidth: 260 }}
                    >
                        {brokers.map((b) => (
                            <option key={b._id} value={b._id}>
                                #{b._id.slice(-6)} | INT {b.intelligence} SPD {b.speed} RISK {b.risk} | energy{' '}
                                {b.energy}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Arena</div>
                <select value={arena} onChange={(e) => setArena(e.target.value)} style={{ padding: 8, minWidth: 260 }}>
                    <option value="prediction">prediction</option>
                    <option value="simulation">simulation</option>
                    <option value="strategyWars">strategyWars</option>
                    <option value="guildWars">guildWars</option>
                </select>
                {arena === 'guildWars' ? (
                    <div style={{ marginTop: 6, color: '#666', fontSize: 12 }}>
                        Guild wars requires you to be a member of a guild. Rewards split into guild treasury.
                    </div>
                ) : null}
            </div>

            <div style={{ marginTop: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                <div style={{ fontWeight: 700 }}>Guilds</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    <button onClick={refreshGuilds} disabled={busy} style={{ padding: '8px 12px' }}>
                        Refresh my guilds
                    </button>
                    <button
                        onClick={depositBrokerToGuild}
                        disabled={busy || !selectedGuildId || !selectedBrokerId}
                        style={{ padding: '8px 12px' }}
                    >
                        Deposit selected broker
                    </button>
                    <button
                        onClick={withdrawBrokerFromGuild}
                        disabled={busy || !selectedGuildId || !selectedBrokerId}
                        style={{ padding: '8px 12px' }}
                    >
                        Withdraw selected broker
                    </button>
                </div>

                {guildMsg ? <div style={{ marginTop: 8 }}>{guildMsg}</div> : null}

                <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>My guilds</div>
                    {guilds.length === 0 ? (
                        <div style={{ color: '#666' }}>No guilds yet.</div>
                    ) : (
                        <select
                            value={selectedGuildId}
                            onChange={(e) => setSelectedGuildId(e.target.value)}
                            style={{ padding: 8, minWidth: 320 }}
                        >
                            {guilds.map((g) => (
                                <option key={g._id} value={g._id}>
                                    {g.name} (members {g.members?.length ?? 0}) — vault NEUR {g.vaultNeur ?? 0}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div style={{ marginTop: 12, display: 'grid', gap: 8, maxWidth: 520 }}>
                    <div style={{ fontWeight: 600 }}>Create guild</div>
                    <input
                        value={newGuildName}
                        onChange={(e) => setNewGuildName(e.target.value)}
                        placeholder="Name (3-24 chars)"
                        style={{ padding: 10 }}
                    />
                    <input
                        value={newGuildBio}
                        onChange={(e) => setNewGuildBio(e.target.value)}
                        placeholder="Bio (optional)"
                        style={{ padding: 10 }}
                    />
                    <button
                        onClick={createGuild}
                        disabled={busy || !newGuildName.trim()}
                        style={{ padding: '8px 12px' }}
                    >
                        Create
                    </button>
                </div>

                <div style={{ marginTop: 12, display: 'grid', gap: 8, maxWidth: 520 }}>
                    <div style={{ fontWeight: 600 }}>Join guild</div>
                    <input
                        value={joinGuildId}
                        onChange={(e) => setJoinGuildId(e.target.value)}
                        placeholder="Guild ID"
                        style={{ padding: 10 }}
                    />
                    <button onClick={joinGuild} disabled={busy || !joinGuildId.trim()} style={{ padding: '8px 12px' }}>
                        Join
                    </button>
                </div>
            </div>

            <div style={{ marginTop: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                <div style={{ fontWeight: 700 }}>Referrals</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    <button onClick={createReferral} disabled={busy} style={{ padding: '8px 12px' }}>
                        Create my referral code
                    </button>
                </div>
                {myReferral?.code ? (
                    <div style={{ marginTop: 10, color: '#666' }}>
                        Your code: <span style={{ fontWeight: 700 }}>{String(myReferral.code).toUpperCase()}</span>
                    </div>
                ) : null}

                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        value={refCodeInput}
                        onChange={(e) => setRefCodeInput(e.target.value)}
                        placeholder="Enter referral code"
                        style={{ padding: 10, minWidth: 240 }}
                    />
                    <button
                        onClick={useReferral}
                        disabled={busy || !refCodeInput.trim()}
                        style={{ padding: '8px 12px' }}
                    >
                        Apply
                    </button>
                </div>
                {refMsg ? <div style={{ marginTop: 8 }}>{refMsg}</div> : null}
                <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                    Note: applying a referral requires a connected wallet (anti-sybil baseline).
                </div>
            </div>

            {battle ? (
                <div style={{ marginTop: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700 }}>Battle result</div>
                    <div style={{ marginTop: 6 }}>Score: {battle.score}</div>
                    <div>Reward AIBA (credits): {battle.rewardAiba}</div>

                    {ad?.imageUrl ? (
                        <div style={{ marginTop: 12, padding: 10, border: '1px solid #f2f2f2', borderRadius: 10 }}>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Sponsored</div>
                            <img
                                src={ad.imageUrl}
                                alt="ad"
                                style={{ width: '100%', maxWidth: 520, borderRadius: 10, display: 'block' }}
                                onClick={() => {
                                    const url = String(ad.linkUrl || '').trim();
                                    if (!url) return;
                                    try {
                                        if (window?.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(url);
                                        else window.open(url, '_blank');
                                    } catch {
                                        // ignore
                                    }
                                }}
                            />
                            {ad.linkUrl ? (
                                <div style={{ marginTop: 8 }}>
                                    <button
                                        onClick={() => {
                                            const url = String(ad.linkUrl || '').trim();
                                            if (!url) return;
                                            try {
                                                if (window?.Telegram?.WebApp?.openLink)
                                                    window.Telegram.WebApp.openLink(url);
                                                else window.open(url, '_blank');
                                            } catch {
                                                // ignore
                                            }
                                        }}
                                        style={{ padding: '8px 12px' }}
                                    >
                                        Open
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <div style={{ marginTop: 12, fontWeight: 600 }}>On-chain claim</div>
                    {lastClaim?.vaultAddress ? (
                        <>
                            <div style={{ color: '#666', fontSize: 12, wordBreak: 'break-all' }}>
                                vault: {lastClaim.vaultAddress}
                            </div>
                            <div style={{ color: '#666', fontSize: 12, wordBreak: 'break-all' }}>
                                to: {lastClaim.toAddress}
                            </div>
                            <div style={{ color: '#666', fontSize: 12 }}>
                                amount: {lastClaim.amount} | seqno: {lastClaim.seqno} | validUntil:{' '}
                                {lastClaim.validUntil}
                            </div>
                            <button
                                onClick={claimOnChain}
                                disabled={busy}
                                style={{ marginTop: 10, padding: '8px 12px' }}
                            >
                                Claim on-chain (TonConnect)
                            </button>
                            <button
                                onClick={checkClaimStatus}
                                disabled={busy}
                                style={{ marginTop: 10, marginLeft: 8, padding: '8px 12px' }}
                            >
                                Check claim status
                            </button>
                            {claimStatus ? <div style={{ marginTop: 8 }}>{claimStatus}</div> : null}
                            {vaultInfo?.jettonBalance ? (
                                <div style={{ marginTop: 8, color: '#666' }}>
                                    Vault inventory: {vaultInfo.jettonBalance} (jetton units)
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <>
                            <div style={{ color: '#666', marginTop: 6, fontSize: 12 }}>
                                Create a claim from your AIBA credits (balance: {Number(economyMe?.aibaBalance ?? 0)}).
                            </div>
                            <div
                                style={{
                                    marginTop: 10,
                                    display: 'flex',
                                    gap: 8,
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                }}
                            >
                                <input
                                    value={claimAmount}
                                    onChange={(e) => setClaimAmount(e.target.value)}
                                    placeholder="Amount (blank = all credits)"
                                    style={{ padding: 10, minWidth: 240 }}
                                />
                                <button onClick={requestAibaClaim} disabled={busy} style={{ padding: '8px 12px' }}>
                                    Create claim
                                </button>
                            </div>
                            <div style={{ color: '#b45309', marginTop: 8, fontSize: 12 }}>
                                Requires backend env: `ARENA_VAULT_ADDRESS`, `AIBA_JETTON_MASTER`,
                                `ORACLE_PRIVATE_KEY_HEX` and a saved wallet.
                            </div>
                        </>
                    )}
                </div>
            ) : null}
        </div>
    );
}
