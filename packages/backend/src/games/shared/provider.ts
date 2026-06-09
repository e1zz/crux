import type { GameId, GameModuleState, GameHealthResponse } from "./types";

/** Data ownership map — defines what belongs to a game for purge operations */
/** Data ownership map — defines what belongs to a game for purge operations */
export type GameDataOwnership = {
  /** DB tables owned by this game */
  tables: string[];
  /** Cache key prefixes owned by this game */
  cachePrefixes: string[];
  /** Settings/localStorage keys owned by this game */
  settingsKeys: string[];
  /** Env vars required by this game */
  requiredEnvVars: string[];
};

/** Backend game provider contract — each game implements this */
export type GameProvider = {
  /** Game identifier */
  id: GameId;
  /** Display label */
  label: string;

  /** Health check for this game's provider */
  health: () => Promise<GameHealthResponse>;

  /** Data ownership for lifecycle operations */
  ownership: GameDataOwnership;

  /** Cleanup handlers for remove/delete lifecycle */
  cleanup: {
    /** Clear auth/session data only */
    clearAuth: () => Promise<void>;
    /** Purge all game-owned data */
    purgeData: () => Promise<void>;
  };

  /** Optional: additional routes beyond the shared prefix */
  routes?: () => import("elysia").Elysia;
};
