# Unified Super Futuristic Communications Ecosystem

This document defines the **Unified Super Futuristic Communications Ecosystem** for AIBA Arena: one coherent layer for notifications, announcements, support, and community so users stay informed, connected, and engaged.

---

## 1. Vision

- **Unified**: One place for all user-facing communication — in-app feed, Telegram push, status, and support. No scattered channels.
- **Super Futuristic**: Glass-and-glow UI, TON/Telegram-native feel, clear hierarchy (announcements, status, FAQ).
- **For Users**: Users see updates, get push notifications for key events (battle win, Stars, Diamonds), check system status, and find help in one flow.

---

## 2. Principles

| Principle | Description |
|-----------|-------------|
| **Single source of truth** | Announcements and status live in the backend; miniapp and Telegram both consume them. |
| **Re-engagement** | Timely Telegram notifications (battle win, optional announcement broadcast) bring users back. |
| **Transparency** | Status (operational / maintenance) and announcements build trust. |
| **Scalable support** | In-app FAQ and status reduce "where do I ask?"; optional link to support channel. |

---

## 3. Channels

| Channel | Purpose | Implementation |
|---------|---------|----------------|
| **In-app feed** | Announcements, maintenance notices, tips. | "Updates" tab in miniapp; `GET /api/announcements`. |
| **Telegram push** | Battle win (existing), optional broadcast for critical announcements. | `telegramNotify.notifyBattleWin`, `notifyAnnouncement`; admin "Broadcast" action. |
| **System status** | Operational / maintenance. | `GET /api/health` or `GET /api/comms/status`; shown in Updates tab. |
| **Support / FAQ** | Short FAQ in-app; optional link to Telegram support group. | Static block in Updates tab; optional `supportLink` in config. |

---

## 4. Data & API

### Announcements

- **Model**: `Announcement` — title, body, type (`announcement` \| `maintenance` \| `status`), active, publishedAt, link (optional), priority.
- **Public**: `GET /api/announcements?limit=20` — active, published, sorted by publishedAt desc.
- **Admin**: `GET/POST/PATCH/DELETE /api/admin/announcements`, plus `POST /api/admin/announcements/:id/broadcast` (send to all users via Telegram).

### Status

- **Endpoint**: `GET /api/health` returns `{ ok: true }`; optional `GET /api/comms/status` returns `{ status: 'operational', updatedAt }` for display.

### Notifications (existing + new)

- **Existing**: Battle win → `notifyBattleWin(telegramId, { score, arena, rewardAiba, rewardNeur, starsGranted, firstWinDiamond })`.
- **New**: `notifyAnnouncement(telegramId, { title, body, link })` — used by admin broadcast.

---

## 5. Miniapp UX

- **Updates tab** (new): Icon = megaphone or inbox; label = "Updates".
  - **System status**: One line (e.g. "All systems operational" with green dot).
  - **Announcements feed**: Cards (title, date, body snippet, optional link); glass-and-glow style.
  - **FAQ / Support**: Collapsible or short list (e.g. "How do I earn Stars?", "Where is my AIBA?") + optional "Contact support" link.
- **Guide tip**: When tab is Updates, show tip like "Stay informed. Announcements and status here."

---

## 6. Phased Roadmap

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **1** | Vision doc, Announcement model, public + admin APIs, notifyAnnouncement + broadcast | Done |
| **2** | Miniapp Updates tab: feed, status, FAQ block; Admin Comms tab | Done |
| **3** | Optional: read/unread per user, or "last seen" announcement id | Future |
| **4** | Optional: in-app support form or Telegram deep-link to support group | Future |

---

## 7. Files Touched

- **docs/UNIFIED-COMMS-ECOSYSTEM.md** — this doc.
- **backend/models/Announcement.js** — schema (title, body, type, link, active, publishedAt, priority).
- **backend/routes/announcements.js** — `GET /api/announcements` (public feed).
- **backend/routes/adminAnnouncements.js** — GET/POST/PATCH/DELETE + `POST /:id/broadcast`.
- **backend/services/telegramNotify.js** — `notifyAnnouncement(telegramId, { title, body, link })`.
- **backend/app.js** — mount `/api/announcements`, `/api/admin/announcements`; `GET /api/comms/status`.
- **miniapp/src/app/page.js** — Updates tab (IconUpdates), feed, system status, FAQ; TAB_LIST.
- **miniapp/src/app/globals.css** — `.card--comms-status`, `.comms-status-dot`, `.comms-feed`, `.comms-faq`.
- **admin-panel/src/app/page.js** — Comms tab: list announcements, create form, Broadcast to Telegram.

This keeps the ecosystem **unified** (one feed, one status, one notification layer), **super futuristic** (glass-and-glow, clear hierarchy), and **user-first** (re-engagement, transparency, support).
