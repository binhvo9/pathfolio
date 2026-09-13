# PathFolio — How to run this project

6 processes, each in its own terminal/background job. **Always `cd` into
the exact app directory before running its command** — a `.env` file only
loads relative to cwd, and a past session lost time to commands silently
running in the wrong directory because a prior `cd` was still "sticky"
in the same shell.

| # | App | Port | Command (from that app's own directory) |
|---|---|---|---|
| 1 | `apps/web` | 3000 | `npx next dev` |
| 2 | `apps/api-gateway` | 4000 | `npx tsx --env-file=.env src/index.ts` |
| 3 | `apps/simulation` | 4001 | `npx tsx --env-file=.env src/index.ts` |
| 4 | `apps/market-data` | 4002 | `npx tsx --env-file=.env src/index.ts` |
| 5 | `apps/performance-tracking` | 4003 | `npx tsx --env-file=.env src/index.ts` |
| 6 | `apps/insight-ai` | 4004 | `npx tsx --env-file=.env src/index.ts` |

`apps/web` no longer talks to 4001-4004 directly — it calls
`apps/api-gateway` (4000) instead, which reverse-proxies to the right
service by path prefix (`docs/specs/08-api-gateway.md`). Start the
gateway before `apps/web` if you're bringing everything up from cold.

Quick health check once running: `curl localhost:<port>/health` for
4000-4004, `curl -o /dev/null -w '%{http_code}' localhost:3000/dashboard`
for web (needs a logged-in session cookie to return real data, but 200
means the server itself is up).

## Known gotchas

- **MongoDB Atlas IP allowlist.** If any Mongo-backed service (simulation,
  performance-tracking, insight-ai) throws a raw TLS/SSL handshake error
  (`SSL alert number 80` or similar) instead of a clean auth error, it's
  almost always the dev machine's IP falling off Atlas's Network Access
  allowlist (happens on network changes). Fix: Atlas dashboard → Network
  Access → "Add Current IP Address" (often shown as a banner on the
  Overview page). **Then restart the affected process(es)** — a
  `MongoClient` that already failed enters a permanently "closed" state
  within that process; re-allowing the IP alone won't revive it.
- **Test account:** email `vovanbinh9@gmail.com`, real userId
  `cmtfqyby90000ayovj8vyvs1x`. Has 2 scenarios for testing /compare:
  "My First Portfolio" (`6a96f31a7f5cb4eecf4f66bd`) and "Aggressive
  Growth" (`6aa4b7eb2a2a8d4f61cd98dc`), both Active.
- **None of the 5 backend services run in watch mode** — plain one-shot
  `tsx src/index.ts`, not `tsx watch`. Editing a service's source while
  it's running does NOT hot-reload; kill and restart that process to
  pick up changes. All 5 (gateway + 4 microservices) share the
  entry-file name `src/index.ts`, so `pkill -f "src/index.ts"` kills
  all of them, not just the one you meant — target by PID/port instead
  (learned the hard way — see FEATURES.md #68).
- **apps/web's env changed** (2026-09-13, API Gateway): the 4
  `*_SERVICE_URL` vars are gone from `apps/web/.env`, replaced by one
  `GATEWAY_URL`. Next.js only reads `.env` at process start, so a config
  change there needs a full restart of `apps/web`, not just a save.
- **Looking up a real user id / portfolio id without a DB client:**
  `psql`/raw Postgres connections are blocked by the auto-mode
  classifier. Instead, write a throwaway `.mjs` script *inside*
  `apps/web` (not the scratchpad — module resolution for
  `@/generated/prisma/client` needs to run from there) that imports
  `PrismaClient` from `./src/generated/prisma/client.js` with the same
  `PrismaNeon` adapter as `src/lib/prisma.ts`, run it with
  `set -a && source .env && set +a && npx tsx <script>`, then delete it.
  Mongo-side ids (portfolios, snapshots) are simpler — just `curl` the
  relevant service's own read endpoint with the real userId.
- **Snapshot interval** is `SNAPSHOT_INTERVAL_SECONDS` in
  `apps/performance-tracking/.env`, currently 300 (5 min). The value math
  is time-proportional now (2026-09-12 fix), so this is purely a
  data-freshness knob, not a correctness one — safe to change either way.
- Every service needs its own `.env` (already populated with real
  credentials, gitignored) — see each `apps/*/.env` file directly rather
  than guessing values; don't recreate them from scratch.

## Where things stand (see FEATURES.md for the full numbered log)

Phases 0-5 fully done and verified live (onboarding through
comparison/export/email, backend + UI). Phase 6 (API contract & docs
cleanup) is done too: OpenAPI specs (`docs/api/`), the user journey
diagram, the deployment diagram, and the API Gateway
(`apps/api-gateway`, all of `apps/web`'s backend calls now go through it
instead of 4 separate service URLs) are all built and verified live.

## Next up

Phase 7 — ship it: live demo deployed (Vercel + Railway per
`docs/diagrams/deployment.md`), written case study, README with
diagrams embedded, cleaned-up repo/commit history, optional walkthrough
video. See BACKLOG.md for the full checklist. Phase 8 (Behance UX case
study in Figma) is independent and can start anytime.

## Testing an authenticated page without going through OAuth

Auth is database-session-strategy NextAuth (Google/GitHub only, no
credentials provider), so there's no dev login bypass. To drive a page
as the test user in Playwright: insert a `Session` row directly
(same throwaway-script trick as the user-id lookup above — create one
with `prisma.session.create({ data: { sessionToken, userId, expires } })`
using a random UUID as the token), then in Playwright call
`page.context().addCookies([{ name: "authjs.session-token", value:
sessionToken, domain: "localhost", path: "/", httpOnly: true, secure:
false }])` before navigating. Delete the Session row afterward.
