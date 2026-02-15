/**
 * Proxy broker API requests to the backend.
 * Use when NEXT_PUBLIC_BACKEND_URL causes CORS/405 issues.
 * Requests to /api/brokers/* are forwarded to BACKEND_URL/api/brokers/*
 */
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:5000';

async function proxy(request, { params }, method) {
  const resolved = await params;
  const path = Array.isArray(resolved?.path) ? resolved.path.join('/') : (resolved?.path || '');
  const base = `${BACKEND.replace(/\/+$/, '')}/api/brokers/${path}`;
  const url = method === 'GET' && request.url?.includes('?') ? `${base}${request.url.slice(request.url.indexOf('?'))}` : base;
  try {
    const initData = request.headers.get('x-telegram-init-data') || '';
    const telegramId = request.headers.get('x-telegram-id') || '';
    const body = method === 'GET' ? '' : await request.text();
    const reqHeaders = { 'Content-Type': 'application/json' };
    if (initData) reqHeaders['x-telegram-init-data'] = initData;
    else if (telegramId) reqHeaders['x-telegram-id'] = telegramId;

    const res = await fetch(url, {
      method,
      headers: reqHeaders,
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

export async function GET(request, context) {
  return proxy(request, context, 'GET');
}

export async function POST(request, context) {
  return proxy(request, context, 'POST');
}
