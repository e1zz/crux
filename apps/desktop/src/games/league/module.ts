import { LayoutTemplate, Activity, Home } from "lucide-react";
import type { GameModule } from "../shared/module";
import { useLeagueRuntime } from "./hooks/useLeagueRuntime";
import { LeagueSettingsPanel } from "./settings";
import { LeagueTopBar } from "./components/LeagueTopBar";
import { createLeagueRoutes } from "./routes";

/** League of Legends game module */
export const leagueModule: GameModule = {
  id: "league",
  label: "League of Legends",
  icon: "league",

  routes: createLeagueRoutes(),

  navigation: {
    homePath: "/",
    items: [
      { to: "/", label: "Home", icon: Home, end: true },
      { to: "/champ-select", label: "Champ Select", icon: LayoutTemplate },
      { to: "/recorder", label: "Recorder", icon: Activity },
    ],
  },

  settings: {
    panel: LeagueSettingsPanel,
  },

  hooks: {
    useRuntime: useLeagueRuntime,
  },

  shell: {
    topBar: LeagueTopBar,
  },

  recorder: {
    detectRunning: async () => false,
    sourceMatch: (sourceName: string) =>
      sourceName.toLowerCase().includes("league"),
  },

  cleanup: {
    onRemove: async () => {
      // Clear League auth/session tokens but keep cached data.
      // Riot settings remain in localStorage under crux-riot-settings.
    },
    onPurge: async () => {
      // Clear everything: Riot settings, cached profiles, match data markers.
      localStorage.removeItem("crux-riot-settings");
    },
  },
};
