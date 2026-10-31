// Headless Chromium on the local check stack, signed in as the seed account.
// How to use it: docs/agents/browser-check.md.
import { chromium } from 'playwright-core';

// theme: 'day', 'night' or 'auto'. clock: install Playwright's fake clock, so timers are
// advanced with page.clock.runFor(ms) instead of waited for. signIn: false opens the app as
// a logged-out visitor, with no `api` and no theme (visitors get day or night by the hour).
export async function openApp({
  url = 'http://localhost:5174',
  width = 1280,
  height = 900,
  theme = 'day',
  clock = false,
  signIn = true,
} = {}) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: url, viewport: { width, height } });
  let api;
  if (signIn) {
    // The refresh cookie lands in the browser context, and the app restores the session from it.
    const login = await page.request.post('/api/auth/login', {
      headers: { 'X-Refresh-Token-Transport': 'cookie' },
      data: { email: 'seed@tamiyo.local', password: 'password123' },
    });
    if (!login.ok()) {
      await browser.close();
      throw new Error(`login failed: ${login.status()} ${await login.text()}`);
    }
    const { token } = await login.json();
    api = async (method, path, data) => {
      const response = await page.request.fetch(`/api${path}`, {
        method,
        data,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok()) {
        throw new Error(`${method} ${path}: ${response.status()} ${await response.text()}`);
      }
      return response.status() === 204 ? null : response.json();
    };
    await api('PATCH', '/auth/me/preferences', { theme });
  }
  if (clock) {
    await page.clock.install();
  }
  await page.goto('/');
  return { browser, page, api };
}
