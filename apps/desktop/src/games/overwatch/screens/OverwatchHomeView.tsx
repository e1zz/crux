import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { useOverwatchSettings } from "../hooks/useOverwatchSettings";
import { OverwatchPlayerView } from "./OverwatchPlayerView";

export function OverwatchHomeView() {
  const { settings: owSettings, hasClaimedPlayer } = useOverwatchSettings();
  const navigate = useNavigate();

  if (hasClaimedPlayer && owSettings.claimedPlayerId) {
    return <OverwatchPlayerView forcedPlayerId={owSettings.claimedPlayerId} />;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <h2 className="text-xl font-semibold text-foreground">No Account Claimed</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        Claim an Overwatch account to see your profile, stats, and competitive ranks here.
      </p>
      <button
        onClick={() => navigate("/overwatch/search")}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Search size={16} />
        Search for a Player
      </button>
    </div>
  );
}
