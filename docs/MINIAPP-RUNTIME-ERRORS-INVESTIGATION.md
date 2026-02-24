# Miniapp runtime errors — investigation

This doc summarizes the two runtime errors seen in production (Vercel) and what was found.

---

## Quick checklist when you see these errors

| Error                                                         | Cause                                  | What to do                                                                                                                                                                                                                                     |
| ------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **webpage_content_reporter.js** … `Unexpected token 'export'` | Browser extension injecting a script   | **Ignore.** Test in Incognito with extensions disabled to confirm it goes away.                                                                                                                                                                |
| **117-….js** … `Cannot access 'dw' before initialization`     | Next.js App Router runtime chunk (TDZ) | 1) Ensure miniapp uses **Next 14.2.18** in `miniapp/package.json`. 2) Redeploy: `cd miniapp && del package-lock.json && npm install`, then commit & push. 3) If it persists, try Next **13.5.8** (different runtime) or defer TonConnect load. |

---

## 1. `webpage_content_reporter.js:1 Uncaught SyntaxError: Unexpected token 'export'`

### Finding

- **Not from our repo.** There is no file named `webpage_content_reporter.js` or `content_reporter` in the codebase.
- The name suggests a **browser extension** (e.g. a “webpage content reporter” or scraper) that injects a script into the page.
- The error means that script uses ESM (`export`) but is executed as a classic script (no `type="module"`), which is an extension bug, not an app bug.

### What to do

- **Ignore for app correctness:** Our app cannot fix third‑party extension code.
- **To confirm:** Open the miniapp in **Incognito/Private** with **all extensions disabled**. If the `webpage_content_reporter.js` error disappears, it’s from an extension.
- Optionally mention in docs/README that users should disable conflicting extensions if they see odd console errors.

---

## 2. `117-87e1257a64a40675.js:1 ReferenceError: Cannot access 'dw' before initialization`

### Finding

- **Chunk 117** is part of the **Next.js App Router runtime** (in `rootMainFiles`). It contains:
    - Next.js router (hydrate, appBootstrap, addBasePath, reducer, fetchServerResponse, etc.)
    - React scheduler (MessageChannel, `unstable_scheduleCallback`)
    - Polyfills and framework helpers
- The stack points at **MessagePort.M** (scheduler) and then into the **page** chunk. So the failure happens when the scheduler runs work that touches code in chunk 117 where a minified binding (e.g. `dw`) is used before its declaration (TDZ).
- This is consistent with **circular dependency or module initialization order** inside the framework/runtime chunk, not with our app source files. Our app already:
    - Uses **dynamic import** for `HomeContent` and for **Providers** (TonConnect).
    - **Lazy-loads** `tonJetton` and `tonRewardClaim` (and thus `@ton/core`) only when building payloads, so `@ton/core` is not in the initial page bundle.

### What we already did

1. **transpilePackages:** `['@tonconnect/ui-react', '@ton/core']` in `next.config.js`.
2. **Lazy TON payload libs:** No top-level import of `tonJetton` / `tonRewardClaim` in `HomeContent.js`; they are `await import('../lib/tonJetton')` / `tonRewardClaim` at call sites.

### Diagnostics run

- **Circular dependencies:** `npx madge --circular src` in miniapp reports **no circular dependency** in app code. The TDZ is therefore in the Next.js runtime chunk (117) or its bundling, not in our imports.
- **Production source maps:** `productionBrowserSourceMaps: true` is set in `miniapp/next.config.js` so you can see original source when debugging the minified `117` / `dw` error in production.

### Options if the error persists

1. **Verify deployment**  
   Ensure the latest commit (with lazy TON payloads and no top-level `@ton/core` in the page) is what Vercel built. Redeploy without cache if needed.

2. **Reproduce without extensions**  
   Reproduce in Incognito with extensions disabled so only the `117` error is in play.

3. **Next.js version**  
   The miniapp is pinned to **Next.js 14.2.18** (in `miniapp/package.json`) to avoid a TDZ in the App Router runtime chunk seen with 14.2.35. If the error persists, try 14.2.16 or 13.5.x.

4. **Defer TonConnect until interaction**  
   Load the TonConnect provider only when the user clicks “Connect wallet” (or similar), so the provider chunk and its dependencies load later. That can change the order in which chunks (including 117) are evaluated and may avoid the current TDZ path.

5. **Clear build cache**  
   On Vercel: Redeploy → uncheck “Use existing Build Cache”. Locally: delete `miniapp/.next` and run `npm run build` again.

---

## Summary

| Error                                                       | Source                                                    | Action                                                                                                                 |
| ----------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `webpage_content_reporter.js` … `Unexpected token 'export'` | Almost certainly a **browser extension**                  | Ignore for app; confirm in Incognito without extensions.                                                               |
| `117-….js` … `Cannot access 'dw' before initialization`     | **Next.js App Router runtime** chunk (module order / TDZ) | Already mitigated by lazy TON libs; if it persists, try deploy verification, Next patch, or deferring TonConnect load. |
