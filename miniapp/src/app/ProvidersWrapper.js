'use client';

import dynamic from 'next/dynamic';

/**
 * Load Providers (and thus @tonconnect/ui-react) only on the client in a separate chunk.
 * Avoids "can't access lexical declaration 'dS' before initialization" and React #423
 * that can occur when TonConnect is in the initial bundle.
 * If you see ChunkLoadError, clear the build cache: from miniapp folder run "rm -rf .next" (or "rmdir /s /q .next" on Windows) then "npm run dev".
 */
const Providers = dynamic(
    () =>
        import('./providers')
            .then((m) => ({ default: m.Providers }))
            .catch((err) => {
                if (typeof window !== 'undefined') {
                    console.error(
                        'Providers chunk failed to load. Try: delete miniapp/.next and restart dev server.',
                        err,
                    );
                }
                throw err;
            }),
    {
        ssr: false,
        loading: () => <main className="app-main" />,
    },
);

export function ProvidersWrapper({ children }) {
    return <Providers>{children}</Providers>;
}
