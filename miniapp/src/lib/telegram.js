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
