'use client';

import { useState, useEffect } from 'react';

/**
 * Renders children only after client mount and once the document is ready.
 * Avoids hydration errors, "can't access lexical declaration before initialization",
 * and "Layout was forced before the page was fully loaded" / FOUC when styles
 * or dependencies load after first paint.
 */
export function ClientOnly({ children, fallback = null }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        function go() {
            setMounted(true);
        }
        if (typeof document === 'undefined') {
            go();
            return;
        }
        if (document.readyState === 'complete') {
            go();
            return;
        }
        const onLoad = () => go();
        window.addEventListener('load', onLoad, { once: true });
        const t = setTimeout(go, 3000);
        return () => {
            window.removeEventListener('load', onLoad);
            clearTimeout(t);
        };
    }, []);
    if (!mounted) return fallback;
    return children;
}
