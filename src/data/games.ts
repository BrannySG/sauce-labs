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
    id: "vibe-tetris",
    title: "Vibe Tetris",
    creator: "Branny",
    tagline: "A simple falling-block prototype built as a web game experiment.",
    status: "Prototype",
    thumbnail: "/games/vibe-tetris/thumb.svg",
    playUrl: "https://brannysg.github.io/vibe-tetris/",
    orientation: "portrait",
    recommendedDevice: "Any",
    updatedAt: "2026-05-27",
  },
];
