/** Shared game types used across Crux desktop and backend */

/** Unique game identifier */
export type GameId = "league" | "overwatch";

/** All supported games in Crux */
export const GAMES: { id: GameId; label: string; icon: string }[] = [
  { id: "league", label: "League of Legends", icon: "league" },
  { id: "overwatch", label: "Overwatch 2", icon: "overwatch" },
];

/** Game lifecycle state — tracks installation status in Crux */
export type GameInstallState =
  | "not_installed"
  | "installed"
  | "removed_with_saved_data";

/** Game connection/health state */
export type GameConnectionState =
  | "disconnected"
  | "connected"
  | "connecting"
  | "degraded"
  | "error";

/** Game runtime state — whether the game is running locally */
export type GameRuntimeState = "stopped" | "running" | "unknown";

/** Full per-game state stored in Crux */
export type GameModuleState = {
  id: GameId;
  installState: GameInstallState;
  connectionState: GameConnectionState;
  runtimeState: GameRuntimeState;
  hasRetainedData: boolean;
  lastActiveAt: number | null;
};

/** Global Crux game configuration */
export type CruxGameConfig = {
  installedGames: GameId[];
  enabledGames: GameId[];
  activeGame: GameId | null;
};

/** Default game config */
export const DEFAULT_GAME_CONFIG: CruxGameConfig = {
  installedGames: [],
  enabledGames: [],
  activeGame: null,
};
