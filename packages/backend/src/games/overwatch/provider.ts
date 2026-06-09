import type { GameProvider, GameDataOwnership } from "../shared/provider";
import { db } from "../../db";
import { apiCache } from "../../db/schema";
import { like, or } from "drizzle-orm";

const OVERWATCH_OWNERSHIP: GameDataOwnership = {
  tables: [],
  cachePrefixes: [
    "overfast:",
  ],
  settingsKeys: [
    "crux-overwatch-settings",
  ],
  requiredEnvVars: [
    "OVERWATCH_API_URL",
  ],
};

export const overwatchProvider: GameProvider = {
  id: "overwatch",
  label: "Overwatch 2",

  async health() {
    return {
      game: "overwatch",
      status: "ok",
      hasConfig: true,
      timestamp: Date.now(),
    };
  },

  ownership: OVERWATCH_OWNERSHIP,

  cleanup: {
    async clearAuth() {
      // OverFast API has no auth — no-op
    },

    async purgeData() {
      try {
        const conditions = OVERWATCH_OWNERSHIP.cachePrefixes.map((prefix) =>
          like(apiCache.key, `${prefix}%`),
        );
        if (conditions.length > 0) {
          await db.delete(apiCache).where(or(...conditions));
        }
      } catch {}
    },
  },
};
