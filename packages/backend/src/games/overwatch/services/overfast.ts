import https from "node:https";
import { db } from "../../../db";
import { apiCache } from "../../../db/schema";
import { eq } from "drizzle-orm";

const OVERWATCH_API_URL = process.env.OVERWATCH_API_URL?.replace(/\/+$/, "") ?? "https://overfast-api.tekrop.fr";

const CACHE_TTL = {
  player: 10 * 60 * 1000,
  static: 60 * 60 * 1000,
  search: 5 * 60 * 1000,
} as const;

function fetchJson<T>(url: string): Promise<T> {
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "GET",
        timeout: 15_000,
        headers: {
          Accept: "application/json",
          "User-Agent": "CruxBackend/0.1",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf-8");
          if ((res.statusCode ?? 0) < 200 || (res.statusCode ?? 0) >= 300) {
            reject(
              new Error(`OverFast ${res.statusCode}: ${body.substring(0, 200)}`),
            );
            return;
          }
          try {
            resolve(JSON.parse(body) as T);
          } catch {
            reject(new Error(`Failed to parse OverFast response`));
          }
        });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("OverFast request timed out"));
    });
    req.on("error", reject);
    req.end();
  });
}

async function getCached<T>(key: string): Promise<T | null> {
  const row = await db
    .select()
    .from(apiCache)
    .where(eq(apiCache.key, key))
    .get();

  if (!row) return null;
  if (row.expiresAt <= new Date()) {
    await db.delete(apiCache).where(eq(apiCache.key, key));
    return null;
  }
  return JSON.parse(row.value) as T;
}

async function setCache<T>(key: string, value: T, ttlMs: number): Promise<void> {
  await db
    .insert(apiCache)
    .values({
      key,
      value: JSON.stringify(value),
      expiresAt: new Date(Date.now() + ttlMs),
    })
    .onConflictDoUpdate({
      target: apiCache.key,
      set: {
        value: JSON.stringify(value),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });
}

/**
 * Fetch from OverFast with caching.
 */
async function overfastRequest<T>(
  path: string,
  cacheTtl: number,
): Promise<T> {
  const cacheKey = `overfast:${path}`;
  const cached = await getCached<T>(cacheKey);
  if (cached) return cached;

  const url = `${OVERWATCH_API_URL}${path}`;
  const data = await fetchJson<T>(url);
  await setCache(cacheKey, data, cacheTtl);
  return data;
}

// ── OverFast API types ────────────────────────────────────────────────────────

export type OverwatchPlayerSearchResult = {
  player_id: string;
  name: string;
  avatar?: string;
  namecard?: string;
  title?: string;
  career_url?: string;
};

export type OverwatchPlayerSummary = {
  username: string;
  avatar?: string;
  namecard?: string;
  title?: string;
  endorsement?: { level: number; frame?: string };
  competitive?: {
    pc?: OverwatchCompetitivePlatformRanks | null;
    console?: OverwatchCompetitivePlatformRanks | null;
  };
  last_updated_at?: number;
};

export type OverwatchCompetitiveRank = {
  division: string;
  tier: number;
  role_icon?: string;
  rank_icon?: string;
  tier_icon?: string;
};

export type OverwatchCompetitivePlatformRanks = {
  season?: number | null;
  tank?: OverwatchCompetitiveRank | null;
  damage?: OverwatchCompetitiveRank | null;
  support?: OverwatchCompetitiveRank | null;
  open?: OverwatchCompetitiveRank | null;
};

export type OverwatchPlayerGamemode = "quickplay" | "competitive";

export type OverwatchPlayerPlatform = "pc" | "console";

export type OverwatchPlayerStatsFilters = {
  gamemode?: OverwatchPlayerGamemode;
  platform?: OverwatchPlayerPlatform;
  hero?: string;
};

export type OverwatchPlayerStats = {
  general?: {
    games_played?: number;
    games_won?: number;
    games_lost?: number;
    time_played?: number;
    winrate?: number;
    eliminations_avg?: number;
    deaths_avg?: number;
    assists_avg?: number;
    damage_avg?: number;
    healing_avg?: number;
  };
  heroes?: Record<string, OverwatchHeroStat[]>;
};

export type OverwatchHeroStat = {
  hero: string;
  games_played?: number;
  games_won?: number;
  time_played?: number;
  winrate?: number;
  eliminations_avg?: number;
  deaths_avg?: number;
  assists_avg?: number;
  damage_avg?: number;
  healing_avg?: number;
};

export type OverwatchCareerStatBuckets = {
  assists?: Record<string, number>;
  average?: Record<string, number>;
  best?: Record<string, number>;
  combat?: Record<string, number>;
  game?: Record<string, number>;
  hero_specific?: Record<string, number>;
  match_awards?: Record<string, number>;
  miscellaneous?: Record<string, number>;
};

export type OverwatchPlayerCareerStats = Record<
  string,
  OverwatchCareerStatBuckets | null
>;

export type OverwatchHero = {
  key: string;
  name: string;
  portrait: string;
  role: string;
};

export type OverwatchMap = {
  name: string;
  screenshot?: string;
  gamemodes: string[];
  location: string;
  country_code?: string;
};

function buildPlayerStatsQuery(filters: OverwatchPlayerStatsFilters = {}) {
  const params = new URLSearchParams();

  if (filters.gamemode) {
    params.set("gamemode", filters.gamemode);
  }

  if (filters.platform) {
    params.set("platform", filters.platform);
  }

  if (filters.hero) {
    params.set("hero", filters.hero);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

// ── Proxy methods ─────────────────────────────────────────────────────────────

/** Search players by BattleTag */
export async function searchPlayers(query: string) {
  const result = await overfastRequest<{
    total: number;
    results: OverwatchPlayerSearchResult[];
  }>(`/players?name=${encodeURIComponent(query)}`, CACHE_TTL.search);
  return result;
}

/** Get player summary (profile + competitive ranks) */
export async function getPlayerSummary(playerId: string) {
  const result = await overfastRequest<OverwatchPlayerSummary>(
    `/players/${encodeURIComponent(playerId)}/summary`,
    CACHE_TTL.player,
  );
  return result;
}

/** Get player aggregated stats */
export async function getPlayerStats(
  playerId: string,
  filters: OverwatchPlayerStatsFilters = {},
) {
  const result = await overfastRequest<OverwatchPlayerStats>(
    `/players/${encodeURIComponent(playerId)}/stats/summary${buildPlayerStatsQuery(filters)}`,
    CACHE_TTL.player,
  );
  return result;
}

/** Get detailed player career stats */
export async function getPlayerCareerStats(
  playerId: string,
  filters: OverwatchPlayerStatsFilters & {
    gamemode: OverwatchPlayerGamemode;
  },
) {
  const result = await overfastRequest<OverwatchPlayerCareerStats>(
    `/players/${encodeURIComponent(playerId)}/stats/career${buildPlayerStatsQuery(filters)}`,
    CACHE_TTL.player,
  );
  return result;
}

/** Get hero list */
export async function getHeroes() {
  const result = await overfastRequest<OverwatchHero[]>(
    `/heroes`,
    CACHE_TTL.static,
  );
  return result;
}

/** Get map list */
export async function getMaps() {
  const result = await overfastRequest<OverwatchMap[]>(
    `/maps`,
    CACHE_TTL.static,
  );
  return result;
}

/** Check if OverFast API is reachable */
export function getOverwatchApiUrl(): string {
  return OVERWATCH_API_URL;
}
