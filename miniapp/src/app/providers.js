'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useMemo } from 'react';

export function Providers({ children }) {
    // TonConnect wallets expect an absolute, publicly reachable URL.
    // A relative path (e.g. "/api/tonconnect-manifest") can cause "App Manifest Error" in Wallet apps.
    const manifestUrl = useMemo(() => {
        const env = String(process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL || '').trim();
        const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
        if (!env) return origin ? `${origin}/api/tonconnect-manifest` : 'https://aiba-arena2.vercel.app/api/tonconnect-manifest';

        // Accept absolute URLs as-is.
        if (/^https?:\/\//i.test(env)) return env;

        // If env is a relative path, convert it to an absolute URL.
        if (env.startsWith('/') && origin) return `${origin}${env}`;

        // Fallback: treat as path.
        return origin ? `${origin}/${env.replace(/^\/+/, '')}` : env;
    }, []);

    // Theme for the Connect Wallet modal (list of TON wallets: Tonkeeper, TonHub, etc.)
    const uiPreferences = useMemo(() => ({ theme: 'DARK' }), []);

    return (
        <TonConnectUIProvider manifestUrl={manifestUrl} uiPreferences={uiPreferences}>
            {children}
        </TonConnectUIProvider>
    );
}
