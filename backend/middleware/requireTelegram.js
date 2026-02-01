const { verifyTelegramInitData } = require('../security/telegram');
const { getTelegramInitDataMaxAgeSeconds } = require('../security/telegramPolicy');
const User = require('../models/User');

function normalizeTelegramUser(raw) {
    const u = raw && typeof raw === 'object' ? raw : {};
    const id = u.id !== undefined && u.id !== null ? String(u.id) : '';
    const username = u.username !== undefined && u.username !== null ? String(u.username || '') : '';
    const firstName = u.first_name !== undefined && u.first_name !== null ? String(u.first_name || '') : '';
    const lastName = u.last_name !== undefined && u.last_name !== null ? String(u.last_name || '') : '';
    const languageCode = u.language_code !== undefined && u.language_code !== null ? String(u.language_code || '') : '';
    const photoUrl = u.photo_url !== undefined && u.photo_url !== null ? String(u.photo_url || '') : '';
    return { id, username, firstName, lastName, languageCode, photoUrl };
}

async function requireTelegram(req, res, next) {
    try {
        // Dev escape hatch: allow plain telegramId in dev mode
        if (process.env.APP_ENV === 'dev' || process.env.APP_ENV === 'test') {
            const id = (req.headers['x-telegram-id'] && String(req.headers['x-telegram-id'])) || 'local-dev';
            const username =
                (req.headers['x-telegram-username'] && String(req.headers['x-telegram-username'])) || 'local';

            req.telegramUser = normalizeTelegramUser({ id, username });
            req.telegramId = req.telegramUser.id;

            // Normalize identity into DB even in dev mode (helps local flows).
            try {
                const now = new Date();
                req.user = await User.findOneAndUpdate(
                    { telegramId: req.telegramId },
                    {
                        $set: {
                            telegramId: req.telegramId,
                            username: req.telegramUser.username,
                            telegram: {
                                username: req.telegramUser.username,
                                firstName: req.telegramUser.firstName,
                                lastName: req.telegramUser.lastName,
                                languageCode: req.telegramUser.languageCode,
                                photoUrl: req.telegramUser.photoUrl,
                            },
                            lastSeenAt: now,
                        },
                        $setOnInsert: { telegramId: req.telegramId },
                    },
                    { new: true, upsert: true, setDefaultsOnInsert: true },
                ).lean();
            } catch {
                // If DB is down, still allow dev to proceed with req.telegramUser.
                req.user = null;
            }

            return next();
        }

        const initData = req.headers['x-telegram-init-data'] || req.body?.initData;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        const result = verifyTelegramInitData(String(initData || ''), String(botToken || ''));
        if (!result.ok) return res.status(401).json({ error: 'telegram auth failed', detail: result.error });

        // Optional replay/age protection. For mainnet, keep this conservative (default 15 minutes).
        const maxAgeSec = getTelegramInitDataMaxAgeSeconds(process.env);
        if (Number.isFinite(maxAgeSec) && maxAgeSec > 0 && result.authDate) {
            const ageSec = Math.floor(Date.now() / 1000) - Number(result.authDate);
            if (ageSec > maxAgeSec) return res.status(401).json({ error: 'telegram auth expired' });
        }

        req.telegramUser = normalizeTelegramUser(result.user);
        req.telegramId = req.telegramUser.id;

        if (!req.telegramId) return res.status(401).json({ error: 'telegram auth missing user id' });

        // Normalize identity into DB (single source of truth for user identity).
        const now = new Date();
        req.user = await User.findOneAndUpdate(
            { telegramId: req.telegramId },
            {
                $set: {
                    telegramId: req.telegramId,
                    username: req.telegramUser.username,
                    telegram: {
                        username: req.telegramUser.username,
                        firstName: req.telegramUser.firstName,
                        lastName: req.telegramUser.lastName,
                        languageCode: req.telegramUser.languageCode,
                        photoUrl: req.telegramUser.photoUrl,
                    },
                    lastSeenAt: now,
                },
                $setOnInsert: { telegramId: req.telegramId },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        ).lean();

        return next();
    } catch (err) {
        console.error('requireTelegram error:', err);
        return res.status(500).json({ error: 'telegram auth error' });
    }
}

module.exports = { requireTelegram };
