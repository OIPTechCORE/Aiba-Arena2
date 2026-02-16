# UI Design Principles — AIBA Arena

**Status:** Canonical guidance for miniapp and admin UI.  
**Last updated:** Feb 2026

---

## 1. Core principles

The app must be **deeply and seamlessly**:

- **Futuristic** — Metallic design system (brass gold, deep dark, 3D gradients), clear typography, motion and depth. No flat, generic “web2” look.
- **Modular** — Reusable components (cards, nav, buttons, tabs). Compose screens from small, testable building blocks.
- **Card-based** — Content lives in cards: panels, sections, and actions use `.card`, `.card--elevated`, consistent borders and shadows (see `globals.css`).
- **Extensible** — New features add new tabs or cards without rewriting existing flows. Config-driven labels and navigation where possible.
- **Interoperable** — Same design tokens (CSS variables), same patterns across miniapp, admin, and legal pages. Shared components (e.g. `PageNav`) and classes.
- **Multi-tabbed** — Primary navigation is tab-based (Home grid + tab panels). Sub-flows (e.g. Wallet → Staking, Market → Rentals) use nested tabs or cards, not one-off full-page layouts.

---

## 2. Navigation (every page)

- **A. Back to Home** — On every page and every tab, the user can return to Home in one action (link to `/` or set tab to `home`).
- **B. Back to Previous** — On every page, the user can return to where they were:
  - **Route pages** (privacy, terms, trainer, admin): use browser/tab history (`router.back()`); component: `PageNav`.
  - **In-app tabs** (HomeContent): use tab history; show “← Back to Previous” (previous tab) and “← Back to Home” in the hero when not on home.

Use the shared `PageNav` component on all route-level pages (privacy, terms, trainer, admin).

---

## 3. Design system (miniapp)

- **Tokens:** `globals.css` defines `--bg-deep`, `--bg-panel`, `--metal-*`, `--accent-gold`, `--text-primary`, `--radius-*`, `--android-space-*`, `--shadow-3d-card`, etc.
- **Cards:** `.card`, `.card__title`, `.card__hint`, `.card--elevated` for panels; left border accent for emphasis.
- **Buttons:** `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--ghost`; use for actions; keep touch targets ≥ 48px where possible.
- **Nav:** `.page-nav`, `.page-nav__card`, `.page-nav__btn`, `.page-nav__link` for Back to Previous + Back to Home.

---

## 4. Multi-tabbed interfaces

- **Home grid** — Entry points to Brokers, Market, Racing, Guilds, Wallet, etc. Tapping a grid item or tab bar switches the active tab.
- **Tab panels** — One active panel per tab; use `.tab-panel`, `.is-active`, `aria-hidden` for accessibility.
- **Nested flows** — Within a tab (e.g. Wallet), use sub-tabs or card sections (Staking, DAO, Gifts) rather than replacing the whole screen when possible.

---

## 5. Implementation checklist

- [ ] New route page → include `PageNav` (Back to Previous + Back to Home).
- [ ] New tab in HomeContent → hero shows Back to Previous (tab) + Back to Home when not on home.
- [ ] New section → use card-based layout and design tokens.
- [ ] New component → reuse existing buttons, cards, and nav styles; avoid one-off inline styles for layout.

---

## See also

- [TELEGRAM-MINI-APP-UI-UX-AUDIT.md](TELEGRAM-MINI-APP-UI-UX-AUDIT.md) — Telegram-specific UX.
- [USER-GUIDE.md](USER-GUIDE.md) — How users move through tabs and features.
- `miniapp/src/app/globals.css` — Design tokens and card/button classes.
- `miniapp/src/components/PageNav.js` — Shared page navigation component.
