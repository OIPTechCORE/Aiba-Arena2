import axios from 'axios';
import { getTelegramInitData, getTelegramUserUnsafe } from './telegram';

function extractErrorPayload(error) {
    const data = error?.response?.data || {};
    if (data?.error && typeof data.error === 'object') {
        return {
            code: data.error.code || 'error',
            message: data.error.message || data.error.code || 'Request failed',
            details: data.error.details,
            requestId: data.requestId || error?.response?.headers?.['x-request-id'] || '',
        };
    }
    if (data?.error) {
        return {
            code: data.error,
            message: data.error,
            details: data.detail || data.details,
            requestId: data.requestId || error?.response?.headers?.['x-request-id'] || '',
        };
    }
    return {
        code: 'error',
        message: error?.message || 'Request failed',
        details: undefined,
        requestId: error?.response?.headers?.['x-request-id'] || '',
    };
}

export function getErrorMessage(error, fallback = 'Request failed.') {
    const payload = extractErrorPayload(error);
    return payload.message || fallback;
}

export function createApi(baseURL) {
    const api = axios.create({ baseURL });

    api.interceptors.request.use((config) => {
        const initData = getTelegramInitData();
        if (initData) {
            config.headers['x-telegram-init-data'] = initData;
        } else {
            // Local dev fallback: backend accepts this only when APP_ENV=dev
            const user = getTelegramUserUnsafe();
            config.headers['x-telegram-id'] = user?.id ? String(user.id) : 'local-dev';
        }
        return config;
    });

    api.interceptors.response.use(
        (response) => {
            const data = response?.data;
            if (data && data.ok === false && data.error) {
                const error = new Error(data.error.message || data.error.code || 'Request failed');
                error.code = data.error.code;
                error.details = data.error.details;
                error.requestId = data.requestId || response?.headers?.['x-request-id'] || '';
                return Promise.reject(error);
            }
            if (data && data.ok === true && Object.prototype.hasOwnProperty.call(data, 'data')) {
                return { ...response, data: data.data };
            }
            return response;
        },
        (error) => {
            const payload = extractErrorPayload(error);
            error.userMessage = payload.message;
            error.code = payload.code;
            error.details = payload.details;
            error.requestId = payload.requestId;
            return Promise.reject(error);
        },
    );

    return api;
}
