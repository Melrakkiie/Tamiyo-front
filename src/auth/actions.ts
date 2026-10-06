import { api, unwrap } from '../api/client';
import { endSession, setAccessToken } from './session';

export async function login(email: string, password: string) {
  const data = unwrap(await api.POST('/auth/login', { body: { email, password } }));
  setAccessToken(data.token);
}

export async function register(email: string, password: string) {
  const data = unwrap(await api.POST('/auth/register', { body: { email, password } }));
  setAccessToken(data.token);
}

function revokeRefreshCookie() {
  return api.POST('/auth/logout');
}

export function logout() {
  return endSession(revokeRefreshCookie);
}

export async function requestPasswordReset(email: string) {
  unwrap(await api.POST('/auth/forgot-password', { body: { email } }));
}

export async function resetPassword(token: string, newPassword: string) {
  unwrap(await api.POST('/auth/reset-password', { body: { token, new_password: newPassword } }));
  await endSession(revokeRefreshCookie);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  unwrap(
    await api.POST('/auth/password', {
      body: { current_password: currentPassword, new_password: newPassword },
    }),
  );
  await endSession(revokeRefreshCookie);
}
