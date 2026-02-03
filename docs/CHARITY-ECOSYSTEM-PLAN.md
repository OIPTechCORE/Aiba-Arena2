# Unified Super Futuristic Charity Ecosystem — Deep Plan

This document plans a **unified, super, futuristic charity ecosystem** inside the AIBA Arena project. The ecosystem integrates with existing economy (NEUR/AIBA), DAO, Treasury, guilds, and marketplace to create one coherent “play → earn → give” loop with full transparency and a futuristic UX.

---

## 1. Vision & Principles

### 1.1 Unified
- **Single charity layer** across the app: one “Charity” surface (tab + admin) for all giving.
- **One token flow**: NEUR and AIBA earned in-game can be donated without leaving the ecosystem; optional TON for external donors.
- **One source of truth**: Campaigns, donations, and disbursements are tracked in one place and can be audited (public donation ledger, campaign totals).
- **Unified with existing features**:
  - **Treasury**: Charity campaigns can hold pooled NEUR/AIBA in a dedicated Charity Treasury (or per-campaign pools); DAO can vote to allocate main Treasury to charity.
  - **DAO**: Proposal type `charity_payout` to send Treasury (or Charity Treasury) to an approved campaign beneficiary.
  - **Guilds**: Optional “Guild charity pool” — guild can allocate a % of vault or create a guild-sponsored campaign.
  - **Marketplace**: Optional “Donate X% of sale to campaign” at list time.
  - **Battles**: Optional “Round up for charity” — user opts in to donate a % of each battle reward to a selected campaign.

### 1.2 Super
- **Transparency**: Every donation is recorded (donor, amount, campaign, time). Campaign pages show live progress (goal vs raised), donor count, and recent donations.
- **Impact metrics**: Global stats — total NEUR/AIBA/TON raised, number of campaigns, number of donors, “impact score” (e.g. NEUR + AIBA normalized).
- **Recognition**: Charity leaderboard (top donors by amount or impact score); optional badges or titles (“Champion”, “Guardian”) for tiers.
- **Flexible giving**: Donate NEUR or AIBA from in-app balance; optional TON to a campaign’s TON wallet for external/on-chain transparency.
- **Campaign lifecycle**: Draft → Active → Ended → Funded → Disbursed; admin or DAO controls transitions and payouts.

### 1.3 Futuristic
- **UI**: Glass cards, gradient progress rings, “cause” tags with accent colors, holographic progress bars, subtle motion on campaign cards.
- **Copy & tone**: “Impact”, “Cause”, “Unite for Good”, “Donate”, “Campaign”, “Raised”, “Donors”.
- **Icons**: Heart, hand, globe, spark (impact); consistent with existing icon set (stroke, 24×24).
- **Experience**: Charity tab feels like a “mission control” for good — campaign cards with clear goals, one-tap donate, and instant feedback (thank-you + updated total).

### 1.4 Charity
- **Campaigns** represent causes (e.g. Education, Environment, Health, Emergency). Each has a goal (NEUR and/or AIBA, optional TON), end date, beneficiary (TON address or “treasury” for off-chain payout).
- **Donations** are voluntary; no gameplay penalty. Optionally, small soft rewards (e.g. badge, leaderboard) to encourage participation.
- **Disbursement**: When a campaign is funded/ended, funds are sent to the beneficiary (via DAO execute to TON, or admin-triggered off-chain payout from Charity Treasury).

---

## 2. Core Concepts

### 2.1 Campaign
- **Identity**: `name`, `slug` (optional, for URLs), `description`, `cause` (tag: e.g. `education`, `environment`, `health`, `emergency`, `community`).
- **Goals**: `goalNeur`, `goalAiba` (optional; 0 = no goal or “open” goal). Optional `goalTonNano` for TON.
- **Beneficiary**: `beneficiaryTonAddress` (for TON payouts) and/or `beneficiaryType: 'treasury' | 'external'` (treasury = we hold and DAO pays out; external = we record and optionally forward).
- **Lifecycle**: `status: 'draft' | 'active' | 'ended' | 'funded' | 'disbursed'`; `startAt`, `endAt`; `disbursedAt` when payout is done.
- **Pool**: Track `raisedNeur`, `raisedAiba` on the campaign (or in a separate CharityPool per campaign). Optional `raisedTonNano` if we verify TON donations.
- **Visibility**: `featured` (boolean), `order` (for listing). Admin can pin campaigns.

