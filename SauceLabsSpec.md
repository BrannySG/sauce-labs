Sauce Labs V1 — Build Spec

You are building Sauce Labs, a simple public website for hosting and sharing playable web game prototypes made by the Sauce Studios team.

The site should feel like a lightweight public gallery of experiments, closer to Neal.fun than Miniclip. It is not a full game portal, not a social platform, and not a polished commercial storefront.

The goal is:

Let visitors quickly browse small playable experiments, click a game, and start playing immediately.

Product goals

Sauce Labs should:

Present our games in a clean, fun, public-facing way.
Let users play games directly on the site through embedded iframes.
Make each game feel intentionally packaged with a thumbnail, creator name, game name, and short flavour text.
Avoid accounts, ratings, comments, payments, leaderboards, or complex platform features.
Work locally first, but be structured so it can easily be deployed to a static host later.
Support games hosted elsewhere, especially GitHub Pages links.
Intended user experience

The homepage should show a grid of game cards.

Each card should include:

thumbnail image
game name
creator name
short flavour text
optional status pill, such as Prototype, Tiny Toy, WIP, New

When the user clicks a card, the game should open immediately in a play view.

The play view should include:

embedded game iframe
game title
creator name
close/back button
open in new tab button
optional fullscreen button if practical

The user should not need to go through a detailed game page before playing.

V1 scope
Required

Build:

responsive homepage
game card grid
game iframe play overlay or play screen
local game data file controlled by the site owner
support for external game URLs, especially GitHub Pages URLs
simple branded visual identity for “Sauce Labs”
fallback button to open the game in a new tab
Not required for V1

Do not build:

user accounts
admin panel
database
comments
ratings
likes
leaderboards
achievements
payment/monetisation
automatic game submissions by devs
complex CMS

For V1, the game list can be manually edited by the site owner in code.

Technical approach

Use a simple static frontend.

Recommended stack:

Vite
React
TypeScript
static TypeScript game registry
CSS/Tailwind/simple component styling

The important requirement is that the final site can be built into static files and hosted on a static host.

Local-first requirement

The project must run locally first.

Expected local workflow:

npm install
npm run dev

Expected production build workflow:

npm run build
npm run preview

The app should not depend on server-side logic.

The app should work when deployed as static files.

Game hosting model

Individual games may be hosted separately, usually via GitHub Pages.

Example real game URL:

https://brannysg.github.io/vibe-tetris/

Sauce Labs will embed that URL in an iframe.

Example iframe:

<iframe
  src="https://brannysg.github.io/vibe-tetris/"
  allow="fullscreen; gamepad"
  allowfullscreen
></iframe>
Give feedback

The site should assume that most games are standalone static web games hosted elsewhere.

Important iframe notes

The play view should assume embedded games may have quirks.

Include:

Open in new tab as a fallback.
A visible close/back button.
A responsive iframe container.
A centered layout for portrait/mobile-first games.
A desktop-friendly layout for landscape games.

Some games may need the user to click inside the iframe before keyboard controls work. This is acceptable.

Site hosting recommendation

The main Sauce Labs site should eventually live at something like:

https://labs.saucestudios.com

Recommended final URL:

labs.saucestudios.com

Alternative:

play.saucestudios.com

Use labs.saucestudios.com if possible, because the project is called Sauce Labs, and it frames the site as playful experiments rather than a polished arcade platform.

Hosting options

The main site can be hosted on:

Option A — Cloudflare Pages

Recommended for the Sauce Labs main site.

Good fit because:

static hosting
custom domain support
Git integration
easy deploys from a GitHub repo
good for a public static site
Option B — GitHub Pages

Also acceptable, especially if keeping everything GitHub-native.

Good fit because:

the team is already learning GitHub Pages
simple mental model
easy static hosting

For V1, either is acceptable.

Domain/setup tasks for the site owner

Before or during deployment, the owner should:

Choose final URL.

Recommended:

labs.saucestudios.com
Decide where DNS is managed.

If the domain is already managed through Cloudflare, Cloudflare Pages is especially convenient.

If the domain is elsewhere, the DNS provider will need a record pointing the chosen subdomain to the static host.

Create the main site repo.

Suggested repo name:

sauce-labs
Create/deploy individual game repos.

Each game can have its own GitHub Pages URL.

Example:

brannysg/vibe-tetris
Add game entries manually to Sauce Labs.

For V1, the site owner manually updates the Sauce Labs game registry.

Game registry

Create a local data file, for example:

src/data/games.ts

Example structure:

export type GameStatus = "New" | "Prototype" | "Tiny Toy" | "WIP" | "Archived";

