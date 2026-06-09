import type { GameId, GameModuleState } from "./types";

/** Registry of all installed game modules */
export type GameModuleEntry = {
  id: GameId;
  label: string;
  state: GameModuleState;
};

export type GameRegistry = {
  /** All registered game modules */
  modules: GameModuleEntry[];
  /** Get a specific game module */
  get: (id: GameId) => GameModuleEntry | undefined;
  /** Check if a game is installed */
  isInstalled: (id: GameId) => boolean;
  /** Get all installed game IDs */
  getInstalledIds: () => GameId[];
  /** Get the active game ID */
  getActiveGame: () => GameId | null;
};

/** Initial state for a newly installed game */
export function createInitialGameState(id: GameId): GameModuleState {
  return {
    id,
    installState: "installed",
    connectionState: "disconnected",
    runtimeState: "stopped",
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
    runtimeState: "stopped",
    hasRetainedData: true,
    lastActiveAt: null,
  };
}
