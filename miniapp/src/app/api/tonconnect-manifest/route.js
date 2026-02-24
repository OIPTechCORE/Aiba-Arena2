import { headers } from 'next/headers';

async function getBaseUrl() {
    // Vercel/Proxy-friendly base URL detection.
    const h = await headers();
    const proto = h.get('x-forwarded-proto') || 'http';
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';

    const env = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    if (env && /^https?:\/\//i.test(env)) return env.replace(/\/+$/, '');

    return `${proto}://${host}`;
}

export async function GET() {
    const baseUrl = await getBaseUrl();
    // TON Connect spec: iconUrl should be PNG or ICO (180x180 px). SVG is not supported by some wallets.
    const iconUrl = `${baseUrl}/icon.svg`;

    return Response.json({
        url: baseUrl,
        name: 'AIBA Arena',
        iconUrl,
    });
}
