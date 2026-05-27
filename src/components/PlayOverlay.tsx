import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { GameEntry } from "../data/games";

interface PlayOverlayProps {
  game: GameEntry;
  onClose: () => void;
}

// Approx. height taken up by the overlay header bar + content padding.
// Used to cap the play surface so it never overflows the viewport.
const PLAY_CHROME = "7.5rem";

function getPlaySurfaceClasses(orientation: GameEntry["orientation"]): string {
  if (orientation === "responsive") {
    return "w-full h-full max-w-[1400px]";
  }
  return "w-full";
}

function getPlaySurfaceStyle(game: GameEntry): CSSProperties {
  if (game.orientation === "responsive") {
    return {};
  }

  const ratio =
    game.aspectRatio ?? (game.orientation === "portrait" ? "9 / 16" : "16 / 9");
  const [wStr, hStr] = ratio.split("/").map((part) => part.trim());
  const w = Number(wStr) || 16;
  const h = Number(hStr) || 9;
  const maxWidthPx = game.orientation === "portrait" ? 440 : 1152;

  // The container's width is the smaller of (orientation max width) and
  // (the width that keeps an aspect-ratio box inside the remaining viewport
  // height). This prevents the outer wrapper from ever needing scrollbars.
  return {
    maxWidth: `min(${maxWidthPx}px, calc((100dvh - ${PLAY_CHROME}) * ${w} / ${h}))`,
    aspectRatio: `${w} / ${h}`,
  };
}

export function PlayOverlay({ game, onClose }: PlayOverlayProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
          return;
        }
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.classList.add("overlay-open");
    return () => {
      document.body.classList.remove("overlay-open");
    };
  }, []);

  useEffect(() => {
    setFullscreenSupported(typeof document.fullscreenEnabled === "boolean" ? document.fullscreenEnabled : false);
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleFullscreen = () => {
    const target = containerRef.current;
    if (!target) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      target.requestFullscreen().catch(() => {});
    }
  };

  const handleBackdropMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${game.title} play view`}
      onMouseDown={handleBackdropMouseDown}
      className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm"
      style={{ animation: "sauce-fade-in 160ms ease-out both" }}
    >
      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#15151d] px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-base font-semibold text-white sm:text-lg">
            {game.title}
          </h2>
          <p className="truncate text-xs font-medium text-white/65">
            by {game.creator}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
          {fullscreenSupported && (
            <button
              type="button"
              onClick={handleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 text-xs font-medium text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sauce-400)]"
            >
              <FullscreenIcon active={isFullscreen} />
              <span className="hidden sm:inline">
                {isFullscreen ? "Exit" : "Fullscreen"}
              </span>
            </button>
          )}

          <a
            href={game.playUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 text-xs font-medium text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sauce-400)]"
            title="Open game in new tab"
          >
            <ExternalIcon />
            <span className="hidden sm:inline">Open in new tab</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close play view"
            title="Close (Esc)"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-[var(--color-sauce-500)]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sauce-400)]"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden p-3 sm:p-6">
        <div
          ref={containerRef}
          className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/50 ring-1 ring-white/10 ${getPlaySurfaceClasses(game.orientation)}`}
          style={{
            animation: "sauce-scale-in 200ms ease-out both",
            ...getPlaySurfaceStyle(game),
          }}
        >
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--color-surface)] text-[var(--color-muted)]">
              <span
                className="block h-8 w-8 rounded-full border-2 border-white/15 border-t-[var(--color-sauce-400)]"
                style={{ animation: "sauce-spin 800ms linear infinite" }}
                aria-hidden="true"
              />
              <span className="text-xs uppercase tracking-widest">
                Loading {game.title}…
              </span>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={game.playUrl}
            title={`${game.title} by ${game.creator}`}
            onLoad={() => setIframeLoaded(true)}
            allow="fullscreen; gamepad; autoplay; clipboard-write; accelerometer; gyroscope"
            allowFullScreen
            className="h-full w-full border-0 bg-black"
          />
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.47 4.47a.75.75 0 0 1 1.06 0L10 8.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L11.06 10l4.47 4.47a.75.75 0 1 1-1.06 1.06L10 11.06l-4.47 4.47a.75.75 0 0 1-1.06-1.06L8.94 10 4.47 5.53a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M11 3a1 1 0 1 0 0 2h2.586L8.293 10.293a1 1 0 0 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5Z" />
      <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5Z" />
    </svg>
  );
}

function FullscreenIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M8 3.75A.75.75 0 0 0 7.25 3h-3.5A.75.75 0 0 0 3 3.75v3.5a.75.75 0 0 0 1.5 0V5.56l2.47 2.47a.75.75 0 1 0 1.06-1.06L5.56 4.5H7.25A.75.75 0 0 0 8 3.75ZM12 16.25c0 .414.336.75.75.75h3.5a.75.75 0 0 0 .75-.75v-3.5a.75.75 0 0 0-1.5 0v1.69l-2.47-2.47a.75.75 0 1 0-1.06 1.06l2.47 2.47h-1.69a.75.75 0 0 0-.75.75ZM12 3.75c0-.414.336-.75.75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V5.56l-2.47 2.47a.75.75 0 1 1-1.06-1.06l2.47-2.47h-1.69a.75.75 0 0 1-.75-.75ZM8 16.25a.75.75 0 0 1-.75.75h-3.5a.75.75 0 0 1-.75-.75v-3.5a.75.75 0 0 1 1.5 0v1.69l2.47-2.47a.75.75 0 1 1 1.06 1.06L5.56 15.5H7.25a.75.75 0 0 1 .75.75Z" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3.75 3a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0V4.5h2.75a.75.75 0 0 0 0-1.5h-3.5ZM12.25 3a.75.75 0 0 0 0 1.5h3.25v2.75a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-4ZM3 12.75a.75.75 0 0 1 1.5 0V15.5h2.75a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75v-3.5ZM16.25 12a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-.75.75h-4a.75.75 0 0 1 0-1.5h3.25v-2.75a.75.75 0 0 1 .75-.75Z" />
    </svg>
  );
}
