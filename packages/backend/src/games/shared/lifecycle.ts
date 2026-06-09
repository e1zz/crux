import type { GameId, GameModuleState, GameHealthResponse } from "./types";
import type { GameProvider } from "./provider";
import { createInitialGameState, createRemovedGameState } from "./registry";
import { db } from "../../db";
import { gameAuthTokens } from "../../db/schema";
import { eq } from "drizzle-orm";

/** Game lifecycle service — handles install/remove/delete for all games */
export type GameLifecycleService = {
  /** Get current state for a game */
  getState: (gameId: GameId) => GameModuleState;
  /** Get health check for a game */
  getHealth: (gameId: GameId) => Promise<GameHealthResponse>;
  /** Install a game module */
  install: (gameId: GameId) => Promise<void>;
  /** Remove a game but keep data, clear auth */
  remove: (gameId: GameId) => Promise<void>;
  /** Remove a game and purge all data + auth */
  purge: (gameId: GameId) => Promise<void>;
};

/** Create a lifecycle service backed by in-memory state and GameProviders */
export function createLifecycleService(
  providers: Partial<Record<GameId, GameProvider>>,
): GameLifecycleService {
  const states = new Map<GameId, GameModuleState>();

  // Initialize states for all registered providers
  for (const id of Object.keys(providers) as GameId[]) {
    states.set(id, createInitialGameState(id));
  }

  return {
    getState(gameId) {
      return (
        states.get(gameId) ?? {
          id: gameId,
          installState: "not_installed",
          connectionState: "disconnected",
          hasRetainedData: false,
          lastActiveAt: null,
        }
      );
    },

    async getHealth(gameId) {
      const provider = providers[gameId];
      if (!provider) {
        return {
          game: gameId,
          status: "error",
          hasConfig: false,
          timestamp: Date.now(),
        };
      }
      return provider.health();
    },

    async install(gameId) {
      const provider = providers[gameId];
      const existing = states.get(gameId);
      if (existing?.installState === "installed") return;

      if (existing?.hasRetainedData) {
        states.set(gameId, {
          ...existing,
          installState: "installed",
          connectionState: "disconnected",
        });
      } else {
        states.set(gameId, createInitialGameState(gameId));
      }
    },

    async remove(gameId) {
      const provider = providers[gameId];
      const current = states.get(gameId);
      if (!current || current.installState === "not_installed") return;

      // Clear auth only — keep data
      try {
        await db
          .delete(gameAuthTokens)
          .where(eq(gameAuthTokens.gameId, gameId));
        if (provider) await provider.cleanup.clearAuth();
      } catch {
        // Best-effort auth clear
      }

      states.set(gameId, {
        ...current,
        installState: "removed_with_saved_data",
        connectionState: "disconnected",
        hasRetainedData: true,
        lastActiveAt: null,
      });
    },

    async purge(gameId) {
      const provider = providers[gameId];
      const current = states.get(gameId);
      if (!current) return;

      // Clear auth
      try {
        await db
          .delete(gameAuthTokens)
          .where(eq(gameAuthTokens.gameId, gameId));
      } catch {
        // Best-effort
      }

      // Purge all game-owned data
      if (provider) {
        try {
          await provider.cleanup.purgeData();
        } catch {
          // Best-effort
        }
      }

      states.delete(gameId);
    },
  };
}
