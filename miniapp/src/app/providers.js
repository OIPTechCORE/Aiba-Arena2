"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";

export function Providers({ children }) {
    // Prefer a dynamic manifest so it works behind ngrok/vercel/custom domains.
    const manifestUrl = process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL || "/api/tonconnect-manifest";

    return <TonConnectUIProvider manifestUrl={manifestUrl}>{children}</TonConnectUIProvider>;
}

