# AIBA Arena — User Guide

This guide walks you through **how to play** AIBA Arena: from opening the app to earning NEUR and AIBA and withdrawing AIBA to your TON wallet.

---

## 1. Opening the Game

- **Where:** AIBA Arena runs as a **Telegram Mini App**. Open it from a link or bot inside Telegram (e.g. from the project’s bot or a shared link).
- **Requirements:** Telegram account; optionally a TON wallet (TonConnect) if you want to withdraw AIBA on-chain.
- **First time:** The app may show “Backend: …” at the top; that’s for developers. You’ll see a **TonConnect** button and sections for brokers, arena, battle, economy, guilds, referrals, and claims.

---

## 2. Connect Your Wallet (Recommended)

- **Why:** Your TON address is used to:
  - Save your progress (linked to Telegram + wallet).
  - **Withdraw AIBA** on-chain: claims are tied to your wallet; you send one transaction to the vault to receive AIBA jettons.
- **How:**
  1. Tap **TonConnect** (or “Connect wallet”).
  2. Choose your TON wallet (e.g. Tonkeeper, Telegram Wallet).
  3. Approve the connection in the wallet.
- **Result:** The app shows “Wallet connected.” The backend stores your address for claims. If you don’t connect, you can still play and earn NEUR/AIBA credits, but you won’t be able to withdraw AIBA to the chain until you connect.

---

## 3. Get Your First Broker

