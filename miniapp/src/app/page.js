'use client';

import dynamic from 'next/dynamic';

/**
 * Load home content only on the client to avoid hydration and
 * "can't access lexical declaration before initialization" errors
 * from the large hook-heavy bundle or TonConnect.
 */
const HomeContent = dynamic(() => import('./HomeContent'), {
    ssr: false,
    loading: () => (
        <div className="aiba-app" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
        </div>
    ),
});

export default function Page() {
    return <HomeContent />;
}