### 2.2 Donation
- **Who**: `telegramId` (donor).
- **What**: `campaignId`, `amountNeur`, `amountAiba` (one or both; at least one > 0).
- **When**: `donatedAt` (Date).
- **Optional**: `message` (public thank-you note), `anonymous` (boolean; if true, donor not shown in public leaderboard).
- **Idempotency**: For TON donations, `txHash` so same tx is not counted twice.
- **Source**: `source: 'balance' | 'ton' | 'round_up' | 'marketplace'` for analytics (balance = user clicked Donate; round_up = battle round-up; marketplace = % of sale).

### 2.3 Charity Treasury (optional but recommended)
- **Purpose**: Single off-chain pool that holds NEUR/AIBA collected for charity (from donations and optionally from round-up / marketplace %).
- **Model**: Either extend `Treasury` with `charityBalanceNeur`, `charityBalanceAiba` or a dedicated `CharityTreasury` document. Campaigns can be “pooled” (donations go to Charity Treasury and are then allocated to campaigns by admin/DAO) or “direct” (donations increase campaign’s own raisedNeur/raisedAiba and we track separately).
- **Simpler approach**: Each campaign has `raisedNeur`, `raisedAiba`; when user donates, we debit user and credit campaign (no separate Charity Treasury). When campaign is disbursed, we debit campaign pool and send to beneficiary (DAO execute or admin). So “pool” is virtual (sum of campaign raised) until disbursement.

### 2.4 Impact & Leaderboard
- **Donor impact score**: e.g. `impactScore = donatedNeur + (donatedAiba * k)` where k is a config constant (e.g. 10) so NEUR and AIBA are comparable. Or separate leaderboards: by NEUR, by AIBA, by total donations count.
- **Charity leaderboard**: Top donors (all-time or per campaign), optional “top this month”. Respect `anonymous` (exclude or show as “Anonymous”).

---

## 3. Data Models (Backend)

### 3.1 CharityCampaign
```js
{
  name: String,           // required
  description: String,
  cause: String,          // enum or tag: education, environment, health, emergency, community
  goalNeur: Number,       // 0 = no goal
  goalAiba: Number,       // 0 = no goal
  goalTonNano: Number,    // optional
  raisedNeur: Number,     // default 0
  raisedAiba: Number,     // default 0
  raisedTonNano: Number,  // optional, if we verify TON
  donorCount: Number,     // default 0 (unique donors)
  status: String,         // draft | active | ended | funded | disbursed
  beneficiaryTonAddress: String,  // for TON payout
  beneficiaryType: String,        // 'treasury' | 'external'
  startAt: Date,
  endAt: Date,
  disbursedAt: Date,
  featured: Boolean,
  order: Number,
  createdBy: String,       // admin telegramId or 'system'
}
```

### 3.2 CharityDonation
```js
{
  campaignId: ObjectId,   // ref CharityCampaign
  telegramId: String,
  amountNeur: Number,     // default 0
  amountAiba: Number,     // default 0
  amountTonNano: Number,   // optional
  source: String,         // 'balance' | 'ton' | 'round_up' | 'marketplace'
  message: String,
  anonymous: Boolean,
  txHash: String,         // for TON idempotency
  donatedAt: Date,
}
```
Indexes: `campaignId`, `telegramId`, `donatedAt`; compound for leaderboard queries.

### 3.3 EconomyConfig additions
- `charityRoundUpPercent: Number` (0 = off; e.g. 5 = 5% of battle reward rounded to charity).
- `charityMarketplacePercentMax: Number` (max % seller can assign to charity per listing; 0 = feature off).
- `charityImpactAibaMultiplier: Number` (e.g. 10 — 1 AIBA = 10 “impact points” for leaderboard).

### 3.4 User (optional)
- `charityImpactScore: Number` (cached total impact for leaderboard) or compute on read from CharityDonation.

---

## 4. API Design

