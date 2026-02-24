# Key Rotation Runbook — AIBA Arena

Step-by-step procedures for rotating secrets when compromised or as part of regular security practice.

**General rule:** Rotate immediately if a key is exposed. For routine rotation, schedule during low-traffic windows and coordinate with on-chain updates.

---

## 1. Oracle Key (`ORACLE_PRIVATE_KEY_HEX`)

**Purpose:** Signs reward-claim messages for on-chain vault.

**Rotation steps:**

1. **Generate new keypair** (64 hex chars for private key).
2. **Update on-chain vault:** Call vault contract `set_oracle` with new public key. Requires contract owner/admin.
3. **Update backend:** Set new `ORACLE_PRIVATE_KEY_HEX` in secret manager / env.
4. **Restart backend** to pick up new key.
5. **Verify:** `GET /api/vault/last-seqno?to=<vault_addr>` succeeds; run a test claim.

**Rollback:** Revert to previous oracle via `set_oracle` if new key has issues.

---

## 2. Admin JWT Secret (`ADMIN_JWT_SECRET`)

**Purpose:** Signs admin session tokens.

**Rotation steps:**

1. **Generate new secret** (≥32 chars, cryptographically random).
2. **Update backend:** Set new `ADMIN_JWT_SECRET` in secret manager / env.
3. **Restart backend.**
4. **Effect:** All existing admin sessions invalidated. Admins must log in again.

**Rollback:** Restore previous secret and restart; old sessions will work again.

---

## 3. Admin Password (`ADMIN_PASSWORD_HASH`)

**Purpose:** Admin login. Stored as bcrypt hash, not plaintext.

**Rotation steps:**

1. **Generate new bcrypt hash:**
    ```bash
    node -e "const bcrypt=require('bcrypt'); bcrypt.hash('NEW_STRONG_PASSWORD', 10).then(h=>console.log(h));"
    ```
2. **Update backend:** Set new `ADMIN_PASSWORD_HASH` in secret manager / env.
3. **Restart backend** (or wait for next deploy).
4. **Effect:** Old admin password no longer works. Use new password for login.

**Rollback:** Restore previous hash.

---

## 4. Telegram Bot Token (`TELEGRAM_BOT_TOKEN`)

**Purpose:** Telegram Mini App bot authentication.

**Rotation steps:**

1. **Revoke and create new token** via [@BotFather](https://t.me/BotFather): `/revoke` or create new bot.
2. **Update backend:** Set new `TELEGRAM_BOT_TOKEN` in secret manager / env.
3. **Restart backend.**
4. **Update miniapp** if bot username/URL changed (e.g. new bot link).

**Rollback:** Re-issue token from BotFather; update env and restart.

---

## 5. Battle Seed Secret (`BATTLE_SEED_SECRET`)

**Purpose:** Deterministic battle RNG. Changing alters battle outcomes.

**Rotation steps:**

1. **Generate new secret** (≥32 chars).
2. **Update backend:** Set new `BATTLE_SEED_SECRET` in secret manager / env.
3. **Restart backend.**
4. **Effect:** Battle randomness changes. No on-chain impact.

**Note:** Rotate only when necessary (e.g. compromise). Routine rotation not recommended due to determinism implications.

---

## 6. Checklist Before Rotation

- [ ] New keys/secrets generated with strong randomness
- [ ] Backup of current values (encrypted) in case rollback needed
- [ ] Maintenance window or low-traffic period scheduled
- [ ] For oracle: contract `set_oracle` call prepared

---

## 7. Post-Rotation Verification

- [ ] `GET /health` returns `{ ok: true }`
- [ ] Admin login works (if JWT/password rotated)
- [ ] Test claim succeeds (if oracle rotated)
- [ ] Telegram initData validates (if bot token rotated)

Run: `node scripts/monitoring-check.js` and `node scripts/health-check.js`.

---

## 8. References

- [OPERATIONS.md](OPERATIONS.md) — Key management overview, incident response
- [BACKUP-RUNBOOK.md](BACKUP-RUNBOOK.md) — Backup and restore procedures
- [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md) — Env variables
