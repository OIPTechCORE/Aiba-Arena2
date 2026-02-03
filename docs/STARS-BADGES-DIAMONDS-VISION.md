# Stars, Badges & Diamonds — Deep Vision (Super Futuristic)

This document **deep-checks** the AIBA Arena implementation of **Telegram Stars**, **X-style Profile Badges**, and **Telegram/TON Diamonds**, and aligns product language and UX with the real ecosystems in a **super, futuristic** way.

---

## 1. Telegram Stars (Real World)

- **What they are**: Telegram’s official in-app currency for digital goods and services. Users buy Stars (Apple/Google, PremiumBot, Fragment); they spend them in bots and mini apps (tips, digital products, courses). Creators/developers can cash out Stars to TON via Fragment.
- **In AIBA Arena**: We use “Stars” as an **in-app recognition and reward currency** that mirrors this idea: earn from battles (no real-money purchase in-app), display prominently, and position for future “spend” (tips, boosts, charity). No real Telegram Stars API is required; the **branding and UX** should feel like “this is your Stars balance — Telegram-style digital value.”

### Implementation checklist (super futuristic)

| Item | Status | Notes |
|------|--------|--------|
| User.starsBalance | ✅ | Backend model |
| Earn per battle win | ✅ | starRewardPerBattle, ledger |
| Balance strip | ✅ | Stars and Diamonds with icons + glow (balance-strip__label--star/diamond, icon-svg glow) |
| Wallet card | ✅ | Enhance copy: “Telegram Stars–style • Earn in battles, digital value” |
| Victory card | ✅ | Shows +Stars; ensure icon + glow |
| Icon + CSS | ✅ | `.icon-svg--star` gold glow; balance-display + victory-card meta |

---

## 2. Profile Badges (X-Style)

- **What they are**: On X (Twitter), profile badges (e.g. verified blue check, gold org, grey “official”) appear next to the name and in lists. They signal identity, status, and trust.
- **In AIBA Arena**: We implement **profile badges** as a list of IDs (`verified`, `early_adopter`, `top_leader`, `top_donor`, etc.), assignable by admins (and auto for `top_leader`). Display: **X-style** — next to username in Profile, leaderboards, charity leaderboard, and a small verified mark in the balance strip.

### Implementation checklist (super futuristic)

| Item | Status | Notes |
|------|--------|--------|
| User.badges[] | ✅ | Backend |
| Admin set badges | ✅ | POST /api/admin/mod/user-badges |
| Auto top_leader | ✅ | Cron + sync job |
| BADGE_LABELS | ✅ | label, color, title (tooltip); diamond_holder |
| Profile card pills | ✅ | Futuristic pills; verified = cyan; title tooltip |
| Leaderboard badges | ✅ | Inline pills (up to 3); title tooltip |
| Balance strip verified | ✅ | Small ✓ badge |
| CSS per-badge glow | ✅ | `.badge-pill[data-badge="verified"]` glow |

---

## 3. Diamonds (Telegram / TON Ecosystem)

- **What they are**: In the Telegram/TON narrative, “Diamonds” are often used as a **premium / rare** concept (e.g. Fragment, exclusive assets). TON is the chain; Stars are the in-app currency; “Diamonds” here mean **rare, high-prestige, TON-ecosystem-aligned** rewards.
- **In AIBA Arena**: **Diamonds** are a scarce, premium asset: first battle win grants Diamonds (configurable); future use can include milestones or exclusive perks. No on-chain diamond token required; the **feel** is “premium TON ecosystem asset.”

### Implementation checklist (super futuristic)

| Item | Status | Notes |
|------|--------|--------|
| User.diamondsBalance | ✅ | Backend |
| First-win grant | ✅ | firstWinDiamondAwardedAt, ledger |
| Balance strip | ✅ | Diamonds with icon + glow (TON premium title) |
| Wallet card | ✅ | Copy: “Rare TON ecosystem asset • First win + milestones” |
| Victory card | ✅ | “+1 Diamond (first win!)” with icon |
| Icon + CSS | ✅ | `.icon-svg--diamond` cyan/ice glow; victory-card__meta-diamond |

---

## 4. Super Futuristic UX Summary

1. **Balance strip**: Always show **Stars** and **Diamonds** with icons and glow next to NEUR/AIBA (and verified badge when applicable).
2. **Wallet tab**:  
   - **Stars** card: Telegram Stars–style copy and gold/amber futuristic styling.  
   - **Diamonds** card: TON premium copy and cyan/ice styling.  
   - **Profile** card: Identity + full badge pills (X-style), with verified check when present.
3. **Leaderboards / Charity**: Badge pills next to names (verified, top_leader, etc.) with distinct colors.
4. **Victory card**: Prominent Stars and first-win Diamond line with icons.
5. **CSS**: Dedicated classes for star/diamond icons (glow, gradient), card borders, and badge pills so the whole experience feels cohesive and “super futuristic.”

---

## 5. Files Touched (Implementation)

- **miniapp/src/app/page.js**: Balance strip Stars + Diamonds with icons and tooltips; Wallet card copy; BADGE_LABELS with `title` tooltips; Profile badge `data-badge="verified"` for glow; Victory card (Home & Arenas) uses IconStar/IconDiamond in meta.
- **miniapp/src/app/globals.css**: `.icon-svg--star`, `.icon-svg--diamond` glow; `.victory-card__meta-stars` / `.victory-card__meta-diamond`; `.card--stars` / `.card--diamonds` stronger border and inset glow; `.badge-pill[data-badge="verified"]` glow.
- **Backend**: No schema changes (already aligned).

---

## 6. Deep Check Completed

All checklist items are implemented. **Stars** = Telegram Stars–style in-app currency (balance strip, wallet card, victory with icon + glow). **Badges** = X-style pills with tooltips and verified glow. **Diamonds** = TON premium asset (balance strip, wallet card, victory with icon + glow). UX is cohesive and super futuristic (glass + glow).

This vision keeps **Stars** aligned with Telegram’s in-app currency idea, **Badges** with X-style identity/status, and **Diamonds** with TON premium scarcity, while pushing the in-app presentation to a super futuristic, glass-and-glow style.
