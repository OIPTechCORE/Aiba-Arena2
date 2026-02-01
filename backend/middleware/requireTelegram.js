const { verifyTelegramInitData } = require('../security/telegram');

function requireTelegram(req, res, next) {
    // Dev escape hatch: allow plain telegramId in dev mode
    if (process.env.APP_ENV === 'dev' || process.env.APP_ENV === 'test') {
        const id =
            (req.body?.telegramId && String(req.body.telegramId)) ||
            (req.query?.telegramId && String(req.query.telegramId)) ||
            (req.headers['x-telegram-id'] && String(req.headers['x-telegram-id'])) ||
            'local-dev';
        const username = (req.body?.username && String(req.body.username)) || 'local';
        req.telegramUser = { id, username };
        return next();
    }

    const initData = req.headers['x-telegram-init-data'] || req.body?.initData;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    const result = verifyTelegramInitData(String(initData || ''), String(botToken || ''));
    if (!result.ok) return res.status(401).json({ error: 'telegram auth failed', detail: result.error });

    req.telegramUser = result.user;
    return next();
}

module.exports = { requireTelegram };

