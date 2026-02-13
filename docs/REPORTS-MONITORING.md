# Reports Deep Monitoring — Codebase vs Documentation

**Purpose:** Cross-validate advisory and audit reports against the live codebase. Single reference for "are the reports accurate?"

**Last verified:** Generated from codebase scan. Re-run verification when economy, referrals, or automation logic changes.

---

## 1. Report Inventory

| Report | Path | Scope |
|--------|------|-------|
| **ADVISORY-TOKENOMICS-VIRAL-FOUNDER-REVENUE** | `docs/ADVISORY-TOKENOMICS-VIRAL-FOUNDER-REVENUE.md` | 1T AIBA, viral mechanics, user/founder revenue |
| **AIBA-SELF-AUTOMATION** | `docs/AIBA-SELF-AUTOMATION.md` | Caps, allocation, minting, anti-inflation automation |
| **OPERATIONS** | `docs/OPERATIONS.md` | Runbook, keys, incident response, monitoring |
| **API-AND-READINESS-AUDIT** | `docs/API-AND-READINESS-AUDIT.md` | API mapping, production readiness |
| **AUDIT-AND-STATUS** | `docs/AUDIT-AND-STATUS.md` | Project assessment, ecosystems, vision vs codebase |

---

## 2. ADVISORY-TOKENOMICS — Verification

### 2.1 Economy Config (from `EconomyConfig.js`)

| Advisory Claims | Codebase | Status |
|-----------------|----------|--------|
| dailyCapAiba 1M | `default: 1_000_000` | ✅ Match |
| baseRewardAibaPerScore 2 | `default: 2` | ✅ Match |
| referralRewardAibaReferrer 10 | `default: 10` | ✅ Match |
| referralRewardAibaReferee 5 | `default: 5` | ✅ Match |
| marketplaceFeeBps 3% | `default: 300` | ✅ Match |
| Token splits: Burn 15%, Treasury 25%, Rewards 50%, Staking 10% | `tokenSplitBurnBps: 1500`, `tokenSplitTreasuryBps: 2500`, `tokenSplitRewardsBps: 5000`, `tokenSplitStakingBps: 1000` | ✅ Match |
| stakingApyPercent 15 | `default: 15` | ✅ Match |
| nftStakingApyPercent 12 | `default: 12` | ✅ Match |
| carEntryFeeAiba 10, carRacingFeeBps 3% | `10`, `300` | ✅ Match |
| createBrokerCostTonNano 1 TON | `1_000_000_000` | ✅ Match |
| University badge 10 TON, cert 15 TON | `10e9`, `15e9` | ✅ Match |
| referralUnlock3BonusBps 100 (1%) | `default: 100` | ✅ Match |

### 2.2 Referral Tiered Rewards

| Advisory | Code (`referrals.js`) | Status |
|----------|------------------------|--------|
| 10th = 2× referrer, 1.5× referee | `newUses >= 10` → `*2`, `*1.5` | ✅ Match |
| 100th = 5× referrer, 2× referee | `newUses >= 100` → `*5`, `*2` | ✅ Match |

### 2.3 Token Splits Implementation

| Advisory | Code (`tokenSplits.js`, EconomyConfig) | Status |
|----------|----------------------------------------|--------|
| Burn 15%, Treasury 25%, Rewards 50%, Staking 10% | `computeTokenSplits` uses BPS from config; defaults as above | ✅ Match |
| Marketplace 3% fee → splits | `marketplaceFeeBps: 300`; `computeTokenSplits` on fee amount | ✅ Match |

### 2.4 Trainer Rewards (TRAINERS-MANUAL / economy)

| Claim | Code | Status |
|-------|------|--------|
| 5 AIBA per referred user (3+ battles) | `trainerRewardAibaPerUser: 5` | ✅ Match |
| 20 AIBA per recruited trainer (on approval) | `trainerRewardAibaPerRecruitedTrainer: 20` | ✅ Match |

### 2.5 Invite-3 Unlock & K-Factor (Implemented)

| Feature | Code | Status |
|---------|------|--------|
| Invite 3 — 1% battle bonus | `referralUnlock3BonusBps: 100`; `innovations.js` getRewardMultiplier checks Referral.uses >= 3 | Match |
| K-factor metrics | `GET /api/admin/referrals/metrics` — kFactorEstimate, avgUsesPerReferrer | Match |
| Referral leaderboard | `/api/referrals/top`; top 3 styled in Referrals tab | Match |

---

## 3. AIBA-SELF-AUTOMATION — Verification

| Advisory Claim | Codebase | Status |
|----------------|----------|--------|
| Dynamic caps in economyAutomation.js | `engine/economyAutomation.js` exists; `automationEnabled`, `automationTargetEmissionPercentPerYear` | ✅ Match |
| POST /api/admin/economy-automation/run | `routes/economyAutomation.js` (or admin routes) | ✅ Match |
| automationMinCapAiba / automationMaxCapAiba | `EconomyConfig`: 500k, 5M defaults | ✅ Match |
| Allocation config: Vault 40%, Treasury 15%, etc. | `allocationVaultPct: 40`, `allocationTreasuryPct: 15`, etc. | ✅ Match |
| Actual minting needs owner key (scripts/mintAibaToVault.ts) | On-chain constraint; doc correct | ✅ Match |
| Burns tracked in EconomyDay; on-chain burns need key | Doc correct | ✅ Match |

---

## 4. OPERATIONS — Verification

