# Do we need Unity WebGL, Unreal WebGL, or a Three.js web game?

**Short answer: No.** The app does **not** require any of them to work. Battles are **server-simulated**; the client shows results with **HTML/CSS** (and optional future 2D/3D is a product choice, not a requirement).

---

## 1. How the game works today

- **Battle = server-side simulation.** The miniapp sends `POST /api/battle/run` (brokerId, arena, league). The backend runs a **deterministic formula** (broker stats + seed → score), applies rewards, and returns the result.
- **No client-side game engine.** The miniapp does not run physics, 3D scenes, or real-time combat. It displays:
  - Broker list, arena/mode dropdown, “Run battle” button
  - After battle: **CSS “arena” visual** (gradient/glow) + **victory card** (score, AIBA, Stars, Diamonds, Share)
- **“3D Super Power Futuristic Arenas”** in the UI is **branding + CSS** (see [VISION-3D-ARENAS-STATUS.md](VISION-3D-ARENAS-STATUS.md)). There is no WebGL or 3D rendering.

So: **Unity WebGL, Unreal WebGL, and Three.js are not needed** for the current design.

---

## 2. If you later want 3D / richer visuals

| Option | Pros | Cons | Fit for AIBA Arena (Telegram miniapp) |
|--------|------|------|--------------------------------------|
| **Unity WebGL** | Full game engine, big ecosystem. | Heavy bundle, load time, memory; often too much for in-app WebView. | **Rarely a good fit** for a miniapp. |
| **Unreal WebGL** | High-fidelity 3D. | Very heavy; targets desktop browsers. | **Poor fit** for Telegram miniapp. |
| **Three.js (or React Three Fiber)** | Lightweight, web-native, works in iframe/WebView. | You build the “game” layer yourself. | **Best fit** if you add 3D later. |

The existing roadmap in [VISION-3D-ARENAS-STATUS.md](VISION-3D-ARENAS-STATUS.md) already suggests **Phase C — WebGL/Three.js** (e.g. Three.js or React Three Fiber) for an optional 3D arena visualization. That would be an **optional enhancement**, not a dependency.

---

## 3. Recommendation

- **Today:** You do **not** need Unity WebGL, Unreal WebGL, or a Three.js web game. The app is complete and playable with the current **server simulation + HTML/CSS** presentation.
- **Optional later:** If you want 3D arena visuals or a more “game-like” feel, prefer **Three.js or React Three Fiber** (light, web-friendly). Avoid adding Unity or Unreal WebGL unless you have a clear need for their full engine features and accept the cost in bundle size and performance inside a miniapp.

---

## 4. Summary

| Question | Answer |
|----------|--------|
| Do we need Unity WebGL? | **No.** |
| Do we need Unreal WebGL? | **No.** |
| Do we need a Three.js web game? | **No** for the current app. **Optional** if you add 3D arena visuals later; then Three.js/React Three Fiber is the suggested path. |

Current game structure: **Broker + GameMode → POST /api/battle/run → score + rewards → show in UI.** No 3D engine required.