export type GameOrientation = "portrait" | "landscape" | "responsive";

export interface GameEntry {
  id: string;
  title: string;
  creator: string;
  tagline: string;
  status: GameStatus;
  thumbnail: string;
  playUrl: string;
  orientation: GameOrientation;
  recommendedDevice?: "Mobile" | "Desktop" | "Any";
  updatedAt?: string;
}

export const games: GameEntry[] = [
  {
    id: "vibe-tetris",
    title: "Vibe Tetris",
    creator: "Branny",
    tagline: "A simple falling-block prototype built as a web game experiment.",
    status: "Prototype",
    thumbnail: "/games/vibe-tetris/thumb.png",
    playUrl: "https://brannysg.github.io/vibe-tetris/",
    orientation: "portrait",
    recommendedDevice: "Any",
    updatedAt: "2026-05-27"
  }
];
Registry rules

Each game needs:

id
title
creator
tagline
thumbnail
playUrl
status
orientation

The site should not break if optional fields are missing.

Asset requirements

For each game, prepare a thumbnail image.

Recommended thumbnail size:

1200x675

16:9 is easiest for cards and sharing.

Example path:

public/
  games/
    vibe-tetris/
      thumb.png

Optional later:

square icon
animated gif/webm preview
banner image
creator avatar

For V1, use only thumbnails.

Design direction

The site should feel:

clean
playful
lightweight
experimental
fast
friendly
not overly corporate
not too “gamer portal”

Suggested main copy:

Sauce Labs
Playable experiments from Sauce Studios.

Alternative:

Sauce Labs
Small games, strange prototypes, and playable ideas.

Homepage layout:

Header
  Sauce Labs
  Short intro
  Optional small Sauce Studios link

Game grid
  Cards

Card layout:

[Thumbnail]

Game Name
by Creator

Short flavour text

[Status pill]

Clicking anywhere on the card should open the game.

Play overlay / play screen

Recommended V1 approach: use a full-screen modal overlay.

When a card is clicked:

darken or replace the homepage
show a top bar
embed the iframe below

Play overlay layout:

Top bar:
  Game title
  Creator
  Open in new tab
  Fullscreen
  Close

Main area:
  iframe containing game
iframe sizing

For portrait games:

center the iframe
use a mobile-like aspect ratio
maximum width around phone/tablet size
allow it to scale down on small screens

For landscape games:

use a wide responsive container
allow most of the viewport

For responsive games:

fill available space

Suggested behavior:

if orientation === "portrait":
  use narrow centered frame

if orientation === "landscape":
  use wide 16:9-ish frame

if orientation === "responsive":
  use full flexible frame
Fallback behavior

Every embedded game should have:

Open in new tab

This is important because some games may behave better outside an iframe.

If a game fails to load or behaves oddly, the user can still play it directly.

Suggested file structure
sauce-labs/
  public/
    games/
      vibe-tetris/
        thumb.png

  src/
    components/
      Header.tsx
      GameCard.tsx
      GameGrid.tsx
      PlayOverlay.tsx
      StatusPill.tsx

    data/
      games.ts

    App.tsx
    main.tsx
    styles.css

  package.json
  index.html
  README.md
Acceptance criteria

The V1 is complete when:

The site runs locally with npm run dev.
The homepage displays a branded Sauce Labs header.
The homepage displays game cards from a local registry.
Each game card shows thumbnail, title, creator, tagline, and status.
Clicking a game opens an embedded iframe play view.
The play view embeds this real test URL:
https://brannysg.github.io/vibe-tetris/
The play view has close/back functionality.
The play view has an “Open in new tab” fallback.
The layout works on desktop and mobile.
The project can be built with npm run build.
The build output can be hosted as a static site.
Nice-to-have but not required

Add only if quick and clean:

filter by status
latest sorting
tiny animated hover effects
keyboard Escape closes play overlay
loading state while iframe loads
simple empty state if no games exist
shareable URL state, e.g. ?game=vibe-tetris

The shareable URL state would be useful, but do not let it overcomplicate V1.

Build priority

Build in this order:

Static homepage with one hardcoded sample card.
Use the real test game: https://brannysg.github.io/vibe-tetris/.
Move game data into src/data/games.ts.
Build reusable GameCard.
Build PlayOverlay with iframe.
Add responsive layout for portrait/landscape/responsive games.
Add open-in-new-tab fallback.
Polish styling.
Test locally.
Prepare for static deployment.
Important instructions

Do not build a backend.

Do not add accounts.

Do not add a CMS.

Do not require a database.

Do not require game developers to submit metadata themselves.

For V1, the site owner manually edits the game registry.

The core experience should be:

Browse card → click card → play immediately.