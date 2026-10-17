# Tamiyo front

React SPA for Tamiyo, a Magic: The Gathering collection and deck manager. React + TypeScript (Vite), Mantine, TanStack Query, React Router, openapi-fetch. The Go API lives in the separate `tamiyo` repo and is served on the same origin under `/api`.

## Commands

```bash
npm run dev          # http://localhost:5173, proxies /api to localhost:8080 (run the API with API_BASE_PATH=/api)
npm run build        # type check + production build; this is what CI runs
npm run typecheck
npm run gen:api      # regenerate src/api/schema.d.ts from the API's doc/openapi.yaml (main branch)
npx prettier --write <files>   # options in .prettierrc
```

There are no automated tests: run `npm run build` before calling a change done, and check the result in the browser.

## Layout

- `src/api/schema.d.ts`: generated and committed; regenerate it with `npm run gen:api` after any API change.
- `src/scryfall/`: every browser call to Scryfall: `client.ts` (spaced 100 ms apart, retried on 429), `cardCache.ts` (per-card cache in memory and IndexedDB, 7 days), `hooks.ts`.
- `src/theme/`: Mantine theme and palettes (`theme.ts`), day/night switch (`colorScheme.ts`), and the identity's building blocks: `LunaMoth`, `Sticker`, `SectionTitle`, `EmptyNote`, `MoonLoader`, `tapeProps`.
- `src/layout/dragDrop.tsx`: the hand-made drag and drop every drag interaction goes through.

## Rules

- **Auth:** the access token stays in memory, never in `localStorage`; the refresh token is an `httpOnly` cookie. Every request sends `X-Refresh-Token-Transport: cookie`. Don't change the refresh flow without reading `src/auth/session.ts`.
- **Scryfall:** go through `src/scryfall` hooks; never `fetch` Scryfall elsewhere, or the cache and the rate limit are bypassed. Images are hotlinked, never stored.
- **Preferences** (display mode, columns, grouping, sort, day/night) are saved through the API (`useUpdatePreferences`, per-deck `useSaveDeckView`), never in browser storage. Anonymous visitors keep them in component state.
- **Identity:** a collector's notebook in the luna moth's colors. Use theme colors (`lune`, `prune`, `ocelle`, `gray`, `dark`) and the `src/theme` components; no raw hex in components except illustrations (moth, storage drawings), which keep fixed day colors in both themes. Fonts: Fraunces (headings), Karla (UI), Patrick Hand (`tamiyo-hand` class, short notes only), self-hosted in `public/fonts`. Keep whimsy (tilts, tape, stickers, scribbles) on tiles, titles and empty states; long card lists and forms stay plain.
- **Day and night:** every visual change must read well in both. Filled components get dark text at night (handled by the theme's `variantColorResolver`).
- **Mantine:** a `Select` inside a `Popover` needs `comboboxProps={{ withinPortal: false }}`.
- **UI text in French**, addressing the user as « tu ». Code, README and commit messages in English.
- **Comments:** names carry the meaning; a comment only states a constraint the code can't show.
- **Remove dead code** a change leaves behind.
- Every page calls `usePageTitle(...)` (`src/layout/usePageTitle.ts`) so the tab reads "Tamiyo - <page>".

## Commits

Imperative subject under ~70 characters, then a short body. API changes the front needs are pushed first. Pushing to `main` deploys to production once CI passes. Commit on a branch and open a PR; merging to `main` is mine.

## Agent skills

### Issue tracker

Issues are tracked in this repo's GitHub Issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context, kept in the API repo (`../Tamiyo/GLOSSARY.md`, `../Tamiyo/docs/adr/`). See `docs/agents/domain.md`.
