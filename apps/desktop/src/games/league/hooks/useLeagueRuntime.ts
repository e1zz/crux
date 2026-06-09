import { useGameStatus } from "../../../hooks/useGameStatus";
import { useRiotEnvStatus } from "../../../hooks/useRiotEnvStatus";
import { useLeagueSettings } from "./useLeagueSettings";
import { useAppSettings } from "../../../hooks/useAppSettings";
import type { GameRuntimeHookResult } from "../../shared/module";

export function useLeagueRuntime(): GameRuntimeHookResult {
  const { clientRunning, gameId } = useGameStatus();
  const isRunning = clientRunning && gameId === "league";
  const { settings: leagueSettings } = useLeagueSettings();
  const { settings: appSettings } = useAppSettings();
  const { hasEnvKey } = useRiotEnvStatus(appSettings.backendUrl);

  const configured = Boolean(leagueSettings.gameName && leagueSettings.tagLine);

  let connectionState: GameRuntimeHookResult["connectionState"] = "disconnected";
  if (!hasEnvKey) {
    connectionState = "error";
  } else if (configured) {
    connectionState = "connected";
  }

  return {
    isRunning,
    connectionState,
    error: hasEnvKey ? null : "No Riot API key configured on backend",
    refetch: () => {},
  };
}
