import { overwatchRoutes } from "./routes/index";

/** Overwatch 2 backend module — expose routes for the server */
export { overwatchRoutes };

/** Overwatch health check */
export async function overwatchHealthCheck() {
  return {
    game: "overwatch" as const,
    status: "ok" as const,
    hasConfig: true,
    timestamp: Date.now(),
  };
}
