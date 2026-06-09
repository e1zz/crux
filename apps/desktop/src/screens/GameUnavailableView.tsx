import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function GameUnavailableView({
  gameLabel,
}: {
  gameLabel: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            Game not available yet
          </h2>
          <p className="text-sm text-muted-foreground">
            {gameLabel} is installed but its desktop experience is not ready.
          </p>
        </div>
        <button
          onClick={() => navigate("/settings")}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
        >
          <Settings size={14} />
          Open Settings
        </button>
      </div>
    </div>
  );
}
