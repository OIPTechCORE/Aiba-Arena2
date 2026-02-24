'use client';

import { useEffect } from 'react';

/**
 * Ensures the TonConnect widget root does not block clicks on the app (home grid, etc.).
 * The library injects a full-viewport div that can capture pointer events; we force
 * it and its non-interactive children to pointer-events: none via the DOM so the
 * grid and all app buttons remain clickable. Connect Wallet button (actual <button>/<a>)
 * is left interactive.
 */
function setWidgetPassThrough(root) {
    if (!root || typeof root.style === 'undefined') return;
    root.style.setProperty('pointer-events', 'none', 'important');
    const isInteractive = (el) => {
        if (!el || el.nodeType !== 1) return false;
        const tag = el.tagName && el.tagName.toLowerCase();
        const role = el.getAttribute && el.getAttribute('role');
        if (tag === 'button' || tag === 'a' || role === 'button') return true;
        return false;
    };
    const walk = (el) => {
        if (!el || el.nodeType !== 1) return;
        if (isInteractive(el)) {
            el.style.setProperty('pointer-events', 'auto', 'important');
        } else {
            el.style.setProperty('pointer-events', 'none', 'important');
        }
        for (let i = 0; i < (el.children && el.children.length) || 0; i++) walk(el.children[i]);
    };
    for (let i = 0; i < root.children.length; i++) walk(root.children[i]);
}

function isModalOpen(root) {
    return root && root.querySelector && root.querySelector('[data-tc-modal="true"]');
}

export function TonConnectClickFix() {
    useEffect(() => {
        let tick = 0;
        const maxTicks = 50;
        const apply = () => {
            const root = document.getElementById('tc-widget-root');
            if (root) {
                if (isModalOpen(root)) {
                    root.style.setProperty('pointer-events', 'auto', 'important');
                    const all = root.querySelectorAll('*');
                    for (let i = 0; i < all.length; i++)
                        all[i].style.setProperty('pointer-events', 'auto', 'important');
                } else {
                    setWidgetPassThrough(root);
                }
            }
            tick++;
            if (tick < maxTicks) id = setTimeout(apply, 200);
        };
        let id = setTimeout(apply, 100);
        const observer = typeof MutationObserver !== 'undefined' ? new MutationObserver(() => apply()) : null;
        if (observer) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
        return () => {
            clearTimeout(id);
            if (observer) observer.disconnect();
        };
    }, []);
    return null;
}
