# Mini Golf Scorer

A simple web app for tracking mini golf scores with friends. Create games, add players, enter scores hole-by-hole, and view the leaderboard.

## Run & Operate

- `pnpm --filter @workspace/mini-golf run dev` — run the frontend dev server
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter, Tailwind CSS, shadcn/ui, @tanstack/react-query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Where things live

- OpenAPI spec: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/{games,players,scores}.ts`
- API routes: `artifacts/api-server/src/routes/games.ts`
- Frontend pages: `artifacts/mini-golf/src/pages/{home,new-game,game,leaderboard}.tsx`
- App entry: `artifacts/mini-golf/src/App.tsx`

## Architecture decisions

- Single shared API server serves `/api` routes; the frontend is a separate Vite artifact at `/`.
- API contracts are defined in OpenAPI and generated into React Query hooks and Zod schemas.
- Drizzle ORM tables use `onDelete: cascade` so removing a game removes its players and scores.
- Scores are upserted by `(playerId, hole)` unique constraint to keep one score per player per hole.

## Product

- Create mini golf games with 9 or 18 holes.
- Add 2–8 players (or more) to a game.
- Tap any score cell to enter strokes per hole.
- View the live leaderboard with total strokes and holes completed.
- Mark games as complete; completed games are shown on the home list.
- Delete games from the home list.

## User preferences

- Keep the UI simple and mobile-friendly (mini golf is played on phones).
- Avoid heavy animations; prefer fast, clear interactions.
- Conserve credits on the free plan — avoid unnecessary background work or heavy generation.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before using the new hooks.
- `pnpm run typecheck` at the root is the authoritative check; editor warnings may lag behind generated files.
