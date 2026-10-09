import { notifications } from '@mantine/notifications';
import createClient from 'openapi-fetch';

import { expiresSoon, getSession, refreshAccessToken } from '../auth/session';
import {
  API_BASE_PATH,
  API_BASE_URL,
  REFRESH_TRANSPORT_COOKIE,
  REFRESH_TRANSPORT_HEADER,
} from '../config';
import { ApiError } from './errors';
import type { paths } from './schema';

function authRoute(url: string): 'none' | 'password' | 'other' {
  const path = new URL(url, window.location.origin).pathname;
  if (path === `${API_BASE_PATH}/auth/password` || path === `${API_BASE_PATH}/auth/email`) {
    return 'password';
  }
  if (path === `${API_BASE_PATH}/auth/me` || path.startsWith(`${API_BASE_PATH}/auth/me/`)) {
    return 'none';
  }
  return path.startsWith(`${API_BASE_PATH}/auth/`) ? 'other' : 'none';
}

function prepare(request: Request, token: string | null): Request {
  request.headers.set(REFRESH_TRANSPORT_HEADER, REFRESH_TRANSPORT_COOKIE);
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
}

async function freshAccessToken(): Promise<string | null> {
  const token = getSession().accessToken;
  if (!token || !expiresSoon(token)) {
    return token;
  }
  try {
    return await refreshAccessToken();
  } catch {
    return token;
  }
}

function notifySessionExpired() {
  notifications.show({
    id: 'session-expired',
    color: 'orange',
    title: 'Session expirée',
    message: 'Reconnecte-toi pour continuer.',
  });
}

export async function authFetch(request: Request): Promise<Response> {
  const route = authRoute(request.url);

  if (route === 'other') {
    return fetch(prepare(request, null));
  }

  const replay = request.clone();
  const sentToken = await freshAccessToken();
  const response = await fetch(prepare(request, sentToken));

  if (response.status !== 401 || route === 'password') {
    return response;
  }

  let token: string | null;
  const current = getSession().accessToken;
  if (current && current !== sentToken) {
    token = current;
  } else if (getSession().status === 'anonymous') {
    token = null;
  } else {
    try {
      token = await refreshAccessToken();
    } catch {
      return response;
    }
  }

  if (!token) {
    notifySessionExpired();
    return response;
  }
  return fetch(prepare(replay, token));
}

export const api = createClient<paths>({ baseUrl: API_BASE_URL, fetch: authFetch });

export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (!result.response.ok) {
    throw ApiError.from(result.response, result.error);
  }
  return result.data as T;
}
