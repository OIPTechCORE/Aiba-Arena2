# Super Futuristic AIBA ARENA UNIVERSITY — Plan

This document defines the **AIBA ARENA UNIVERSITY**: a dedicated learning hub inside the miniapp where users learn how to play, master arenas and economy, and excel. Super futuristic (glass-and-glow) UX aligned with the rest of the app.

---

## 1. Vision

- **University** = one place for all learning: courses, modules, best practices, and optional certifications.
- **Super Futuristic** = glass cards, cyan/gold glow, expandable “courses” and “modules,” clear hierarchy.
- **In-app** = no external links required for core content; optional “Read more” to docs or Telegram.

---

## 2. Structure

| Level | Description |
|-------|-------------|
| **University** | Single tab/section in the miniapp. |
| **Course** | Top-level track (e.g. “Getting Started”, “Arenas & Modes”, “Economy”, “Guilds & Social”, “Pro Tips”). |
| **Module** | One lesson inside a course (title + body text). Expandable/collapsible. |
| **Optional** | “Graduate” badge or progress (e.g. completed modules) in a later phase. |

---

## 3. Courses (content outline)

| Course | Slug | Modules (short) |
|--------|------|------------------|
| **Getting Started** | getting-started | What is AIBA Arena; Brokers (stats, energy); Your first battle; Connect wallet & claim. |
| **Arenas & Modes** | arenas-modes | Prediction, Simulation, Strategy Wars; Leagues (rookie, pro, elite); Guild Wars. |
| **Economy** | economy | NEUR (earn & spend); AIBA credits & on-chain claim; Stars & Diamonds; Staking. |
| **Guilds & Social** | guilds-social | Create or join a guild; Guild Wars rewards; Groups leaderboard. |
| **Pro Tips** | pro-tips | Best practices; Energy & cooldowns; When to stake, mint NFT; Wall of Fame. |

Content can live in the **backend** (`GET /api/university/courses`) as JSON, or in the **miniapp** as constants. Backend allows future CMS or admin-editable courses.

---

## 4. Data & API

### Option A: Backend-driven

- **GET /api/university/courses** — returns list of courses; each course has `id`, `title`, `slug`, `modules` (array of `{ id, title, body }`). Order by `order` or array index.
- **Model (optional):** `UniversityCourse`, `UniversityModule` if content is stored in DB. For MVP, return static JSON from the route.

### Option B: Miniapp-only

- Courses and modules defined in miniapp (e.g. `UNIVERSITY_COURSES` constant). No backend. Fastest to ship.

### Choice for implementation

- **Backend:** `GET /api/university/courses` returning static JSON (no DB). Miniapp fetches on University tab open; if fetch fails, fallback to embedded static data in miniapp so it works offline/without backend.

---

## 5. Miniapp UX

| Element | Description |
|---------|-------------|
| **Tab** | “University” with graduation-cap (or book) icon. |
| **Hero** | “Super Futuristic AIBA ARENA UNIVERSITY. Learn, master, excel.” Glass card, cyan/gold glow. |
| **Course list** | Each course = one card (title, short description). Click to expand. |
| **Modules** | Inside expanded course: list of modules; each module expandable (title + body). |
| **Guide tip** | When tab is University: “Learn the game. Courses and modules right here.” |
| **Styling** | `.card--university`, `.university-hero`, `.university-course`, `.university-module` with border/glow. |

---

## 6. Implementation Steps

| Step | Layer | Action |
|------|--------|--------|
| 1 | Docs | Create this plan (done). |
| 2 | Backend | Add `GET /api/university/courses` returning static course/module JSON (no auth required, or requireTelegram). |
| 3 | Backend | Mount route in `app.js`: `/api/university`. |
| 4 | Miniapp | Add `IconUniversity` (graduation cap SVG). |
| 5 | Miniapp | Add “University” to `TAB_LIST`. |
| 6 | Miniapp | State: `universityCourses`, `expandedCourseId`, `expandedModuleKey` (e.g. `courseId-moduleId`). |
| 7 | Miniapp | Fetch courses on tab open; fallback to embedded static data if API fails. |
| 8 | Miniapp | University tab panel: hero + course cards; expand course → show modules; expand module → show body. |
| 9 | CSS | `.card--university`, `.university-hero`, `.university-course`, `.university-module`, `.university-module__body`. |
| 10 | Miniapp | Guide tip for `tab === 'university'`. |

