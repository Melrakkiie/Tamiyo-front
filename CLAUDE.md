# Tamiyo front

React SPA for Tamiyo, a Magic: The Gathering collection and deck manager. React + TypeScript (Vite), Mantine, TanStack Query, React Router, openapi-fetch. The Go API lives in the separate `tamiyo` repo and is served on the same origin under `/api`.

## Commands

```bash
npm run dev          # http://localhost:5173, proxies /api to $API_PROXY (default localhost:8080; run the API with API_BASE_PATH=/api)
npm run build        # type check + production build; CI runs it after the tests
npm test             # Vitest suite, run once (node environment, no DOM)
npm run typecheck
npm run lint         # ESLint: the mechanical rules of this file (eslint.config.js)
npm run format       # Prettier on the whole repo; CI and the pre-commit hook run format:check
npm run gen:api      # regenerate src/api/schema.d.ts from the API's doc/openapi.yaml (main branch)
```

Vitest covers pure TypeScript only; tests sit next to their module (`foo.test.ts`), and shared Scryfall card fixtures live in `src/scryfall/fixtures.ts`. There are no rendering tests: run `npm test` and `npm run build` before calling a change done, and check UI changes in the browser (headless, with screenshots: `docs/agents/browser-check.md`).

To check a front branch against an unmerged API branch: `make check-stack-up PORT=8081` in the API checkout (fresh Postgres, seed account `seed@tamiyo.local` / `password123`), then `API_PROXY=http://localhost:8081 npx vite --port 5174 --strictPort` here; `make check-stack-down PORT=8081` afterwards.

## Layout

- `src/api/schema.d.ts`: generated and committed; regenerate it with `npm run gen:api` after any API change.
- `src/scryfall/`: every browser call to Scryfall: `client.ts` (spaced 100 ms apart, retried on 429), `cardCache.ts` (per-card cache in memory and IndexedDB, 7 days), `hooks.ts`.
- `src/theme/`: Mantine theme and palettes (`theme.ts`), day/night switch (`colorScheme.ts`), and the identity's building blocks: `LunaMoth`, `Sticker`, `SectionTitle`, `EmptyNote`, `MoonLoader`, `tapeProps`.
- `src/layout/dragDrop.tsx`: the hand-made drag and drop every drag interaction goes through.

## Rules

- **Auth:** the access token stays in memory, never in `localStorage`; the refresh token is an `httpOnly` cookie. Every request sends `X-Refresh-Token-Transport: cookie`. Don't change the refresh flow without reading `src/auth/session.ts`.
- **Visual changes** follow the identity and day/night rules in `CODING_STANDARDS.md`.
- **Mantine:** a `Select` inside a `Popover` needs `comboboxProps={{ withinPortal: false }}`.
- **UI text in French**, addressing the user as « tu ». Code, README and commit messages in English.

## Commits

Imperative subject under ~70 characters, then a short body. API changes the front needs are pushed first. Pushing to `main` deploys to production once CI passes. Commit on a branch and open a PR; merging to `main` is mine.

## Agent skills

### Issue tracker

Issues are tracked in this repo's GitHub Issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context, kept in the API repo (`../Tamiyo/GLOSSARY.md`, `../Tamiyo/docs/adr/`). See `docs/agents/domain.md`.
