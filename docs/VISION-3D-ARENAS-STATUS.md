# AIBA Arena — 3D Arenas: Vision vs Current Status

**Last updated:** 2025  
**Scope:** Clarification of "3D super power futuristic arenas" — what exists, what doesn't, and how to see them.

---

## 1. Direct Answer

### Do we already have 3D super power futuristic arenas?
**Yes (CSS visuals).** The app has **arena modes as game logic** (prediction, simulation, strategyWars, arbitrage, guildWars) and **futuristic arena visuals** (CSS gradient/glow, labeled "3D Super Power Arena").

### Can I see them?
**Yes.** You can see them in:
1. **Home tab** — Hero banner "3D Super Power Futuristic Arenas" (tappable, goes to Arenas)
2. **Arenas tab** — Main arena visual with "3D Super Power Arena" label
3. **Brokers tab** — Victory and "Battle Complete" visuals after a battle

These are **CSS-based** (gradients, glow, grid patterns) — not WebGL/Three.js. Battles are still server-simulated + text result. The visuals provide a futuristic "super power" aesthetic.

---

## 2. What Exists Today

| Component | Status | Location |
|-----------|--------|----------|
| Arena modes (prediction, simulation, etc.) | ✅ Implemented | `backend/engine/battleEngine.js`, miniapp arena select |
| Battle simulation (deterministic formula) | ✅ Implemented | `simulateBattle()` |
| Victory card (score + rewards) | ✅ Implemented | `page.js` victory-card |
| Futuristic arena visuals (CSS gradient/glow) | ✅ Implemented | `miniapp/globals.css` `.arena-visual`, `page.js` Home + Arenas + Brokers |
| Home hero "3D Super Power Futuristic Arenas" | ✅ Implemented | `page.js` Home tab (tappable → Arenas) |
| 3D/WebGL/Three.js arena visualization | ❌ Not implemented | — |
| Real-time battle animation | ❌ Not implemented | — |

---

## 3. Roadmap: Adding 3D Arenas

To deliver "3D super power futuristic arenas" you can:

1. **Phase A — Placeholder hero**
   - Add a static or animated 2D/Canvas hero image per arena (prediction, simulation, etc.) in the Arenas tab.
   - File: `miniapp/public/arenas/` — SVG or PNG per arena.

2. **Phase B — CSS/2D motion**
   - CSS animations, particle effects, or Lottie on battle result.
   - Gives "futuristic" feel without full 3D.

3. **Phase C — WebGL/Three.js**
   - Integrate Three.js or React Three Fiber.
   - Render a simple 3D arena (platform, lights, broker as shape).
   - Run on battle start; animate briefly on result.

4. **Phase D — Full 3D experience**
   - Dedicated arena scenes per mode.
   - Broker avatars, environment, visual score reveal.

---

## 4. Where the Copy Lives

- `miniapp/src/app/page.js`: `BROKERS_EXPLANATION`, `HERO_BY_TAB.home`, cinematic intro — all say "3D arenas"
- These are **marketing/positioning** statements. The product does not yet render 3D.

---

## 5. Recommendation

- **Short term:** Add arena hero images (Phase A) so each mode has a distinct visual.
- **Medium term:** Add Phase B or C for a "see it" experience.
- **Long term:** Full 3D (Phase D) if the roadmap prioritizes it.
