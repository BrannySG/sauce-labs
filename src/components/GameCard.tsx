import { useState, type KeyboardEvent } from "react";
import type { GameEntry } from "../data/games";
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

        {game.multiplayer && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-white shadow-sm ring-1 ring-white/15 backdrop-blur-sm">
            <MultiplayerIcon />
            Multiplayer
          </span>
        )}
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

function MultiplayerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
    </svg>
  );
}
