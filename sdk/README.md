# Sauce Games SDK

A tiny browser SDK that gives any static Sauce Games prototype **leaderboards** and **analytics** with a few lines of code. Your game never talks to the backend directly — the SDK wraps it.

> The goal: copy a snippet, set your `gameId`, call `submitScore`, and you have a working leaderboard.

## Install / include

### Option A — ES module import (recommended)

If your game is built with a bundler (Vite, etc.):

```ts
import { Sauce } from "@sauce/sdk";
```

For local/no-bundler use, import the built ESM file directly in a module script:

```html
<script type="module">
  import { Sauce } from "https://labs.saucegames.io/sdk/sauce.js";
  const sauce = Sauce.init({ gameId: "my-game", buildId: "v0.1.0" });
</script>
```

### Option B — plain `<script>` tag (global)

```html
<script src="https://labs.saucegames.io/sdk/sauce.iife.js"></script>
<script>
  const sauce = Sauce.init({ gameId: "my-game", buildId: "v0.1.0" });
</script>
```

## Initialize

```ts
const sauce = Sauce.init({
  gameId: "clicker-demo",   // your registered game id
  buildId: "v0.1.0",        // your build/version string
  apiBaseUrl: "http://localhost:8787", // optional; omit in production
});
```

`apiBaseUrl` defaults to `https://api.saucegames.io`. Point it at `http://localhost:8787` while developing against a local API.

## Analytics

```ts
sauce.analytics.startSession();          // emits "session_start", makes a sessionId
sauce.analytics.track("game_start");     // any event name + optional metadata
sauce.analytics.track("game_end", { score: 123, duration: 30, totalClicks: 123 });
sauce.analytics.endSession();            // emits "session_end" (reliable on unload)
```

- A random `sessionId` (UUID) is created automatically and attached to every event, along with `gameId`, `buildId`, and a `timestamp`.
- Analytics is **fire-and-forget**: it never throws and never blocks gameplay.
- Common event names: `session_start`, `session_end`, `game_start`, `game_end`, `score_submit`, `click`, `leaderboard_view`. You can use any string.
- Tip: batch high-frequency things (like clicks) into a single `game_end` event instead of sending one request per click.

## Leaderboards

```ts
// Submit a score (throws on invalid input or network failure)
await sauce.leaderboards.submitScore({
  boardId: "main",
  playerName: "Branny",
  score: 123,
  metadata: { duration: 30, totalClicks: 123 }, // optional
});

// Fetch the top entries (highest first by default)
const entries = await sauce.leaderboards.getTop({ boardId: "main", limit: 10 });
// entries: { playerName, score, createdAt, metadata, ... }[]
```

The SDK validates before sending: `playerName` must be non-empty and ≤ 24 chars, `score` must be a finite non-negative number, `boardId` must be set, and `metadata` (if given) must be an object.

## Add leaderboards to YOUR game (3 steps)

1. **Register your game** in the backend (one row in the `games` table — ask the Labs maintainer or run the seed for your `gameId`).
2. **Init the SDK** with that `gameId` on page load and call `startSession()`.
3. **Submit and read scores** when your round ends:

```ts
const sauce = Sauce.init({ gameId: "my-game", buildId: "v0.1.0" });
sauce.analytics.startSession();

// ...when the round ends:
await sauce.leaderboards.submitScore({ boardId: "main", playerName, score });
const top = await sauce.leaderboards.getTop({ boardId: "main", limit: 10 });
```

That's it — you have a working leaderboard.

## Build

```bash
npm install
npm run build   # emits dist/sauce.js (ESM), dist/sauce.iife.js (global), dist/index.d.ts
```
