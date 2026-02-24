# AIBA Arena — User Guide

This guide walks you through **how to play** AIBA Arena: from opening the app to earning NEUR and AIBA, withdrawing AIBA to your TON wallet, and using every tab and feature. **Nothing is omitted.**

## Android UI/UX rollout navigation (Phase 1–4)

| Phase       | UI label                                                             | Primary docs                                         |
| ----------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| **Phase 1** | **Fast Win — Android UI/UX shell (top app bar + sticky bottom nav)** | `USER-GUIDE.md`, `TELEGRAM-MINI-APP-UI-UX-AUDIT.md`  |
| **Phase 2** | **Home + Tasks card redesign (spacing, typography, button sizing)**  | `USER-GUIDE.md`, `TESTING.md`                        |
| **Phase 3** | **Market + Racing flow redesign (sheet-style detail views)**         | `FEATURE-PLANS.md`, `USER-GUIDE.md`, `TESTING.md`    |
| **Phase 4** | **Component system cleanup + theming + QA pass**                     | `AUDIT-AND-STATUS.md`, `TESTING.md`, `OPERATIONS.md` |

Use this phase table first, then continue with the full user guide below.

---

## What is AIBA Arena?

**AIBA Arena** is a **Telegram Mini App** where you own **brokers** (AI trading agents with stats), enter **arenas** (prediction, simulation, strategy wars, guild wars) and **leagues** (rookie, pro, elite), and run **battles**. The server simulates a deterministic match; you get a **score** and earn **NEUR** (off-chain) and **AIBA** (off-chain credits withdrawable on-chain as jettons). Core loop: pick broker → choose arena → run battle → earn rewards → optionally withdraw AIBA to your TON wallet. Supporting features: guilds, referrals, marketplace, car/bike racing, university, charity, multiverse (NFT/stake), governance. See **FEATURE-PLANS.md** for high-level feature design; **DEPLOYMENT-AND-ENV.md** and **OPERATIONS.md** for deployment and ops.

---

### Contents

1. Opening the Game
2. How the App Is Organized (Tabs)
3. Connect Your Wallet
4. Get Your First Broker
5. Choose Arena and Run a Battle
6. Balances (NEUR, AIBA, Stars, Diamonds)
7. Guilds (Groups)
8. Withdrawing AIBA to Your Wallet (On-Chain Claim)
9. Super Futuristic Unified Marketplace (Create Broker, List, Buy, Boosts)
10. Boost your profile
11. Gifts
12. Referrals
13. Brokers Tab: Combine and Mint as NFT
14. NFT Multiverse (Own, Stake, Earn)
15. Leaderboard
16. Charity (Unite for Good)
17. University
18. Updates (Announcements)
19. Wallet Tab (Full Picture)
20. Ads and Tasks
21. Vault Inventory
22. Troubleshooting
23. Quick Checklist (First Session)

---

## 1. Opening the Game

- **Where:** AIBA Arena runs as a **Telegram Mini App**. Open it from a link or bot inside Telegram (e.g. from the project’s bot or a shared link).
- **Requirements:** Telegram account; optionally a TON wallet (TonConnect) if you want to withdraw AIBA on-chain.
- **First time:** You may see a **cinematic intro** (skip or watch) and a **tutorial** (steps for brokers, arena, battle). The app has a **Home** grid and tab bar: **Brokers**, **Market**, **Car Racing**, **Bike Racing**, **Multiverse**, **Arenas**, **Guilds**, **Charity**, **University**, **Updates**, **Wallet**, **DAO**, **Governance**, **Trainers**, etc. Tap a grid item or tab to switch. A **balance strip** at the top shows NEUR, AIBA credits, Stars, Diamonds, and a verified badge if you have one.

---

## 2. How the App Is Organized (Tabs)

