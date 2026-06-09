import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Shield, Crosshair, Heart } from "lucide-react";
import { apiPost } from "../../../lib/api";
import { useAppSettings } from "../../../hooks/useAppSettings";

type OverwatchScoreboardResult = {
  battleTags: string[];
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  tank: <Shield size={14} />,
  damage: <Crosshair size={14} />,
  support: <Heart size={14} />,
};

const ARCHETYPE_COLORS: Record<string, string> = {
  dive: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  rush: "bg-red-500/20 text-red-300 border-red-500/30",
  poke: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

type AnalyzedHero = {
  heroId: string;
  name: string;
  role: string;
  archetype: string;
  score: number;
  reasons: string[];
};

export function OverwatchCompanionView() {
  const { settings } = useAppSettings();
  const backendUrl = settings.backendUrl.replace(/\/+$/, "");
  const [battleTags, setBattleTags] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onOverwatchScoreboard(
      (result: OverwatchScoreboardResult) => {
        if (result.battleTags.length > 0) {
          setBattleTags(result.battleTags);
        }
      },
    );
    return () => { unsubscribe?.(); };
  }, []);

  const heroIds = battleTags.slice(0, 5);

  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ["matchup-analyze", heroIds],
    queryFn: async () => {
      const res = await apiPost<AnalyzedHero[]>("/api/overwatch/matchups/analyze", {
        enemyHeroes: heroIds,
      }, backendUrl);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    enabled: heroIds.length > 0,
    staleTime: 10_000,
  });

  const topCounters = analysis?.slice(0, 3) ?? [];

  // Classify the enemy team comp archetypes
  const enemyArchetypes = analysis
    ? [...new Set(analysis.map((h) => h.archetype))]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Overwatch Companion
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Press Tab in-game to scan the scoreboard for enemy heroes and
          counter-recommendations.
        </p>
      </div>

      {battleTags.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Activity size={24} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No scoreboard detected yet. Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">Tab</kbd> in-game to scan.
          </p>
        </div>
      )}

      {battleTags.length > 0 && (
        <>
          {/* Detected BattleTags */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
              Detected Players
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {battleTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[11px] font-mono bg-muted rounded border border-border"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Enemy Team Analysis */}
          {isLoading && (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Analyzing enemy composition...
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-300">
              Failed to analyze matchups.
            </div>
          )}

          {analysis && topCounters.length > 0 && (
            <>
              {/* Enemy archetype summary */}
              {enemyArchetypes.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Enemy Composition:
                  </span>
                  {enemyArchetypes.map((archetype) => (
                    <span
                      key={archetype}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${ARCHETYPE_COLORS[archetype] ?? "bg-muted text-muted-foreground border-border"}`}
                    >
                      {archetype}
                    </span>
                  ))}
                </div>
              )}

              {/* Counter recommendations */}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
                  Recommended Counters
                </h2>
                <div className="grid gap-3">
                  {topCounters.map((hero, i) => (
                    <div
                      key={hero.heroId}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-5">
                          #{i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {hero.name}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              {ROLE_ICONS[hero.role]}
                              {hero.role}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${ARCHETYPE_COLORS[hero.archetype] ?? "bg-muted text-muted-foreground border-border"}`}
                            >
                              {hero.archetype}
                            </span>
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {hero.reasons.slice(0, 2).map((reason, j) => (
                              <p
                                key={j}
                                className="text-[11px] text-muted-foreground"
                              >
                                {reason}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold tabular-nums text-foreground">
                            {hero.score}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            score
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
