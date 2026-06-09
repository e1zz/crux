import { useCallback, useEffect, useState } from "react";
import { useGameStatus } from "../../../hooks/useGameStatus";
import type { GameRuntimeHookResult } from "../../shared/module";

export function useOverwatchRuntime(): GameRuntimeHookResult {
  const { clientRunning, gameId } = useGameStatus();
  const isRunning = (clientRunning && gameId === "overwatch");
  const [processRunning, setProcessRunning] = useState(false);

  const refetch = useCallback(async () => {
    try {
      if (window.electronAPI?.checkOverwatchRunning) {
        const result = await window.electronAPI.checkOverwatchRunning();
        setProcessRunning(result ?? false);
      }
    } catch {
      // Process detection not available on this platform
    }
  }, []);

  useEffect(() => {
    void refetch();
    const interval = setInterval(refetch, 15_000);
    return () => clearInterval(interval);
  }, [refetch]);

  const connectionState: GameRuntimeHookResult["connectionState"] = "connected";

  return {
    isRunning: isRunning || processRunning,
    connectionState,
    error: null,
    refetch,
  };
}
