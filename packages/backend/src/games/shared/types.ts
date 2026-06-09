/** Shared game types for Crux backend */

/** Unique game identifier */
export type GameId = "league" | "overwatch";

/** Game lifecycle state */
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

/** Per-game state stored in backend */
export type GameModuleState = {
  id: GameId;
  installState: GameInstallState;
  connectionState: GameConnectionState;
  hasRetainedData: boolean;
  lastActiveAt: number | null;
};

/** Backend game health check response */
export type GameHealthResponse = {
  game: GameId;
  status: "ok" | "degraded" | "error";
  hasApiKey?: boolean;
  hasConfig?: boolean;
  timestamp: number;
};
