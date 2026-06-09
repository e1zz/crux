import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  Activity,
  Award,
  Clock3,
  Crosshair,
  HeartPulse,
  Loader2,
  Shield,
  Swords,
  Target,
  Trophy,
} from "lucide-react";

import { useAppSettings } from "../../../hooks/useAppSettings";

type RoleKey = "tank" | "damage" | "support";

type PlayerSummary = {
  username: string;
  avatar?: string;
  namecard?: string;
  title?: string;
  endorsement?: { level: number; frame?: string };
  competitive?: {
    pc?: PlayerCompetitivePlatformRanks | null;
    console?: PlayerCompetitivePlatformRanks | null;
  };
};

type PlayerCompetitiveRank = {
  division: string;
  tier: number;
  role_icon?: string;
  rank_icon?: string;
  tier_icon?: string;
};

type PlayerCompetitivePlatformRanks = {
  season?: number | null;
  tank?: PlayerCompetitiveRank | null;
  damage?: PlayerCompetitiveRank | null;
  support?: PlayerCompetitiveRank | null;
  open?: PlayerCompetitiveRank | null;
};

type StatsSummary = {
  games_played?: number;
  games_won?: number;
  games_lost?: number;
  time_played?: number;
  winrate?: number;
  kda?: number;
  total?: {
    eliminations?: number;
    assists?: number;
    deaths?: number;
    damage?: number;
    healing?: number;
  };
  average?: {
    eliminations?: number;
    assists?: number;
    deaths?: number;
    damage?: number;
    healing?: number;
  };
};

type PlayerStats = {
  general?: StatsSummary | null;
  roles?: Partial<Record<RoleKey, StatsSummary | null>> | null;
  heroes?: Record<string, StatsSummary | null> | null;
};

type CareerStatBuckets = {
  assists?: Record<string, number>;
  average?: Record<string, number>;
  best?: Record<string, number>;
  combat?: Record<string, number>;
  game?: Record<string, number>;
  hero_specific?: Record<string, number>;
  match_awards?: Record<string, number>;
  miscellaneous?: Record<string, number>;
};

type PlayerCareerStats = Record<string, CareerStatBuckets | null>;

type HeroSummary = {
  key: string;
  name: string;
  portrait?: string;
  role: RoleKey | string;
};

type Metric = {
  label: string;
  value: string;
  featured?: boolean;
};

type RolePerformance = {
  role: RoleKey;
  rank: PlayerCompetitiveRank | null;
  gamesPlayed: number;
  wins: number;
  losses: number;
  timePlayed: number;
  winrate: number | null;
  kda: number | null;
};

type TopHero = {
  key: string;
  name: string;
  role: string;
  portrait?: string;
  timePlayed: number;
  matches: number;
  winrate: number | null;
  kda: number | null;
  eliminationsPer10: number | null;
  damagePer10: number | null;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

const ROLE_ORDER: RoleKey[] = ["tank", "damage", "support"];

const RANK_NAMES: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
  master: "Master",
  grandmaster: "Grandmaster",
  ultimate: "Ultimate",
};

function formatRank(div: string, tier: number): string {
  const name = RANK_NAMES[div] ?? titleCase(div);
  return `${name} ${tier}`;
}

