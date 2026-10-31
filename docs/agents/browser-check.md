# Browser check

How to check a UI change headlessly, with screenshots, when Claude in Chrome is not connected.

## 1. Start the stack

Run the check stack and Vite on 5174 as `CLAUDE.md` says, from the API checkout of the branch the front change needs (`main` when it needs none). The check stack lifts the login rate limit, the compose API on 8080 does not. The front worktree needs a `node_modules`: symlink the main checkout's when it has none.

Stop both afterwards, Vite by its PID (`ss -ltnp | grep 5174`): `pkill -f vite` matches the calling shell too.

## 2. Drive the page

Write the check script in your scratchpad and import `scripts/browser-check.mjs` by its absolute path. `openApp` launches Playwright's Chromium (already in `~/.cache/ms-playwright`), signs in as `seed@tamiyo.local`, sets the theme and opens `/`. Pass `signIn: false` to check as a logged-out visitor: no API stack is needed, `api` is undefined and `theme` is ignored (visitors get day or night by the hour, so set it with `clock: true` and `page.clock.setFixedTime`):

```js
import { openApp } from '/abs/path/to/Tamiyo-front/scripts/browser-check.mjs';

const { browser, page, api } = await openApp({ theme: 'night', width: 390, height: 844, clock: true });
await api('PATCH', '/auth/me/preferences', { show_card_details: true }); // seed data through the API
await page.reload();
await page.clock.runFor(6000); // skip a 6 s timer instead of waiting for it
await page.screenshot({ path: 'night-390.png', animations: 'disabled' });
await browser.close();
```

With `clock: true`, advance animations and delays with `page.clock.runFor(ms)` rather than `page.waitForTimeout(ms)`: a check that waits in real time costs minutes per run. CSS transitions (modal fades) keep real time: take screenshots with `animations: 'disabled'`, which finishes them first.

Cover the states the change touches: day and night, 1280 and 390 wide, data and empty.

## Gotchas

- `POST /cards` takes `collector_number` as a string (`doc/API.md` says int).
- Tile storage labels only show with the `show_card_details: true` preference.
