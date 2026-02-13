export function getTelegramInitData() {
  try {
    return typeof window !== 'undefined' ? (window?.Telegram?.WebApp?.initData || '') : '';
  } catch {
    return '';
  }
}

export function getTelegramUserUnsafe() {
  try {
    return typeof window !== 'undefined'
      ? (window?.Telegram?.WebApp?.initDataUnsafe?.user || null)
      : null;
  } catch {
    return null;
  }
}

/** Check if running inside Telegram WebApp */
export function isTelegramWebApp() {
  try {
    return Boolean(typeof window !== 'undefined' && window?.Telegram?.WebApp);
  } catch {
    return false;
  }
}

/** Trigger haptic feedback when available */
export function hapticFeedback(type = 'light') {
  try {
    window?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch { /* ignore */ }
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
