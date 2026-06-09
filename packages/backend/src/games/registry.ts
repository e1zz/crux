import type { GameId } from "./shared/types";
import type { GameProvider } from "./shared/provider";
import type { GameLifecycleService } from "./shared/lifecycle";
import { createLifecycleService } from "./shared/lifecycle";
import { leagueProvider } from "./league/provider";
import { overwatchProvider } from "./overwatch/provider";

/** All registered backend game providers */
const providers: Partial<Record<GameId, GameProvider>> = {
  league: leagueProvider,
  overwatch: overwatchProvider,
};

/** Singleton lifecycle service */
let lifecycleInstance: GameLifecycleService | null = null;

export function getLifecycleService(): GameLifecycleService {
  if (!lifecycleInstance) {
    lifecycleInstance = createLifecycleService(providers);
  }
  return lifecycleInstance;
}

/** Get provider by game ID */
export function getProvider(id: GameId): GameProvider | undefined {
  return providers[id];
}
