import { createContext, useContext, type ReactNode } from "react";
import type { LeagueSettings } from "./hooks/useLeagueSettings";
import type { useSummoner } from "../../hooks/useSummoner";
import type { useLcuCurrentSummoner } from "../../hooks/useLcuCurrentSummoner";
import type { useChampSelectSession } from "../../hooks/useChampSelectSession";
import type { useLeagueRecorder } from "../../hooks/useLeagueRecorder";
import type { RecorderSettings } from "../../types/recorder";

export type { RiotProfileBundle } from "../../types/riot";

export type LeagueAppContextValue = {
  effectiveSettings: LeagueSettings;
  configured: boolean;
  hasEnvKey: boolean;
  gameActive: boolean;
  summoner: ReturnType<typeof useSummoner>;
  lcu: ReturnType<typeof useLcuCurrentSummoner>;
  champSelect: ReturnType<typeof useChampSelectSession>;
  recorder: ReturnType<typeof useLeagueRecorder> & {
    settings: RecorderSettings;
  };
  onOpenSettings: () => void;
};

const LeagueAppContext = createContext<LeagueAppContextValue | null>(null);

export function LeagueAppProvider({
  value,
  children,
}: {
  value: LeagueAppContextValue;
  children: ReactNode;
}) {
  return (
    <LeagueAppContext.Provider value={value}>
      {children}
    </LeagueAppContext.Provider>
  );
}

export function useLeagueApp(): LeagueAppContextValue {
  const ctx = useContext(LeagueAppContext);
  if (!ctx) {
    throw new Error("useLeagueApp must be used within a LeagueAppProvider");
  }
  return ctx;
}
