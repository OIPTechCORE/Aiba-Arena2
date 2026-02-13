export function getTelegramInitData() {
    try {
        return window?.Telegram?.WebApp?.initData || '';
    } catch {
        return '';
    }
}

export function getTelegramUserUnsafe() {
    try {
        return window?.Telegram?.WebApp?.initDataUnsafe?.user || null;
    } catch {
        return null;
    }
}

/** Open Telegram native share (t.me/share/url) when in Telegram; fallback to navigator.share or clipboard */
export function shareViaTelegram({ title, text, url }) {
    const u = url || (typeof window !== 'undefined' ? window.location?.href : '');
    const t = [title, text].filter(Boolean).join(': ') || text || '';
    try {
        if (window?.Telegram?.WebApp?.openTelegramLink) {
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`;
            window.Telegram.WebApp.openTelegramLink(shareUrl);
            return true;
        }
        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({ title: title || 'AIBA Arena', text: t, url: u }).catch(() => {});
            return true;
        }
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(t + (u ? ' ' + u : '')).catch(() => {});
            return true;
        }
    } catch { /* ignore */ }
    return false;
}
