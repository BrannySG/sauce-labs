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
   * Use when the game's UI needs more breathing room than the orientation
   * default (16/9 for landscape, 9/16 for portrait).
   */
  aspectRatio?: string;
  /**
   * Optional explicit render size (in CSS pixels) for the iframe. The
   * iframe is rendered at this size and visually scaled to fit the play
   * surface, so the embedded game always gets enough internal room to
   * avoid its own scrollbars. If omitted, a sensible default is derived
   * from the orientation + aspectRatio.
   */
  designSize?: { width: number; height: number };
  recommendedDevice?: RecommendedDevice;
  updatedAt?: string;
}

export const games: GameEntry[] = [
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
    aspectRatio: "3 / 2",
    recommendedDevice: "Any",
    updatedAt: "2026-05-27",
  },
];
