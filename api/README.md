# Sauce API

The leaderboard + analytics backend for Sauce Games Labs. A single Cloudflare Worker (zero runtime dependencies) backed by a D1 (SQLite) database.

- Production target: `https://api.saucegames.io`
- Local dev: `http://localhost:8787`

## Endpoints

All requests/responses are JSON. Responses are `{ "ok": true, ... }` or `{ "ok": false, "error": "..." }`.

### `POST /api/v1/scores`
Submit a leaderboard score.
```json
{
  "gameId": "clicker-demo",
  "boardId": "main",
  "playerName": "Branny",
  "score": 123,
  "metadata": { "duration": 30, "totalClicks": 123 }
}
```
Returns `201` with the created entry under `score`. `gameId` must be registered + active.

### `GET /api/v1/leaderboards/:gameId/:boardId?limit=10`
Top scores, highest first by default (`limit` capped at 100). Returns `entries[]` with `playerName, score, createdAt, metadata`.

### `POST /api/v1/events`
Store an analytics event.
```json
{
  "gameId": "clicker-demo",
  "buildId": "v0.1.0",
  "sessionId": "abc-123",
  "eventName": "game_start",
  "metadata": { "source": "clicker-demo" }
}
```

### `GET /api/v1/admin/*` (optional, disabled unless `ADMIN_TOKEN` is set)
`recent-scores`, `recent-events`, `stats?gameId=clicker-demo`. Authenticate with `Authorization: Bearer <token>` or `?token=<token>`. `stats` answers the V1 analytics questions: games played, unique sessions, avg play time, scores submitted, avg score, leaderboard views, and builds seen.

## Validation & safety (V1)
- Server-side validation on every request (`src/validate.ts`): score is a finite, non-negative integer ≤ 1e9; `playerName` 1–24 chars with control chars stripped; `metadata` must be an object ≤ 2 KB serialized; ids ≤ 64 chars.
- CORS (`src/cors.ts`): allows `https://labs.saucegames.io`, any `https://*.github.io`, and `localhost`. Configure first-party hosts via the `ALLOWED_ORIGINS` var.
- Privacy: IP and User-Agent are stored only as salted SHA-256 hashes (never raw). Set the `HASH_SALT` secret in production.
- Rate limiting is intentionally left to a Cloudflare WAF rule (dashboard) for V1.

> Browser-submitted scores can be faked — accepted for V1. Future hardening: Turnstile on high scores, signed submissions, admin moderation.

## Local development
```bash
npm install
npm run db:local      # apply schema.sql to the local D1
npm run dev           # wrangler dev on http://localhost:8787
```
Inspect local data:
```bash
npx wrangler d1 execute sauce_labs --local --command "SELECT * FROM leaderboard_scores;"
```

## Deploy

1. **Create the D1 database** (once):
   ```bash
   npx wrangler d1 create sauce_labs
   ```
   Copy the returned `database_id` into [`wrangler.jsonc`](wrangler.jsonc) (replace `REPLACE_WITH_DATABASE_ID`).

2. **Apply the schema to the remote DB**:
   ```bash
   npm run db:remote
   ```

3. **Set secrets**:
   ```bash
   npx wrangler secret put HASH_SALT      # required in prod
   npx wrangler secret put ADMIN_TOKEN    # optional, enables /admin/*
   ```

4. **Deploy the Worker**:
   ```bash
   npm run deploy
   ```

5. **Custom domain** `api.saucegames.io`:
   - Requires the `saucegames.io` zone to be on Cloudflare.
   - In the Cloudflare dashboard: Workers & Pages → `sauce-api` → Settings → Domains & Routes → Add custom domain → `api.saucegames.io`. Cloudflare provisions the DNS + certificate automatically.
   - Until then, the Worker is reachable at its `*.workers.dev` URL; point the SDK's `apiBaseUrl` there if needed.

## Adding another game
No code change needed — insert a row:
```sql
INSERT INTO games (game_id, name) VALUES ('my-game', 'My Game');
-- optional: a board with a custom sort
INSERT INTO leaderboard_configs (game_id, board_id, sort_direction) VALUES ('my-game', 'main', 'desc');
```
