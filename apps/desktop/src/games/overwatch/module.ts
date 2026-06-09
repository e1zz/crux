import { Home, Activity, Search } from "lucide-react";
import type { GameModule } from "../shared/module";
import { useOverwatchRuntime } from "./hooks/useOverwatchRuntime";
import { OverwatchSettingsPanel } from "./settings";
import { createOverwatchRoutes } from "./routes";

export const overwatchModule: GameModule = {
  id: "overwatch",
  label: "Overwatch 2",
  icon: "overwatch",

  routes: createOverwatchRoutes(),

  navigation: {
    homePath: "/overwatch",
    items: [
      { to: "/overwatch", label: "Home", icon: Home, end: true },
      { to: "/overwatch/search", label: "Search", icon: Search },
      { to: "/overwatch/companion", label: "Companion", icon: Activity },
    ],
  },

  settings: {
    panel: OverwatchSettingsPanel,
  },

  hooks: {
    useRuntime: useOverwatchRuntime,
  },

  shell: {
    // No top-bar content for Overwatch yet
  },

  recorder: {
    detectRunning: async () => {
      try {
        if (window.electronAPI?.checkOverwatchRunning) {
          return await window.electronAPI.checkOverwatchRunning();
        }
      } catch {
        // Ignored
      }
      return false;
    },
    sourceMatch: (sourceName: string) =>
      sourceName.toLowerCase().includes("overwatch"),
  },

  cleanup: {
    onRemove: async () => { /* No specific logic */ },
    onPurge: async () => {
      localStorage.removeItem("crux-overwatch-settings");
    },
  },
};
