import type { LucideIcon } from "lucide-react";
import type { RouteObject } from "react-router-dom";
import type { GameId, GameModuleState } from "./types";

/** Navigation item for sidebar */
export type GameNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** If true, only match exact path */
  end?: boolean;
};

/** Desktop game module contract — each game implements this */
export type GameModule = {
  /** Game identifier */
  id: GameId;
  /** Display label */
  label: string;
  /** Icon key for sidebar/nav */
  icon: string;

  /** Game-specific routes */
  routes: RouteObject[];

  /** Navigation metadata for the sidebar */
  navigation: {
    /** Home route path for this module */
    homePath: string;
    /** Sidebar nav items for this module */
    items: GameNavItem[];
  };

  /** Settings panel for this game */
  settings: {
    /** Panel component rendered in Settings > Games */
    panel: React.ComponentType<GameSettingsPanelProps>;
  };

  /** Runtime hooks that run when this game is installed/enabled */
  hooks: {
    /** Hook that returns runtime state (game status, connection, etc.) */
    useRuntime: () => GameRuntimeHookResult;
  };

  /** Shell-level UI provided by this module */
  shell: {
    /** Top bar content rendered in the shell */
    topBar?: React.ComponentType<unknown>;
  };

  /** Recorder integration */
  recorder: {
    /** How to detect if this game is running */
    detectRunning: () => Promise<boolean>;
    /** Source matching rules for screen capture */
    sourceMatch?: (sourceName: string) => boolean;
  };

  /** Cleanup handlers for remove/delete lifecycle */
  cleanup: {
    /** Called when game is removed (keep data, clear auth) */
    onRemove: () => Promise<void>;
    /** Called when game is fully deleted (purge everything) */
    onPurge: () => Promise<void>;
  };
};

/** Props passed to a game's settings panel */
export type GameSettingsPanelProps = {
  /** Current game state */
  state: GameModuleState;
  /** Whether the backend has the required config (API key, etc.) */
  hasBackendConfig: boolean;
  /** Install the game */
  onInstall: () => void;
  /** Remove the game (keep data) */
  onRemove: () => void;
  /** Purge the game completely */
  onPurge: () => void;
  /** Reconnect account (if applicable) */
  onReconnect?: () => void;
};

/** Return type for a game's runtime hook */
export type GameRuntimeHookResult = {
  /** Whether the game is currently running */
  isRunning: boolean;
  /** Connection state */
  connectionState: GameModuleState["connectionState"];
  /** Error message if any */
  error: string | null;
  /** Refetch/recheck status */
  refetch: () => void;
};
