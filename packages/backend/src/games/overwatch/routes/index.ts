import { Elysia, t } from "elysia";
import {
  searchPlayers,
  getPlayerSummary,
  getPlayerStats,
  getPlayerCareerStats,
  getHeroes,
  getMaps,
} from "../services/overfast";
import { analyzeMatchup } from "../services/matchupAnalyzer";
import { syncPlayerProfile } from "../services/profileSync";

const overwatchPlayerIdParams = t.Object({
  playerId: t.String(),
});

const overwatchStatsQuery = t.Object({
  gamemode: t.Optional(t.Union([t.Literal("competitive"), t.Literal("quickplay")])),
  platform: t.Optional(t.Union([t.Literal("pc"), t.Literal("console")])),
});

const overwatchCareerQuery = t.Object({
  gamemode: t.Union([t.Literal("competitive"), t.Literal("quickplay")]),
  platform: t.Optional(t.Union([t.Literal("pc"), t.Literal("console")])),
  hero: t.Optional(t.String()),
});

export const overwatchRoutes = new Elysia({ prefix: "/api/overwatch" })
  .post(
    "/matchups/analyze",
    async ({ body }) => {
      try {
        const data = await analyzeMatchup(body.enemyHeroes);
        return { success: true, data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
          status: 500,
        };
      }
    },
    {
      body: t.Object({
        enemyHeroes: t.Array(t.String()),
      }),
    }
  )
  .get(
    "/health",
    async () => {
      try {
        // Quick health check — ping OverFast heroes endpoint
        await getHeroes();
        return {
          success: true,
          status: "ok" as const,
          timestamp: Date.now(),
        };
      } catch {
        return {
          success: true,
          status: "degraded" as const,
          error: "OverFast API not reachable",
          timestamp: Date.now(),
        };
      }
    },
  )
  .get(
    "/players/search",
    async ({ query }) => {
      const name = query.name;
      if (!name || name.trim().length < 2) {
        return {
          success: false,
          error: "At least 2 characters required for search.",
          status: 400,
        };
      }
      try {
        const result = await searchPlayers(name.trim());
        return { success: true, data: result };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
          status: 502,
        };
      }
    },
    {
      query: t.Object({
        name: t.String(),
      }),
    },
  )
  .get(
    "/players/:playerId/summary",
    async ({ params }) => {
      try {
        const data = await getPlayerSummary(params.playerId);
        return { success: true, data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
          status: 502,
        };
      }
    },
    {
      params: t.Object({
        playerId: t.String(),
      }),
    },
  )
  .get(
    "/players/:playerId/stats",
    async ({ params, query }) => {
      try {
        const data = await getPlayerStats(params.playerId, query);
        return { success: true, data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
          status: 502,
        };
      }
    },
    {
      params: overwatchPlayerIdParams,
      query: overwatchStatsQuery,
    },
  )
  .get(
    "/players/:playerId/sync",
    async ({ params, query }) => {
      try {
        const data = await syncPlayerProfile(params.playerId, query);
        return { success: true, data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
          status: 502,
        };
      }
    },
    {
      params: overwatchPlayerIdParams,
      query: overwatchStatsQuery,
    },
  )
  .get(
    "/players/:playerId/stats/career",
    async ({ params, query }) => {
      try {
        const data = await getPlayerCareerStats(params.playerId, query);
        return { success: true, data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
          status: 502,
        };
      }
    },
    {
      params: overwatchPlayerIdParams,
      query: overwatchCareerQuery,
    },
  )
  .get(
    "/heroes",
    async () => {
      try {
        const data = await getHeroes();
        return { success: true, data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
          status: 502,
        };
      }
    },
  )
  .get(
    "/maps",
    async () => {
      try {
        const data = await getMaps();
        return { success: true, data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
          status: 502,
        };
      }
    },
  );
