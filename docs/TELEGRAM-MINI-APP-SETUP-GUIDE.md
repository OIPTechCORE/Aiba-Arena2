# How to Create and Set Up a Telegram Mini App — Deep Systematic Guide

This guide walks you through creating and configuring a **Telegram Mini App** from scratch, with your **AIBA Arena** miniapp as reference. Follow the steps in order.

---

## 1. What Is a Telegram Mini App?

- A **web app** (HTML/JS/CSS or React/Next.js) that runs **inside Telegram** (mobile or desktop).
- Users open it via a **bot menu button**, **inline button**, or **direct link**.
- Telegram injects the **Web App SDK** (`window.Telegram.WebApp`) and passes **initData** (signed user/session data) so your backend can authenticate the user.
- **HTTPS is required** for the app URL (no localhost in production).

**Official docs:** [Telegram Mini Apps](https://core.telegram.org/bots/webapps)

---

## 2. Prerequisites (Checklist)

| Item | Purpose |
|------|--------|
| **Telegram account** | To create the bot and test the app |
| **A bot** | Created via [@BotFather](https://t.me/BotFather); the Mini App is attached to this bot |
| **Web app URL** | Your app must be served over **HTTPS** (e.g. Vercel, Netlify, your server) |
| **Backend (optional)** | To verify `initData` and store user data (your project uses Express + MongoDB) |

---

## 3. Step-by-Step Setup

### Step 1 — Create a Telegram Bot

1. Open Telegram and search for **@BotFather**.
2. Send: `/newbot`
3. Follow the prompts:
   - **Bot name** (e.g. "AIBA Arena")
   - **Bot username** (e.g. `AibaArenaBot` — must end in `bot`)
4. BotFather replies with a **token** like `123456789:AAH...`. **Store it securely** (e.g. in `backend/.env` as `TELEGRAM_BOT_TOKEN`). Never commit the token to git.

**Useful BotFather commands later:**

- `/mybots` → select your bot → Bot Settings
- **Edit Bot** → change name, description, photo
- **Menu Button** or **Configure** → set the Mini App URL (see Step 4)

---

### Step 2 — Build Your Web App

Your app is a normal web app; the only Telegram-specific parts are:

1. **Load in Telegram context**  
   When opened inside Telegram, the Telegram client injects a script and sets `window.Telegram.WebApp`. You don’t need to add the script yourself; just use the API.

2. **Use the Web App API**  
   - **initData** — signed string (user id, username, auth date, etc.). Send it to your backend in a header (e.g. `x-telegram-init-data`) so the backend can verify the user.
   - **initDataUnsafe** — same data as JSON (convenient for UI); **do not trust it on the server** — always verify using `initData` on the backend.
   - **themeParams**, **viewport**, **MainButton**, **BackButton**, **openLink**, **close** — for look-and-feel and UX inside Telegram.

**In your AIBA Arena miniapp:**

- `miniapp/src/lib/telegram.js` — reads `initData` and `initDataUnsafe.user`.
- `miniapp/src/lib/api.js` — sends `x-telegram-init-data` (and optional `x-telegram-id` for dev) on every request.
- Backend validates `initData` (e.g. with `TELEGRAM_BOT_TOKEN`) before trusting the user.

**Minimal client usage:**

```javascript
// Get initData string (send to backend for verification)
const initData = window.Telegram?.WebApp?.initData || '';

// Get user for display only (never trust on server)
const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
// user.id, user.first_name, user.username, etc.

// Expand to full height (recommended)
window.Telegram?.WebApp?.expand();

// Ready event (optional)
window.Telegram?.WebApp?.ready();
```

---

### Step 3 — Host Your App (HTTPS)

Telegram requires **HTTPS** for the Mini App URL (except for local testing with a tunnel).

**Options:**

| Option | Typical use |
|--------|-------------|
| **Vercel** | Next.js (your miniapp). Connect GitHub repo, set build command and output, add env (e.g. `NEXT_PUBLIC_BACKEND_URL`). You get `https://your-app.vercel.app`. |
| **Netlify** | Similar: connect repo, build Next.js or static site. |
| **Your server** | Serve the built app (e.g. `miniapp/out` for static export or Node with `next start`) behind HTTPS (nginx + Let’s Encrypt or similar). |

**For AIBA Arena:**

- Miniapp is in `miniapp/`. Build: `cd miniapp && npm install && npm run build`.
- Set `NEXT_PUBLIC_BACKEND_URL` to your backend API URL (e.g. `https://your-backend.onrender.com`).
- Deploy the miniapp (e.g. Vercel) and note the **root URL** (e.g. `https://aiba-arena2-miniapp.vercel.app`). This will be the **Mini App URL** in Telegram.

---

### Step 4 — Attach the Mini App to Your Bot

You must tell Telegram which URL to open when users tap the bot’s menu or a “Open App” button.

**Option A — Menu button (recommended)**

1. In Telegram, open [@BotFather](https://t.me/BotFather).
2. Send `/mybots` → choose your bot.
3. **Bot Settings** → **Menu Button** → **Configure menu button** (or **Configure** → **Menu Button**).
4. Set:
   - **Menu button URL:** your app URL, e.g. `https://aiba-arena2-miniapp.vercel.app`
   - Optionally set **Menu button text** (e.g. "Play" or "Open Arena").

When users open the bot, they’ll see a menu button that opens your Mini App.

**Option B — Set via Bot API**

You can set the menu button programmatically:

```http
POST https://api.telegram.org/bot<TOKEN>/setChatMenuButton
Content-Type: application/json

{
  "menu_button": {
    "type": "web_app",
    "text": "Open Arena",
    "web_app": { "url": "https://your-miniapp.vercel.app" }
  }
}
```

Replace `<TOKEN>` and the URL. This sets the menu button for the bot.

**Option C — Inline / In-chat link**

You can open the Mini App from any link that points to your app URL, or from an inline button that uses `web_app` (see [Telegram Bot API: WebAppInfo](https://core.telegram.org/bots/api#webappinfo)).

---

### Step 5 — Backend: Verify initData (Security)

**Never trust data only from the client.** Always verify `initData` on the server.

1. Client sends the raw **initData** string in a header (e.g. `x-telegram-init-data`).
2. Backend:
   - Parses the key-value pairs (e.g. `hash=...&user=...&auth_date=...`).
   - Checks **auth_date** is recent (e.g. not older than 5–15 minutes) to prevent replay.
   - Builds a **data-check string** and verifies the **hash** using your bot token as HMAC secret (SHA-256).

**Algorithm (conceptual):**

- Sort key-value pairs (excluding `hash`) by key, format as `key1=value1\nkey2=value2\n...`.
- Compute `HMAC-SHA256(data_check_string, secret)` where `secret` = `HMAC-SHA256(bot_token, "WebAppData")`.
- Compare result (hex) with the `hash` from initData.

Libraries (e.g. `telegram-validate-webapp` or similar) often do this for you. Your backend already uses initData for auth (e.g. `requireTelegram` middleware); ensure it validates the hash and auth_date.

**Environment:**

- `TELEGRAM_BOT_TOKEN` — same token from BotFather.
- `TELEGRAM_INITDATA_MAX_AGE_SECONDS` (e.g. 300–900) — reject initData older than this.

---

### Step 6 — Environment Variables Summary

**Miniapp (e.g. Vercel):**

| Variable | Example | Purpose |
|----------|---------|--------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://your-api.onrender.com` | API base URL for the miniapp |
| `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` | (optional) full URL to TonConnect manifest | If not set, miniapp uses same origin `/api/tonconnect-manifest` |

**Backend:**

| Variable | Purpose |
|----------|--------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather; used for initData validation and optional notifications |
| `TELEGRAM_INITDATA_MAX_AGE_SECONDS` | Max age of initData in seconds (e.g. 300) |

---

### Step 7 — Test the Flow

1. **Local (no Telegram):**  
   Run miniapp (`npm run dev`) and backend locally. Your app may use `x-telegram-id` for dev when initData is missing; backend should allow that only in dev.

2. **Inside Telegram:**  
   - Deploy miniapp to HTTPS (e.g. Vercel).  
   - Set the bot’s menu button URL to that HTTPS URL.  
   - Open the bot in Telegram and tap the menu button.  
   - The Mini App should open; `window.Telegram.WebApp` and `initData` will be present.  
   - Test login/API calls; backend should receive and validate `x-telegram-init-data`.

3. **Tunnels (optional):**  
   For local HTTPS testing inside Telegram, use a tunnel (e.g. ngrok, Cloudflare Tunnel) and temporarily set the menu button URL to the tunnel URL.

---

### Step 8 — Optional: TonConnect / TON

If your app uses **TonConnect** (e.g. for wallet connect and claims):

- Host a **TonConnect manifest** at a **public HTTPS URL** (same origin as the miniapp is fine, e.g. `https://your-miniapp.vercel.app/api/tonconnect-manifest`).
- In your miniapp, set `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` to that full URL if the wallet expects an absolute URL.
- Your `tonconnect-manifest.json` (or dynamic route) should expose `url`, `name`, `iconUrl` for the Mini App.

---

## 9. Checklist — Create and Set Up a Mini App

- [ ] Create a bot with [@BotFather](https://t.me/BotFather) and save the token.
- [ ] Build the web app (e.g. Next.js); use `window.Telegram.WebApp` for initData and UX.
- [ ] Deploy the app to an **HTTPS** URL (e.g. Vercel, Netlify).
- [ ] Set the bot’s **menu button** (or equivalent) to the app URL.
- [ ] Backend: validate **initData** (hash + auth_date) using `TELEGRAM_BOT_TOKEN`.
- [ ] Set **TELEGRAM_INITDATA_MAX_AGE_SECONDS** and use it in validation.
- [ ] Configure **NEXT_PUBLIC_BACKEND_URL** (and optional TonConnect manifest URL) for the miniapp.
- [ ] Open the bot in Telegram and tap the menu button; confirm the app loads and API calls work with initData.

---

## 10. References

- [Telegram Mini Apps (Bots: Mini Apps)](https://core.telegram.org/bots/webapps)
- [BotFather](https://t.me/BotFather)
- [Telegram WebApp API (JavaScript)](https://core.telegram.org/bots/webapps#javascript-api)
- Your repo: `miniapp/src/lib/telegram.js`, `miniapp/src/lib/api.js`, `backend` auth/initData validation.

This guide gives you a **systematic path**: create bot → build app → host on HTTPS → attach URL to bot → verify initData on backend → test in Telegram.
