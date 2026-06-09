import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSettings } from "../../hooks/useAppSettings";
import { useRiotEnvStatus } from "../../hooks/useRiotEnvStatus";
import { useGameStatus } from "../../hooks/useGameStatus";
import { useRecorderSettings } from "../../hooks/useRecorderSettings";
import { useLcuCurrentSummoner } from "../../hooks/useLcuCurrentSummoner";
import { useChampSelectSession } from "../../hooks/useChampSelectSession";
import { useSummoner } from "../../hooks/useSummoner";
import { useGameRecorder as useLeagueRecorder } from "./hooks/useLeagueRecorder";
import { useLeagueSettings, isLeagueConfigured } from "./hooks/useLeagueSettings";
import { LeagueAppProvider } from "./context";
import type { LeagueAppContextValue } from "./context";

/**
 * League data provider — lives at the app shell level so League hooks
 * and state persist across navigation (Settings, Sessions, etc.).
 * Renders nothing visual; just provides context.
 */
export function LeagueProvider({ children }: { children: ReactNode }) {
  const { settings } = useAppSettings();
  const { settings: leagueSettings } = useLeagueSettings();
  const { hasEnvKey } = useRiotEnvStatus(settings.backendUrl);
  const { matchRunning } = useGameStatus();
  const { settings: recorderSettings } = useRecorderSettings();
  const navigate = useNavigate();

  const lcu = useLcuCurrentSummoner({ pollMs: 30_000 });
  const champSelect = useChampSelectSession(2_000);

  const {
    recordingState,
    elapsedSeconds,
    lastSavedPath,
    errorMessage,
    startRecording,
    stopRecording,
  } = useLeagueRecorder(recorderSettings);

  const lcuGameName = lcu.data?.summoner.gameName || lcu.data?.summoner.displayName;
  const lcuTagLine = lcu.data?.summoner.tagLine;
  const lcuPlatform = lcu.data?.platform;

  const effectiveSettings = useMemo(() => {
    if (lcu.isLive) {
      return {
        ...leagueSettings,
        gameName: lcuGameName || leagueSettings.gameName,
        tagLine: lcuTagLine || leagueSettings.tagLine,
        platform: lcuPlatform ?? leagueSettings.platform,
      };
    }
    return leagueSettings;
  }, [lcu.isLive, lcuGameName, lcuPlatform, lcuTagLine, leagueSettings]);

  const summoner = useSummoner(effectiveSettings, settings, { matchCount: 30 });
  const configured = isLeagueConfigured(effectiveSettings);

  const contextValue: LeagueAppContextValue = {
    effectiveSettings,
    configured,
    hasEnvKey,
    gameActive: matchRunning,
    summoner,
    lcu,
    champSelect,
    recorder: {
      recordingState,
      elapsedSeconds,
      lastSavedPath,
      errorMessage,
      startRecording,
      stopRecording,
      settings: recorderSettings,
    },
    onOpenSettings: () => navigate("/settings"),
  };

  return (
    <LeagueAppProvider value={contextValue}>
      {children}
    </LeagueAppProvider>
  );
}
