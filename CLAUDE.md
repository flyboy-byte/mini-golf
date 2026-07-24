# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Mini Golf Scorer — a web app for tracking mini golf scores with friends. Create games, add players, enter scores hole-by-hole, view the leaderboard.

## Commands

- `pnpm --filter @workspace/mini-golf run dev` — frontend dev server (Vite)
- `pnpm --filter @workspace/api-server run dev` — API server (builds then runs)
- `pnpm run typecheck` — full typecheck across all packages (authoritative; run this after any change, editor diagnostics can lag behind generated files)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client hooks and Zod schemas from `lib/api-spec/openapi.yaml`
- `pnpm --filter @workspace/db run push` — push Drizzle schema changes to the dev DB (`push-force` if it refuses due to data loss warnings)
- `pnpm run build` — typecheck, then build all packages with a `build` script
- Required env: `DATABASE_URL` (path to the SQLite database file, e.g. `file:./data/mini_golf.db` — the `file:` prefix is optional and stripped). The API server also requires `PORT` (binds to `127.0.0.1` by default; override with `HOST` if a service needs to listen on all interfaces); optionally `CORS_ORIGIN` (comma-separated allowed origins; defaults to reflecting any origin if unset). The frontend requires `PORT` and `BASE_PATH`.

There is no test suite in this repo currently — `pnpm run typecheck` is the primary correctness check.

## Architecture

This is a pnpm workspace (`pnpm-workspace.yaml`) split into `lib/*` (shared, non-deployable packages) and `artifacts/*` (independently run/deployed services).

**Data flow for API contracts is spec-first, not code-first:**
1. `lib/api-spec/openapi.yaml` is the source of truth for every API route, request/response shape.
2. Orval (`lib/api-spec/orval.config.ts`) generates two outputs from it:
   - `lib/api-client-react/src/generated/` — React Query hooks + fetch client for the frontend (uses a custom fetch mutator at `lib/api-client-react/src/custom-fetch.ts`).
   - `lib/api-zod/src/generated/` — Zod schemas per operation (e.g. `CreateGameBody`, `GetGameParams`), used for request validation in the API server routes.
3. After editing `openapi.yaml`, you must run the codegen command above before the new types/hooks exist — nothing watches the spec file automatically.

**Backend** (`artifacts/api-server`): Express 5 app (`src/app.ts`) mounting one router at `/api` (`src/routes/index.ts` → `src/routes/games.ts`, `src/routes/health.ts`). Route handlers parse `req.params`/`req.body` with the generated Zod schemas from `@workspace/api-zod` and talk to SQLite directly through Drizzle (`@workspace/db`) — there is no separate service/repository layer. Logging is via pino/pino-http (`src/lib/logger.ts`).

**Security middleware** (`src/app.ts`, `src/middlewares/`): `helmet()` for security headers and a global rate limiter (`rate-limit.ts`, 120 req/min/IP) on all of `/api`. There is intentionally no authentication — anyone with a game's URL can view/edit it; this was a deliberate choice (removed HTTP Basic Auth that existed briefly) to keep the app frictionless for a "share the link with friends" use case. A catch-all error handler at the end of the middleware chain logs unhandled errors via pino and returns a generic 500 instead of leaking stack traces.

**Database** (`lib/db`): SQLite via `better-sqlite3`, accessed through Drizzle ORM. Schema in `src/schema/{games,players,scores}.ts`, each table pairing a `sqliteTable` definition with a `drizzle-zod`-derived insert schema. Key relationships/constraints that affect how you write queries:
- `players` and `scores` reference `games`/`players` with `onDelete: cascade` — deleting a game deletes its players and scores. This is only enforced because `src/index.ts` turns on `PRAGMA foreign_keys = ON` at connection time — SQLite ignores `ON DELETE CASCADE` otherwise.
- `scores` has a unique constraint on `(playerId, hole)`; the API upserts scores via `onConflictDoUpdate` against that constraint rather than checking-then-writing.
- `index.ts` throws at import time if `DATABASE_URL` isn't set, and creates the parent directory for the db file if it doesn't exist — the DB client can't be imported in a context without that env var.
- `better-sqlite3` is a native module and is kept external from the API server's esbuild bundle (`build.mjs`); it must stay a direct dependency of `artifacts/api-server` (not just `lib/db`) or the built output fails to resolve it at runtime under pnpm's strict `node_modules` layout.

**Frontend** (`artifacts/mini-golf`): React + Vite + wouter (routes in `src/App.tsx`: `/`, `/games/new`, `/games/:gameId`, `/games/:gameId/leaderboard`), Tailwind CSS v4, shadcn/ui components (`src/components/ui/*` — generated, not hand-rolled; regenerate/extend via shadcn conventions rather than editing generated primitives ad hoc), TanStack Query for server state via the generated hooks in `@workspace/api-client-react`.

**`artifacts/mockup-sandbox`**: a separate Vite app for previewing/designing UI components in isolation (has its own `mockupPreviewPlugin.ts`), independent of the main frontend and API server.

Each artifact under `artifacts/*` has a `.replit-artifact/artifact.toml` describing how that service is run/built/served in the hosting environment (dev command, port, production build/serve, health check path). These are load-bearing service-routing configs, not just metadata — update them if you change how a service starts, its port, or its build output path.

## Conventions

- Use pnpm only — the root `preinstall` script refuses to run under npm/yarn and deletes any `package-lock.json`/`yarn.lock` that shows up.
- Dependency versions shared across packages are pinned once in the `catalog:` section of `pnpm-workspace.yaml` and referenced as `"catalog:"` in each package's `package.json`.
- `react`/`react-dom` are pinned to an exact version (not a range) in the catalog because Expo elsewhere in the org requires that exact version — don't loosen these.
- `pnpm-workspace.yaml` enforces a 1-day minimum release age on new npm package versions as a supply-chain safety measure; don't remove `minimumReleaseAge` or add broad exclusions to bypass it.
