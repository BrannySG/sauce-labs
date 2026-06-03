export type GameStatus = "New" | "Prototype" | "Tiny Toy" | "WIP" | "Archived";

export type GameOrientation = "portrait" | "landscape" | "responsive";

export type RecommendedDevice = "Mobile" | "Desktop" | "Any";

export interface GameEntry {
  id: string;
  title: string;
  creator: string;
  tagline: string;
  status: GameStatus;
  thumbnail: string;
  playUrl: string;
  orientation: GameOrientation;
  /**
   * Optional CSS aspect-ratio override (e.g. "3 / 2", "16 / 10").
   * Use when the game's UI needs a different shape than the orientation
   * default (16/9 for landscape, 9/16 for portrait) — for example if the
   * default produces empty bands or internal scrollbars at the container
   * size.
   */
  aspectRatio?: string;
  recommendedDevice?: RecommendedDevice;
  updatedAt?: string;
}

const gameEntries: GameEntry[] = [
  {
    id: "clicker-demo",
    title: "Sauce Clicker",
    creator: "Sauce Games",
    tagline: "Click fast, submit your score, and test the Sauce leaderboard and analytics SDK.",
    status: "Prototype",
    thumbnail: "/games/clicker-demo/thumb.svg",
    playUrl: "https://brannysg.github.io/sauce-labs/play/clicker-demo/",
    orientation: "landscape",
    recommendedDevice: "Any",
    updatedAt: "2026-06-03",
  },
  {
    id: "tap-to-bounce",
    title: "Tap to Bounce",
    creator: "Alykia",
    tagline: "Tap to bounce, hold to charge — chase the pink portal across neon arcade levels.",
    status: "New",
    thumbnail: "/games/tap-to-bounce/thumb.svg",
    playUrl: "https://alykia.github.io/tap-to-bounce/",
    orientation: "portrait",
    recommendedDevice: "Any",
    updatedAt: "2026-05-27",
  },
  {
    id: "vibe-tetris",
    title: "Vibe Tetris",
    creator: "Branny",
    tagline: "A simple falling-block prototype built as a web game experiment.",
    status: "Prototype",
    thumbnail: "/games/vibe-tetris/thumb.svg",
    playUrl: "https://brannysg.github.io/vibe-tetris/",
    orientation: "landscape",
    aspectRatio: "4 / 3",
    recommendedDevice: "Any",
    updatedAt: "2026-05-27",
  },
  {
    id: "merge-for-brainrots",
    title: "Merge for Brainrots",
    creator: "Paulo Corona",
    tagline: "Tap, spawn, and merge unhinged Italian brainrot creatures into ever-bigger forms.",
    status: "New",
    thumbnail: "/games/merge-for-brainrots/thumb.jpg",
    playUrl: "https://paulocorona.github.io/vibe-merge-brainrot/",
    orientation: "portrait",
    recommendedDevice: "Any",
    updatedAt: "2026-05-27",
  },
  {
    id: "crimson-ascent",
    title: "Crimson Ascent",
    creator: "Alykia",
    tagline: "Climb a gothic cathedral as a vampire heroine — dash, wall-jump, and shoot through the night.",
    status: "New",
    thumbnail: "/games/crimson-ascent/thumb.jpg",
    playUrl: "https://alykia.github.io/crimson-ascent/",
    orientation: "portrait",
    recommendedDevice: "Desktop",
    updatedAt: "2026-05-28",
  },
  {
    id: "tetris-roguelike",
    title: "Tetris Rogue-Like",
    creator: "Qasim",
    tagline: "Stack tetrominoes to attack an AI rival — a roguelike twist on the classic falling-block game.",
    status: "New",
    thumbnail: "/games/tetris-roguelike/thumb.jpg",
    playUrl: "https://qasimali9001.github.io/TetrisRogueLikeThingy/",
    orientation: "landscape",
    recommendedDevice: "Desktop",
    updatedAt: "2026-05-29",
  },
  {
    id: "card-renderer",
    title: "Card Renderer",
    creator: "Branny",
    tagline: "Flip and tilt a premium trading card with holographic foil, parallax, and sparkle effects.",
    status: "New",
    thumbnail: "/games/card-renderer/thumb.jpg",
    playUrl: "https://brannysg.github.io/card-renderer/",
    orientation: "responsive",
    recommendedDevice: "Any",
    updatedAt: "2026-05-29",
  },
  {
    id: "typerogue",
    title: "TypeRogue",
    creator: "Damon",
    tagline: "Type enemy names to strike them down as you fight through a cursed dungeon — a typing roguelike.",
    status: "New",
    thumbnail: "/games/typerogue/thumb.jpg",
    playUrl: "https://damonsg.github.io/Vibe-TypeRogue/",
    orientation: "landscape",
    recommendedDevice: "Desktop",
    updatedAt: "2026-05-29",
  },
  {
    id: "tap-for-brainrots",
    title: "Tap for Brainrots",
    creator: "Branny",
    tagline: "Tap chests, collect loot, and keep the idle grind going in this chaotic brainrot clicker.",
    status: "New",
    thumbnail: "/games/tap-for-brainrots/thumb.jpg",
    playUrl: "https://brannysg.github.io/TapForBrainrots/",
    orientation: "portrait",
    recommendedDevice: "Any",
    updatedAt: "2026-05-30",
  },
  {
    id: "dont-stop-pop",
    title: "Don't Stop Pop",
    creator: "Lei",
    tagline: "Pop as many balloons as you can before they float away in this bright party-themed tap challenge.",
    status: "New",
    thumbnail: "/games/dont-stop-pop/thumb.png",
    playUrl: "https://leisumyi.github.io/Don-t-Stop-Pop-/",
    orientation: "portrait",
    recommendedDevice: "Mobile",
    updatedAt: "2026-06-02",
  },
];

/** Newest games first; same-day entries keep later additions ahead. */
export const games: GameEntry[] = [...gameEntries]
  .map((game, index) => ({ game, index }))
  .sort((a, b) => {
    const dateA = a.game.updatedAt ?? "";
    const dateB = b.game.updatedAt ?? "";
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return b.index - a.index;
  })
  .map(({ game }) => game);
