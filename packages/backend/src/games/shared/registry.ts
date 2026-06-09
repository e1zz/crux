import type { GameId, GameModuleState } from "./types";

/** Initial state for a newly installed game */
export function createInitialGameState(id: GameId): GameModuleState {
  return {
    id,
    installState: "installed",
    connectionState: "disconnected",
    hasRetainedData: false,
    lastActiveAt: null,
  };
}

/** Initial state for a removed game with retained data */
export function createRemovedGameState(id: GameId): GameModuleState {
  return {
    id,
    installState: "removed_with_saved_data",
    connectionState: "disconnected",
    hasRetainedData: true,
    lastActiveAt: null,
  };
}
