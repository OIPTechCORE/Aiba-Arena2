# Connect TON Wallet — Deep Scan Report

This document confirms that **Connect your TON wallet** is correctly wired and what to do for full functionality (including localhost and Error -102).

---

## 1. Architecture (verified)

| Layer | Location | Role |
|-------|----------|------|
| **Provider** | `miniapp/src/app/providers.js` | `TonConnectUIProvider` with `manifestUrl` and `uiPreferences.theme: 'DARK'` |
| **Manifest API** | `miniapp/src/app/api/tonconnect-manifest/route.js` | Serves app manifest at `GET /api/tonconnect-manifest` (url, name, iconUrl) |
| **Manifest URL** | Client: `window.location.origin + '/api/tonconnect-manifest'` or `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` | Wallets fetch this to discover the dApp |
| **Connect button** | `miniapp/src/app/page.js` | When disconnected: custom button calls `tonConnectUI?.openModal?.()`; when connected: `<TonConnectButton />` |
| **Wallet sync** | `page.js` useEffect | On `wallet?.account?.address` change, POST `/api/wallet/connect` with `{ address }` to save wallet for the user |
| **Claim on-chain** | `page.js` → `claimOnChain()` | Uses `tonConnectUI.sendTransaction()` with payload from `lib/tonRewardClaim.js` (ArenaRewardVault claim) |

---

## 2. Manifest (dApp discovery)

- **Route:** `miniapp/src/app/api/tonconnect-manifest/route.js`
- **Response:** `{ url, name: 'AIBA Arena', iconUrl }` where `url` and `iconUrl` use `getBaseUrl()` (from `x-forwarded-proto`/`host` or `NEXT_PUBLIC_APP_URL`).
- **TON requirement:** [TON Connect manifests](https://docs.ton.org/ecosystem/ton-connect/manifest) require **iconUrl in PNG or ICO** (180×180 px PNG recommended). **SVG is not supported** by the spec. The app currently serves `icon.svg`; some wallets may show a fallback or broken icon. For full compatibility, add `miniapp/public/icon.png` (180×180) and point the manifest to `/icon.png` (see §6 below).
- **Public access:** Manifest must be GET-able without auth. The route returns JSON with no CORS restriction from your app; ensure your host (e.g. Vercel) does not require auth for this path.

---

## 3. Connect button and modal

- **When disconnected:** A custom "Connect Wallet" button with `aria-label="Connect TON wallet"` calls `tonConnectUI?.openModal?.()`. Optional chaining avoids errors if the UI is not ready yet.
- **When connected:** `<TonConnectButton />` is rendered so the user can disconnect or change wallet.
- **Modal styling:** `miniapp/src/app/globals.css` targets `#tc-widget-root` and `[data-tc-modal="true"]` with fixed overlay, `100dvh`, safe-area insets, and responsive width (e.g. full width ≤440px). Layout uses `viewportFit: 'cover'` for notched devices.

---

## 4. Wallet → backend sync

- On connect, the miniapp POSTs to `/api/wallet/connect` with `{ address: wallet.account.address }`.
- Backend: `backend/routes/wallet.js` — `requireTelegram`, validates `address`, updates `User` by `telegramId` with `wallet: address`. Required for linking the Telegram user to the TON address (claims, rewards).

---

## 5. Claim on-chain (TonConnect)

- **Flow:** User has a signed claim from the backend → clicks "Claim on-chain (TonConnect)" → `claimOnChain()`:
  - Ensures `lastClaim`, `wallet.account.address`, and that the connected wallet matches `claim.toAddress`.
  - Builds payload with `buildRewardClaimPayload()` from `lib/tonRewardClaim.js`.
  - Calls `tonConnectUI.sendTransaction({ validUntil, messages: [{ address: vaultAddress, amount: '70000000', payload }] })`.
  - Polls `/api/vault/claim-status` until confirmed or timeout.
- **Other sendTransaction usages:** Same pattern used for listing/buy flows (e.g. asset marketplace) where a TON/token tx is required.

---

## 6. Localhost and Error -102

### Error -102 (ERR_CONNECTION_REFUSED)

- **Meaning:** The browser (or Telegram in-app browser) could not open the URL (e.g. `http://localhost:3000/`). Connection refused usually means:
  1. **Dev server not running** — Start the app with `npm run dev` (from project root) or `npm run dev --prefix miniapp`, then open `http://localhost:3000` in a **desktop browser** on the same machine.
  2. **Opening from Telegram or another app** — Many in-app browsers (e.g. Telegram Mini App on mobile) **cannot reach `localhost`** because that refers to the device, not your PC. Use an HTTPS deployment or a tunnel (e.g. ngrok) for testing from Telegram.

### Connect Wallet on localhost

- **Manifest URL:** On localhost, the provider uses `http://localhost:3000/api/tonconnect-manifest`. Desktop **browser extension** wallets (e.g. Tonkeeper extension) can load this because they run in the same browser.
- **Mobile wallets** (Tonkeeper app, etc.) run on the user’s phone and cannot fetch `http://localhost:3000` from your dev machine. So:
  - **Option A:** Test Connect Wallet on localhost with a **browser extension** wallet only.
  - **Option B:** Deploy the miniapp to HTTPS (e.g. Vercel) or expose localhost via **ngrok** (`npm run tunnel`), and set `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` to that HTTPS URL (e.g. `https://your-app.vercel.app/api/tonconnect-manifest`) so mobile wallets can load the manifest.

---

## 7. Checklist for “Connect your TON wallet” fully functional

| Check | Status / action |
|-------|------------------|
| TonConnectUIProvider wraps the app with a valid manifestUrl | ✅ `providers.js` |
| Manifest API returns url, name, iconUrl (GET, no auth) | ✅ `api/tonconnect-manifest/route.js` |
| Icon format (PNG/ICO 180×180 recommended) | ⚠️ Use PNG for full compatibility; add `icon.png` and point manifest to it (see below) |
| Connect button opens wallet list when disconnected | ✅ `tonConnectUI?.openModal?.()` |
| TonConnectButton shown when connected | ✅ `page.js` header |
| Wallet address synced to backend after connect | ✅ POST `/api/wallet/connect` in useEffect |
| Claim on-chain uses sendTransaction and matches claim.toAddress | ✅ `claimOnChain()` |
| Localhost: dev server running; use browser or tunnel for mobile | ✅ Documented above |
| Error -102: start dev server and/or use HTTPS/tunnel | ✅ §6 |

### Optional: PNG icon for manifest

1. Add `miniapp/public/icon.png` (180×180 px, PNG).
2. In `miniapp/src/app/api/tonconnect-manifest/route.js`, set `iconUrl` to `\`${baseUrl}/icon.png\`` instead of `icon.svg`.

---

## 8. Summary

Connect your TON wallet is **correctly implemented**: provider, manifest route, Connect button, modal, wallet sync, and on-chain claim flow are in place and consistent with TON Connect. For **full** compatibility and best UX:

- Use a **PNG (or ICO) app icon** in the manifest.
- On **localhost**, run the dev server and use a desktop browser (or ngrok + HTTPS manifest URL for mobile).
- **Error -102** is resolved by ensuring the app is reachable (server running, or use a public HTTPS URL).
