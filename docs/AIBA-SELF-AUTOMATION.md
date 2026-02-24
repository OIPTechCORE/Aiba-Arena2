# AIBA Self-Automation — What Is Possible

This doc explains what can be automated vs what requires manual/on-chain actions for the 1T AIBA mint and allocation strategy.

---

## 1. Self-Automated Daily Caps ✅ **IMPLEMENTED**

**Location:** `backend/engine/economyAutomation.js`, `backend/routes/economyAutomation.js`

- **Dynamic caps:** When `automationEnabled` is true in EconomyConfig, the system can adjust `dailyCapAiba` based on:
    - `automationTargetEmissionPercentPerYear` — target % of 1T to emit per year (e.g. 10%)
    - `automationMinCapAiba` / `automationMaxCapAiba` — bounds
- **Trigger:** `POST /api/admin/economy-automation/run` (admin-only)
- **Cron:** Add a daily cron (e.g. 00:05 UTC) to call this endpoint for true automation

---

## 2. Allocation Strategy ✅ **IMPLEMENTED (Config)**

**Location:** `backend/models/EconomyConfig.js` — fields:

| Field                    | Default | Purpose              |
| ------------------------ | ------- | -------------------- |
| `allocationVaultPct`     | 40      | % to vault (rewards) |
| `allocationTreasuryPct`  | 15      | % to treasury        |
| `allocationStakingPct`   | 20      | % to staking         |
| `allocationTeamPct`      | 10      | % to team            |
| `allocationEcosystemPct` | 10      | % to ecosystem       |
| `allocationCommunityPct` | 5       | % to community       |

- **Usage:** `GET /api/admin/economy-automation/allocation` returns the strategy
- **Minting:** Actual minting is done via `scripts/mintAibaToVault.ts` — requires **owner key**. The allocation percentages guide _how much_ to mint to each address.

---

## 3. Self-Automated Minting ⚠️ **NOT FULLY POSSIBLE (On-Chain Constraint)**

- **Why:** The `AibaToken` contract (Tact) requires the **owner** to send a `Mint` message. There is no built-in "automatic mint" on a schedule.
- **Options:**
    1. **Cron + script:** Run `mintAibaToVault.ts` daily via cron with the owner key (semi-automated; key must be available to the runner)
    2. **Oracle / relayer:** An off-chain service holds the owner key and mints when conditions are met (e.g. vault below threshold)
    3. **Contract upgrade:** Deploy a new AibaToken with a "minter" role that can be a contract with scheduled logic — **complex, requires contract change**

**Practical:** Use option 1 — cron + script with secure key storage. Document in runbook.

---

## 4. Self-Automated Anti-Inflation ✅ **PARTIALLY IMPLEMENTED**

- **Burns:** Already in place — marketplace fee (3%), asset mint/upgrade, brokerage costs. Token splits: 15% burn, 25% treasury, etc. Every AIBA debit that goes through `debitAibaFromUser` is tracked.
- **Staking locks:** Users stake AIBA → reduces circulating supply.
- **Dynamic caps:** The automation adjusts emission caps so that inflation stays within target (see §1).
- **What’s NOT automated:** On-chain burns. The current flow records burns in `EconomyDay`; actual token burns would need a contract call (e.g. `SafeTokenBurn`). That requires either a backend job that holds the burner key or a user-triggered flow.

---

## 5. Summary

| Feature                         | Status | Notes                                 |
| ------------------------------- | ------ | ------------------------------------- |
| Dynamic daily caps              | ✅     | Admin trigger or cron                 |
| Allocation config               | ✅     | EconomyConfig fields                  |
| Anti-inflation (burn tracking)  | ✅     | Off-chain; on-chain burns need key    |
| Fully autonomous minting        | ❌     | Owner key required; use cron + script |
| Fully autonomous on-chain burns | ❌     | Requires signer/key                   |

---

## 6. Enabling Automation

1. Set `automationEnabled: true` in EconomyConfig (admin panel or DB).
2. Set `automationTargetEmissionPercentPerYear` (e.g. 10 = 10%/year).
3. Set `automationMinCapAiba` and `automationMaxCapAiba`.
4. Add cron: `0 5 0 * * *` (00:05 UTC daily) → `curl -X POST /api/admin/economy-automation/run` with admin auth.

---

## 7. Related Config (EconomyConfig)

| Field                                  | Default | Purpose                                                             |
| -------------------------------------- | ------- | ------------------------------------------------------------------- |
| `referralUnlock3BonusBps`              | 100     | 1% battle reward bonus when user has 3+ referrals (invite-3 unlock) |
| `trainerRewardAibaPerUser`             | 5       | AIBA per referred user with 3+ battles                              |
| `trainerRewardAibaPerRecruitedTrainer` | 20      | AIBA per trainer recruited (when approved)                          |
