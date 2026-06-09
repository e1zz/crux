/** Recorder strategy contract — each game module defines its own */
export type RecorderStrategy = {
  /** How to detect if this game is running */
  detectRunning: () => Promise<boolean>;
  /** Match a screen/window source name to this game */
  sourceMatch?: (sourceName: string) => boolean;
};

/** Recorder mode — controls which games trigger recording */
export type RecorderMode = "active_game_only" | "all_installed_games";
