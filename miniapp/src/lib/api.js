import axios from "axios";
import { getTelegramInitData, getTelegramUserUnsafe } from "./telegram";

export function createApi(baseURL) {
    const api = axios.create({ baseURL });

    api.interceptors.request.use((config) => {
        const initData = getTelegramInitData();
        if (initData) {
            config.headers["x-telegram-init-data"] = initData;
        } else {
            // Local dev fallback: backend accepts this only when APP_ENV=dev
            const user = getTelegramUserUnsafe();
            config.headers["x-telegram-id"] = user?.id ? String(user.id) : "local-dev";
        }
        return config;
    });

    return api;
}