### 4.1 Public / Authenticated
- `GET /api/charity/campaigns` — List campaigns (status active or ended; optional ?featured=1, ?cause=education). Returns name, cause, goalNeur, goalAiba, raisedNeur, raisedAiba, donorCount, endAt, status, featured.
- `GET /api/charity/campaigns/:id` — One campaign + recent donations (optional, anonymized if anonymous).
- `POST /api/charity/donate` — Body: `campaignId`, `amountNeur`, `amountAiba` (at least one > 0), optional `message`, `anonymous`. Debit user (LedgerEntry), credit campaign (raisedNeur/raisedAiba), create CharityDonation. Idempotency: optional `requestId`.
- `POST /api/charity/donate-ton` — Body: `campaignId`, `txHash`. Verify TON tx to campaign’s `beneficiaryTonAddress` (or a shared charity TON wallet); credit campaign’s raisedTonNano and donorCount; create CharityDonation with source 'ton'. Idempotency: txHash.
- `GET /api/charity/leaderboard` — Query: ?by=neur|aiba|impact|count, ?campaignId=, ?limit=. Returns list of { telegramId (or 'anonymous'), amountNeur, amountAiba, impactScore, rank }.
- `GET /api/charity/my-impact` — Current user’s total donated (NEUR, AIBA, impact score) and optional per-campaign breakdown.
- `GET /api/charity/stats` — Global: totalRaisedNeur, totalRaisedAiba, totalDonors, campaignCount, activeCampaignCount.

### 4.2 Admin
- `GET /api/admin/charity/campaigns` — List all campaigns (any status).
- `POST /api/admin/charity/campaigns` — Create campaign (name, description, cause, goals, beneficiary, startAt, endAt, featured, order).
- `PATCH /api/admin/charity/campaigns/:id` — Update campaign (e.g. status, endAt, featured).
- `POST /api/admin/charity/campaigns/:id/close` — Set status to ended (or funded if goals met).
- `POST /api/admin/charity/campaigns/:id/disburse` — Disburse: create DAO proposal (charity_payout) or trigger payout from Treasury to beneficiary. Or mark as disbursed and record disbursedAt (actual TON send might be manual or via existing DAO execute).
- `GET /api/admin/charity/donations` — List donations (filter by campaignId, telegramId, date range) for transparency/audit.
- `GET /api/admin/charity/stats` — Same as public stats + breakdown by campaign.

### 4.3 Integration hooks (existing routes)
- **Battle**: After battle reward is applied, if user has “round up for charity” enabled and selected campaign, debit `roundUpNeur`/`roundUpAiba` from user and credit campaign (and create CharityDonation with source 'round_up'). Requires user preference: `charityRoundUpCampaignId`, `charityRoundUpEnabled` (stored in User or client only).
- **Marketplace**: On list, optional `charityCampaignId`, `charityPercent`. On sale, that % of seller’s proceeds is debited and credited to campaign (CharityDonation source 'marketplace').
- **DAO**: New proposal type `charity_payout`: same as treasury_payout but with optional `campaignId` and narrative “Disburse campaign X to beneficiary”. Execute sends from Treasury (or Charity Treasury) to beneficiary.

---

## 5. Miniapp UI (Futuristic)

### 5.1 New tab: Charity
- **Placement**: Add “Charity” to tab bar (e.g. between Market and Wallet or after Wallet). Icon: heart or hand (futuristic stroke style).
- **Sections** (in one scroll or sub-sections):
  1. **Impact headline** — “Unite for Good” or “Community Impact”; global stats (total raised, donors, active campaigns) in glass cards with gradient accents.
  2. **Featured / Active campaigns** — Card per campaign: cause tag, name, progress ring or bar (raised / goal), donor count, “Donate” button. Tapping opens campaign detail or inline donate (amount input + NEUR/AIBA toggle + optional message + anonymous checkbox).
  3. **My impact** — “You’ve donated X NEUR, Y AIBA” and impact score; link to leaderboard.
  4. **Leaderboard** — Top donors (by NEUR, AIBA, or impact); optional filter by campaign. Anonymous donors shown as “Anonymous”.
  5. **Recent donations** (optional) — Feed of “User X donated N NEUR to Campaign Y” (anonymized if needed).

