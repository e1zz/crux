import { useEffect, useState } from "react";

import { PLATFORM_REGIONS, type PlatformRegion } from "../../../types/riot";

export type LeagueSettings = {
  /** Summoner game name (Riot ID name) */
  gameName: string;
  /** Summoner tag line (e.g. "NA1", "KR1") */
  tagLine: string;
  /** Platform region (e.g. "na1", "euw1") */
  platform: PlatformRegion;
};

const LEAGUE_SETTINGS_KEY = "crux-league-settings";
const LEGACY_RIOT_SETTINGS_KEY = "crux-riot-settings";

export const DEFAULT_LEAGUE_SETTINGS: LeagueSettings = {
  gameName: "",
  tagLine: "",
  platform: "na1",
};

function loadLeagueSettings(): LeagueSettings {
  try {
    const raw = localStorage.getItem(LEAGUE_SETTINGS_KEY);
    if (!raw) {
      // Migrate from legacy
      const legacyRaw = localStorage.getItem(LEGACY_RIOT_SETTINGS_KEY);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw) as Partial<LeagueSettings>;
        const platform = PLATFORM_REGIONS.includes(parsed.platform as PlatformRegion)
          ? (parsed.platform as PlatformRegion)
          : DEFAULT_LEAGUE_SETTINGS.platform;

        const migrated = {
          gameName: typeof parsed.gameName === "string" ? parsed.gameName : "",
          tagLine: typeof parsed.tagLine === "string" ? parsed.tagLine : "",
          platform,
        };
        localStorage.setItem(LEAGUE_SETTINGS_KEY, JSON.stringify(migrated));
        return migrated;
      }
      return DEFAULT_LEAGUE_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<LeagueSettings>;
    const platform = PLATFORM_REGIONS.includes(parsed.platform as PlatformRegion)
      ? (parsed.platform as PlatformRegion)
      : DEFAULT_LEAGUE_SETTINGS.platform;

    return {
      gameName: typeof parsed.gameName === "string" ? parsed.gameName : "",
      tagLine: typeof parsed.tagLine === "string" ? parsed.tagLine : "",
      platform,
    };
  } catch {
    return DEFAULT_LEAGUE_SETTINGS;
  }
}

export function useLeagueSettings() {
  const [settings, setSettings] = useState<LeagueSettings>(loadLeagueSettings);

  useEffect(() => {
    localStorage.setItem(LEAGUE_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  return { settings, setSettings };
}

/**
 * Returns true when the user has entered enough info to look up a profile.
 */
export function isLeagueConfigured(settings: LeagueSettings): boolean {
  return Boolean(settings.gameName) && Boolean(settings.tagLine);
}
