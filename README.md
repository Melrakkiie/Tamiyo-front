# Tamiyo — front

Web interface for [Tamiyo](https://github.com/Melrakkiie/tamiyo), the Magic: The Gathering collection management API.

Stack: React + TypeScript (Vite), [Mantine](https://mantine.dev) for UI components, [TanStack Query](https://tanstack.com/query) for server state, React Router, and an API client typed from the backend's OpenAPI spec ([openapi-typescript](https://openapi-ts.dev) + openapi-fetch).

## Getting started

Requirements: Node 20.19+ or 22.12+ (22 recommended, see `.nvmrc`) and the API running locally.

1. **Run the API with the `/api` prefix.** In the backend's `.env`:
   ```
   API_BASE_PATH=/api
   ```
   The front calls the API on its own origin (`/api`), exactly like in production. The prefix is required for the browser to send back the refresh token cookie, whose path is `/api/auth`.

   Chrome and Firefox accept the `Secure` cookie on `http://localhost`. If your session doesn't survive a page reload locally (Safari in particular), also set `REFRESH_COOKIE_SECURE=false` in the backend, locally only.

2. **Install and generate the API client:**
   ```bash
   npm install
   npm run gen:api   # generates src/api/schema.d.ts from the backend's doc/openapi.yaml
   ```
   `src/api/schema.d.ts` is committed: run `npm run gen:api` again and commit the result whenever the backend spec changes.

3. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Vite serves the app on http://localhost:5173 and proxies `/api` to http://localhost:8080.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Type check, then production build into `dist/` |
| `npm run typecheck` | Type check only |
| `npm run preview` | Serve the production build locally |
| `npm run gen:api` | Regenerate the API types from the backend's OpenAPI spec (`main` branch) |

## Authentication

- **Access token** (JWT, 15 min): kept **in memory only**, never in `localStorage`.
- **Refresh token**: in an `httpOnly` cookie set by the API, which JavaScript can't read. On page load, the app calls `POST /api/auth/refresh` with no body: if the cookie is valid, the session resumes. Every call sends `X-Refresh-Token-Transport: cookie`, so the API leaves the refresh token out of JSON responses.
- **Expiry**: the client refreshes the access token just before it expires. If a call still gets a 401, it refreshes once and replays the call (`src/api/client.ts`). If the refresh fails, the session is over and the user is sent back to `/login`. A network error during a refresh doesn't log the user out.
- **No concurrent refreshes**: the API revokes every session of an account when a refresh token is reused. Refreshes are therefore shared within a tab and serialized across tabs with a Web Lock, which logout also takes (`src/auth/session.ts`).
- **Password change or reset**: the API revokes every session. The front then logs out explicitly to clear the cookie; otherwise the next refresh would send a revoked token, which the API would treat as theft.

## Structure

```
src/
├── api/        typed client (openapi-fetch), errors, generated schema.d.ts
├── auth/       session (in-memory token, refresh), actions, route guards
├── layout/     AppLayout (logged-in app), AuthLayout (login and password pages)
├── pages/      one file per screen
├── router.tsx  routes
└── main.tsx    entry point (providers)
```
