/** @type {import('next').NextConfig} */
const MINIAPP_URL = 'https://aiba-arena2-miniapp.vercel.app';
const DEFAULT_BACKEND_URL = 'https://aiba-arena2-backend.vercel.app';

const nextConfig = {
    reactStrictMode: true,
    productionBrowserSourceMaps: true, // debug TDZ / minified errors in production
    transpilePackages: ['@tonconnect/ui-react', '@ton/core'],
    env: {
        // Auto-set app URL when deployed on Vercel (for metadataBase, OG, etc.)
        NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.NEXT_PUBLIC_APP_URL || MINIAPP_URL,
        // Production fallback when building on Vercel so API calls hit backend if env not set
        NEXT_PUBLIC_BACKEND_URL:
            process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.VERCEL ? DEFAULT_BACKEND_URL : undefined),
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**', pathname: '/**' },
            { protocol: 'http', hostname: 'localhost', pathname: '/**' },
        ],
    },
    async redirects() {
        return [{ source: '/favicon.ico', destination: '/icon.svg', permanent: false }];
    },
    async headers() {
        // Allow Telegram Mini App to embed us on Web, iOS, Android, and Desktop.
        // Mobile/desktop clients use in-app WebViews with varying origins; frame-ancestors *
        // ensures the app opens everywhere. X-Frame-Options is omitted so embedding is allowed.
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
