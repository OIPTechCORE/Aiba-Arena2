# Seamlessness scan — AIBA Arena app

Deep scan for consistent UX, layout, and flow across the whole app.

## Summary

- **Navigation**: Nav hub grid (15 sections); tab change scrolls active panel into view.
- **Layout**: Safe-area insets on app shell; TonConnect modal full-viewport; no clipping.
- **Content**: University module body scrolls when long; hero one-line strip can scroll horizontally with thin scrollbar.
- **State**: Single `busy` state; API errors surfaced via `getErrorMessage`; try/finally ensures `setBusy(false)`.

## Checks performed

| Area | Status | Notes |
|------|--------|--------|
| Tab switch → content visible | ✅ | `useEffect` on `tab` scrolls `.tab-content` into view (smooth). |
| Safe area (notches / home bar) | ✅ | `.aiba-app` uses `env(safe-area-inset-*)` for padding. |
| TonConnect modal | ✅ | `#tc-widget-root` full viewport; body `overflow: visible` when modal open; inner content scrollable. |
| University modules | ✅ | `.university-module__body` has `max-height: 50vh` and `overflow-y: auto`. |
| Hero one-line strip | ✅ | `overflow-x: auto`; thin scrollbar; `white-space: nowrap` on title/sub/hint/Enter. |
| Tab content scroll target | ✅ | `.tab-content` has `scroll-margin-top` so it doesn’t sit under header. |
| Busy state | ✅ | 63 `setBusy(true)` and 63 `setBusy(false)` (in finally blocks). |
| API errors | ✅ | `getErrorMessage()` used for user-facing messages; interceptors normalize payload. |
| Panel visibility | ✅ | `.tab-panel.is-active` display block; others `display: none`; `aria-hidden` set. |

## Files touched (seamlessness updates)

- `miniapp/src/app/page.js` — scroll-into-view on tab change.
- `miniapp/src/app/globals.css` — safe-area padding, tab-content scroll-margin, university body scroll, hero scrollbar.

## Recommendations

- Keep a single global `busy` so all actions disable consistently.
- When adding new async actions, use try/catch/finally with `setBusy(false)` in `finally`.
- For new modals or overlays, ensure `z-index` and `overflow` don’t clip content; use `100dvh` / safe-area where relevant.
