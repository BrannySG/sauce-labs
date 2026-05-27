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
    recommendedDevice: "Any",
    updatedAt: "2026-05-27",
  },
];
