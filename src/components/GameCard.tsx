import { useState, type KeyboardEvent } from "react";
import type { GameEntry } from "../data/games";
import { StatusPill } from "./StatusPill";
import { ThumbnailFallback } from "./ThumbnailFallback";

interface GameCardProps {
  game: GameEntry;
  onPlay: (game: GameEntry) => void;
}

function resolveAsset(path: string): string {
  if (!path) return path;
  if (/^(https?:)?\/\//i.test(path)) return path;
  const base = import.meta.env.BASE_URL ?? "/";
  const trimmed = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${trimmed}`;
}

export function GameCard({ game, onPlay }: GameCardProps) {
  const [thumbFailed, setThumbFailed] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPlay(game);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onPlay(game)}
      onKeyDown={handleKeyDown}
      aria-label={`Play ${game.title} by ${game.creator}`}
      className="group flex cursor-pointer flex-col outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sauce-400)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--color-canvas)] rounded-2xl"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-[var(--color-border-strong)] group-hover:shadow-md">
        {thumbFailed || !game.thumbnail ? (
          <ThumbnailFallback title={game.title} seed={game.id} />
        ) : (
          <img
            src={resolveAsset(game.thumbnail)}
            alt=""
            loading="lazy"
            onError={() => setThumbFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute right-2.5 top-2.5">
          <StatusPill status={game.status} />
        </div>
      </div>

      <p className="mt-3 px-1 text-sm">
        <span className="font-medium text-[var(--color-text)]">
          {game.title}
        </span>
        <span className="text-[var(--color-muted)]"> · {game.creator}</span>
      </p>
    </div>
  );
}
