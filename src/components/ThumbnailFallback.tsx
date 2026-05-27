interface ThumbnailFallbackProps {
  title: string;
  seed?: string;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const PALETTES: Array<[string, string]> = [
  ["#ff5a1f", "#ffb347"],
  ["#7c3aed", "#ec4899"],
  ["#0ea5e9", "#22d3ee"],
  ["#10b981", "#84cc16"],
  ["#f59e0b", "#ef4444"],
  ["#6366f1", "#a855f7"],
];

export function ThumbnailFallback({ title, seed }: ThumbnailFallbackProps) {
  const idx = hashString(seed ?? title) % PALETTES.length;
  const [from, to] = PALETTES[idx];
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
      aria-hidden="true"
    >
      <span
        className="font-display text-5xl font-bold tracking-tight text-white/90 drop-shadow-sm"
        style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
      >
        {initials || "S"}
      </span>
    </div>
  );
}
