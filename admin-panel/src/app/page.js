"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function AdminHome() {
    const [token, setToken] = useState("");
    const [tab, setTab] = useState("tasks"); // tasks | ads | modes

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState("");

    const api = useMemo(() => {
        const a = axios.create({ baseURL: BACKEND_URL });
        a.interceptors.request.use((cfg) => {
            if (token) cfg.headers.Authorization = `Bearer ${token}`;
            return cfg;
        });
        return a;
    }, [token]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("aiba_admin_token");
            if (saved) setToken(saved);
        } catch {
            // ignore
        }
    }, []);

    const login = async () => {
        setAuthError("");
        try {
            const res = await axios.post(`${BACKEND_URL}/api/admin/auth/login`, { email, password });
            const t = String(res.data?.token || "");
            if (!t) throw new Error("no token");
            setToken(t);
            localStorage.setItem("aiba_admin_token", t);
        } catch {
            setAuthError("Login failed (check ADMIN_EMAIL / password).");
        }
    };

    const logout = () => {
        setToken("");
        try {
            localStorage.removeItem("aiba_admin_token");
        } catch {
            // ignore
        }
    };

    // ----- Tasks -----
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [tasksError, setTasksError] = useState("");

    const fetchTasks = async () => {
        setLoadingTasks(true);
        setTasksError("");
        try {
            const res = await api.get("/api/admin/tasks");
            setTasks(Array.isArray(res.data) ? res.data : []);
        } catch {
            setTasksError("Failed to load tasks (missing/invalid admin token?)");
        } finally {
            setLoadingTasks(false);
        }
    };

    const createTask = async () => {
        if (!newTaskTitle.trim()) return;
        await api.post("/api/admin/tasks", { title: newTaskTitle.trim(), description: newTaskDescription.trim(), enabled: true });
        setNewTaskTitle("");
        setNewTaskDescription("");
        await fetchTasks();
    };

    const toggleTask = async (t) => {
        await api.patch(`/api/admin/tasks/${t._id}`, { enabled: !t.enabled });
        await fetchTasks();
    };

    // ----- Ads -----
    const [ads, setAds] = useState([]);
    const [loadingAds, setLoadingAds] = useState(false);
    const [adsError, setAdsError] = useState("");
    const [newAdImageUrl, setNewAdImageUrl] = useState("");
    const [newAdLinkUrl, setNewAdLinkUrl] = useState("");

    const fetchAds = async () => {
        setLoadingAds(true);
        setAdsError("");
        try {
            const res = await api.get("/api/admin/ads");
            setAds(Array.isArray(res.data) ? res.data : []);
        } catch {
            setAdsError("Failed to load ads (missing/invalid admin token?)");
        } finally {
            setLoadingAds(false);
        }
    };

    const createAd = async () => {
        if (!newAdImageUrl.trim()) return;
        await api.post("/api/admin/ads", {
            imageUrl: newAdImageUrl.trim(),
            linkUrl: newAdLinkUrl.trim(),
            placement: "between_battles",
            weight: 1,
            active: true,
        });
        setNewAdImageUrl("");
        setNewAdLinkUrl("");
        await fetchAds();
    };

    const toggleAd = async (a) => {
        await api.patch(`/api/admin/ads/${a._id}`, { active: !a.active });
        await fetchAds();
    };

    // ----- Game Modes -----
    const [modes, setModes] = useState([]);
    const [loadingModes, setLoadingModes] = useState(false);
    const [modesError, setModesError] = useState("");
    const [newModeKey, setNewModeKey] = useState("");
    const [newModeName, setNewModeName] = useState("");
    const [newModeArena, setNewModeArena] = useState("prediction");

    const fetchModes = async () => {
        setLoadingModes(true);
        setModesError("");
        try {
            const res = await api.get("/api/admin/game-modes");
            setModes(Array.isArray(res.data) ? res.data : []);
        } catch {
            setModesError("Failed to load game modes (missing/invalid admin token?)");
        } finally {
            setLoadingModes(false);
        }
    };

    const createMode = async () => {
        if (!newModeKey.trim() || !newModeName.trim() || !newModeArena.trim()) return;
        await api.post("/api/admin/game-modes", {
            key: newModeKey.trim(),
            name: newModeName.trim(),
            arena: newModeArena.trim(),
            league: "rookie",
            enabled: true,
        });
        setNewModeKey("");
        setNewModeName("");
        await fetchModes();
    };

    const toggleMode = async (m) => {
        await api.patch(`/api/admin/game-modes/${m._id}`, { enabled: !m.enabled });
        await fetchModes();
    };

    // ----- Economy config -----
    const [economyJson, setEconomyJson] = useState("");
    const [loadingEconomy, setLoadingEconomy] = useState(false);
    const [economyError, setEconomyError] = useState("");

    const fetchEconomy = async () => {
        setLoadingEconomy(true);
        setEconomyError("");
        try {
            const res = await api.get("/api/admin/economy/config");
            setEconomyJson(JSON.stringify(res.data || {}, null, 2));
        } catch {
            setEconomyError("Failed to load economy config (missing/invalid admin token?)");
        } finally {
            setLoadingEconomy(false);
        }
    };

    const saveEconomy = async () => {
        setEconomyError("");
        try {
            const parsed = JSON.parse(economyJson || "{}");
            await api.patch("/api/admin/economy/config", parsed);
            await fetchEconomy();
        } catch {
            setEconomyError("Failed to save (invalid JSON or backend error).");
        }
    };

    useEffect(() => {
        if (!token) return;
        if (tab === "tasks") fetchTasks();
        if (tab === "ads") fetchAds();
        if (tab === "modes") fetchModes();
        if (tab === "economy") fetchEconomy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, tab]);

    return (
        <div style={{ padding: 16 }}>
            <h1 style={{ marginTop: 0 }}>Admin Panel</h1>
            <div style={{ color: "#666", marginBottom: 12 }}>Backend: {BACKEND_URL}</div>

            {!token ? (
                <div style={{ maxWidth: 420, border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Admin login</div>
                    <div style={{ display: "grid", gap: 8 }}>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            style={{ padding: 10 }}
                        />
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            type="password"
                            style={{ padding: 10 }}
                        />
                        <button onClick={login} style={{ padding: "10px 12px" }}>
                            Login
                        </button>
                        {authError ? <div style={{ color: "crimson" }}>{authError}</div> : null}
                    </div>
                </div>
            ) : (
                <>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <button onClick={() => setTab("tasks")} style={{ padding: "8px 12px" }}>
                            Tasks
                        </button>
                        <button onClick={() => setTab("ads")} style={{ padding: "8px 12px" }}>
                            Ads
                        </button>
                        <button onClick={() => setTab("modes")} style={{ padding: "8px 12px" }}>
                            Game modes
                        </button>
                        <button onClick={() => setTab("economy")} style={{ padding: "8px 12px" }}>
                            Economy
                        </button>
                        <div style={{ flex: 1 }} />
                        <button onClick={logout} style={{ padding: "8px 12px" }}>
                            Logout
                        </button>
                    </div>

                    <div style={{ marginTop: 12 }}>
                        {tab === "tasks" ? (
                            <>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                    <button onClick={fetchTasks} disabled={loadingTasks} style={{ padding: "8px 12px" }}>
                                        {loadingTasks ? "Loading…" : "Refresh"}
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
                                    <button onClick={createTask} style={{ padding: "8px 12px" }}>
                                        Create
                                    </button>
                                </div>
                                {tasksError ? <p style={{ color: "crimson" }}>{tasksError}</p> : null}
                                <div style={{ marginTop: 12 }}>
                                    {tasks.map((t) => (
                                        <div
                                            key={t._id}
                                            style={{ padding: 12, border: "1px solid #eee", borderRadius: 8, marginTop: 8 }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                                                    {t.description ? (
                                                        <div style={{ color: "#444", marginTop: 4 }}>{t.description}</div>
                                                    ) : null}
                                                    {t.enabled === false ? (
                                                        <div style={{ color: "#b45309", marginTop: 6 }}>Disabled</div>
                                                    ) : null}
                                                </div>
                                                <button onClick={() => toggleTask(t)} style={{ padding: "8px 12px" }}>
                                                    {t.enabled ? "Disable" : "Enable"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : null}

                        {tab === "ads" ? (
                            <>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                    <button onClick={fetchAds} disabled={loadingAds} style={{ padding: "8px 12px" }}>
                                        {loadingAds ? "Loading…" : "Refresh"}
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
                                    <button onClick={createAd} style={{ padding: "8px 12px" }}>
                                        Create
                                    </button>
                                </div>
                                {adsError ? <p style={{ color: "crimson" }}>{adsError}</p> : null}
                                <div style={{ marginTop: 12 }}>
                                    {ads.map((a) => (
                                        <div
                                            key={a._id}
                                            style={{ padding: 12, border: "1px solid #eee", borderRadius: 8, marginTop: 8 }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, wordBreak: "break-all" }}>{a.imageUrl}</div>
                                                    {a.linkUrl ? (
                                                        <div style={{ color: "#444", marginTop: 4, wordBreak: "break-all" }}>
                                                            {a.linkUrl}
                                                        </div>
                                                    ) : null}
                                                    <div style={{ color: "#666", marginTop: 6, fontSize: 12 }}>
                                                        placement: {a.placement} | weight: {a.weight} |{" "}
                                                        {a.active ? "active" : "inactive"}
                                                    </div>
                                                </div>
                                                <button onClick={() => toggleAd(a)} style={{ padding: "8px 12px" }}>
                                                    {a.active ? "Disable" : "Enable"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : null}

                        {tab === "modes" ? (
                            <>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                    <button onClick={fetchModes} disabled={loadingModes} style={{ padding: "8px 12px" }}>
                                        {loadingModes ? "Loading…" : "Refresh"}
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
                                    <input
                                        value={newModeArena}
                                        onChange={(e) => setNewModeArena(e.target.value)}
                                        placeholder="arena"
                                        style={{ padding: 10, minWidth: 180 }}
                                    />
                                    <button onClick={createMode} style={{ padding: "8px 12px" }}>
                                        Create
                                    </button>
                                </div>
                                {modesError ? <p style={{ color: "crimson" }}>{modesError}</p> : null}
                                <div style={{ marginTop: 12 }}>
                                    {modes.map((m) => (
                                        <div
                                            key={m._id}
                                            style={{ padding: 12, border: "1px solid #eee", borderRadius: 8, marginTop: 8 }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600 }}>
                                                        {m.key} — {m.name}
                                                    </div>
                                                    <div style={{ color: "#666", marginTop: 6, fontSize: 12 }}>
                                                        arena: {m.arena} | league: {m.league} | {m.enabled ? "enabled" : "disabled"}
                                                    </div>
                                                </div>
                                                <button onClick={() => toggleMode(m)} style={{ padding: "8px 12px" }}>
                                                    {m.enabled ? "Disable" : "Enable"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : null}

                        {tab === "economy" ? (
                            <>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                    <button onClick={fetchEconomy} disabled={loadingEconomy} style={{ padding: "8px 12px" }}>
                                        {loadingEconomy ? "Loading…" : "Refresh"}
                                    </button>
                                    <button onClick={saveEconomy} style={{ padding: "8px 12px" }}>
                                        Save
                                    </button>
                                </div>
                                {economyError ? <p style={{ color: "crimson" }}>{economyError}</p> : null}
                                <textarea
                                    value={economyJson}
                                    onChange={(e) => setEconomyJson(e.target.value)}
                                    spellCheck={false}
                                    style={{
                                        marginTop: 12,
                                        width: "100%",
                                        minHeight: 420,
                                        padding: 12,
                                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                        fontSize: 12,
                                        border: "1px solid #eee",
                                        borderRadius: 8,
                                    }}
                                />
                                <div style={{ color: "#666", fontSize: 12, marginTop: 8 }}>
                                    Tip: edit `baseRewardAibaPerScore`, `baseRewardNeurPerScore`, caps, and `dailyCap*ByArena` maps.
                                </div>
                            </>
                        ) : null}
                    </div>
                </>
            )}
        </div>
    );
}