### 5.2 Campaign card (futuristic)
- Glass card, border-left gradient (cause color).
- Progress: circular or linear bar (raised/goal) with glow.
- Cause tag: pill with icon.
- CTA: “Donate” (primary button) → modal or inline: amount (NEUR / AIBA), optional message, anonymous; confirm.
- After donate: toast or inline “Thank you! Raised total updated.”

### 5.3 Settings / Battle flow (optional)
- In Wallet or Home: “Round up for charity” toggle + campaign selector (if round-up feature is on). When enabled, after each battle a small % is auto-donated to selected campaign.

### 5.4 Copy
- Tab: “Charity” or “Impact”.
- Headline: “Unite for Good” / “Community Impact”.
- Buttons: “Donate”, “Donate NEUR”, “Donate AIBA”.
- Empty state: “No active campaigns yet. Check back soon.”

---

## 6. Admin Panel

### 6.1 Charity section
- **Tab: Charity** (or under Economy).
- **Campaigns**: List all; Create (form: name, description, cause, goalNeur, goalAiba, beneficiary, dates, featured); Edit; Close; Disburse.
- **Donations**: Table (campaign, donor, amount, date, source) with export option.
- **Stats**: Total raised (NEUR, AIBA), donor count, per-campaign breakdown.

### 6.2 Economy config (existing)
- Add to Economy JSON (and allowedTopLevel): `charityRoundUpPercent`, `charityMarketplacePercentMax`, `charityImpactAibaMultiplier`.

---

## 7. Transparency & Trust

- **Public donation list per campaign**: Last N donations (amount, date; donor as “User” or “Anonymous”) so anyone can verify.
- **Global stats**: Visible in app and optionally on a public page (total raised, number of campaigns, number of donors).
- **Disbursement**: When a campaign is disbursed, record disbursedAt and optionally a tx hash or “Disbursed to [address]” so donors see the outcome.
- **DAO-driven payouts**: For treasury-funded charity payouts, DAO vote creates accountability (proposal + execute).

---

## 8. Phased Implementation

### Phase 1 — MVP (Unified core)
- Models: `CharityCampaign`, `CharityDonation`.
- Routes: GET campaigns (list, one), POST donate (NEUR/AIBA from balance), GET leaderboard, GET my-impact, GET stats.
- Admin: Create/edit campaign, list donations, close campaign.
- Miniapp: Charity tab with campaign list, progress, Donate (NEUR/AIBA), leaderboard, my impact.
- EconomyConfig: no new fields yet (no round-up, no marketplace %).

### Phase 2 — Disbursement & DAO
- Campaign status flow: active → ended → disbursed.
- Admin: Disburse (create DAO proposal type `charity_payout` or direct payout from Treasury).
- DAO: Support `charity_payout` in execute (send to campaign beneficiary).
- Optional: TON donation (POST donate-ton, verify tx, credit campaign).

### Phase 3 — Integrations
- User preference: round up for charity (campaign selector). Battle flow: after reward, debit round-up, credit campaign, create donation.
- EconomyConfig: `charityRoundUpPercent`, `charityImpactAibaMultiplier`.
- Marketplace: optional `charityCampaignId` + `charityPercent` on list; on sale, credit campaign.

### Phase 4 — Guild & polish
- Guild charity pool: optional field on Guild (e.g. `charityCampaignId` or `charityPercentOfVault`); when guild earns, a slice goes to campaign. Or simple: “Guild X supports Campaign Y” (display only; donations still user-level).
- Badges/titles for top donors (e.g. “Champion”, “Guardian”) — optional User fields or computed from leaderboard.
- Public impact page (optional): standalone page with global stats and list of campaigns for sharing.

---

## 9. File & Route Summary (Implementation Checklist)

