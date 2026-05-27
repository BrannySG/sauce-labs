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
        <div className="flex items-center">
          <a
            href="https://saucestudios.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] sm:inline-flex"
          >
            saucestudios.com &nbsp;&rarr;
          </a>
        </div>

        <a
          href="."
          aria-label="Sauce Labs home"
          className="group flex flex-col items-center gap-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sauce-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
        >
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-sauce-400)] to-[var(--color-sauce-600)] font-display text-sm font-bold text-white shadow-sm transition-transform duration-200 group-hover:rotate-[-4deg]"
            >
              S
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Sauce Labs
            </span>
          </span>
          <span className="text-center text-xs text-[var(--color-muted)]">
            playable experiments by Sauce Studios
          </span>
        </a>

        <div className="flex justify-end">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
