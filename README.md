# Mini Golf Scorer

A small web app for tracking mini golf scores with friends: create a game, add players, enter scores hole-by-hole, check the leaderboard.

**Live:** https://golf.flyboybyte.com — no login, just share the game link.

## What's actually in here

It's a pnpm workspace, which makes the file tree look bigger than the app is. Two things get deployed:

- `artifacts/api-server` — Express 5 API, talks to SQLite via Drizzle
- `artifacts/mini-golf` — React/Vite frontend

Everything else is shared plumbing:

- `lib/api-spec` — the OpenAPI spec (source of truth for the API), plus Orval codegen config
- `lib/api-client-react` — generated React Query hooks/fetch client (don't hand-edit)
- `lib/api-zod` — generated Zod schemas for request validation (don't hand-edit)
- `lib/db` — Drizzle schema + SQLite client

See [CLAUDE.md](./CLAUDE.md) for the full architecture rundown, commands, and conventions.

## Running it locally

```bash
pnpm install

# .env with at least DATABASE_URL, PORT
pnpm --filter @workspace/api-server run dev    # API
pnpm --filter @workspace/mini-golf run dev     # frontend
```

`pnpm run typecheck` is the primary correctness check — there's no test suite yet.

## Deploying

`./deploy.sh` builds and ships to the VPS this app already lives on. See `CLAUDE.md` and `deploy.sh` for details.
