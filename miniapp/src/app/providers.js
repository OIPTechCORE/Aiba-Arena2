"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";

export function Providers({ children }) {
    const manifestUrl =
        process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL || "/tonconnect-manifest.json";

    return <TonConnectUIProvider manifestUrl={manifestUrl}>{children}</TonConnectUIProvider>;
}

