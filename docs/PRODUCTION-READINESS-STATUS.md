# Production Readiness Status

**Short answer:** **Not yet deeply production-ready.** The stack is **testnet/MVP-ready** and has **strong guardrails** (fail-fast checks, docs, runbooks). To be **deeply ready for production (mainnet)** you must complete env, key isolation, operational setup, and a few code/ops follow-ups.

---

## What is already in place ✅

### Backend (enforced at startup when `APP_ENV=prod` or `NODE_ENV=production`)

- **CORS:** Must set `CORS_ORIGIN` (comma-separated allow-list); unset = allow-all → **backend refuses to start** in prod.
- **Telegram:** `TELEGRAM_BOT_TOKEN` required; `TELEGRAM_INITDATA_MAX_AGE_SECONDS` required, numeric, > 0 (recommended 300–900s).
- **Admin auth:** `ADMIN_JWT_SECRET` (≥ 32 chars, no dev placeholder), `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (plaintext `ADMIN_PASSWORD` disallowed in prod).
- **Battle determinism:** `BATTLE_SEED_SECRET` ≥ 32 chars, no dev placeholder.
- **Vault/claims:** If any of `ARENA_VAULT_ADDRESS`, `AIBA_JETTON_MASTER`, `ORACLE_PRIVATE_KEY_HEX` is set, **all three** required; `TON_PROVIDER_URL` required and **must not be testnet**; `ORACLE_PRIVATE_KEY_HEX` must be 64 hex chars.
- **Legacy dispatch:** `ENABLE_LEGACY_PENDING_AIBA_DISPATCH` must not be `true` in production.

### Docs and ops

- **mainnet-readiness.md** — Key management, validation defaults, checklist enforcement, security review steps.
- **runbook.md** — Key summary, incident response, production safety checks, key rotation (incl. oracle), security playbooks.
- **monitoring.md** — Log drain, uptime `/health`, Prometheus `/metrics`, suggested alerts and metric names.
- **deployment.md** — Backend (Render/Railway + Vercel separate project, root `backend/`), env (incl. CORS_ORIGIN, vault/claim), miniapp/admin.

### Application behavior

- Idempotency for economy credits/debits (ledger row first, duplicate-safe).
- Admin economy PATCH validation in prod (reject unknown fields).
- Rate limiting (in-memory, IP/telegramId); battle route has stricter per-user limit.
- `/health` and `/metrics` exposed for uptime and Prometheus.

---

## What you must do before production 🔴

### 1. Environment and secrets

- Set **all** required env in the **production** backend (see `docs/deployment.md`, `backend/.env.example`, `docs/mainnet-readiness.md`).
- Use a **secret manager** (Vercel/Render/Railway secrets, Vault, or cloud secrets manager); **no secrets in repo**.
- Set `APP_ENV=prod` (or `NODE_ENV=production`) so fail-fast checks run; set `CORS_ORIGIN` to your real frontend origins (comma-separated).
- If using vault/claims: set `ARENA_VAULT_ADDRESS`, `AIBA_JETTON_MASTER`, `ORACLE_PRIVATE_KEY_HEX`, **mainnet** `TON_PROVIDER_URL`, and `TON_API_KEY` (recommended to avoid rate limits).

### 2. Key separation and rotation

- **Separate** contract deployer key, oracle key (`ORACLE_PRIVATE_KEY_HEX`), admin JWT secret, Telegram bot token, battle seed.
- **Rotate** any key that ever touched a developer machine before going live.
- Have a **rotation plan** for `ORACLE_PRIVATE_KEY_HEX` (requires updating oracle on-chain + backend secret); document and rehearse.

### 3. Operational readiness

- **Monitoring:** Configure log drain, uptime checks for `GET /health`, Prometheus scraping for `GET /metrics`, and (if using vault) TON provider error-rate and vault inventory alerts (see `docs/monitoring.md`).
- **Backups:** Enable MongoDB backups (e.g. Atlas snapshots) and **test restore**.
- **Runbook:** Confirm team can follow `docs/runbook.md` (incident response, key rotation, security playbooks).

---

## What is recommended for “deep” production readiness 🟡

### Code / architecture

- **Rate limiting:** Replace **in-memory** rate limit with a **shared store (e.g. Redis)** if you run **multiple backend instances**; otherwise limits are per-instance and can be circumvented. See `backend/middleware/rateLimit.js` and `docs/mainnet-readiness.md`.
- **Signing isolation:** Move reward-claim signing behind a **dedicated signing service or KMS/HSM** with strict allow-lists (vault address, jetton master, max amount, max claims per user/day). See `docs/mainnet-readiness.md` (“Signing isolation”).

### Security and review

- **Contract review:** Vault claim invariants (recipient binding, seqno, expiry); marketplace escrow invariants; NFT transfer/bounce handling.
- **Backend review:** No secrets in logs; CORS and `trust proxy` correct; admin auth (hash params, token expiry); **database indexes** for all high-volume queries.

### Checklist before go-live

- [ ] All production env set in secret manager; `APP_ENV=prod` (or `NODE_ENV=production`); backend starts without PROD_READINESS_FAILED.
- [ ] CORS_ORIGIN set to production frontend URLs only.
- [ ] Keys separated and rotated; oracle rotation rehearsed.
- [ ] Monitoring and alerting live (health, metrics, vault/TON if applicable).
- [ ] Backups enabled and restore tested.
- [ ] Runbook and security playbooks read and agreed.

---

## Summary

| Area              | Status        | Note |
|-------------------|---------------|------|
| Testnet / MVP     | ✅ Ready      | Contracts, backend, miniapp, admin; fail-fast in prod. |
| Prod env + CORS   | 🔴 You must set | Required for backend to start in prod. |
| Keys & secrets    | 🔴 You must do  | Separate keys, secret manager, rotate if exposed. |
| Ops (monitor/backup/runbook) | 🔴 You must configure | Monitoring, backups, runbook follow-through. |
| Rate limit (multi-instance) | 🟡 Recommended | Redis (or shared store) for multi-instance. |
| Signing isolation | 🟡 Recommended | Dedicated signer/KMS + allow-lists. |
| Security/contract review | 🟡 Recommended | Before mainnet go-live. |

**Bottom line:** You are **not deeply ready for production** until env is set, keys are isolated and rotated, and monitoring, backups, and runbook are in place. The **codebase and docs** are in good shape for that path; the remaining work is **configuration, key management, and operations**.
