# Sauce Labs

A lightweight public gallery for playable web experiments made by the Sauce Studios team. Browse a card, click a card, play immediately.

The site is a static Vite + React + TypeScript app styled with Tailwind v4. Games are hosted elsewhere (typically GitHub Pages) and embedded via iframes; Sauce Labs is purely the storefront.

## Quick start

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview
```

The build emits a fully static site to `dist/`. `vite.config.ts` sets `base: "./"` so the output works whether deployed at a domain root (e.g. `labs.saucestudios.com`) or under a sub-path (e.g. GitHub project pages).

## Adding a game

All games are listed in [`src/data/games.ts`](src/data/games.ts). To add one:

1. Append a new `GameEntry` to the `games` array:

   ```ts
   {
     id: "my-new-game",
     title: "My New Game",
     creator: "Your Name",
     tagline: "One short, punchy sentence about the game.",
     status: "Prototype",                 // New | Prototype | Tiny Toy | WIP | Archived
     thumbnail: "/games/my-new-game/thumb.png",
     playUrl: "https://yourname.github.io/my-new-game/",
     orientation: "portrait",             // portrait | landscape | responsive
     recommendedDevice: "Any",            // optional
     updatedAt: "2026-05-27"              // optional
   }
   ```

2. Drop a 1200×675 (16:9) thumbnail at `public/games/<id>/thumb.png` (or `.svg`, `.jpg`, `.webp`). If the file is missing the card automatically falls back to a generated gradient with the game's initials, so nothing breaks.

3. That's it — `npm run dev` will hot-reload the grid.

### Orientation guide

- `portrait` — narrow centered iframe with a phone-shaped 9:16 box. Best for mobile-first games.
- `landscape` — wide 16:9 iframe up to ~1152px wide. Best for desktop arcade-style games.
- `responsive` — fills the available viewport. Best for fluid layouts that handle any size.

## Deployment

Either of these static hosts works out of the box:

- **Cloudflare Pages** (recommended). Connect this repo, set the build command to `npm run build` and the output directory to `dist`. Add a custom domain like `labs.saucestudios.com`.
- **GitHub Pages**. Build locally or via Actions, then publish `dist/`. The relative-path build (`base: "./"`) means the site works under a project sub-path without extra config.

## What's deliberately not in V1

Per the spec, this build skips: accounts, ratings, comments, leaderboards, a CMS, a database, and any backend logic. The game list is edited by hand in `src/data/games.ts`. Shareable URL state (`?game=...`), status filtering, and latest sorting are also deferred and easy to add later.

## Project layout

```
sauce-labs/
  public/
    favicon.svg
    games/
      vibe-tetris/thumb.svg
  src/
    components/
      Header.tsx
      GameCard.tsx
      GameGrid.tsx
      PlayOverlay.tsx
      StatusPill.tsx
      ThumbnailFallback.tsx
    data/
      games.ts
    App.tsx
    main.tsx
    styles.css
    vite-env.d.ts
  index.html
  package.json
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  vite.config.ts
```
