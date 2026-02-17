# Production env — Vercel (copy-paste)

Use these in **Vercel** → Project → **Settings** → **Environment Variables**. Replace `https://aiba-arena2-backend.vercel.app` with your **actual backend URL** if different.

---

## Miniapp project (Root: `miniapp`)

| Key | Value |
|-----|--------|
| **NEXT_PUBLIC_BACKEND_URL** | `https://aiba-arena2-backend.vercel.app` |
| **NEXT_PUBLIC_APP_URL** | `https://aiba-arena2-miniapp.vercel.app` |

*(If you leave these unset, the app still uses the same URLs by default when deployed at the known miniapp URL.)*

---

## Admin panel project (Root: `admin-panel`)

| Key | Value |
|-----|--------|
| **NEXT_PUBLIC_BACKEND_URL** | `https://aiba-arena2-backend.vercel.app` |

*(If unset, the admin panel uses this backend URL when deployed at the known admin URL.)*

---

## Backend project (Root: `backend`)

| Key | Value |
|-----|--------|
| **CORS_ORIGIN** | `https://aiba-arena2-miniapp.vercel.app,https://aiba-arena2-admin-panel.vercel.app` |

*(Plus all other backend vars: MONGO_URI, APP_ENV, TELEGRAM_BOT_TOKEN, ADMIN_JWT_SECRET, etc. — see [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md).)*

---

## URLs

| App | URL |
|-----|-----|
| **Miniapp** | https://aiba-arena2-miniapp.vercel.app |
| **Admin** | https://aiba-arena2-admin-panel.vercel.app |
| **Backend** | Your backend project URL (e.g. https://aiba-arena2-backend.vercel.app) |

After changing env, **redeploy** each project so the new values are used.
