import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

import { createLeagueRoutes, leagueHealthCheck } from "./games/league";
import { overwatchRoutes } from "./games/overwatch";
import { cleanExpiredCache } from "./games/league/services/riotApi";
import { lifecycleRoutes } from "./games/lifecycleRoutes";
import { migrate } from "./db/migrate";
import { startScheduler } from "./services/scheduler";

const PORT = Number(process.env.PORT) || 3001;

// Run database migration before starting the server
await migrate();

const app = new Elysia()
  .use(
    cors({
      origin: true,
      methods: ["GET", "POST", "OPTIONS"],
    }),
  )
  // Global health check
  .get("/api/health", () => ({
    status: "ok",
    hasApiKey: leagueHealthCheck().hasApiKey,
    timestamp: Date.now(),
  }))
  // League of Legends routes
  .use(createLeagueRoutes())
  // Game lifecycle routes (install/remove/purge/health)
  .use(lifecycleRoutes)
  // Overwatch 2 routes (OverFast API proxy)
  .use(overwatchRoutes)
  .onStart(() => {
    console.log(`🔄 Crux backend running on http://localhost:${PORT}`);

    // Clean expired cache entries every 10 minutes
    setInterval(() => {
      cleanExpiredCache().catch((err) =>
        console.error("Cache cleanup error:", err),
      );
    }, 10 * 60 * 1000);

    // Start cron scheduler (reads cron.enabled from scraper.config.json)
    startScheduler();
  })
  .listen(PORT);

export type App = typeof app;
