import type { GameEntry } from "../data/games";
import { GameCard } from "./GameCard";

interface GameGridProps {
  games: GameEntry[];
  onPlay: (game: GameEntry) => void;
}

function EmptyState() {
  return (
    <p className="py-20 text-center text-sm text-[var(--color-muted)]">
      No games yet. Add the first one to{" "}
      <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 text-xs">
        src/data/games.ts
      </code>
      .
    </p>
  );
}

export function GameGrid({ games, onPlay }: GameGridProps) {
  if (games.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <GameCard key={game.id} game={game} onPlay={onPlay} />
      ))}
    </div>
  );
}
