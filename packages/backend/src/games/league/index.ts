import { Elysia } from "elysia";
import { leagueProfileRoutes } from "./routes/profile";
import { leagueStatsRoutes } from "./routes/stats";
import { hasApiKey } from "./services/riotApi";

/** League of Legends game module — all League-specific backend logic */
export function createLeagueRoutes(): Elysia<any, any, any, any, any, any, any> {
  return new Elysia()
    .use(leagueProfileRoutes)
    .use(leagueStatsRoutes);
}

/** League health check — reports whether the Riot API key is configured */
export function leagueHealthCheck() {
  return {
    game: "league" as const,
    status: hasApiKey() ? "ok" : "error" as const,
    hasApiKey: hasApiKey(),
    timestamp: Date.now(),
  };
}