| Claim | Verification |
|-------|---------------|
| GET /health | Backend health route exists |
| GET /metrics | Prometheus metrics endpoint |
| GET /api/comms/status | Comms route |
| Keys: ORACLE_PRIVATE_KEY_HEX, ADMIN_JWT_SECRET, etc. | DEPLOYMENT-AND-ENV.md + enforceProductionReadiness |
| Incident playbooks: oracle, admin, Telegram | Documented in OPERATIONS.md |

**Action:** Ensure OPERATIONS.md env list stays in sync with `enforceProductionReadiness()` and DEPLOYMENT-AND-ENV.md.

---

## 5. API-AND-READINESS-AUDIT — Verification

| Area | Status |
|------|--------|
| API categories mapped | ✅ 48+ categories; Trainers, Premium, Economy Automation, Referrals metrics |
| Trainers API | ✅ `/api/trainers/*` (me, apply, network, leaderboard, profile, claim-rewards, register-use, recruit-link) |
| Vault/Claims config-dependent | ✅ Documented |
| Production checklist (env, CORS) | ✅ Documented |

---

## 6. AUDIT-AND-STATUS — Verification

| Claim | Status |
|-------|--------|
| Contracts Tact/Blueprint | ✅ |
| Backend Express, Mongoose | ✅ |
| Miniapp Next.js 14, TonConnect | ✅ |
| Admin panel | ✅ (admin-panel/ + miniapp /admin) |
| CI (.github/workflows/ci.yml) | ✅ |
| Leaderboard top N free guild create | `leaderboardTopFreeCreate: 50` | ✅ |
| CoE absent; University is learning hub | ✅ |

---

## 7. Monitoring Checklist (When to Re-verify)

Run this when:

- [ ] EconomyConfig defaults change
- [ ] Referral tier logic changes
- [ ] Token splits (Burn, Treasury, Rewards, Staking) change
- [ ] New revenue streams (TON wallets, fees) added
- [ ] Automation (economyAutomation, allocation) changes
- [ ] New API routes (trainers, admin, etc.) added
- [ ] OPERATIONS or DEPLOYMENT-AND-ENV updated

---

## 8. Summary

| Report | Overall | Notes |
|--------|---------|-------|
| ADVISORY-TOKENOMICS | ✅ Aligned | Economy, referrals, splits, trainers, invite-3, K-factor verified |
| AIBA-SELF-AUTOMATION | ✅ Aligned | Automation, allocation, mint constraints, related config (referralUnlock3BonusBps) |
| OPERATIONS | ✅ Aligned | Runbook consistent with codebase |
| API-AND-READINESS-AUDIT | ✅ Aligned | Trainers, Premium, Economy Automation, Referrals metrics documented |
| AUDIT-AND-STATUS | ✅ Aligned | Project assessment accurate |

**Conclusion:** All reports aligned with codebase. Invite-3 unlock (1% battle bonus) and K-factor metrics (`/api/admin/referrals/metrics`) implemented.

---

## 9. Docs Cross-Reference Matrix

| Doc | References | Status |
|-----|------------|--------|
| ADVISORY-TOKENOMICS | TRAINERS-MANUAL, REPORTS-MONITORING, INNOVATIONS-100X, GAME-FUNCTIONALITY | ✅ |
| AIBA-SELF-AUTOMATION | EconomyConfig, referralUnlock3BonusBps, trainer rewards | ✅ |
| API-AND-READINESS-AUDIT | Trainers (8 routes), Premium, Economy Automation, Referrals metrics, Invite-3 | ✅ |
| AUDIT-AND-STATUS | Trainers ecosystem, vision alignment | ✅ |
| TRAINERS-MANUAL | ADVISORY, REPORTS-MONITORING, USER-GUIDE, API-AND-READINESS-AUDIT | ✅ |
| OPERATIONS | Keys, incident response, monitoring (no trainer-specific section needed) | ✅ |
| docs/README | All docs indexed including REPORTS-MONITORING, TRAINERS-MANUAL, ORACLE-AIBA-TON | ✅ |
| ORACLE-AIBA-TON | API-CONTRACT, ADVISORY-TOKENOMICS | ✅ |

---

## 10. Implementation Inventory (Systematic)

| Component | Implementation | Doc |
|-----------|----------------|-----|
| Tiered referrals (10th=2×, 100th=5×) | `referrals.js` | ADVISORY |
| Invite-3 unlock (1% bonus) | `innovations.js`, `referralUnlock3BonusBps` | ADVISORY, AIBA-SELF-AUTOMATION |
| K-factor metrics | `GET /api/admin/referrals/metrics` | ADVISORY, API-AND-READINESS-AUDIT |
| Referral leaderboard + badges | `/api/referrals/top` | ADVISORY |
| Share via Telegram | `telegram.js` shareViaTelegram | ADVISORY |
| Trainers network/dashboard/leaderboard | `trainers.js`, `/trainer` | TRAINERS-MANUAL, AUDIT-AND-STATUS |
| Trainer viral recruitment | `?ref=CODE`, admin approval → 20 AIBA | TRAINERS-MANUAL |
| Economy automation | `economyAutomation.js`, allocation | AIBA-SELF-AUTOMATION |
| Token splits (15/25/50/10) | `tokenSplits.js`, EconomyConfig | ADVISORY |
| Oracle AIBA/TON (automated) | `aibaTonOracle.js`, cron, GET /api/oracle/price, admin oracle | ORACLE-AIBA-TON |
| Treasury ops | GET /api/treasury/ops | API-CONTRACT |
| Miniapp backend alignment | Treasury ops, Mentors upgrade, Trainers enrichment, 3D arena visuals | USER-GUIDE, VISION-3D-ARENAS-STATUS |