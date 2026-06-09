import type { GameProvider, GameDataOwnership } from "../shared/provider";
import { hasApiKey } from "./services/riotApi";
import { db } from "../../db";
import {
  summoners,
  matches,
  championItemStats,
  championMatchupStats,
  crawlerQueue,
  apiCache,
} from "../../db/schema";
import { eq, lt, like, or } from "drizzle-orm";

const LEAGUE_OWNERSHIP: GameDataOwnership = {
  tables: [
    "summoners",
    "matches",
    "champion_item_stats",
    "champion_matchup_stats",
    "crawler_queue",
  ],
  cachePrefixes: [
    "profileBundle:",
    "ddragon:",
  ],
  settingsKeys: [
    "crux-riot-settings",
  ],
  requiredEnvVars: [
    "RIOT_API_KEY",
  ],
};

export const leagueProvider: GameProvider = {
  id: "league",
  label: "League of Legends",

  async health() {
    const hasKey = hasApiKey();
    return {
      game: "league",
      status: hasKey ? "ok" : "error",
      hasApiKey: hasKey,
      timestamp: Date.now(),
    };
  },

  ownership: LEAGUE_OWNERSHIP,

  cleanup: {
    async clearAuth() {
      // League doesn't store per-user auth tokens in the DB.
      // The API key lives in .env and is managed by the admin.
    },

    async purgeData() {
      // Delete all League-owned DB tables
      try { await db.delete(summoners); } catch {}
      try { await db.delete(matches); } catch {}
      try { await db.delete(championItemStats); } catch {}
      try { await db.delete(championMatchupStats); } catch {}
      try { await db.delete(crawlerQueue); } catch {}

      // Clear API cache entries matching League prefixes
      try {
        const conditions = LEAGUE_OWNERSHIP.cachePrefixes.map((prefix) =>
          like(apiCache.key, `${prefix}%`),
        );
        if (conditions.length > 0) {
          await db.delete(apiCache).where(or(...conditions));
        }
      } catch {}
    },
  },
};
