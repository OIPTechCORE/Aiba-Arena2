# Unified Super Futuristic Communications Ecosystem

This document defines the **Unified Super Futuristic Communications Ecosystem** for AIBA Arena: one coherent layer for notifications, announcements, support, and community so users stay informed, connected, and engaged.

---

## 1. Vision

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
|---------|---------|-----------------|
| **In-app feed** | Announcements, maintenance notices, tips. | Updates tab in miniapp; `GET /api/announcements`. |
| **Telegram push** | Battle win (existing), optional broadcast for critical announcements. | `telegramNotify.notifyBattleWin`, `notifyAnnouncement`; admin Broadcast action. |
| **System status** | Operational / maintenance. | `GET /health` (uptime; returns `{ ok: true }`) or `GET /api/comms/status` (returns `{ status, updatedAt }`); Updates tab uses comms/status. |
| **Support / FAQ** | Short FAQ in-app; optional link to Telegram support group. | Static block in Updates tab; optional `supportLink` in config. |

---

## 4. Data & API

### Announcements

- **Public**: `GET /api/announcements?limit=20` — active, published, sorted by publishedAt desc. Returns `{ items[], unreadCount }` (items = announcements; unreadCount = newer than user's `lastSeenAnnouncementId`).
- **Mark as read (Phase 3)**: `POST /api/announcements/seen` — Body: `{ announcementId }`. Updates user's `lastSeenAnnouncementId`.
- **Admin**: `GET/POST/PATCH/DELETE /api/admin/announcements`, plus `POST /api/admin/announcements/:id/broadcast` (send to all users via Telegram).

### Status

- **`GET /api/comms/status`** — Returns `{ status: "operational", updatedAt }`.
- **`GET /api/comms/config`** — Returns `{ supportLink, supportTelegramGroup }` (Phase 4; configurable in Admin → Economy).

### Support (Phase 4)

- **`POST /api/support/request`** — Body: `{ subject, message }`. User submits support request; admins view in Admin → Support.
- **subject** must be one of: `question`, `bug`, `feature`, `account`, `other` (case-insensitive; invalid → `other`).
- Config: `supportLink`, `supportTelegramGroup` in EconomyConfig (Admin → Economy).

---

## 5. Miniapp UX

- **System status**: One line (e.g. "All systems operational" with green dot). Card `card--comms-status`; dot `comms-status-dot`.
- **Announcements feed**: Cards (title, date, body snippet, optional link); glass-and-glow style (`comms-feed`, `comms-feed__item`). Read/unread indicator (Phase 3): "New" badge on first unread; tab bar shows unread count badge on Updates when `unreadCount` > 0. Click to mark as read (`POST /api/announcements/seen`).
- **FAQ / Support**: Collapsible FAQ block (native `<details>`/`<summary>`, `.comms-faq__item`) + in-app support form (Phase 4) with subject (question, bug, feature, account, other) + message. When `supportLink` or `supportTelegramGroup` configured (comms/config), display "Open support channel" and/or Telegram link above the form.
- **Guide tip**: When tab is Updates, show tip "Stay informed. Announcements, status & support here."

---

## 6. Phased Roadmap

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **1** | Vision doc, Announcement model, public + admin APIs, notifyAnnouncement + broadcast | Done |
| **2** | Miniapp Updates tab: feed, status, FAQ block; Admin Comms tab | Done |
| **3** | Read/unread per user via `lastSeenAnnouncementId`; `POST /api/announcements/seen` | **Done** |
| **4** | In-app support form (`POST /api/support/request`) + `GET /api/comms/config` (supportLink, supportTelegramGroup) | **Done** |

---

## 7. Files Touched

- **backend/models/Announcement.js** — schema (title, body, type, link, active, publishedAt, priority).
- **backend/models/User.js** — `lastSeenAnnouncementId` (Phase 3).
- **backend/models/SupportRequest.js** — support requests (Phase 4).
- **backend/models/EconomyConfig.js** — `supportLink`, `supportTelegramGroup` (Phase 4).
- **backend/routes/announcements.js** — `GET /api/announcements` (public feed + unreadCount), `POST /api/announcements/seen`.
- **backend/routes/adminAnnouncements.js** — GET/POST/PATCH/DELETE + `POST /:id/broadcast`.
- **backend/routes/comms.js** — `GET /api/comms/status`, `GET /api/comms/config`.
- **backend/routes/support.js** — `POST /api/support/request`.
- **backend/routes/adminSupport.js** — `GET /api/admin/support`, `PATCH /api/admin/support/:id`.
- **backend/services/telegramNotify.js** — `notifyAnnouncement(telegramId, { title, body, link })`.
- **backend/app.js** — mount `/api/announcements`, `/api/admin/announcements`, `/api/comms`, `/api/support`, `/api/admin/support`.
- **miniapp** — Updates tab: feed, status, support form, read/unread.
- **admin-panel** — Comms tab; Admin → Support for requests.
