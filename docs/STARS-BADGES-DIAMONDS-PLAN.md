# Stars, Profile Badges & Diamonds — Super Futuristic Plan

This document plans and defines the implementation of **Telegram Stars**, **Profile Badges** (X-style), and **Telegram/TON Diamonds** inside the AIBA Arena project, in a **super, futuristic** way aligned with the existing 3D glass UI and TON ecosystem.

---

## 1. Vision (Super Futuristic)

- **Stars** — Like Telegram Stars: in-app recognition and tips. Earned from battles and engagement; spent on tips, boosts, or charity. Displayed with a bold star icon and glow.
- **Profile Badges** — Like X (Twitter) profile badges: verified, early adopter, top donor, guild leader, etc. Shown as futuristic pill badges with distinct colors and icons next to usernames and in leaderboards.
- **Diamonds** — Premium TON/Telegram ecosystem asset: rare, high-value. Earned on first win and select achievements; used for premium perks or displayed as status. Futuristic diamond icon and premium styling.

All three integrate with the existing **modular, multi-tabbed, multi-card** miniapp UI and **balance strip** for a seamless, eye-catching experience.

---

## 2. Stars (Telegram Stars–Style)

### 2.1 Concept
- **Earn**: Every battle win grants configurable Stars (e.g. 1–5 per battle from EconomyConfig).
- **Display**: Balance strip + Wallet tab show Stars with a star icon and accent (e.g. gold/amber).
- **Spend** (future): Tips to other players, charity donations, or premium actions. (MVP: display and earn only.)
- **Backend**: `User.starsBalance` (number); `EconomyConfig.starRewardPerBattle`; after each battle, increment user's stars by config value.

### 2.2 Data
- **User**: `starsBalance: { type: Number, default: 0 }`
- **EconomyConfig**: `starRewardPerBattle: { type: Number, default: 1 }`
- **Economy /me**: Return `starsBalance` and `economy.starRewardPerBattle`

### 2.3 UI
- Balance strip: **★ Stars** value with futuristic star icon.
- Wallet tab: **Stars** card (glass, gradient border) — "Earn Stars from battles. Use for tips & perks."

---

## 3. Profile Badges (X-Style)

### 3.1 Concept
- **Types**: `verified`, `early_adopter`, `top_donor`, `guild_leader`, `top_leader`, `champion`, custom.
- **Assignment**: Admin assigns badges to users (telegramId + list of badge ids). Optional auto-award (e.g. top 10 leaderboard → `top_leader`).
- **Display**: Next to username in header, leaderboards, and a dedicated **Profile** identity card with all badges as futuristic pills/icons.

### 3.2 Data
- **User**: `badges: { type: [String], default: [] }` — e.g. `['verified', 'early_adopter']`
- **Admin**: `POST /api/admin/mod/user-badges` — body: `{ telegramId, badges: ['verified', 'top_donor'] }`
- **Economy /me**: Return `badges` array.

### 3.3 Badge Definitions (for UI)
| Id              | Label         | Color/Icon   |
|-----------------|---------------|--------------|
| verified        | Verified      | Cyan check   |
| early_adopter   | Early Adopter | Gold         |
| top_donor       | Top Donor     | Magenta      |
| guild_leader    | Guild Leader  | Green        |
| top_leader      | Top Leader    | Gold         |
| champion        | Champion      | Magenta      |

### 3.4 UI
- **Profile / Identity card** (Home or Wallet): Avatar placeholder, username, and badge pills (futuristic, with small icon per badge).
- Leaderboard rows: Optional badge icon next to username if user has badges.
- Balance strip or header: Optional small verified badge next to balance if user has `verified`.

---

## 4. Diamonds (Telegram/TON Ecosystem)

### 4.1 Concept
- **Earn**: First battle win ever grants configurable Diamonds (e.g. 1). Optional: high scores or achievements grant more.
- **Display**: Balance strip + Wallet tab with a diamond icon and premium (e.g. cyan/silver) styling.
- **Spend** (future): Premium features, exclusive arenas, or NFT mints. (MVP: display and earn on first win.)
- **Backend**: `User.diamondsBalance`, `User.firstWinDiamondAwardedAt`; `EconomyConfig.diamondRewardFirstWin`; in battle route, if first win and not yet awarded, increment diamonds and set flag.

### 4.2 Data
- **User**: `diamondsBalance: { type: Number, default: 0 }`, `firstWinDiamondAwardedAt: { type: Date, default: null }`
- **EconomyConfig**: `diamondRewardFirstWin: { type: Number, default: 1 }`
- **Economy /me**: Return `diamondsBalance` and `economy.diamondRewardFirstWin`

### 4.3 UI
- Balance strip: **◆ Diamonds** value with futuristic diamond icon.
- Wallet tab: **Diamonds** card — "Premium TON ecosystem asset. Earned on first win and achievements."

---

## 5. API Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| GET /api/economy/me | - | Adds `starsBalance`, `diamondsBalance`, `badges`; economy: `starRewardPerBattle`, `diamondRewardFirstWin` |
| POST /api/admin/mod/user-badges | Admin | Body: `{ telegramId, badges: [] }` — set user badges |

---

## 6. File Checklist

- **Backend**: User model (stars, diamonds, badges, firstWinDiamondAwardedAt); EconomyConfig (starRewardPerBattle, diamondRewardFirstWin); economy/me response; battle route (award stars + first-win diamond); admin economy PATCH (new keys); admin mod user-badges route.
- **Miniapp**: Balance strip (Stars, Diamonds); Profile/Identity card with badges; Wallet tab (Stars card, Diamonds card); futuristic icons for star and diamond.
- **Admin panel**: Economy config (star/diamond knobs); Mod or Users section (assign badges by telegramId).

---

## 7. Futuristic UX Principles

- **Consistency**: Same glass cards, gradient borders, and font system (Orbitron, Exo 2).
- **Icons**: Inline SVG star (★) and diamond (◆) in 24×24 stroke style; badge pills with small icons.
- **Copy**: "Stars", "Diamonds", "Profile badges", "Earn Stars from battles", "Premium TON asset."
- **Guidance**: Short hints under each card explaining how to earn and (later) spend.

This keeps Stars, Badges, and Diamonds **unified** with the rest of the app and **super futuristic** in look and feel.
