import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "warning" | "info" | "positive";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground border-border",
  warning: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
  info: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  positive: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
};

export function BehaviorBadge({
  label,
  variant = "default",
  className,
}: {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Derive behavior badges from profile delta data */
export type PlayerBehavior = {
  oneTrick: boolean;
  aggressive: boolean;
  passive: boolean;
  supportMain: boolean;
  dpsMain: boolean;
  tankMain: boolean;
};

export function getBehaviorBadgesFromDelta(
  deltas: any,
): { label: string; variant: BadgeVariant }[] {
  const badges: { label: string; variant: BadgeVariant }[] = [];

  // This is a placeholder — real logic would parse hero playtime distributions
  // from the OverFast stats data to determine one-trick, role mains, etc.

  if (deltas?.hero_playtime) {
    // Check if player has > 80% playtime on one hero
    const total = Object.values(deltas.hero_playtime as Record<string, number>).reduce(
      (a: number, b: number) => a + b,
      0,
    );
    const max = Math.max(
      ...(Object.values(deltas.hero_playtime) as number[]),
    );
    if (total > 0 && max / total > 0.8) {
      badges.push({ label: "One-Trick", variant: "warning" });
    }
  }

  return badges;
}

export function PlayerBehaviorBadges({ deltas }: { deltas: any }) {
  const badges = getBehaviorBadgesFromDelta(deltas);

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((badge) => (
        <BehaviorBadge
          key={badge.label}
          label={badge.label}
          variant={badge.variant}
        />
      ))}
    </div>
  );
}
