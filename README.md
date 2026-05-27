# Sauce Labs

A lightweight public gallery for playable web experiments made by the Sauce Games team. Browse a card, click a card, play immediately.

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

The build emits a fully static site to `dist/`. `vite.config.ts` sets `base: "./"` so the output works whether deployed at a domain root (e.g. `labs.saucegames.io`) or under a sub-path (e.g. GitHub project pages).

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
     aspectRatio: "3 / 2",                // optional CSS aspect-ratio override
     recommendedDevice: "Any",            // optional
     updatedAt: "2026-05-27"              // optional
   }
   ```

   The play overlay sizes the iframe container to fit the viewport using
   the orientation default (16/9 for landscape, 9/16 for portrait). The
   optional `aspectRatio` is the one knob to reach for if a game's UI
   doesn't fit that default — for example if you see empty bands on the
   sides or internal scrollbars in the embedded game. In fullscreen the
   container drops its aspect/width constraints so the game gets the
   whole screen.

2. Drop a 1200×675 (16:9) thumbnail at `public/games/<id>/thumb.png` (or `.svg`, `.jpg`, `.webp`). If the file is missing the card automatically falls back to a generated gradient with the game's initials, so nothing breaks.

3. That's it — `npm run dev` will hot-reload the grid.

### Orientation guide

- `portrait` — narrow centered iframe with a phone-shaped 9:16 box. Best for mobile-first games.
- `landscape` — wide 16:9 iframe up to ~1152px wide. Best for desktop arcade-style games.
- `responsive` — fills the available viewport. Best for fluid layouts that handle any size.

## Deployment

### GitHub Pages (active)

This repo deploys to GitHub Pages via the workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Every push to `main` triggers a build and publishes `dist/` to Pages. The live site is:

```
https://brannysg.github.io/sauce-labs/
```

The project lives on a sub-path, so [`vite.config.ts`](vite.config.ts) sets `base` to `/sauce-labs/` for production builds (and for `npm run preview`) while keeping `/` for `npm run dev`. If you fork this repo under a different name, update the `base` value to match `/<your-repo-name>/`.

To enable Pages on a freshly forked repo:

1. In repo Settings -> Pages, set Source to **GitHub Actions**.
2. Push to `main`. The workflow handles the rest.

### Cloudflare Pages (alternative)

Also works out of the box. Connect this repo, set the build command to `npm run build`, set the output directory to `dist`, and change the `base` in [`vite.config.ts`](vite.config.ts) to `/` (since Cloudflare typically serves at the domain root).

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
