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
    let msg = payload.message || fallback;
    const code = error?.code || payload.code;
    const isNetworkFailure =
        !error?.response &&
        (code === 'ERR_NETWORK' ||
            code === 'ERR_CONNECTION_REFUSED' ||
            code === 'ECONNREFUSED' ||
            msg === 'Network Error' ||
            (typeof msg === 'string' && msg.toLowerCase().includes('network error')));
    if (isNetworkFailure) {
        const base = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000') : 'http://localhost:5000';
        return `Backend unreachable at ${base}. Make sure the backend is running (npm run dev from project root). If using MongoDB Atlas, whitelist your IP in Network Access.`;
    }
    return msg;
}

export function createApi(baseURL) {
  const api = axios.create({
    baseURL,
    timeout: 30000,
  });

  api.interceptors.request.use((config) => {
    const initData = getTelegramInitData();
    if (initData) {
      config.headers['x-telegram-init-data'] = initData;
    } else {
      const user = getTelegramUserUnsafe();
      config.headers['x-telegram-id'] = user?.id ? String(user.id) : 'local-dev';
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      const data = response?.data;
      if (data && data.ok === false && data.error) {
        const err = new Error(data.error.message || data.error.code || 'Request failed');
        err.code = data.error.code;
        err.details = data.error.details;
        err.requestId = data.requestId || response?.headers?.['x-request-id'] || '';
        return Promise.reject(err);
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
