/**
 * Proxy broker API requests to the backend.
 * Use when NEXT_PUBLIC_BACKEND_URL causes CORS/405 issues.
 * Requests to /api/brokers/* are forwarded to BACKEND_URL/api/brokers/*
 */
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(request, { params }) {
    const path = Array.isArray(params?.path) ? params.path.join('/') : (params?.path || '');
    const url = `${BACKEND.replace(/\/+$/, '')}/api/brokers/${path}`;
    try {
        const initData = request.headers.get('x-telegram-init-data') || '';
        const telegramId = request.headers.get('x-telegram-id') || '';
        const body = await request.text();
        const headers = { 'Content-Type': 'application/json' };
        if (initData) headers['x-telegram-init-data'] = initData;
        else if (telegramId) headers['x-telegram-id'] = telegramId;

        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: body || undefined,
        });
        const data = await res.text();
        return new Response(data, {
            status: res.status,
            headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
        });
    } catch (err) {
        console.error('Broker proxy error:', err);
        return Response.json({ error: 'proxy_failed', message: err?.message || 'Proxy request failed' }, { status: 502 });
    }
}
