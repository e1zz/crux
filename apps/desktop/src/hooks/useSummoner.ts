import { useCallback, useEffect, useRef, useState } from "react";

import type { RiotProfileBundle } from "../types/riot";
import type { AppSettings } from "./useAppSettings";
import type { LeagueSettings } from "../games/league/hooks/useLeagueSettings";

type Status = "idle" | "loading" | "success" | "error";

type State = {
  status: Status;
  data: RiotProfileBundle | null;
  error: string | null;
  lastFetchedAt: number | null;
};

const INITIAL_STATE: State = {
  status: "idle",
  data: null,
  error: null,
  lastFetchedAt: null,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

type UseSummonerOptions = {
  matchCount?: number;
  refreshKey?: number;
};

/**
 * Fetches the Riot summoner bundle (profile, rank, recent matches)
 * from the Crux backend via HTTP.
 */
export function useSummoner(
  leagueSettings: LeagueSettings,
  appSettings: AppSettings,
  options: UseSummonerOptions = {},
) {
  const { matchCount = 10, refreshKey = 0 } = options;
  const [state, setState] = useState<State>(INITIAL_STATE);
  const requestIdRef = useRef(0);
  const backendUrl = appSettings.backendUrl.replace(/\/+$/, "");
  const platform = leagueSettings.platform;
  const gameName = leagueSettings.gameName.trim();
  const tagLine = leagueSettings.tagLine.replace(/^#/, "").trim();

  const fetchBundle = useCallback(async () => {
    if (!gameName || !tagLine) {
      setState(INITIAL_STATE);
      return;
    }

    const reqId = ++requestIdRef.current;
    setState((prev) => ({ ...prev, status: "loading", error: null }));

    try {
      const url = `${backendUrl}/api/league/profile/${encodeURIComponent(platform)}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?matchCount=${matchCount}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      const result = await response.json() as {
        success: boolean;
        data?: RiotProfileBundle;
        error?: string;
        status?: number;
      };

      if (reqId !== requestIdRef.current) {
        return;
      }

      if (result.success && result.data) {
        setState({
          status: "success",
          data: result.data,
          error: null,
          lastFetchedAt: Date.now(),
        });
      } else {
        setState({
          status: "error",
          data: null,
          error: result.error ?? "Unknown error",
          lastFetchedAt: Date.now(),
        });
      }
    } catch (err: unknown) {
      if (reqId !== requestIdRef.current) return;
      setState({
        status: "error",
        data: null,
        error: getErrorMessage(err),
        lastFetchedAt: Date.now(),
      });
    }
  }, [backendUrl, gameName, matchCount, platform, tagLine]);

  useEffect(() => {
    void fetchBundle();
  }, [fetchBundle, refreshKey]);

  return {
    status: state.status,
    data: state.data,
    error: state.error,
    lastFetchedAt: state.lastFetchedAt,
    refetch: fetchBundle,
  };
}
