import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle, Check } from "lucide-react";
import type { GameSettingsPanelProps } from "../shared/module";
import { useLeagueSettings } from "./hooks/useLeagueSettings";
import { PLATFORM_REGIONS, REGION_LABELS, type PlatformRegion } from "../../types/riot";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * League settings panel — Riot ID, detect from client, region.
 * Install/remove/purge are handled by the parent SettingsView.
 */
export function LeagueSettingsPanel({
  state,
}: GameSettingsPanelProps) {
  const { settings: leagueSettings, setSettings: onLeagueSettingsChange } = useLeagueSettings();
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [detectSuccessAt, setDetectSuccessAt] = useState<number | null>(null);

  const handleDetectFromClient = async () => {
    setDetecting(true);
    setDetectError(null);
    try {
      const result = await window.electronAPI.getCurrentSummonerFromClient();
      if (result.success) {
        const { summoner, platform } = result.data;
        onLeagueSettingsChange((current) => ({
          ...current,
          gameName: summoner.gameName || summoner.displayName || current.gameName,
          tagLine: summoner.tagLine || current.tagLine,
          platform: platform ?? current.platform,
        }));
        setDetectSuccessAt(Date.now());
      } else {
        setDetectError(result.error);
      }
    } catch (err: unknown) {
      setDetectError(getErrorMessage(err));
    } finally {
      setDetecting(false);
    }
  };

  if (state.installState !== "installed") {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-dashed border-border bg-background/30 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles size={13} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              Detect from League client
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Reads your Riot ID and region directly from the running game client.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleDetectFromClient()}
            disabled={detecting}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {detecting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Sparkles size={12} />
                Detect
              </>
            )}
          </button>
        </div>
        {detectError && (
          <div className="mt-2.5 flex items-start gap-1.5 rounded-md bg-red-500/5 px-2.5 py-1.5 text-[11px] text-red-300 ring-1 ring-red-500/20">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
            <span className="break-words">{detectError}</span>
          </div>
        )}
        {!detectError && detectSuccessAt && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-emerald-500/5 px-2.5 py-1.5 text-[11px] text-emerald-300 ring-1 ring-emerald-500/20">
            <Check size={11} />
            Filled Riot ID and region from the active client.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Game name
          </span>
          <input
            type="text"
            placeholder="Faker"
            autoComplete="off"
            spellCheck={false}
            className="rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            value={leagueSettings.gameName}
            onChange={(event) =>
              onLeagueSettingsChange((current) => ({
                ...current,
                gameName: event.target.value,
              }))
            }
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Tagline
          </span>
          <div className="flex items-center rounded-md border border-border bg-background/50 pl-2 transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
            <span className="font-mono text-sm text-muted-foreground">#</span>
            <input
              type="text"
              placeholder="KR1"
              autoComplete="off"
              spellCheck={false}
              maxLength={5}
              className="w-full rounded-md bg-transparent px-1 py-2 font-mono text-sm uppercase text-foreground outline-none"
              value={leagueSettings.tagLine}
              onChange={(event) =>
                onLeagueSettingsChange((current) => ({
                  ...current,
                  tagLine: event.target.value.replace(/^#/, ""),
                }))
              }
            />
          </div>
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Region
        </span>
        <select
          className="rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          value={leagueSettings.platform}
          onChange={(event) =>
            onLeagueSettingsChange((current) => ({
              ...current,
              platform: event.target.value as PlatformRegion,
            }))
          }
        >
          {PLATFORM_REGIONS.map((region) => (
            <option key={region} value={region}>
              {REGION_LABELS[region]} ({region.toUpperCase()})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
