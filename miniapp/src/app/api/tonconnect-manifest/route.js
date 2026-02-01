import { headers } from "next/headers";

function getBaseUrl() {
    // Vercel/Proxy-friendly base URL detection.
    const h = headers();
    const proto = h.get("x-forwarded-proto") || "http";
    const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";

    // Allow explicit override for edge cases.
    const env = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    if (env && /^https?:\/\//i.test(env)) return env.replace(/\/+$/, "");

    return `${proto}://${host}`;
}

export function GET() {
    const baseUrl = getBaseUrl();

    return Response.json({
        // "url" is the dApp origin (not Telegram).
        url: baseUrl,
        name: "AIBA Arena",
        iconUrl: `${baseUrl}/icon.svg`,
    });
}

