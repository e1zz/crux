import { LogOut } from "lucide-react";
import type { GameSettingsPanelProps } from "../shared/module";
import { useOverwatchSettings } from "./hooks/useOverwatchSettings";

export function OverwatchSettingsPanel({
  state,
  hasBackendConfig,
}: GameSettingsPanelProps) {
  const { settings, unclaimPlayer, hasClaimedPlayer, setDebugMode } = useOverwatchSettings();

  if (state.installState !== "installed") {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Data Source</span>
          <span className="font-medium">
            {hasBackendConfig ? "OverFast API" : "Unavailable"}
          </span>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <div className="font-medium text-foreground">OCR Debug Mode</div>
            <div className="text-xs text-muted-foreground">
              Save screenshots and log raw OCR text for troubleshooting.
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={!!settings.debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-5 w-9 rounded-full bg-muted after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-background after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
          </label>
        </div>

        {hasClaimedPlayer && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <div className="font-medium text-foreground">Claimed Account</div>
              <div className="text-xs text-muted-foreground">
                {settings.claimedPlayerName || settings.claimedPlayerId}
              </div>
            </div>
            <button
              onClick={unclaimPlayer}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut size={12} />
              Unclaim
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Overwatch 2 data is fetched from the OverFast community API.{" "}
        {hasClaimedPlayer
          ? "Your claimed account will automatically load on the home screen."
          : "Claim an account from the search results to have it load automatically on the home screen."}
      </p>
    </div>
  );
}