---

## 7. Files to Touch

- **docs/AIBA-ARENA-UNIVERSITY-PLAN.md** — this doc.
- **backend/routes/university.js** — `GET /api/university/courses` (static JSON).
- **backend/app.js** — `app.use('/api/university', require('./routes/university'))`.
- **miniapp/src/app/page.js** — IconUniversity, TAB_LIST, state, fetch, University tab panel (hero + courses/modules).
- **miniapp/src/app/globals.css** — University card and module styling.

---

## 8. Optional (later)

- **Progress:** Track “completed” modules per user (backend + miniapp).
- **Badge:** “University Graduate” or “CoE Graduate” in profile when all modules completed.
- **Admin:** Edit courses/modules via admin panel (store in DB, serve from API).

This plan delivers a **Super Futuristic AIBA ARENA UNIVERSITY** as a dedicated in-app learning hub with courses and expandable modules, glass-and-glow styling, and optional backend-driven content.

---

## 9. Implementation Done

| Item | Status |
|------|--------|
| Plan doc | Done — this file. |
| Backend `GET /api/university/courses` | Done — static JSON (5 courses, multiple modules each). |
| Backend mount `/api/university` | Done — in `app.js`. |
| Miniapp tab “University” | Done — IconUniversity, TAB_LIST, state, fetch on tab open. |
| Miniapp hero + expandable courses/modules | Done — hero card, course cards, expand course → modules, expand module → body. |
| Guide tip for University tab | Done — “Learn the game. Courses and modules right here.” |
| CSS | Done — `.card--university`, `.university-hero`, `.university-course`, `.university-module`, etc. |

**Files touched:** `docs/AIBA-ARENA-UNIVERSITY-PLAN.md`, `backend/routes/university.js`, `backend/app.js`, `miniapp/src/app/page.js`, `miniapp/src/app/globals.css`.

---

## 10. Deep completion (A. Courses, B. Progress, C. Badge, D. Admin)

| Item | Implementation | Status |
|------|-----------------|--------|
| **A. UNIVERSITY_COURSES** | Backend `/courses` returns `{ courses, totalModules }`. Courses are complete (5 courses, 18 modules). Miniapp uses `courses` and `totalModules` for progress display. | **Done** |
| **B. PROGRESS** | `UniversityProgress` model (telegramId, completedKeys[], graduatedAt). `GET /api/university/progress` and `POST /api/university/progress` (body: courseId, moduleId). Miniapp fetches progress on University tab; when user expands a module, POST marks it complete and refreshes progress. Progress shown in hero (X / Y modules). | **Done** |
| **C. BADGE** | When all modules are completed, backend adds `university_graduate` to `User.badges`. Miniapp `BADGE_LABELS.university_graduate` and Profile/Wallet show the badge. | **Done** |
| **D. ADMIN** | `GET /api/admin/university/stats`, `GET /api/admin/university/courses`, `GET /api/admin/university/graduates`. Admin panel “University” tab: stats (graduates, progress count, total modules), courses (read-only), graduates list. | **Done** |

**Deep completion implementation:** Backend `backend/routes/university.js` (courses, progress, badge award, mint-course-badge, mint-full-certificate), `backend/models/UniversityProgress.js`, `backend/routes/adminUniversity.js`. Miniapp: University tab with hero progress (X / Y modules), expandable courses/modules, POST progress on expand; Wallet/Profile show `university_graduate` badge. Admin panel: University tab with stats, courses, graduates list.
