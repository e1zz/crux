import { useEffect, useState } from "react";
import type { GameId } from "../games/shared/types";

export type DetectedGame = {
  active: boolean;
  gameId: GameId | null;
  clientRunning: boolean;
  matchRunning: boolean;
};

const INITIAL: DetectedGame = {
  active: false,
  gameId: null,
  clientRunning: false,
  matchRunning: false,
};

export function useGameStatus(): DetectedGame {
  const [status, setStatus] = useState<DetectedGame>(INITIAL);

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onGameStatus((payload) => {
      setStatus({
        active: payload.active,
        gameId: (payload.gameId as GameId) ?? null,
        clientRunning: payload.clientRunning,
        matchRunning: payload.matchRunning,
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  return status;
}
