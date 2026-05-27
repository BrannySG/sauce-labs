import type { GameStatus } from "../data/games";

interface StatusPillProps {
  status: GameStatus;
  className?: string;
}

const DOT_COLORS: Record<GameStatus, string> = {
  New: "bg-emerald-500",
  Prototype: "bg-amber-500",
  "Tiny Toy": "bg-sky-500",
  WIP: "bg-violet-500",
  Archived: "bg-zinc-400",
};

export function StatusPill({ status, className = "" }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide ring-1 ring-inset backdrop-blur-sm ${className}`}
      style={{
        backgroundColor: "var(--color-status-bg)",
        color: "var(--color-status-text)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        // ring color via custom property
        ["--tw-ring-color" as string]: "var(--color-status-ring)",
      }}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${DOT_COLORS[status]}`}
      />
      {status}
    </span>
  );
}
