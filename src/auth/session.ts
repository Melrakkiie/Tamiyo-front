import { ApiError } from '../api/errors';
import { API_BASE_URL, REFRESH_TRANSPORT_COOKIE, REFRESH_TRANSPORT_HEADER } from '../config';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

export interface Session {
  status: SessionStatus;
  accessToken: string | null;
}

let session: Session = { status: 'unknown', accessToken: null };
const listeners = new Set<() => void>();

function update(next: Session) {
  session = next;
  listeners.forEach((listener) => listener());
}

export function getSession(): Session {
  return session;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setAccessToken(accessToken: string) {
  update({ status: 'authenticated', accessToken });
}

export function clearSession() {
  update({ status: 'anonymous', accessToken: null });
}

let refreshInFlight: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = withSessionLock(requestRefresh).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function requestRefresh(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { [REFRESH_TRANSPORT_HEADER]: REFRESH_TRANSPORT_COOKIE },
  });

  if (response.status === 400 || response.status === 401) {
    clearSession();
    return null;
  }
  if (!response.ok) {
    throw new ApiError(response.status, 'refresh failed');
  }

  const body = (await response.json()) as { token: string };
  setAccessToken(body.token);
  return body.token;
}

function withSessionLock<T>(task: () => Promise<T>): Promise<T> {
  if (!('locks' in navigator)) {
    return task();
  }
  return new Promise<T>((resolve, reject) => {
    navigator.locks.request('tamiyo-session', () => task().then(resolve, reject)).catch(reject);
  });
}

export async function endSession(revoke: () => Promise<unknown>) {
  await refreshInFlight?.catch(() => null);
  await withSessionLock(async () => {
    await revoke().catch(() => undefined);
  });
  clearSession();
}

export async function restoreSession() {
  await refreshAccessToken().catch(() => null);
  if (getSession().status === 'unknown') {
    clearSession();
  }
}

export function expiresSoon(token: string): boolean {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    return typeof exp === 'number' && exp * 1000 - Date.now() < 30_000;
  } catch {
    return false;
  }
}
