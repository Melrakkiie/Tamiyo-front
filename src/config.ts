export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');

export const API_BASE_PATH = new URL(API_BASE_URL, window.location.origin).pathname.replace(/\/+$/, '');

export const REFRESH_TRANSPORT_HEADER = 'X-Refresh-Token-Transport';
export const REFRESH_TRANSPORT_COOKIE = 'cookie';
