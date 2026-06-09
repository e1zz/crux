import { useEffect, useState } from "react";

export type AppSettings = {
  /** Crux backend URL (e.g. http://localhost:3001) */
  backendUrl: string;
};

const APP_SETTINGS_KEY = "crux-app-settings";
const LEGACY_RIOT_SETTINGS_KEY = "crux-riot-settings";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  backendUrl: "http://localhost:3001",
};

function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) {
      // Migration from legacy riot settings
      const legacyRaw = localStorage.getItem(LEGACY_RIOT_SETTINGS_KEY);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw) as { backendUrl?: string };
        if (legacyParsed.backendUrl) {
          const migrated = { backendUrl: legacyParsed.backendUrl.trim() };
          localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
      return DEFAULT_APP_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      backendUrl:
        typeof parsed.backendUrl === "string" && parsed.backendUrl.trim()
          ? parsed.backendUrl.trim()
          : DEFAULT_APP_SETTINGS.backendUrl,
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings);

  useEffect(() => {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  return { settings, setSettings };
}