| Tab                                      | What’s there                                                                                                                                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Home**                                 | TonConnect, Vault info, Arena & battle (pick broker, arena, Run battle), Battle result, Referrals, Leaderboard.                                                                                                                                                          |
| **Brokers**                              | My brokers (select, combine two for NEUR, mint one as NFT for AIBA).                                                                                                                                                                                                     |
| **Super Futuristic Unified Marketplace** | Brokers, assets, rentals, system shop, boosts. Create broker with TON; list/buy with AIBA.                                                                                                                                                                               |
| **Car Racing**                           | Autonomous car racing: tracks, races, my cars, create car (AIBA or TON), **list car for sale** or **buy** from players/system, enter race, leaderboard.                                                                                                                  |
| **Bike Racing**                          | Autonomous bike racing: tracks, races, my bikes, create bike (AIBA or TON), **list bike for sale** or **buy** from players/system, enter race, leaderboard.                                                                                                              |
| **Multiverse**                           | NFT universes, **My NFTs** (Broker NFTs you own), **stake** to earn AIBA daily, **claim** staking rewards. Mint Broker NFTs from the Brokers tab (pay AIBA).                                                                                                             |
| **Arenas**                               | Arena selector, Run battle, Battle result (score, rewards, Stars/Diamond).                                                                                                                                                                                               |
| **Guilds**                               | Groups (leaderboard rank, create or join, pay TON to create if not top N, boost group with TON), My groups, deposit/withdraw broker.                                                                                                                                     |
| **Charity**                              | Unite for Good: campaigns, donate NEUR or AIBA, your impact, charity leaderboard.                                                                                                                                                                                        |
| **University**                           | Courses and modules, progress, graduate badge, mint course badge / full certificate (pay TON).                                                                                                                                                                           |
| **Updates**                              | Announcements (read/unread), system status, in-app support form (subject + message).                                                                                                                                                                                     |
| **Wallet**                               | Profile & badges, Boost your profile (TON), Gifts (TON), Daily reward (NEUR), Vault, Staking (flexible + locked periods, min stake from config, cancel-early with fee), DAO (proposals, vote; create requires staked AIBA), on-chain claim, Stars & Diamonds.            |
| **Yield Vault**                          | Dedicated staking tab: hero shows **minimum stake** (e.g. 100 AIBA, ecosystem-aligned); locked + flexible staking both show and enforce min; periods (30/90/180/365d), reward preview, countdown, cancel-early (5% fee). Wallet tab staking flow shows the same minimum. |

---

## 3. Connect Your Wallet (Recommended)

- **Why:** Your TON address is used to:
    - Save your progress (linked to Telegram + wallet).
    - **Withdraw AIBA** on-chain: claims are tied to your wallet; you send one transaction to the vault to receive AIBA jettons.
- **How:**
    1. Tap **TonConnect** (or “Connect wallet”).
    2. Choose your TON wallet (e.g. Tonkeeper, Telegram Wallet).
    3. Approve the connection in the wallet.
- **Result:** The app shows “Wallet connected.” The backend stores your address for claims. If you don’t connect, you can still play and earn NEUR/AIBA credits, but you won’t be able to withdraw AIBA to the chain until you connect.

---

## 4. Get Your First Broker

