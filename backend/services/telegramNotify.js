/**
 * Send Telegram message to user (push notification).
 * Requires TELEGRAM_BOT_TOKEN. chat_id = user's telegramId.
 */
async function sendTelegramMessage(chatId, text, options = {}) {
    const token = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!token || !chatId) return { ok: false, reason: 'missing_token_or_chat' };
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        const body = {
            chat_id: String(chatId),
            text: String(text).slice(0, 4096),
            parse_mode: options.parse_mode || 'HTML',
            disable_web_page_preview: true,
            ...options,
        };
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!data.ok) return { ok: false, reason: data.description || 'api_error' };
        return { ok: true };
    } catch (err) {
        console.error('Telegram sendMessage error:', err);
        return { ok: false, reason: String(err?.message || 'request_failed') };
    }
}

/** Notify user that their broker won a battle (push notification). */
async function notifyBattleWin(telegramId, { score, arena, rewardAiba, rewardNeur, starsGranted = 0, firstWinDiamond = 0 }) {
    let text = `🏆 <b>Your AI broker just won!</b>\n\nScore: ${score}\nArena: ${arena}\nReward: ${rewardAiba ?? 0} AIBA, ${rewardNeur ?? 0} NEUR`;
    if (Number(starsGranted) > 0) text += `\n⭐ +${starsGranted} Stars`;
    if (Number(firstWinDiamond) > 0) text += `\n💎 +${firstWinDiamond} Diamond (first win!)`;
    return sendTelegramMessage(telegramId, text);
}

/** Notify user of an announcement (push notification). Used by admin broadcast. */
async function notifyAnnouncement(telegramId, { title, body = '', link = '' }) {
    let text = `📢 <b>${String(title).slice(0, 200)}</b>`;
    if (body) text += `\n\n${String(body).slice(0, 1500)}`;
    if (link) text += `\n\n🔗 ${String(link).slice(0, 200)}`;
    return sendTelegramMessage(telegramId, text);
}

module.exports = { sendTelegramMessage, notifyBattleWin, notifyAnnouncement };
