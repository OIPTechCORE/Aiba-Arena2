const crypto = require('crypto');

// Verifies Telegram Mini App initData (WebApp.initData) with BOT_TOKEN.
// Ref: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
function verifyTelegramInitData(initData, botToken) {
    if (!initData || !botToken) return { ok: false, error: 'missing initData or botToken' };

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { ok: false, error: 'missing hash' };

    const authDateRaw = params.get('auth_date');
    const authDate = authDateRaw ? Number(authDateRaw) : null;
    const queryId = params.get('query_id') ? String(params.get('query_id')) : null;

    params.delete('hash');

    // data_check_string is sorted by key, joined with '\n' as `key=value`
    const pairs = [];
    for (const [key, value] of params.entries()) pairs.push([key, value]);
    pairs.sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = pairs.map(([k, v]) => `${k}=${v}`).join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (computed !== hash) return { ok: false, error: 'hash mismatch' };

    const userJson = params.get('user');
    let user = null;
    try {
        user = userJson ? JSON.parse(userJson) : null;
    } catch {
        user = null;
    }

    return { ok: true, user, authDate, queryId };
}

module.exports = { verifyTelegramInitData };

