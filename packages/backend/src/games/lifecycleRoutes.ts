import { Elysia, t } from "elysia";
import { getLifecycleService, getProvider } from "./registry";
import type { GameId } from "./shared/types";

export const lifecycleRoutes = new Elysia({ prefix: "/api/games" })
  .get(
    "/",
    () => {
      const service = getLifecycleService();
      const ids: GameId[] = ["league", "overwatch"];
      const states = ids.map((id) => {
        const state = service.getState(id);
        const provider = getProvider(id);
        return {
          ...state,
          label: provider?.label ?? id,
          hasProvider: Boolean(provider),
        };
      });
      return { success: true, games: states };
    },
  )
  .get(
    "/:gameId/health",
    async ({ params: { gameId } }) => {
      const service = getLifecycleService();
      const health = await service.getHealth(gameId as GameId);
      return { success: true, ...health };
    },
    {
      params: t.Object({
        gameId: t.String(),
      }),
    },
  )
  .post(
    "/:gameId/install",
    async ({ params: { gameId } }) => {
      const service = getLifecycleService();
      await service.install(gameId as GameId);
      return { success: true, game: service.getState(gameId as GameId) };
    },
    {
      params: t.Object({
        gameId: t.String(),
      }),
    },
  )
  .post(
    "/:gameId/remove",
    async ({ params: { gameId } }) => {
      const service = getLifecycleService();
      await service.remove(gameId as GameId);
      return { success: true, game: service.getState(gameId as GameId) };
    },
    {
      params: t.Object({
        gameId: t.String(),
      }),
    },
  )
  .post(
    "/:gameId/purge",
    async ({ params: { gameId } }) => {
      const service = getLifecycleService();
      await service.purge(gameId as GameId);
      return { success: true, game: service.getState(gameId as GameId) };
    },
    {
      params: t.Object({
        gameId: t.String(),
      }),
    },
  );