### Backend
- `models/CharityCampaign.js` — schema above.
- `models/CharityDonation.js` — schema above.
- `routes/charity.js` — GET campaigns, GET campaigns/:id, POST donate, GET leaderboard, GET my-impact, GET stats; POST donate-ton (phase 2).
- `routes/adminCharity.js` — GET/POST/PATCH campaigns, POST close, POST disburse, GET donations, GET stats.
- `engine/economy.js` or `engine/charity.js` — `donateToCampaign(telegramId, campaignId, amountNeur, amountAiba)` (debit user, credit campaign, create CharityDonation). Reuse LedgerEntry and existing debit/credit helpers where possible.
- `app.js` — mount `/api/charity`, `/api/admin/charity`.
- EconomyConfig: add fields in phase 3.
- Battle route: after battle reward, if round-up enabled, call donateToCampaign(..., source: 'round_up').
- Marketplace route: on buy, if listing had charityPercent + charityCampaignId, credit campaign.
- DAO: proposal type `charity_payout`; execute same as treasury_payout (recipient = campaign beneficiary or treasury payout to TON).

### Miniapp
- Tab: “Charity” + icon (e.g. IconHeart).
- Panel: impact headline, campaign cards, donate flow, my impact, leaderboard.
- Reuse existing card, button, input, guide-tip styles from globals.css.

### Admin
- Tab: Charity. Campaign CRUD, list donations, close/disburse, stats.
- Economy JSON: allow new charity fields when phase 3.

---

## 10. Benefits for Project Owners

As **project owners**, you benefit from this unified, super, futuristic charity ecosystem in concrete ways:

### 10.1 Brand & Reputation
- **Positive positioning**: The project is seen as “play → earn → give” — not just another game or DeFi app. Charity becomes a core part of the story.
- **Trust**: Public donation ledger, campaign progress, and DAO-driven disbursements show you’re serious about transparency. That builds trust with users and partners.
- **Storytelling**: You have clear narratives for marketing and partnerships: “X NEUR raised for Education,” “Y donors in 30 days,” “Community chose this cause via DAO.”

### 10.2 User Engagement & Retention
- **Stickiness**: Charity tab, leaderboards, and “my impact” give users another reason to open the app and return (check campaigns, donate, see rank).
- **Emotional connection**: Giving creates attachment. Users who donate are more likely to stay and invite others.
- **Soft rewards**: Donor recognition (leaderboard, badges) costs little but increases participation and social proof.

### 10.3 Token & Ecosystem Utility
- **NEUR/AIBA use cases**: In-game tokens get a non-speculative use (donate to causes). That supports “utility” narratives and can help with regulatory and community optics.
- **Flow through your stack**: Donations stay in your economy until disbursement — you control the flow, reporting, and optional fees (if you ever take a small % for operations, it’s configurable and transparent).

### 10.4 Differentiation
- **Stand out**: Few mini-apps combine battles, brokers, guilds, marketplace, DAO, and a full charity layer. This makes the project memorable and shareable.
- **“Futuristic” angle**: Glass UI, impact metrics, and mission-control charity UX support a premium, forward-looking brand.

### 10.5 Governance & Treasury
- **DAO relevance**: Charity payouts give the DAO a clear, high-signal use case (vote to disburse to a cause). More meaningful votes → more engaged governance.
- **Treasury narrative**: You can allocate part of the Treasury to charity (via proposals), showing the community that the project shares value with the world.

### 10.6 Compliance & Optics
- **Voluntary, transparent**: Donations are opt-in and recorded. No hidden mechanics; easier to explain to regulators and partners.
- **Impact metrics**: You can report “total raised,” “number of donors,” “campaigns funded” in reports, decks, and audits.

**In short**: You get **stronger brand**, **higher engagement**, **more token utility**, **clear differentiation**, **better DAO usage**, and **cleaner compliance storytelling** — all from one unified charity layer that fits your existing economy, DAO, guilds, and marketplace.

---

## 11. Success Metrics

- **Adoption**: Number of donors, number of donations per month, % of active users who donated at least once.
- **Volume**: Total NEUR/AIBA (and TON if applicable) raised per campaign and globally.
- **Trust**: Public donation list and disbursement records; DAO votes on charity payouts.
- **Engagement**: Repeat donors, leaderboard movement, round-up opt-in rate (if implemented).

---

This plan keeps the charity ecosystem **unified** (one layer, one tab, one admin), **super** (transparent, impactful, recognizable), **futuristic** (glass UI, progress rings, cause tags), and **charity-focused** (voluntary, campaign-based, clear disbursement). Implementation can follow the phased approach so MVP ships first and integrations (round-up, marketplace, DAO, TON) follow.
