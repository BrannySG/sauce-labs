import { useCallback, useState } from "react";
import { Header } from "./components/Header";
import { GameGrid } from "./components/GameGrid";
import { PlayOverlay } from "./components/PlayOverlay";
import { games, type GameEntry } from "./data/games";
import { useTheme } from "./hooks/useTheme";

export function App() {
  const [activeGame, setActiveGame] = useState<GameEntry | null>(null);
  const { theme, toggleTheme } = useTheme();

  const handlePlay = useCallback((game: GameEntry) => {
    setActiveGame(game);
  }, []);

  const handleClose = useCallback(() => {
    setActiveGame(null);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <GameGrid games={games} onPlay={handlePlay} />
      </main>

      {activeGame && (
        <PlayOverlay game={activeGame} onClose={handleClose} />
      )}
    </div>
  );
}
