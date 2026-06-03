# Clicker Demo

A deliberately tiny clicker game whose only job is to prove the Sauce Games platform flow end to end: a static frontend uses the **Sauce SDK** to start an analytics session, track game events, submit a leaderboard score, and fetch the top 10.

It is the reference example for "how do I add leaderboards to my game?".

## Gameplay
Click Start → click the big button as fast as you can for 30 seconds → enter a name → submit → see yourself on the leaderboard.

## How it uses the SDK
See [`src/main.ts`](src/main.ts). The whole integration is:
```ts
const sauce = Sauce.init({ gameId: "clicker-demo", buildId: "v0.1.0", apiBaseUrl });
sauce.analytics.startSession();                              // session_start
sauce.analytics.track("game_start");                         // round begins
sauce.analytics.track("game_end", { score, duration, totalClicks }); // round ends (clicks batched here)
await sauce.leaderboards.submitScore({ boardId: "main", playerName, score, metadata });
sauce.analytics.track("score_submit", { score });
const entries = await sauce.leaderboards.getTop({ boardId: "main", limit: 10 });
sauce.analytics.track("leaderboard_view");
// on unload: sauce.analytics.endSession();                  // session_end
```
Clicks are counted locally and reported once in `game_end` — no request per click.

## Local development
Run the API first (see [`../../api/README.md`](../../api/README.md)), then:
```bash
npm install
npm run dev      # http://localhost:5174
```
In dev the SDK points at `http://localhost:8787` automatically. Override with a `.env` value:
```
VITE_API_BASE_URL=https://api.saucegames.io
```

## Build
```bash
npm run build    # static output in dist/
```

## Deploying + listing on Sauce Labs
This game ships from **this repo** as part of the Sauce Labs Pages deploy — there is no separate host to keep in sync. The deploy workflow ([`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)) builds the clicker after the storefront and nests it under the Pages site at:

```
https://brannysg.github.io/sauce-labs/play/clicker-demo/
```

The registry entry in [`src/data/games.ts`](../../src/data/games.ts) already points `playUrl` there:
```ts
{
  id: "clicker-demo",
  title: "Sauce Clicker",
  creator: "Sauce Games",
  // ...
  playUrl: "https://brannysg.github.io/sauce-labs/play/clicker-demo/",
}
```

Because the build origin is `*.github.io`, it is already allowed by the API's CORS rules (add first-party hosts via the API's `ALLOWED_ORIGINS` var). The clicker's `vite.config.ts` uses `base: "./"`, so the same build works whether it is served from a domain root or this sub-path.
