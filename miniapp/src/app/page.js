"use client";

import { TonConnectButton, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useEffect, useMemo, useState } from "react";
import { createApi } from "../lib/api";
import { getTelegramUserUnsafe } from "../lib/telegram";
import { buildRewardClaimPayload } from "../lib/tonRewardClaim";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

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

    const [status, setStatus] = useState("");
    const [brokers, setBrokers] = useState([]);
    const [selectedBrokerId, setSelectedBrokerId] = useState("");
    const [battle, setBattle] = useState(null);
    const [busy, setBusy] = useState(false);
    const [claimStatus, setClaimStatus] = useState("");
    const [vaultInfo, setVaultInfo] = useState(null);

    async function refreshBrokers() {
        setBusy(true);
        try {
            const res = await api.get("/api/brokers/mine");
            const list = Array.isArray(res.data) ? res.data : [];
            setBrokers(list);
            if (!selectedBrokerId && list[0]?._id) setSelectedBrokerId(list[0]._id);
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        refreshBrokers().catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!wallet?.account?.address) return;

        setStatus("Saving wallet…");
        api.post("/api/wallet/connect", {
            address: wallet.account.address,
        })
            .then(() => setStatus("Wallet connected."))
            .catch(() => setStatus("Failed to save wallet (backend not running?)."));
    }, [wallet, api]);

    async function createStarterBroker() {
        setBusy(true);
        try {
            await api.post("/api/brokers/starter", {});
            await refreshBrokers();
        } finally {
            setBusy(false);
        }
    }

    async function runBattle() {
        if (!selectedBrokerId) {
            setStatus("Select a broker first.");
            return;
        }
        setBusy(true);
        try {
            const res = await api.post("/api/battle/run", {
                requestId: uuid(),
                brokerId: selectedBrokerId,
                arena: "prediction",
                league: "rookie",
            });
            setBattle(res.data);
        } catch {
            setStatus("Battle failed. Is backend running and APP_ENV=dev set?");
        } finally {
            setBusy(false);
        }
    }

    async function refreshVaultInventory() {
        setBusy(true);
        try {
            const res = await api.get("/api/vault/inventory");
            setVaultInfo(res.data);
        } catch {
            setVaultInfo(null);
            setStatus("Could not read vault inventory (configure TON_PROVIDER_URL/TON_API_KEY on backend).");
        } finally {
            setBusy(false);
        }
    }

    async function checkClaimStatus() {
        const claim = battle?.claim;
        if (!claim?.vaultAddress) return;

        setBusy(true);
        try {
            const res = await api.get("/api/vault/last-seqno", { params: { to: claim.toAddress } });
            const last = BigInt(res.data?.lastSeqno ?? "0");
            const claimed = last >= BigInt(claim.seqno);
            setClaimStatus(claimed ? "Claim confirmed on-chain." : "Not confirmed yet (wait and retry).");
        } catch {
            setClaimStatus("Could not read vault status (configure TON_PROVIDER_URL/TON_API_KEY on backend).");
        } finally {
            setBusy(false);
        }
    }

    async function claimOnChain() {
        const claim = battle?.claim;
        if (!claim?.vaultAddress) {
            setStatus("No on-chain claim available (missing env or wallet).");
            return;
        }
        if (!wallet?.account?.address) {
            setStatus("Connect wallet first.");
            return;
        }
        if (String(wallet.account.address) !== String(claim.toAddress)) {
            setStatus("Connected wallet does not match claim recipient. Reconnect the correct wallet.");
            return;
        }
        if (vaultInfo?.jettonBalance) {
            try {
                const bal = BigInt(vaultInfo.jettonBalance);
                const amt = BigInt(claim.amount);
                if (amt > bal) {
                    setStatus("Vault inventory is too low to pay this claim. Top up the vault.");
                    return;
                }
            } catch {
                // ignore parsing errors
            }
        }

        setBusy(true);
        try {
            setClaimStatus("");
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
                        amount: "70000000", // 0.07 TON
                        payload,
                    },
                ],
            });

            setStatus("Claim transaction sent.");

            const start = Date.now();
            while (Date.now() - start < 60_000) {
                await new Promise((r) => setTimeout(r, 2500));
                try {
                    const res = await api.get("/api/vault/last-seqno", { params: { to: claim.toAddress } });
                    const last = BigInt(res.data?.lastSeqno ?? "0");
                    if (last >= BigInt(claim.seqno)) {
                        setClaimStatus("Claim confirmed on-chain.");
                        return;
                    }
                    setClaimStatus("Pending on-chain confirmation…");
                } catch {
                    setClaimStatus("Pending (cannot read vault status).");
                }
            }

            setClaimStatus("Not confirmed yet (try again).");
        } catch {
            setStatus("Claim failed / rejected in wallet.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ padding: 16 }}>
            <h1 style={{ marginTop: 0 }}>AIBA Arena</h1>
            <div style={{ color: "#666", marginBottom: 12 }}>Backend: {BACKEND_URL}</div>
            <TonConnectButton />
            {status ? <p style={{ marginTop: 12 }}>{status}</p> : null}

            <hr style={{ margin: "16px 0" }} />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={createStarterBroker} disabled={busy} style={{ padding: "8px 12px" }}>
                    Create starter broker
                </button>
                <button onClick={refreshBrokers} disabled={busy} style={{ padding: "8px 12px" }}>
                    Refresh brokers
                </button>
                <button onClick={runBattle} disabled={busy || !selectedBrokerId} style={{ padding: "8px 12px" }}>
                    Run battle
                </button>
                <button onClick={refreshVaultInventory} disabled={busy} style={{ padding: "8px 12px" }}>
                    Vault inventory
                </button>
            </div>

            {vaultInfo ? (
                <div style={{ marginTop: 10, color: "#666", fontSize: 12 }}>
                    <div style={{ wordBreak: "break-all" }}>Vault: {vaultInfo.vaultAddress}</div>
                    <div>Vault TON balance (nano): {vaultInfo.tonBalanceNano}</div>
                    <div style={{ wordBreak: "break-all" }}>
                        Vault Jetton wallet: {vaultInfo.vaultJettonWallet?.userFriendly || vaultInfo.vaultJettonWallet?.raw}
                    </div>
                    <div>Vault Jetton balance: {vaultInfo.jettonBalance}</div>
                </div>
            ) : null}

            <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>My brokers</div>
                {brokers.length === 0 ? (
                    <div style={{ color: "#666" }}>No brokers yet. Create a starter broker.</div>
                ) : (
                    <select
                        value={selectedBrokerId}
                        onChange={(e) => setSelectedBrokerId(e.target.value)}
                        style={{ padding: 8, minWidth: 260 }}
                    >
                        {brokers.map((b) => (
                            <option key={b._id} value={b._id}>
                                #{b._id.slice(-6)} | INT {b.intelligence} SPD {b.speed} RISK {b.risk} | energy {b.energy}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {battle ? (
                <div style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
                    <div style={{ fontWeight: 700 }}>Battle result</div>
                    <div style={{ marginTop: 6 }}>Score: {battle.score}</div>
                    <div>Reward AIBA (server): {battle.rewardAiba}</div>

                    <div style={{ marginTop: 12, fontWeight: 600 }}>On-chain claim</div>
                    {battle.claim?.vaultAddress ? (
                        <>
                            <div style={{ color: "#666", fontSize: 12, wordBreak: "break-all" }}>
                                vault: {battle.claim.vaultAddress}
                            </div>
                            <div style={{ color: "#666", fontSize: 12, wordBreak: "break-all" }}>
                                to: {battle.claim.toAddress}
                            </div>
                            <div style={{ color: "#666", fontSize: 12 }}>
                                amount: {battle.claim.amount} | seqno: {battle.claim.seqno} | validUntil:{" "}
                                {battle.claim.validUntil}
                            </div>
                            <button onClick={claimOnChain} disabled={busy} style={{ marginTop: 10, padding: "8px 12px" }}>
                                Claim on-chain (TonConnect)
                            </button>
                            <button
                                onClick={checkClaimStatus}
                                disabled={busy}
                                style={{ marginTop: 10, marginLeft: 8, padding: "8px 12px" }}
                            >
                                Check claim status
                            </button>
                            {claimStatus ? <div style={{ marginTop: 8 }}>{claimStatus}</div> : null}
                            {vaultInfo?.jettonBalance ? (
                                <div style={{ marginTop: 8, color: "#666" }}>
                                    Vault inventory: {vaultInfo.jettonBalance} (jetton units)
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <div style={{ color: "#b45309", marginTop: 6 }}>
                            No claim returned. Set `ARENA_VAULT_ADDRESS`, `AIBA_JETTON_MASTER`, `ORACLE_PRIVATE_KEY_HEX` on the
                            backend and make sure you have a wallet saved.
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}