- **What:** A **broker** is your in-game agent. Each has stats (Intelligence, Speed, Risk), level, energy, and cooldowns.
- **Steps:**
  1. Tap **Create starter broker**.
  2. Wait for “Refresh brokers” to finish (or tap it once).
  3. In **My brokers**, you should see one broker (e.g. “#… | INT 50 SPD 50 RISK 50 | energy 10”).
- **Tip:** You can have multiple brokers later; for now one is enough. Select it in the **My brokers** dropdown before every battle.

---

## 4. Choose Arena and Run a Battle

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
  4. Wait a moment; you’ll see **Battle result** with **Score** and **Reward AIBA (credits)**.
- **Limits:**
  - **Energy:** Each battle costs energy (e.g. 10–20 per battle). Energy regenerates over time (e.g. 1 per minute, cap 100). If you see “no energy,” wait or try again later.
  - **Cooldown:** After a battle in an arena, you must wait (e.g. 30–60 seconds) before the next battle in that same arena/mode.
- **Optional:** Check **Auto-claim AIBA on battle** if you want the server to prepare a claim right after the battle so you can withdraw that battle’s AIBA in one step (see section 7).

---

## 5. Balances (NEUR and AIBA Credits)

- **Where:** Under the main buttons you’ll see something like:  
  **Balances — NEUR: … | AIBA credits: …**
- **NEUR:** Off-chain points. You earn them from battles (and referrals). They’re used for entry fees (if a mode has them), upgrades, and referrals. They never leave the backend ledger.
- **AIBA credits:** Off-chain “credits” that represent withdrawable AIBA. You earn them from battles. To get **real AIBA** in your TON wallet, you must **create a claim** and then **Claim on-chain** (see section 7).
- **Refreshing:** Balances update after battles and after claims. If the number looks stale, run another battle or use “Create claim” / “Claim on-chain” and the UI will refresh.

---

## 6. Guilds (Optional)

- **When:** Useful for **guildWars** arena and for sharing rewards with a group.
- **My guilds:**
  - Tap **Refresh my guilds** to load your memberships.
  - In the **My guilds** dropdown you’ll see guild name, member count, and vault NEUR.
- **Create a guild:**
  1. Enter **Name** (e.g. 3–24 characters) and optional **Bio**.
  2. Tap **Create**.
  3. Refresh my guilds; select the new guild.
- **Join a guild:**
  1. Get the **Guild ID** from someone (e.g. from the guild’s invite).
  2. Paste it into **Join guild** and tap **Join**.
- **Deposit / withdraw broker:**
  - Select a **guild** and a **broker**, then tap **Deposit selected broker** to put that broker in the guild pool (for guild wars).
  - Tap **Withdraw selected broker** to take it back to “yours.”
- **Guild Wars:** To play **guildWars** arena you must be in a guild. Part of the NEUR reward goes to the guild treasury (e.g. 20%); the rest to you.

---

## 7. Withdrawing AIBA to Your Wallet (On-Chain Claim)

To turn **AIBA credits** into **real AIBA jettons** in your TON wallet:

- **Prerequisites:**  
  - Wallet **connected** (TonConnect).  
  - Backend and vault configured (ARENA_VAULT_ADDRESS, AIBA_JETTON_MASTER, ORACLE_PRIVATE_KEY_HEX, TON provider). If not, “Create claim” or “Claim on-chain” may fail or show a message about backend config.
- **Two ways:**

### 7.1 Auto-claim after a battle

1. Check **Auto-claim AIBA on battle**.
2. Run a battle (with a connected wallet and enough AIBA credits from that battle).
3. If the backend returns a claim, you’ll see **On-chain claim** with vault, amount, seqno, validUntil.
4. Tap **Claim on-chain (TonConnect)**.
5. Your wallet opens: confirm sending the transaction to the **vault** (you pay a small TON fee for gas; the vault sends AIBA to you).
6. Wait for confirmation; the app may poll and show “Claim confirmed on-chain.”

### 7.2 Create claim manually, then claim on-chain

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

## 8. Marketplace (Create Broker, List, Buy)

The **Market** tab is the unified marketplace. All payments here are in **TON** (to create a broker) or **AIBA** (to list and buy brokers). See [MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md](MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md) for the full plan.

### 8.1 Create your broker with TON

- **What:** Pay TON once to create a **new broker** that is **automatically listed** on the global marketplace. You get **global recognition** as the seller.
- **Where:** Market tab → **Create your broker (pay TON)** card (shown only when the feature is configured).
- **Steps:**
  1. Note the **cost** (e.g. 1–10 TON; set by admins).
  2. Send that exact amount of TON to the **wallet address** shown or communicated by the project (Super Admin “Created Brokers” wallet).
  3. After the transaction confirms, copy the **transaction hash** (tx hash).
  4. Paste the tx hash into the input and tap **Create broker**.
- **Result:** A new broker is created and listed on the marketplace at the default AIBA price. Everyone can see it; you appear as the seller.
- **Tip:** If you see “txHash already used,” that payment was already applied. Use a new TON payment for another broker.

### 8.2 List and buy brokers (AIBA)

- **List:** Select one of **your** brokers (not in a guild pool), enter a **price in AIBA**, and tap **List**. Your broker appears globally. Withdraw it from a guild first if it’s deposited there.
- **Buy:** Browse **listings** and tap **Buy** on a listing. You pay in **AIBA**; the broker is transferred to you. Your AIBA balance is debited.
- **Refresh:** Tap **Refresh** to load the latest listings.

---

## 9. Boost your profile

- **What:** Pay TON to **boost your profile** so you get higher visibility (e.g. “Boosted” badge, better placement).
- **Where:** Wallet tab → **Boost your profile** card (shown when the feature is configured).
- **Steps:**
  1. Note the **cost** (e.g. 1–10 TON).
  2. Send that amount of TON to the project’s **Boost Profile** wallet.
  3. Paste the **transaction hash** and tap **Boost profile**.
- **Result:** Your profile is boosted until the configured end date. The Profile card shows “Profile boosted until &lt;date&gt;.”

---

## 10. Gifts

- **What:** Send a **gift** to another user by paying TON. The recipient sees it in “Gifts received”; you see yours in “Gifts sent.”
- **Where:** Wallet tab → **Gifts** card.
- **Send a gift:**
  1. Enter the recipient: **Telegram ID** (numeric) or **@username**.
  2. Note the **cost** (e.g. 1–10 TON per gift).
  3. Send that amount of TON to the project’s **Gifts** wallet.
  4. Paste the **transaction hash**, optionally add a **message**, and tap **Send gift**.
- **Received / Sent:** The same card shows **Received** (gifts you got) and **Sent** (gifts you sent). You can’t send a gift to yourself.

---

## 11. Referrals

- **Create your code:** Tap **Create my referral code**. Your code appears (e.g. uppercase). Share it with friends.
- **Use someone else’s code:** Paste their code into **Enter referral code** and tap **Apply**. You (and they) may get NEUR bonuses; applying usually requires a **connected wallet** (anti-sybil). Each code is typically one-time per user/wallet.
- **Note:** If it says “Referral failed (already used? wallet required? invalid code?)”, check: wallet connected, code correct, and that you haven’t already used a referral.

---

## 12. Ads and Tasks

- **Ads:** After some battles you may see a **Sponsored** image/link. Tapping it opens the advertiser’s link (in Telegram or browser). This doesn’t change your balances.
- **Tasks:** The app or backend may list **tasks** (e.g. daily quests or external links). Follow the instructions shown for each task; completion may grant rewards (implementation depends on the project).

---

## 13. Vault Inventory (Optional / Debug)

- **Vault inventory** shows the vault’s TON balance and AIBA (jetton) balance. It’s mainly for checking whether the vault has enough to pay claims and enough TON for gas.
- If “Claim on-chain” fails with “Vault inventory too low” or “insufficient TON,” an admin needs to top up the vault; you can use this section to confirm the state.

---

## 11. Troubleshooting

| Problem | What to do |
|--------|------------|
| “Select a broker first” | Create a broker and select it in **My brokers** before **Run battle**. |
| “No energy” / “need X have Y” | Wait for energy to regen (e.g. 1 per minute), or try a different broker if you have one. |
| “Cooldown” / “retryAfterMs” | Wait the shown time before running another battle in the same arena/mode. |
| “Battle failed. Is backend running…?” | Backend may be down or not reachable; try again later or check project status. |
| “Wallet connected” never appears | Retry TonConnect; ensure wallet is unlocked and network is OK. |
| “Connect wallet first” when claiming | Connect TonConnect; the claim is tied to your wallet address. |
| “Connected wallet does not match claim recipient” | Reconnect the same wallet that was used when the claim was created. |
| “Claim expired” | Create a new claim (run a battle with auto-claim or use “Create claim” again). |
| “Vault inventory too low” / “insufficient TON” | Project must top up the vault; you can’t fix this from the app. |
| “No claim created” / “Could not create claim” | Backend may not have vault/oracle configured, or your AIBA balance is 0; check Balances and try again after earning more. |
| “Guild required” for guildWars | Join or create a guild, then run battle in **guildWars**. |
| “Referral failed (already used?…)” | Ensure wallet is connected, code is correct, and you haven’t already applied a referral. |
| “Create failed” / “TON payment verification failed” (create broker) | Ensure you sent the exact cost in TON to the correct wallet and paste the tx hash for that transfer; each tx hash can only be used once. |
| “txHash already used” (create broker / boost / gift) | That payment was already applied; use a new TON transfer and new tx hash for another action. |
| “recipient not found” (gift) | The Telegram ID or @username doesn’t exist in the system; they may need to open the app once. |
| “Gifts not configured” / “Create broker with TON not configured” | The project hasn’t set the wallet and cost in the backend; the feature is disabled. |

---

## 15. Quick Checklist (First Session)

1. Open AIBA Arena in Telegram.
2. Connect wallet (TonConnect).
3. Create starter broker and select it.
4. Choose arena (e.g. prediction) and tap **Run battle**.
5. Check **Battle result** and **Balances** (NEUR and AIBA credits).
6. (Optional) Enable **Auto-claim AIBA on battle** and tap **Claim on-chain** after the next battle.
7. (Optional) Create/join a guild and try **guildWars**.
8. (Optional) Create referral code or apply a friend’s code.
9. (Optional) **Market:** Create a broker with TON (pay → paste tx hash) or list/buy brokers with AIBA.
10. (Optional) **Wallet:** Boost your profile (TON) or send a gift (TON) to another user.

For more on **how the game works** (brokers, arenas, battles, economy, claims), see **docs/GAME-EXPLAINED.md**. For **marketplace and all payments** (TON + AIBA, Super Admin wallets), see **docs/MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md**.
