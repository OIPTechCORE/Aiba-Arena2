'use client';

import dynamic from 'next/dynamic';

/**
 * Load Providers (and thus @tonconnect/ui-react) only on the client in a separate chunk.
 * Avoids "can't access lexical declaration 'dS' before initialization" and React #423
 * that can occur when TonConnect is in the initial bundle.
 */
const Providers = dynamic(
  () => import('./providers').then((m) => ({ default: m.Providers })),
  {
    ssr: false,
    loading: () => <main className="app-main" />,
  }
);

export function ProvidersWrapper({ children }) {
  return <Providers>{children}</Providers>;
}
