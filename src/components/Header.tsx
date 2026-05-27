import { ThemeToggle } from "./ThemeToggle";
import type { Theme } from "../hooks/useTheme";

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="relative">
      <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-start gap-4 px-4 pt-8 sm:px-6 sm:pt-10">
        <div />

        <a
          href="."
          aria-label="Sauce Labs home"
          className="group flex flex-col items-center gap-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sauce-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
        >
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-sauce-400)] to-[var(--color-sauce-600)] text-white shadow-sm transition-transform duration-200 group-hover:rotate-[-4deg]"
            >
              <FlaskIcon />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Sauce Labs
            </span>
          </span>
          <span className="text-center text-xs text-[var(--color-muted)]">
            playable experiments by Sauce Games
          </span>
        </a>

        <div className="flex justify-end">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}

function FlaskIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M9 3h6" />
      <path d="M10 3v6.5L4.6 17.7A1.6 1.6 0 0 0 5.95 20.2h12.1a1.6 1.6 0 0 0 1.35-2.5L14 9.5V3" />
      <path d="M7.5 14.5h9" />
    </svg>
  );
}
