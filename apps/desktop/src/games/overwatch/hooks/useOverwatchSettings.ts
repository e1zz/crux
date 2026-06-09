import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "crux-overwatch-settings";

type OverwatchSettings = {
  claimedPlayerId?: string;
  claimedPlayerName?: string;
  debugMode?: boolean;
};

export function useOverwatchSettings() {
  const [settings, setSettings] = useState<OverwatchSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Sync debug mode with main process
    if (typeof window !== "undefined" && window.electronAPI?.setOcrDebugMode) {
      window.electronAPI.setOcrDebugMode(!!settings.debugMode);
    }
  }, [settings]);

  const claimPlayer = useCallback((playerId: string, playerName: string) => {
    setSettings((prev) => ({ ...prev, claimedPlayerId: playerId, claimedPlayerName: playerName }));
  }, []);

  const unclaimPlayer = useCallback(() => {
    setSettings((prev) => ({ ...prev, claimedPlayerId: undefined, claimedPlayerName: undefined }));
  }, []);

  const setDebugMode = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, debugMode: enabled }));
  }, []);

  return {
    settings,
    claimPlayer,
    unclaimPlayer,
    setDebugMode,
    hasClaimedPlayer: Boolean(settings.claimedPlayerId),
  };
}
