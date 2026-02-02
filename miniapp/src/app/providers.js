'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useMemo } from 'react';

export function Providers({ children }) {
    // TonConnect wallets expect an absolute, publicly reachable URL.
    // A relative path (e.g. "/api/tonconnect-manifest") can cause "App Manifest Error" in Wallet apps.
    const manifestUrl = useMemo(() => {
        const env = String(process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL || '').trim();
        if (!env) return `${window.location.origin}/api/tonconnect-manifest`;

        // Accept absolute URLs as-is.
        if (/^https?:\/\//i.test(env)) return env;

        // If env is a relative path, convert it to an absolute URL.
        if (env.startsWith('/')) return `${window.location.origin}${env}`;

        // Fallback: treat as path.
        return `${window.location.origin}/${env.replace(/^\/+/, '')}`;
    }, []);

    return <TonConnectUIProvider manifestUrl={manifestUrl}>{children}</TonConnectUIProvider>;
}
