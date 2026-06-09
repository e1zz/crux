import { useCallback, useEffect, useState } from "react";
import type {
  GameId,
  CruxGameConfig,
} from "../games/shared/types";
import { DEFAULT_GAME_CONFIG } from "../games/shared/types";

const STORAGE_KEY = "crux-game-config";
const LEAGUE_SETTINGS_KEY = "crux-league-settings";
const LEGACY_RIOT_SETTINGS_KEY = "crux-riot-settings";

/** Check if existing League settings exist (pre-migration League users) */
function hasLegacyLeagueSettings(): boolean {
  try {
    const raw = localStorage.getItem(LEAGUE_SETTINGS_KEY);
    if (raw) return true;
    
    const legacyRaw = localStorage.getItem(LEGACY_RIOT_SETTINGS_KEY);
    if (!legacyRaw) return false;
    const parsed = JSON.parse(legacyRaw) as { gameName?: string; tagLine?: string };
    return Boolean(parsed.gameName || parsed.tagLine);
  } catch {
    return false;
  }
}

function loadConfig(): CruxGameConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // No game config found — check for legacy League settings
      if (hasLegacyLeagueSettings()) {
        // Migrate existing League user: auto-install League
        const migrated: CruxGameConfig = {
          installedGames: ["league"],
          enabledGames: ["league"],
          activeGame: "league",
        };
        saveConfig(migrated);
        return migrated;
      }
      return DEFAULT_GAME_CONFIG;
    }
    const parsed = JSON.parse(raw) as Partial<CruxGameConfig>;
    return {
      installedGames: Array.isArray(parsed.installedGames)
        ? parsed.installedGames
        : DEFAULT_GAME_CONFIG.installedGames,
      enabledGames: Array.isArray(parsed.enabledGames)
        ? parsed.enabledGames
        : DEFAULT_GAME_CONFIG.enabledGames,
      activeGame:
        parsed.activeGame && typeof parsed.activeGame === "string"
          ? parsed.activeGame
          : DEFAULT_GAME_CONFIG.activeGame,
    };
  } catch {
    return DEFAULT_GAME_CONFIG;
  }
}

function saveConfig(config: CruxGameConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export type UseGameConfigResult = {
  config: CruxGameConfig;
  /** Install a game module */
  installGame: (gameId: GameId) => void;
  /** Remove a game but keep data */
  removeGame: (gameId: GameId) => void;
  /** Purge a game completely */
  purgeGame: (gameId: GameId) => void;
  /** Set the active game */
  setActiveGame: (gameId: GameId | null) => void;
  /** Check if a game is installed */
  isInstalled: (gameId: GameId) => boolean;
};

export function useGameConfig(): UseGameConfigResult {
  const [config, setConfig] = useState<CruxGameConfig>(loadConfig);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const installGame = useCallback((gameId: GameId) => {
    setConfig((prev) => {
      if (prev.installedGames.includes(gameId)) return prev;
      return {
        ...prev,
        installedGames: [...prev.installedGames, gameId],
        enabledGames: [...prev.enabledGames, gameId],
        activeGame: prev.activeGame ?? gameId,
      };
    });
  }, []);

  const removeGame = useCallback((gameId: GameId) => {
    setConfig((prev) => ({
      ...prev,
      installedGames: prev.installedGames.filter((id) => id !== gameId),
      enabledGames: prev.enabledGames.filter((id) => id !== gameId),
      activeGame:
        prev.activeGame === gameId
          ? prev.installedGames.find((id) => id !== gameId) ?? null
          : prev.activeGame,
    }));
  }, []);

  const purgeGame = useCallback((gameId: GameId) => {
    setConfig((prev) => ({
      ...prev,
      installedGames: prev.installedGames.filter((id) => id !== gameId),
      enabledGames: prev.enabledGames.filter((id) => id !== gameId),
      activeGame:
        prev.activeGame === gameId
          ? prev.installedGames.find((id) => id !== gameId) ?? null
          : prev.activeGame,
    }));
  }, []);

  const setActiveGame = useCallback((gameId: GameId | null) => {
    setConfig((prev) => ({ ...prev, activeGame: gameId }));
  }, []);

  const isInstalled = useCallback(
    (gameId: GameId) => config.installedGames.includes(gameId),
    [config.installedGames],
  );

  return {
    config,
    installGame,
    removeGame,
    purgeGame,
    setActiveGame,
    isInstalled,
  };
}
