# Do we need a studio for arenas and an images file?

**Short answer:** You **do not need** a separate Arena Studio or a central images file for the app to work. You already have admin tooling for arenas; images are used in a few fixed places. Both become optional enhancements if you scale content or branding.

---

## 1. Studio for arenas

### What you have today

- **Arenas** are **game modes** (GameMode model: key, name, arena, league, energy, cooldown, entry fees, reward multipliers, rules). See [ARENAS-DEEP-EXPLANATION.md](ARENAS-DEEP-EXPLANATION.md).
- **Admin panel → Game Modes** already acts as your “arena studio”:
  - List all modes: `GET /api/admin/game-modes`
  - Create mode: `POST /api/admin/game-modes` (key, name, arena, league, enabled)
  - Toggle enabled: `PATCH /api/admin/game-modes/:id` (enabled)
- Default modes are seeded in `backend/db.js` (e.g. prediction, simulation, strategyWars, guildWars, arbitrage × rookie/pro/elite). Admins can add or edit via the admin UI.

So you **already have** a place to manage arena/mode configuration. You do **not** need a separate “Arena Studio” app for that.

### When a dedicated studio might be useful

- **Visual tuning:** A dedicated UI to tweak arena weights (INT/SPD/RISK), rules, and multipliers with a live preview or simulation.
- **Per-arena artwork or 3D:** If you add per-arena images or 3D scenes (e.g. [VISION-3D-ARENAS-STATUS.md](VISION-3D-ARENAS-STATUS.md) Phase A: `miniapp/public/arenas/*.svg`), a small “studio” could manage which image/scene is used per arena key.
- **Complex rules:** If `GameMode.rules` grows (e.g. many overrides), a form-based or JSON editor in the admin (or a separate studio) could improve UX.

**Recommendation:** For current scope, **no** — use **Admin → Game Modes**. Revisit a dedicated studio only if you add per-arena visuals or heavy rule editing.

---

## 2. Images file for the app

### What you have today

- **Miniapp:** `miniapp/public/icon.svg` (app icon), favicon redirect to it in `next.config.js`. TonConnect manifest uses `icon.svg` (some wallets prefer PNG; see [CONNECT-WALLET-TON-SCAN.md](CONNECT-WALLET-TON-SCAN.md)).
- **Broker images:** Backend serves `/api/metadata/brokers/:id/image.svg` (generated). Miniapp references these via `getBackendUrl() + '/api/metadata/brokers/' + id + '/image.svg'`.
- **Assets folder:** `assets/` (e.g. logo, Telegram profile/splash) used for docs or external channels; not a single “images file” manifest.
- There is **no** central “images file” (e.g. a JSON or JS manifest listing all image paths). Paths are in code or config.

So the app works **without** a central images file. You do **not** need one to run.

### When a central images file helps

- **Many per-arena or per-feature images:** e.g. `public/arenas/prediction.svg`, `public/arenas/simulation.svg`. A small manifest (e.g. `public/images.json` or `miniapp/src/config/assets.js`) mapping arena key → path keeps references consistent.
- **Theming or A/B assets:** One place to swap logo/icon per environment or campaign.
- **Docs and tooling:** A single list of asset paths for designers or scripts.

**Recommendation:** **Optional.** For the current small set of assets (icon, broker SVGs, a few in `assets/`), you don’t need it. If you add per-arena or many branded images, add a small manifest (e.g. `miniapp/src/config/images.js` or `public/asset-manifest.json`) and reference it from the app.

---

## 3. Summary

| Need | Required? | What you have | Consider adding if… |
|------|------------|----------------|----------------------|
| **Studio for arenas** | No | Admin panel → Game Modes (create/edit/toggle modes) | You add per-arena artwork, 3D scenes, or heavy rule tuning with preview. |
| **Images file** | No | Icon and broker images used inline; no central manifest | You add many per-arena/per-feature images or want one place to manage asset paths. |

Both are **optional** enhancements, not requirements for the app today.
