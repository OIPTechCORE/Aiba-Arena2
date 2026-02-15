'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useMemo, useState, useEffect } from 'react';

// Production: set NEXT_PUBLIC_APP_URL and optionally NEXT_PUBLIC_TONCONNECT_MANIFEST_URL (absolute manifest URL).
export function Providers({ children }) {
    // Compute manifest URL without window so server and first client render match (avoids hydration error #423).
    const envManifestUrl = useMemo(() => {
        const env = String(process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL || '').trim();
        const origin = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
        if (!env) return origin ? `${origin}/api/tonconnect-manifest` : '';
        if (/^https?:\/\//i.test(env)) return env;
        if (env.startsWith('/') && origin) return `${origin}${env}`;
        return origin ? `${origin}/${env.replace(/^\/+/, '')}` : env;
    }, []);

    const [manifestUrl, setManifestUrl] = useState(envManifestUrl);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const origin = window.location.origin;
        const env = String(process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL || '').trim();
        if (!env) {
            setManifestUrl(origin ? `${origin}/api/tonconnect-manifest` : envManifestUrl);
            return;
        }
        if (/^https?:\/\//i.test(env)) {
            setManifestUrl(env);
            return;
        }
        if (env.startsWith('/') && origin) {
            setManifestUrl(`${origin}${env}`);
            return;
        }
        setManifestUrl(origin ? `${origin}/${env.replace(/^\/+/, '')}` : envManifestUrl);
    }, [envManifestUrl]);

    // Theme for the Connect Wallet modal (list of TON wallets: Tonkeeper, TonHub, etc.)
    const uiPreferences = useMemo(() => ({ theme: 'DARK' }), []);

    return (
        <TonConnectUIProvider manifestUrl={manifestUrl} uiPreferences={uiPreferences}>
            {children}
        </TonConnectUIProvider>
    );
}