export function OverwatchPlayerView({ forcedPlayerId }: { forcedPlayerId?: string } = {}) {
  const params = useParams<{ playerId: string }>();
  const playerId = forcedPlayerId || params.playerId;
  const { settings } = useAppSettings();
  const backendUrl = settings.backendUrl.replace(/\/+$/, "");

  const [summary, setSummary] = useState<PlayerSummary | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [career, setCareer] = useState<PlayerCareerStats | null>(null);
  const [heroes, setHeroes] = useState<HeroSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const competitiveRanks = summary?.competitive?.pc ?? summary?.competitive?.console ?? null;
  const generalStats = stats?.general ?? null;
  const rolePerformances = buildRolePerformances(stats?.roles ?? null, competitiveRanks);
  const allHeroesCareer = career?.["all-heroes"] ?? null;
  const overviewMetrics = buildOverviewMetrics(allHeroesCareer, generalStats);
  const performanceMetrics = buildPerformanceMetrics(allHeroesCareer, generalStats);
  const topHeroes = buildTopHeroes(stats?.heroes ?? null, heroes);

  useEffect(() => {
    if (!playerId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSummary(null);
    setStats(null);
    setCareer(null);
    setHeroes([]);

    const fetchData = async () => {
      try {
        const statsQuery = new URLSearchParams({
          gamemode: "competitive",
          platform: "pc",
        });
        const careerQuery = new URLSearchParams({
          gamemode: "competitive",
          platform: "pc",
          hero: "all-heroes",
        });

        const [summaryData, statsData, careerData, heroesData] = await Promise.all([
          fetchApiResponse<PlayerSummary>(
            `${backendUrl}/api/overwatch/players/${encodeURIComponent(playerId)}/summary`,
            { signal: AbortSignal.timeout(10_000) },
          ),
          fetchApiResponse<PlayerStats>(
            `${backendUrl}/api/overwatch/players/${encodeURIComponent(playerId)}/stats?${statsQuery.toString()}`,
            { signal: AbortSignal.timeout(10_000) },
          ),
          fetchApiResponse<PlayerCareerStats>(
            `${backendUrl}/api/overwatch/players/${encodeURIComponent(playerId)}/stats/career?${careerQuery.toString()}`,
            { signal: AbortSignal.timeout(10_000) },
          ),
          fetchApiResponse<HeroSummary[]>(
            `${backendUrl}/api/overwatch/heroes`,
            { signal: AbortSignal.timeout(10_000) },
          ),
        ]);

        if (cancelled) return;

        if (summaryData.success) setSummary(summaryData.data ?? null);
        if (statsData.success) setStats(statsData.data ?? null);
        if (careerData.success) setCareer(careerData.data ?? null);
        if (heroesData.success) setHeroes(Array.isArray(heroesData.data) ? heroesData.data : []);

        if (!summaryData.success && !statsData.success && !careerData.success) {
          setError(summaryData.error ?? statsData.error ?? careerData.error ?? "Failed to load player data");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Network error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchData();
    return () => { cancelled = true; };
  }, [playerId, backendUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !summary && !stats && !career) {
    return (
      <div className="text-center py-16 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {summary && (
        <ProfileHeader summary={summary} generalStats={generalStats} />
      )}

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <CurrentRatingsPanel roles={rolePerformances} />
          <RoleOverviewPanel roles={rolePerformances} />
        </div>

        <div className="flex flex-col gap-4">
          {overviewMetrics.primary.length > 0 && (
            <DashboardPanel
              title="PC Competitive Career Overview"
              icon={<Award size={18} />}
              playtimeSeconds={generalStats?.time_played ?? null}
              matchCount={generalStats?.games_played ?? null}
            >
              <MetricGrid metrics={overviewMetrics.primary} />
              <InlineMetricGrid metrics={overviewMetrics.secondary} />
            </DashboardPanel>
          )}

          {performanceMetrics.primary.length > 0 && (
            <DashboardPanel
              title="PC Competitive Performance Overview"
              icon={<Activity size={18} />}
              playtimeSeconds={generalStats?.time_played ?? null}
              matchCount={generalStats?.games_played ?? null}
            >
              <MetricGrid metrics={performanceMetrics.primary} />
              <InlineMetricGrid metrics={performanceMetrics.secondary} />
            </DashboardPanel>
          )}

          {topHeroes.length > 0 && <TopHeroesPanel heroes={topHeroes} />}
        </div>
      </div>
    </div>
  );
}

function ProfileHeader({
  summary,
  generalStats,
}: {
  summary: PlayerSummary;
  generalStats: StatsSummary | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card">
      {summary.namecard && (
        <img
          src={summary.namecard}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/50">
            {summary.avatar ? (
              <img
                src={summary.avatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">
                {summary.username[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold text-foreground">
              {summary.username}
            </h1>
            {summary.title && (
              <p className="mt-1 text-sm text-muted-foreground">{summary.title}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {summary.endorsement && (
                <InfoPill label={`Endorsement ${summary.endorsement.level}`} />
              )}
              {generalStats?.winrate !== undefined && (
                <InfoPill label={`${formatPercent(generalStats.winrate, 1)} Competitive WR`} />
              )}
              {generalStats?.games_played !== undefined && (
                <InfoPill label={`${formatCount(generalStats.games_played)} Matches`} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border/70 bg-background/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
      {label}
    </span>
  );
}

function CurrentRatingsPanel({ roles }: { roles: RolePerformance[] }) {
  const rankedRoles = roles.filter((role) => role.rank);

  return (
    <SidebarPanel title="Current Ratings" icon={<Trophy size={18} />}>
      {rankedRoles.length === 0 ? (
        <EmptyPanelState text="No ranked roles found for this season." />
      ) : (
        <div className="flex flex-col gap-3">
          {rankedRoles.map((role) => (
            <div
              key={role.role}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 p-3"
            >
              {role.rank?.rank_icon ? (
                <img
                  src={role.rank.rank_icon}
                  alt=""
                  className="h-10 w-10 shrink-0 object-contain"
                />
              ) : (
                <RoleBadge role={role.role} />
              )}
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {roleLabel(role.role)}
                </div>
                <div className="text-base font-semibold text-foreground">
                  {role.rank ? formatRank(role.rank.division, role.rank.tier) : "Unranked"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SidebarPanel>
  );
}

function RoleOverviewPanel({ roles }: { roles: RolePerformance[] }) {
  const activeRoles = roles.filter(
    (role) => role.gamesPlayed > 0 || role.timePlayed > 0,
  );

  return (
    <SidebarPanel title="Roles" icon={<Shield size={18} />}>
      {activeRoles.length === 0 ? (
        <EmptyPanelState text="Competitive role stats are not available yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {activeRoles.map((role) => (
            <div
              key={role.role}
              className="rounded-2xl border border-border/60 bg-background/40 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <RoleBadge role={role.role} />
                  <div>
                    <div className="font-semibold text-foreground">
                      {roleLabel(role.role)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {role.wins}W - {role.losses}L
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {role.winrate !== null && (
                    <div className={`text-sm font-semibold ${roleAccentClass(role.role)}`}>
                      WR {formatPercent(role.winrate, 1)}
                    </div>
                  )}
                  {role.kda !== null && (
                    <div className="text-sm font-semibold text-foreground">
                      KDA {formatDecimal(role.kda, 2)}
                    </div>
                  )}
                  {role.timePlayed > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {formatHoursCompact(role.timePlayed)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SidebarPanel>
  );
}

function SidebarPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-border/70 bg-card/90 p-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/50 text-primary">
          {icon}
        </span>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DashboardPanel({
  title,
  icon,
  playtimeSeconds,
  matchCount,
  children,
}: {
  title: string;
  icon: ReactNode;
  playtimeSeconds: number | null;
  matchCount: number | null;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-border/70 bg-card/90 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-border/60 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/50 text-primary">
            {icon}
          </span>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
          {playtimeSeconds !== null && (
            <span className="flex items-center gap-1.5">
              <Clock3 size={14} />
              {formatHoursBadge(playtimeSeconds)} Playtime
            </span>
          )}
          {matchCount !== null && (
            <span className="flex items-center gap-1.5">
              <Swords size={14} />
              {formatCount(matchCount)} Matches
            </span>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/40 p-4"
        >
          {metric.featured && (
            <span className="absolute inset-y-4 left-0 w-1 rounded-full bg-primary" />
          )}
          <div className={metric.featured ? "pl-3" : undefined}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {metric.label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {metric.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InlineMetricGrid({ metrics }: { metrics: Metric[] }) {
  if (metrics.length === 0) return null;

  return (
    <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {metric.label}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function TopHeroesPanel({ heroes }: { heroes: TopHero[] }) {
  return (
    <section className="rounded-[28px] border border-border/70 bg-card/90 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3 border-b border-border/60 pb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/50 text-primary">
          <Target size={18} />
        </span>
        <h2 className="text-xl font-semibold text-foreground">Top Heroes</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <th className="pb-3 pr-3">Hero</th>
              <th className="pb-3 px-3 text-right">Time Played</th>
              <th className="pb-3 px-3 text-right">Matches</th>
              <th className="pb-3 px-3 text-right">Win %</th>
              <th className="pb-3 px-3 text-right">KDA</th>
              <th className="pb-3 px-3 text-right">Elims/10m</th>
              <th className="pb-3 pl-3 text-right">Damage/10m</th>
            </tr>
          </thead>
          <tbody>
            {heroes.map((hero) => (
              <tr key={hero.key} className="[&:not(:last-child)>td]:border-b [&:not(:last-child)>td]:border-border/60">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-3">
                    {hero.portrait ? (
                      <img
                        src={hero.portrait}
                        alt=""
                        className="h-12 w-12 rounded-xl border border-border/60 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-background/50 text-muted-foreground">
                        {hero.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-foreground">{hero.name}</div>
                      <div className="text-xs text-muted-foreground">{hero.role}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-amber-300">
                  {formatHoursCompact(hero.timePlayed)}
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-foreground">
                  {formatCount(hero.matches)}
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-foreground">
                  {hero.winrate !== null ? formatPercent(hero.winrate, 1) : "-"}
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-amber-300">
                  {hero.kda !== null ? formatDecimal(hero.kda, 2) : "-"}
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-foreground">
                  {hero.eliminationsPer10 !== null ? formatDecimal(hero.eliminationsPer10, 2) : "-"}
                </td>
                <td className="pl-3 py-3 text-right font-semibold tabular-nums text-amber-300">
                  {hero.damagePer10 !== null ? formatCount(hero.damagePer10) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyPanelState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-background/30 px-4 py-6 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function RoleBadge({ role }: { role: RoleKey }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/60">
      {roleIcon(role)}
    </span>
  );
}

function roleIcon(role: RoleKey) {
  switch (role) {
    case "tank":
      return <Shield size={18} className={roleAccentClass(role)} />;
    case "damage":
      return <Crosshair size={18} className={roleAccentClass(role)} />;
    case "support":
      return <HeartPulse size={18} className={roleAccentClass(role)} />;
  }
}

function roleAccentClass(role: RoleKey) {
  switch (role) {
    case "tank":
      return "text-cyan-300";
    case "damage":
      return "text-orange-300";
    case "support":
      return "text-emerald-300";
  }
}

function roleLabel(role: RoleKey) {
  return titleCase(role);
}

function buildRolePerformances(
  roleStats: Partial<Record<RoleKey, StatsSummary | null>> | null,
  ranks: PlayerCompetitivePlatformRanks | null,
) {
  return ROLE_ORDER.map((role) => {
    const stats = roleStats?.[role];

    return {
      role,
      rank: ranks?.[role] ?? null,
      gamesPlayed: stats?.games_played ?? 0,
      wins: stats?.games_won ?? 0,
      losses: stats?.games_lost ?? 0,
      timePlayed: stats?.time_played ?? 0,
      winrate: toNumber(stats?.winrate),
      kda: toNumber(stats?.kda),
    } satisfies RolePerformance;
  }).sort((left, right) => {
    if (right.timePlayed !== left.timePlayed) {
      return right.timePlayed - left.timePlayed;
    }
    return right.gamesPlayed - left.gamesPlayed;
  });
}

function buildOverviewMetrics(
  allHeroesCareer: CareerStatBuckets | null,
  generalStats: StatsSummary | null,
) {
  const combat = allHeroesCareer?.combat;
  const assists = allHeroesCareer?.assists;
  const game = allHeroesCareer?.game;
  const awards = allHeroesCareer?.match_awards;

  return {
    primary: compactMetrics([
      metric("Eliminations", formatCount(firstNumber(combat?.eliminations)), true),
      metric(
        "Hero Damage Done",
        formatCount(firstNumber(combat?.hero_damage_done, combat?.damage_done)),
        true,
      ),
      metric("Objective Time", formatDurationLong(firstNumber(combat?.objective_time)), true),
      metric("Games Won", formatCount(firstNumber(game?.games_won, generalStats?.games_won)), true),
    ]),
    secondary: compactMetrics([
      metric("Deaths", formatCount(firstNumber(combat?.deaths))),
      metric("Assists", formatCount(firstNumber(assists?.assists, generalStats?.total?.assists))),
      metric("Final Blows", formatCount(firstNumber(combat?.final_blows))),
      metric("Objective Kills", formatCount(firstNumber(combat?.objective_kills))),
      metric("Solo Kills", formatCount(firstNumber(combat?.solo_kills))),
      metric("Multikills", formatCount(firstNumber(combat?.multikills))),
      metric("Offensive Assists", formatCount(firstNumber(assists?.offensive_assists))),
      metric("Defensive Assists", formatCount(firstNumber(assists?.defensive_assists))),
      metric("Recon Assists", formatCount(firstNumber(assists?.recon_assists))),
      metric("Melee Final Blows", formatCount(firstNumber(combat?.melee_final_blows))),
      metric("Environmental Kills", formatCount(firstNumber(combat?.environmental_kills))),
      metric("Cards", formatCount(firstNumber(awards?.cards))),
    ]),
  };
}

function buildPerformanceMetrics(
  allHeroesCareer: CareerStatBuckets | null,
  generalStats: StatsSummary | null,
) {
  const average = allHeroesCareer?.average;

  return {
    primary: compactMetrics([
      metric("Eliminations/10m", formatDecimal(firstNumber(average?.eliminations_avg_per_10_min), 2), true),
      metric("Hero Damage/10m", formatCount(firstNumber(average?.hero_damage_done_avg_per_10_min)), true),
      metric("KDA Ratio", formatDecimal(firstNumber(generalStats?.kda), 2), true),
      metric("Win Percentage", formatPercent(firstNumber(generalStats?.winrate), 1), true),
    ]),
    secondary: compactMetrics([
      metric("Deaths/10m", formatDecimal(firstNumber(average?.deaths_avg_per_10_min), 2)),
      metric("Assists/10m", formatDecimal(firstNumber(average?.assists_avg_per_10_min), 2)),
      metric("Final Blows/10m", formatDecimal(firstNumber(average?.final_blows_avg_per_10_min), 2)),
      metric("Objective Kills/10m", formatDecimal(firstNumber(average?.objective_kills_avg_per_10_min), 2)),
      metric("Solo Kills/10m", formatDecimal(firstNumber(average?.solo_kills_avg_per_10_min), 2)),
    ]),
  };
}

function buildTopHeroes(
  heroStats: Record<string, StatsSummary | null> | null,
  heroCatalog: HeroSummary[],
) {
  const catalogByKey = new Map(heroCatalog.map((hero) => [hero.key, hero]));
  const entries = Object.entries(heroStats ?? {}).filter(([, stats]) => stats);
  const playedEntries = entries.filter(([, stats]) => (stats?.games_played ?? 0) > 0);
  const sourceEntries = playedEntries.length > 0
    ? playedEntries
    : entries.filter(([, stats]) => (stats?.time_played ?? 0) > 0);

  return sourceEntries
    .map(([key, stats]) => {
      const meta = catalogByKey.get(key);

      return {
        key,
        name: meta?.name ?? titleCase(key.replace(/-/g, " ")),
        role: meta ? titleCase(String(meta.role)) : "Unknown",
        portrait: meta?.portrait,
        timePlayed: stats?.time_played ?? 0,
        matches: stats?.games_played ?? 0,
        winrate: toNumber(stats?.winrate),
        kda: toNumber(stats?.kda),
        eliminationsPer10: toNumber(stats?.average?.eliminations),
        damagePer10: toNumber(stats?.average?.damage),
      } satisfies TopHero;
    })
    .sort((left, right) => {
      if (right.timePlayed !== left.timePlayed) {
        return right.timePlayed - left.timePlayed;
      }

      return right.matches - left.matches;
    })
    .slice(0, 5);
}

function metric(label: string, value: string | null, featured = false) {
  if (value === null) return null;

  return { label, value, featured } satisfies Metric;
}

function compactMetrics(metrics: Array<Metric | null>) {
  return metrics.filter((metric): metric is Metric => metric !== null);
}

function firstNumber(...values: Array<unknown>) {
  for (const value of values) {
    const next = toNumber(value);
    if (next !== null) {
      return next;
    }
  }

  return null;
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatCount(value: number | null) {
  return value === null ? null : Math.round(value).toLocaleString();
}

function formatDecimal(value: number | null, digits = 2) {
  return value === null ? null : value.toFixed(digits);
}

function formatPercent(value: number | null, digits = 1) {
  return value === null ? null : `${value.toFixed(digits)}%`;
}

function formatDurationLong(value: number | null) {
  if (value === null) return null;

  const totalSeconds = Math.max(0, Math.round(value));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function formatHoursCompact(seconds: number) {
  if (seconds <= 0) {
    return "0 hrs";
  }

  const hours = seconds / 3600;
  if (hours >= 1) {
    const digits = hours >= 10 ? 0 : 1;
    return `${hours.toFixed(digits).replace(/\.0$/, "")} hrs`;
  }

  const minutes = seconds / 60;
  return `${Math.max(1, Math.round(minutes))} mins`;
}

function formatHoursBadge(seconds: number) {
  const hours = seconds / 3600;
  if (hours >= 1) {
    const digits = hours >= 10 ? 0 : 1;
    return `${hours.toFixed(digits).replace(/\.0$/, "")}h`;
  }

  return `${Math.max(1, Math.round(seconds / 60))}m`;
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function fetchApiResponse<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  return readApiResponse<T>(response);
}

async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const body = await response.text();

  if (!body.trim()) {
    if (response.ok) {
      return { success: true };
    }

    return {
      success: false,
      error: response.statusText || `Request failed with ${response.status}`,
    };
  }

  try {
    return JSON.parse(body) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: body.trim() || response.statusText || `Request failed with ${response.status}`,
    };
  }
}
