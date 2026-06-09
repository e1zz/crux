import type { GameModule } from "./shared/module";
import type { GameId, CruxGameConfig } from "./shared/types";
import { leagueModule } from "./league/module";
import { overwatchModule } from "./overwatch/module";

/** All known game modules in the desktop app */
const MODULES: GameModule[] = [leagueModule, overwatchModule];

/** Get a module by game ID */
export function getModule(id: GameId): GameModule | undefined {
  return MODULES.find((m) => m.id === id);
}

/** Get all installed modules based on the current game config */
export function getInstalledModules(config: CruxGameConfig): GameModule[] {
  return MODULES.filter((m) => config.installedGames.includes(m.id));
}

/** Get the active module based on the current game config */
export function getActiveModule(config: CruxGameConfig): GameModule | undefined {
  if (!config.activeGame) return undefined;
  return getModule(config.activeGame);
}

/** Get the first installed module that has routes */
export function getFirstInstalledModuleWithRoutes(
  config: CruxGameConfig,
): GameModule | undefined {
  return getInstalledModules(config).find((m) => m.routes.length > 0);
}
