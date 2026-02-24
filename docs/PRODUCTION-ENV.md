# Production environment variables (backend)

When **APP_ENV=prod** or **NODE_ENV=production**, the backend runs production readiness checks. Set these in your hosting (e.g. Vercel → Project → Settings → Environment Variables).

## Required for production

| Variable                              | Example / rules                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **TELEGRAM_INITDATA_MAX_AGE_SECONDS** | `900` (recommended 300–900 seconds)                                                                     |
| **ADMIN_JWT_SECRET**                  | At least 32 characters; **not** `dev-change-me`                                                         |
| **ADMIN_EMAIL**                       | Admin login email, e.g. `admin@yourdomain.com`                                                          |
| **ADMIN_PASSWORD_HASH**               | bcrypt hash (see below); **do not** use `ADMIN_PASSWORD` in production                                  |
| **BATTLE_SEED_SECRET**                | At least 32 characters; **not** `dev-secret-change-me`                                                  |
| **CORS_ORIGIN**                       | Comma-separated allow-list, e.g. `https://aiba-arena2-miniapp.vercel.app,https://your-admin.vercel.app` |
| **TELEGRAM_BOT_TOKEN**                | From [@BotFather](https://t.me/BotFather)                                                               |

## Generate ADMIN_PASSWORD_HASH

From the **backend** directory:

```bash
node scripts/hash-admin-password.js "YourSecurePassword"
```

Copy the output (starts with `$2a$10$` or `$2b$10$`) and set it as `ADMIN_PASSWORD_HASH` in production. Do **not** set `ADMIN_PASSWORD` in production.

## Generate strong secrets (ADMIN_JWT_SECRET, BATTLE_SEED_SECRET)

Use at least 32 random characters. Examples:

```bash
# Node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

Set one value as `ADMIN_JWT_SECRET` and a **different** value as `BATTLE_SEED_SECRET`.

## Summary checklist

- [ ] `TELEGRAM_INITDATA_MAX_AGE_SECONDS` = e.g. `900`
- [ ] `ADMIN_JWT_SECRET` = 32+ char secret (not dev placeholder)
- [ ] `ADMIN_EMAIL` = your admin email
- [ ] `ADMIN_PASSWORD_HASH` = output of `node scripts/hash-admin-password.js "your-password"`
- [ ] `BATTLE_SEED_SECRET` = 32+ char secret (not dev placeholder)
- [ ] `CORS_ORIGIN` = your miniapp (and admin) origins, comma-separated
- [ ] `TELEGRAM_BOT_TOKEN` = from BotFather

After setting these, redeploy the backend so the new env vars are picked up.