- **What:** A **broker** is your in-game agent. Each has stats (Intelligence, Speed, Risk), level, energy, and cooldowns.
- **Steps:**
    1. Tap **Create starter broker**.
    2. Wait for “Refresh brokers” to finish (or tap it once).
    3. In **My brokers**, you should see one broker (e.g. “#… | INT 50 SPD 50 RISK 50 | energy 10”).
- **Tip:** You can have multiple brokers later; for now one is enough. Select it in the **My brokers** dropdown before every battle.

---

## 5. Choose Arena and Run a Battle

- **Arena:** In the **Arena** dropdown you can choose:
    - **prediction** — favors Intelligence.
    - **simulation** — more balanced.
    - **strategyWars** — more Risk.
    - **guildWars** — requires guild membership; rewards split with guild.
- **League:** The app typically uses **rookie** by default. Pro/elite may require higher broker level and cost more energy/cooldown.
- **Run a battle:**
    1. Select **one broker** in My brokers.
    2. Select **arena** (and league if shown).
    3. Tap **Run battle**.
    4. Wait a moment; you’ll see **Battle result** with **Score**, **Reward AIBA (credits)**, and **Reward NEUR**. On a win you also earn **Stars** (every win) and **one Diamond** on your **first ever** win.
- **Limits:**
    - **Energy:** Each battle costs energy (e.g. 10–20 per battle). Energy regenerates over time (e.g. 1 per minute, cap 100). If you see “no energy,” wait or try again later.
    - **Cooldown:** After a battle in an arena, you must wait (e.g. 30–60 seconds) before the next battle in that same arena/mode.
- **Optional:** Check **Auto-claim AIBA on battle** if you want the server to prepare a claim right after the battle so you can withdraw that battle’s AIBA in one step (see section 8).

---

## 6. Balances (NEUR, AIBA, Stars, Diamonds)

- **Where:** The **balance strip** at the top of the app shows: **NEUR**, **AIBA credits**, **Stars**, **Diamonds**, and a **verified** (or other) badge if you have one.
- **NEUR:** Off-chain points. You earn them from battles, referrals, and **daily claim** (Wallet tab). Used for entry fees (if a mode has them), **combine brokers**, training, and referrals. They never leave the backend ledger.
- **AIBA credits:** Off-chain “credits” that represent withdrawable AIBA. You earn them from battles. Use for **upgrades**, **mint as NFT**, **marketplace** (list/buy), **staking**. To get **real AIBA** in your TON wallet, **create a claim** and then **Claim on-chain** (see section 8).
- **Stars:** Telegram Stars–style currency. You earn Stars from **every battle win**. Shown in the balance strip and in the Wallet tab.
- **Diamonds:** Premium TON ecosystem asset. You earn **one Diamond on your first win**. Shown in the balance strip and Wallet tab.
- **Refreshing:** Balances update after battles, claims, daily claim, staking, and marketplace actions. If a number looks stale, perform an action or switch tabs to refresh.

---

## 7. Guilds (Groups) — Optional

- **When:** Useful for **guildWars** arena and for sharing rewards with a group. In the app the tab is labeled **Guilds** and the feature is called **Groups**.
- **Your rank:** The Guilds tab shows **Your leaderboard rank** (e.g. #42 by score). **Top N** leaders (e.g. top 50) can **create a group for free**; everyone else must **pay TON** to create.
- **My groups:** Tap **Refresh my guilds** to load your memberships. In the **My guilds** dropdown you’ll see guild name, member count, vault NEUR, and boost count.
- **Create a group:**
    - If you’re in the **top N** (e.g. top 50): enter **Name** (3–24 characters) and optional **Bio**, then tap **Create**. No payment.
    - If you’re **not** in the top N: the app shows the **cost in TON** (e.g. 1–10 TON). Send that amount to the project’s **Leader Board** wallet, then **paste the transaction hash** in the box and tap **Create**. Refresh; select the new group.
- **Join a group:** Get the **Guild ID** from someone (e.g. from the group’s invite). Paste it into **Join guild** and tap **Join**. Anyone can join any group.
- **Boost a group:** To give a group more visibility, **pay TON** (cost shown, e.g. 1–10 TON) to the **Boost Group** wallet, then paste the **tx hash** next to that group and tap **Boost**. Each group shows its boost count.
- **Deposit / withdraw broker:** Select a **guild** and a **broker**, then tap **Deposit selected broker** to put that broker in the guild pool (for guild wars). Tap **Withdraw selected broker** to take it back. You must withdraw a broker before you can list it on the marketplace.
- **Guild Wars:** To play **guildWars** arena you must be in a guild. Part of the NEUR reward goes to the guild treasury (e.g. 20%); the rest to you.

---

## 8. Withdrawing AIBA to Your Wallet (On-Chain Claim)

To turn **AIBA credits** into **real AIBA jettons** in your TON wallet:

- **Prerequisites:**
    - Wallet **connected** (TonConnect).
    - Backend and vault configured (ARENA_VAULT_ADDRESS, AIBA_JETTON_MASTER, ORACLE_PRIVATE_KEY_HEX, TON provider). If not, “Create claim” or “Claim on-chain” may fail or show a message about backend config.
- **Two ways:**

### 8.1 Auto-claim after a battle

1. Check **Auto-claim AIBA on battle**.
2. Run a battle (with a connected wallet and enough AIBA credits from that battle).
3. If the backend returns a claim, you’ll see **On-chain claim** with vault, amount, seqno, validUntil.
4. Tap **Claim on-chain (TonConnect)**.
5. Your wallet opens: confirm sending the transaction to the **vault** (you pay a small TON fee for gas; the vault sends AIBA to you).
6. Wait for confirmation; the app may poll and show “Claim confirmed on-chain.”

### 8.2 Create claim manually, then claim on-chain

1. After one or more battles you have **AIBA credits** (see Balances).
2. In **On-chain claim**, in the “Create a claim” section:
    - Optionally enter an **Amount** (blank = all your AIBA credits).
    - Tap **Create claim**.
3. You’ll see vault, to, amount, seqno, validUntil (and the backend stores the signed claim).
4. Tap **Claim on-chain (TonConnect)**.
5. Confirm in your wallet (you send one tx to the vault; the vault sends AIBA to your address).
6. Wait for “Claim confirmed on-chain” (or use **Check claim status** if the app offers it).

- **Important:**
    - The **connected wallet** must match the claim’s **to** address. If you changed wallets, reconnect the correct one.
    - Claims have a **validUntil** time (e.g. 10 minutes). If it expires, create a new claim (e.g. run another battle or create claim again).
    - If you see “Vault inventory too low” or “Vault has insufficient TON,” the project needs to top up the vault; you can try again later.

---

## 9. Super Futuristic Unified Marketplace (Create Broker, List, Buy, Boosts)

The **Market** tab is the **Super Futuristic Unified Marketplace**: one hub for brokers, assets, rentals, system shop, and boosts. All payments are **TON** (to create a broker) or **AIBA** (to list and buy). See [MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md](MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md) for the full plan.

### 9.1 Create your broker with TON

- **What:** Pay TON once to create a **new broker** that is **automatically listed** on the global marketplace. You get **global recognition** as the seller.
- **Where:** Market tab → **Create your broker (pay TON)** card (shown only when the feature is configured).
- **Steps:**
    1. Note the **cost** (e.g. 1–10 TON; set by admins).
    2. Send that exact amount of TON to the **wallet address** shown or communicated by the project (Super Admin “Created Brokers” wallet).
    3. After the transaction confirms, copy the **transaction hash** (tx hash).
    4. Paste the tx hash into the input and tap **Create broker**.
- **Result:** A new broker is created and listed on the marketplace at the default AIBA price. Everyone can see it; you appear as the seller.
- **Tip:** If you see “txHash already used,” that payment was already applied. Use a new TON payment for another broker.

### 9.2 Stars Store (buy Stars with AIBA or TON)

- **What:** **Stars** are in-app recognition currency (you also earn them from battles). You can **buy** a pack of Stars with **AIBA** or **TON**.
- **Where:** **Market** tab and **Wallet** tab → **Stars Store** card.
- **Buy with AIBA:** Tap **Buy with AIBA** to buy one pack (size and price set by admins).
- **Buy with TON:** Send the required TON to the Stars Store wallet, paste the **transaction hash**, tap **Buy with TON**. TON goes to Super Admin STARS_STORE_WALLET.

### 9.3 List and buy brokers (AIBA)

- **List:** Select one of **your** brokers (not in a guild pool), enter a **price in AIBA**, and tap **List**. Your broker appears globally. Withdraw it from a guild first if it’s deposited there.
- **Buy:** Browse **listings** and tap **Buy** on a listing. You pay in **AIBA**; the broker is transferred to you. Your AIBA balance is debited.
- **Refresh:** Tap **Refresh** to load the latest listings.

### 9.4 Cars and bikes for sale

- **Cars:** Car Racing tab → **Market** flow. **List** a car from your garage (select car, enter price AIBA, tap List). **Buy** from other players or from the System.
- **Bikes:** Bike Racing tab → **Market** flow. **List** a bike from your garage (select bike, enter price AIBA, tap List). **Buy** from other players or from the System.

---

## 10. Boost your profile

- **What:** Pay TON to **boost your profile** so you get higher visibility (e.g. “Boosted” badge, better placement).
- **Where:** Wallet tab → **Boost your profile** card (shown when the feature is configured).
- **Steps:**
    1. Note the **cost** (e.g. 1–10 TON).
    2. Send that amount of TON to the project’s **Boost Profile** wallet.
    3. Paste the **transaction hash** and tap **Boost profile**.
- **Result:** Your profile is boosted until the configured end date. The Profile card shows “Profile boosted until &lt;date&gt;.”

---

## 11. Gifts

- **What:** Send a **gift** to another user by paying TON. The recipient sees it in “Gifts received”; you see yours in “Gifts sent.”
- **Where:** Wallet tab → **Gifts** card.
- **Send a gift:**
    1. Enter the recipient: **Telegram ID** (numeric) or **@username**.
    2. Note the **cost** (e.g. 1–10 TON per gift).
    3. Send that amount of TON to the project’s **Gifts** wallet.
    4. Paste the **transaction hash**, optionally add a **message**, and tap **Send gift**.
- **Received / Sent:** The same card shows **Received** (gifts you got) and **Sent** (gifts you sent). You can’t send a gift to yourself.

---

## 12. Referrals

- **Create your code:** Tap **Create my referral code**. Your code appears (e.g. uppercase). Share it with friends.
- **Use someone else’s code:** Paste their code into **Enter referral code** and tap **Apply**. You (and they) may get NEUR bonuses; applying usually requires a **connected wallet** (anti-sybil). Each code is typically one-time per user/wallet.
- **Note:** If it says “Referral failed (already used? wallet required? invalid code?)”, check: wallet connected, code correct, and that you haven’t already used a referral.

---

## 13. Brokers Tab: Combine and Mint as NFT

- **My brokers:** In the **Brokers** tab you see all brokers you own. **Select** one in the dropdown to use it in battles (and for combine or mint).
- **Combine brokers:** Pick a **base** broker and a **sacrifice** broker. The base keeps blended stats and XP; the sacrifice is removed. Cost: **NEUR** (amount shown, e.g. 50). Tap **Combine**. Useful to merge two weak brokers into one stronger one.
- **Mint as NFT:** Select one broker and tap **Mint as NFT**. Cost: **AIBA** (amount shown). The backend queues a **mint job**; when an admin completes it, the broker is linked to an on-chain NFT. Status appears in the app.

---

## 14. NFT Multiverse (Own, Stake, Earn)

- **Where:** **Multiverse** tab.
- **What:** The **NFT Multiverse** lets you see all **NFT universes** (e.g. Broker NFT), **My NFTs** (brokers you’ve minted as NFT), and **stake** them to earn **AIBA daily**.
- **Flow:** Mint a Broker NFT from the **Brokers** tab (pay AIBA). Then open **Multiverse** → **My NFTs** → tap **Stake** on a broker NFT. Rewards accumulate per day (e.g. 5 AIBA per NFT per day; configurable). Tap **Claim rewards** to credit pending AIBA to your balance. Tap **Unstake** to stop earning and keep the NFT.
- **Benefit:** Ownership of on-chain NFTs, passive AIBA income from staking, and alignment with the ecosystem (see [NFT-MULTIVERSE-MASTER-PLAN.md](NFT-MULTIVERSE-MASTER-PLAN.md)).

---

## 15. Leaderboard

- **Where:** **Home** tab → **Leaderboard** card.
- **What:** Global ranks by **score**, **AIBA**, **NEUR**, or **battles** (dropdown). You see the top players; the list is the same for everyone worldwide. Your **my-rank** (e.g. “Your leaderboard rank: #42”) is shown in the **Guilds** tab and is used to decide if you can create a group for free (top N) or must pay TON.

---

## 16. Charity (Unite for Good)

- **Where:** **Charity** tab.
- **What:** **Active campaigns** (e.g. education, health, community). Each campaign has a name, description, cause, and progress (NEUR + AIBA raised, donor count). **Donate** NEUR and/or AIBA: use **Max NEUR** / **Max AIBA** to fill amounts, or presets (+10, +50, +100, +500, +1000); optional message (max 500 chars) and **anonymous** toggle.
- **Your impact:** The tab shows how much you’ve donated (NEUR, AIBA, impact score) and per-campaign breakdown.
- **Charity leaderboard:** Optional leaderboard of donors by impact.

---

## 17. University

- **Where:** **University** tab.
- **What:** **Courses** and **modules** (learning content). You see your **progress** (e.g. X of Y modules completed). Tapping a module can mark it complete (POST progress). When you complete all, you get a **graduate** badge.
- **Mint course badge / full certificate:** After completing requirements, you can **mint** a course completion badge or full course certificate by **paying TON** (cost shown). Send TON to the configured wallet, paste the tx hash, and submit. See the University tab for the exact flow and wallet.

---

## 18. Updates (Announcements)

- **Where:** **Updates** tab.
- **What:** **Announcements** from the project (title, body, type). Unread count badge; tap to mark as read. **System status** (operational/maintenance). **Support form**: choose subject (question, bug, feature, account, other) and message; submit to contact support. Admins view requests in Admin → Support.

---

## 19. Wallet Tab (Full Picture)

The **Wallet** tab contains:

- **Profile:** Your **badges** (e.g. Verified, Early Adopter, Top Leader, University Graduate). If you **boosted your profile** (pay TON), it shows “Profile boosted until &lt;date&gt;.”
- **Boost your profile:** See section 10. Pay TON → paste tx hash.
- **Gifts:** See section 11. Send/received/sent.
- **Daily reward:** **Claim daily** to receive **NEUR** once per day (amount set by the project). If you already claimed today, the button shows “Claimed.”
- **Vault:** Vault address and TON/jetton balance (for debugging or checking claim capacity).
- **Staking:** **Stake** AIBA (flexible or locked). **Minimum stake** is shown (e.g. 100 AIBA, ecosystem-aligned; configurable in Admin). Locked: choose period (30/90/180/365 days), see APY and reward preview; view active locks with countdown. **Cancel early** before maturity (5% fee → Treasury). **Claim** when lock matures or for flexible rewards. Staking is off-chain; rewards in AIBA.
- **DAO:** **Create** a proposal (title, description) or **vote** on active proposals (Vote For / Vote Against). Creating a proposal requires staking ≥ config min (e.g. 10,000 AIBA) for ≥ min days (e.g. 30). Proposals can be closed and executed (treasury payout) by the project.
- **On-chain claim:** When you have a battle with a claim (or you created one manually), this card shows vault, amount, seqno, validUntil and **Claim on-chain (TonConnect)** / **Check claim status**. See section 8.
- **Stars and Diamonds:** Display of your Stars and Diamonds balances (earned from battles).

---

## 20. Ads and Tasks

- **Ads:** After some battles you may see a **Sponsored** image/link. Tapping it opens the advertiser’s link (in Telegram or browser). This doesn’t change your balances.
- **Tasks:** The app or backend may list **tasks** (e.g. daily quests or external links). Follow the instructions shown for each task; completion may grant rewards (implementation depends on the project).

---

## 21. Vault Inventory (Optional / Debug)

- **Vault inventory** shows the vault’s TON balance and AIBA (jetton) balance. It’s mainly for checking whether the vault has enough to pay claims and enough TON for gas.
- If “Claim on-chain” fails with “Vault inventory too low” or “insufficient TON,” an admin needs to top up the vault; you can use this section to confirm the state.

---

## 22. Troubleshooting

| Problem                                                             | What to do                                                                                                                                         |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| “Select a broker first”                                             | Create a broker and select it in **My brokers** before **Run battle**.                                                                             |
| “No energy” / “need X have Y”                                       | Wait for energy to regen (e.g. 1 per minute), or try a different broker if you have one.                                                           |
| “Cooldown” / “retryAfterMs”                                         | Wait the shown time before running another battle in the same arena/mode.                                                                          |
| “Battle failed. Is backend running…?”                               | Backend may be down or not reachable; try again later or check project status.                                                                     |
| “Wallet connected” never appears                                    | Retry TonConnect; ensure wallet is unlocked and network is OK.                                                                                     |
| “Connect wallet first” when claiming                                | Connect TonConnect; the claim is tied to your wallet address.                                                                                      |
| “Connected wallet does not match claim recipient”                   | Reconnect the same wallet that was used when the claim was created.                                                                                |
| “Claim expired”                                                     | Create a new claim (run a battle with auto-claim or use “Create claim” again).                                                                     |
| “Vault inventory too low” / “insufficient TON”                      | Project must top up the vault; you can’t fix this from the app.                                                                                    |
| “No claim created” / “Could not create claim”                       | Backend may not have vault/oracle configured, or your AIBA balance is 0; check Balances and try again after earning more.                          |
| “Guild required” for guildWars                                      | Join or create a guild, then run battle in **guildWars**.                                                                                          |
| “Referral failed (already used?…)”                                  | Ensure wallet is connected, code is correct, and you haven’t already applied a referral.                                                           |
| “Create failed” / “TON payment verification failed” (create broker) | Ensure you sent the exact cost in TON to the correct wallet and paste the tx hash for that transfer; each tx hash can only be used once.           |
| “txHash already used” (create broker / boost / gift)                | That payment was already applied; use a new TON transfer and new tx hash for another action.                                                       |
| “recipient not found” (gift)                                        | The Telegram ID or @username doesn’t exist in the system; they may need to open the app once.                                                      |
| “Gifts not configured” / “Create broker with TON not configured”    | The project hasn’t set the wallet and cost in the backend; the feature is disabled.                                                                |
| “Combine failed” / “insufficient NEUR”                              | Ensure you have enough NEUR (battles, daily claim, referrals); select two different brokers (base and sacrifice).                                  |
| “Mint failed” / “insufficient AIBA”                                 | You need enough AIBA credits (battles, marketplace sell); one broker at a time for mint.                                                           |
| “Stake failed” / “Unstake failed”                                   | Check AIBA balance; **minimum stake** applies (e.g. 100 AIBA; shown in Yield Vault / Wallet staking). For unstake, amount must be ≤ staked amount. |
| “Daily claim failed” / “Already claimed today”                      | You can claim daily NEUR only once per day (UTC). Wait until the next day.                                                                         |
| “Vote failed” / “Create failed” (DAO)                               | Proposal may be closed; check you’re voting on an active proposal or that title is non-empty for create.                                           |
| “Donate failed” (charity)                                           | Check campaign is active; ensure you have enough NEUR/AIBA and selected a campaign.                                                                |

---

## 23. Quick Checklist (First Session)

1. Open AIBA Arena in Telegram (skip intro/tutorial if shown).
2. Connect wallet (TonConnect).
3. Create starter broker and select it in **My brokers**.
4. Choose arena (e.g. prediction) and tap **Run battle**.
5. Check **Battle result** and **Balances** (NEUR, AIBA, Stars, Diamonds).
6. (Optional) **Wallet** → **Claim daily** for NEUR.
7. (Optional) Enable **Auto-claim AIBA on battle** and tap **Claim on-chain** after the next battle (Wallet tab when claim is ready).
8. (Optional) **Guilds:** Check your rank; create or join a group (pay TON if not top N); try **guildWars** arena.
9. (Optional) Create referral code or apply a friend’s code (**Home** tab).
10. (Optional) **Market:** Create a broker with TON (pay → paste tx hash) or list/buy brokers with AIBA; buy a boost (NEUR).
11. (Optional) **Wallet:** Boost your profile (TON), send a gift (TON), stake AIBA, or vote in DAO.
12. (Optional) **Charity:** Donate NEUR or AIBA to a campaign. **University:** Complete modules, mint badge/certificate (TON). **Updates:** Read announcements.

For **how the game works** (brokers, arenas, economy, claims), see **GAME-EXPLAINED.md**. For **marketplace and all payments** (TON + AIBA, Super Admin wallets), see **MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md**. For **leaderboard and groups** (top N, pay TON), see **AUDIT-AND-STATUS.md** §2.
