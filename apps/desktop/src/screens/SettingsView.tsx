import { useState, type ReactNode } from "react";
import {
  Gamepad2,
  Laptop,
  Moon,
  Plus,
  Power,
  Server,
  Sun,
  Trash2,
} from "lucide-react";

import {
  FPS_OPTIONS,
  RESOLUTION_OPTIONS,
  type RecorderDeviceProfile,
  type RecorderMode,
  type ResolutionOption,
  type FrameRateOption,
} from "../types/recorder";
import { GAMES } from "../games/shared/types";
import { cn } from "@/lib/utils";
import { useGameConfig } from "../hooks/useGameConfig";
import { Segmented } from "../components/Segmented";
import type { AppSettings } from "../hooks/useAppSettings";
import { getModule } from "../games/index";

type SettingsViewProps = {
  recorderProfiles: RecorderDeviceProfile[];
  activeRecorderProfileId: string;
  onActiveRecorderProfileChange: (profileId: string) => void;
  onRecorderProfileChange: (
    profileId: string,
    updater: (current: RecorderDeviceProfile) => RecorderDeviceProfile,
  ) => void;
  onAddRecorderProfile: () => string;
  onRemoveRecorderProfile: (profileId: string) => void;
  appSettings: AppSettings;
  onAppSettingsChange: (
    updater: (current: AppSettings) => AppSettings,
  ) => void;
  hasEnvRiotKey: boolean;
  isDark: boolean;
  onToggleDark: () => void;
};

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <header className="flex items-start gap-3 border-b border-border pb-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-primary">
          {icon}
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="pt-4">{children}</div>
    </section>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsView({
  recorderProfiles,
  activeRecorderProfileId,
  onActiveRecorderProfileChange,
  onRecorderProfileChange,
  onAddRecorderProfile,
  onRemoveRecorderProfile,
  appSettings,
  onAppSettingsChange,
  hasEnvRiotKey,
  isDark,
  onToggleDark,
}: SettingsViewProps) {
  const [selectedRecorderProfileId, setSelectedRecorderProfileId] = useState(
    activeRecorderProfileId,
  );
  const { installGame, removeGame, purgeGame, isInstalled } =
    useGameConfig();
  const selectedRecorderProfile =
    recorderProfiles.find(
      (p) => p.id === selectedRecorderProfileId,
    ) ??
    recorderProfiles.find((p) => p.id === activeRecorderProfileId) ??
    recorderProfiles[0];
  const selectedProfileIsActive =
    selectedRecorderProfile?.id === activeRecorderProfileId;
  const canRemoveSelectedProfile =
    Boolean(selectedRecorderProfile) && recorderProfiles.length > 1;

  const updateSelectedRecorderProfile = (
    updater: (current: RecorderDeviceProfile) => RecorderDeviceProfile,
  ) => {
    if (!selectedRecorderProfile) return;
    onRecorderProfileChange(selectedRecorderProfile.id, updater);
  };

  const installedGames = GAMES.filter((g) => isInstalled(g.id));
  const availableGames = GAMES.filter((g) => !isInstalled(g.id));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure Crux and its installed games.
        </p>
      </div>

      {/* ── General ────────────────────────────────────────────────────────── */}
      <SectionCard
        icon={<Server size={15} />}
        title="General"
        description="Backend connection and appearance."
      >
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Backend URL
            </span>
            <input
              type="text"
              placeholder="http://localhost:3001"
              autoComplete="off"
              spellCheck={false}
              className="rounded-md border border-border bg-background/50 px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              value={appSettings.backendUrl}
              onChange={(event) =>
                onAppSettingsChange((c) => ({
                  ...c,
                  backendUrl: event.target.value.trim(),
                }))
              }
            />
          </label>

          <div className="flex items-center gap-2 rounded-md bg-white/[0.03] px-3 py-2.5 text-xs">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                hasEnvRiotKey ? "bg-emerald-500" : "bg-red-500",
              )}
            />
            {hasEnvRiotKey ? (
              <span className="text-emerald-300">
                Riot API key configured — League data available.
              </span>
            ) : (
              <span className="text-muted-foreground">
                Set{" "}
                <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[11px]">
                  RIOT_API_KEY
                </code>{" "}
                in{" "}
                <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[11px]">
                  packages/backend/.env
                </code>{" "}
                for League data.
              </span>
            )}
          </div>

          <FieldRow label="Dark mode" hint="Recommended for recording sessions">
            <button
              type="button"
              onClick={onToggleDark}
              role="switch"
              aria-checked={isDark}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isDark ? "bg-primary" : "bg-white/10",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-background shadow transition-transform",
                  isDark ? "translate-x-5" : "translate-x-0.5",
                )}
              >
                {isDark ? (
                  <Moon size={10} className="text-primary" />
                ) : (
                  <Sun size={10} className="text-primary" />
                )}
              </span>
            </button>
          </FieldRow>
        </div>
      </SectionCard>

      {/* ── Installed Games ────────────────────────────────────────────────── */}
      {installedGames.map((game) => {
        const mod = getModule(game.id);
        if (!mod) return null;
        const isLeague = mod.id === "league";
        const state = {
          installState: "installed" as const,
          connectionState: "disconnected" as const,
          runtimeState: "stopped" as const,
          id: mod.id,
          hasRetainedData: false,
          lastActiveAt: null,
        };

        return (
          <SectionCard
            key={mod.id}
            icon={<Gamepad2 size={15} />}
            title={mod.label}
            description={mod.id === "league"
              ? "Riot account, champ select assistant, and recording."
              : "Player search, competitive ranks, career stats, and recording."}
          >
            <div className="flex flex-col gap-6">
              {/* Game-specific settings panel */}
              <mod.settings.panel
                state={state}
                hasBackendConfig={
                  isLeague ? hasEnvRiotKey : !!appSettings.backendUrl}
                onInstall={() => installGame(mod.id)}
                onRemove={() => removeGame(mod.id)}
                onPurge={() => purgeGame(mod.id)}
              />

              {/* Shared recorder */}
              {/* Shared recorder profiles + storage, shown per game */}
              {selectedRecorderProfile && (
                <>
                  <hr className="border-border" />
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">
                      Recorder
                    </h4>
                    <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
                      <div className="flex flex-col gap-2">
                        {recorderProfiles.map((profile) => {
                          const selected =
                            profile.id === selectedRecorderProfile?.id;
                          const active =
                            profile.id === activeRecorderProfileId;
                          return (
                            <button
                              key={profile.id}
                              type="button"
                              onClick={() =>
                                setSelectedRecorderProfileId(profile.id)}
                              className={cn(
                                "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                                selected
                                  ? "border-primary/45 bg-primary/10"
                                  : "border-border bg-background/30 hover:border-white/15",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                                  profile.enabled
                                    ? "bg-emerald-500/10 text-emerald-300"
                                    : "bg-white/[0.04] text-muted-foreground",
                                )}
                              >
                                <Laptop size={14} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-foreground">
                                  {profile.name}
                                </span>
                                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  {active ? "Active here" : "Saved profile"}
                                  <span className="text-muted-foreground/40">
                                    ·
                                  </span>
                                  {profile.enabled
                                    ? "Recorder on"
                                    : "Recorder off"}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => {
                            const id = onAddRecorderProfile();
                            setSelectedRecorderProfileId(id);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-background/20 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                        >
                          <Plus size={12} />
                          Add device profile
                        </button>
                      </div>

                      <div className="rounded-lg border border-border bg-background/25 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Device name
                            </span>
                            <input
                              type="text"
                              value={selectedRecorderProfile.name}
                              onChange={(e) =>
                                updateSelectedRecorderProfile((c) => ({
                                  ...c,
                                  name: e.target.value,
                                }))
                              }
                              className="rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                            />
                          </label>
                          <div className="flex shrink-0 items-center gap-2">
                            {!selectedProfileIsActive && (
                              <button
                                type="button"
                                onClick={() =>
                                  onActiveRecorderProfileChange(
                                    selectedRecorderProfile.id,
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                              >
                                <Laptop size={12} />
                                Use here
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={!canRemoveSelectedProfile}
                              onClick={() => {
                                const removingId = selectedRecorderProfile.id;
                                onRemoveRecorderProfile(removingId);
                                const next = recorderProfiles.find(
                                  (p) => p.id !== removingId,
                                );
                                if (next)
                                  setSelectedRecorderProfileId(next.id);
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Remove device profile"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-4">
                          <FieldRow
                            label="Enable recorder"
                            hint={
                              selectedProfileIsActive
                                ? "When off, matches will not be captured."
                                : "This applies when the profile is active."
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                updateSelectedRecorderProfile((c) => ({
                                  ...c,
                                  enabled: !c.enabled,
                                }))
                              }
                              role="switch"
                              aria-checked={selectedRecorderProfile.enabled}
                              className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                                selectedRecorderProfile.enabled
                                  ? "bg-emerald-500"
                                  : "bg-white/10",
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-background shadow transition-transform",
                                  selectedRecorderProfile.enabled
                                    ? "translate-x-5"
                                    : "translate-x-0.5",
                                )}
                              >
                                <Power size={10} className="text-foreground/80" />
                              </span>
                            </button>
                          </FieldRow>

                          <FieldRow
                            label="Recorder mode"
                            hint={
                              selectedRecorderProfile.recorderMode ===
                              "active_game_only"
                                ? "Only record when the active game is running."
                                : "Record when any installed game is running."
                            }
                          >
                            <select
                              value={selectedRecorderProfile.recorderMode}
                              onChange={(e) =>
                                updateSelectedRecorderProfile((c) => ({
                                  ...c,
                                  recorderMode: e.target
                                    .value as RecorderMode,
                                }))
                              }
                              className="rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="active_game_only">
                                Active game only
                              </option>
                              <option value="all_installed_games">
                                All installed games
                              </option>
                            </select>
                          </FieldRow>

                          <FieldRow
                            label="Resolution"
                            hint="Video output size"
                          >
                            <Segmented<ResolutionOption>
                              options={RESOLUTION_OPTIONS.map((r) => ({
                                value: r,
                                label: r,
                              }))}
                              value={selectedRecorderProfile.resolution}
                              onChange={(v) =>
                                updateSelectedRecorderProfile((c) => ({
                                  ...c,
                                  resolution: v,
                                }))
                              }
                            />
                          </FieldRow>

                          <FieldRow
                            label="Frame rate"
                            hint="Frames per second"
                          >
                            <Segmented<FrameRateOption>
                              options={FPS_OPTIONS.map((f) => ({
                                value: f,
                                label: `${f} fps`,
                              }))}
                              value={selectedRecorderProfile.frameRate}
                              onChange={(v) =>
                                updateSelectedRecorderProfile((c) => ({
                                  ...c,
                                  frameRate: v,
                                }))
                              }
                            />
                          </FieldRow>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Storage — shared across games */}
                  <hr className="border-border" />
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">
                      Storage
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Oldest recordings are deleted when either limit is
                      reached.
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          Max videos
                        </span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          className="rounded-md border border-border bg-background/50 px-3 py-2 font-mono text-sm tabular-nums text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                          value={selectedRecorderProfile.maxVideoCount}
                          onChange={(e) => {
                            const v = Math.max(
                              1,
                              Math.floor(Number(e.target.value)),
                            );
                            if (!Number.isNaN(v))
                              updateSelectedRecorderProfile((c) => ({
                                ...c,
                                maxVideoCount: v,
                              }));
                          }}
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          Max size (GB)
                        </span>
                        <input
                          type="number"
                          min={0.1}
                          step={0.5}
                          className="rounded-md border border-border bg-background/50 px-3 py-2 font-mono text-sm tabular-nums text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                          value={selectedRecorderProfile.maxFolderSizeGB}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!Number.isNaN(v) && v > 0)
                              updateSelectedRecorderProfile((c) => ({
                                ...c,
                                maxFolderSizeGB: v,
                              }));
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Lifecycle controls */}
              <hr className="border-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Game management
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => removeGame(mod.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => purgeGame(mod.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                  >
                    Delete Completely
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>
        );
      })}

      {/* ── Available Games ────────────────────────────────────────────────── */}
      {availableGames.length > 0 && (
        <SectionCard
          icon={<Gamepad2 size={15} />}
          title="Available Games"
          description="Install more games to unlock their features."
        >
          <div className="flex flex-col gap-3">
            {availableGames.map((game) => {
              const mod = getModule(game.id);
              if (!mod) return null;
              return (
                <div
                  key={mod.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-background/30 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground text-lg font-bold">
                    {mod.id === "league" ? "L" : "O"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{mod.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {mod.id === "league"
                        ? "Profile stats, champ select, recording"
                        : "Player search, career stats, hero tracking"}
                    </div>
                  </div>
                  <button
                    onClick={() => installGame(mod.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Install
                  </button>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
