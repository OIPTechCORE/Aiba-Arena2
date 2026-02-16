# Miniapp home page grid buttons – investigation

## Summary

The home page 4×4 grid (Brokers, Arenas, Market, Tasks, etc.) was not responding to clicks. Investigation showed that the **TonConnect widget root** (`#tc-widget-root`), which is injected by `@tonconnect/ui-react` and covers the full viewport with `position: fixed` and `z-index: 10000`, was capturing all pointer events. Its child elements (wrapper divs) use the default `pointer-events: auto`, so they sat on top of the app and blocked clicks to the grid and the rest of the page.

## Fix (in `miniapp/src/app/globals.css`)

1. **`#tc-widget-root * { pointer-events: none; }`**  
   All descendants of the widget pass clicks through, so full‑viewport wrappers no longer block the app.

2. **`#tc-widget-root button, #tc-widget-root a, #tc-widget-root [role="button"] { pointer-events: auto; }`**  
   Only real controls inside the widget (e.g. Connect Wallet button, links) receive clicks.

3. **`#tc-widget-root:has([data-tc-modal="true"]) * { pointer-events: auto; }`**  
   When the wallet modal is open, the modal content is made interactive again.

4. **Defensive styles**  
   - `.aiba-app`: `position: relative`, `z-index: 1`, `pointer-events: auto`  
   - `main.app-main`: `position: relative`, `pointer-events: auto`  
   - `.home-grid` and `.home-grid__item`: `pointer-events: auto`  

   So the app and the grid are explicitly marked as interactive and not dependent on inheritance.

## Flow checked

- **React**: Grid items are `<button type="button" className="home-grid__item" onClick={() => setTab(id)}>`. `setTab` is from `useState('home')` in `HomeContent.js`. Tab panels use `tab === 'home' ? 'is-active' : ''` and `.tab-panel.is-active { display: block }`, so changing `tab` correctly switches panels. No bug found in React or state.
- **DOM**: Root is `<div className="aiba-app">`; inside it, header, balance strip, hero, then `<div className="tab-content">` and `<section className="tab-panel ... is-active">` containing `<div className="home-grid">` and the buttons. No wrapper with `pointer-events: none` or overlay from our code covering the grid.
- **Overlays that can block when visible** (not the cause when they are hidden):
  - `.legal-consent-overlay` (z-index 10000) – legal consent
  - `.cinematic` (z-index 10000) – first‑time intro
  - `.tutorial-overlay` (z-index 9999) – tutorial steps 1–4
  - `#tc-widget-root` (z-index 10000) – always present; fixed by the rules above.

## How to verify

1. Hard refresh the miniapp (e.g. Ctrl+Shift+R).
2. Ensure no legal/cinematic/tutorial overlay is showing (dismiss if needed).
3. Click grid items (e.g. Brokers, Market, Tasks); the tab should switch and the corresponding panel should show.
4. Click “Connect Wallet” in the header; the TonConnect modal should open and remain clickable.
5. In devtools, confirm `#tc-widget-root` exists under `body` and that our CSS rules are applied (no overrides forcing `pointer-events: auto` on its non‑button descendants).

## Files touched

- `miniapp/src/app/globals.css`: TonConnect pointer‑events rules, comments, and defensive `pointer-events` / positioning on `.aiba-app`, `main.app-main`, `.home-grid`, `.home-grid__item`.
