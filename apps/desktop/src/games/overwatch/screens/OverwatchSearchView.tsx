import { useState, type FormEvent } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAppSettings } from "../../../hooks/useAppSettings";
import { useOverwatchSettings } from "../hooks/useOverwatchSettings";

type SearchResult = {
  player_id: string;
  name: string;
  avatar?: string;
  title?: string;
};

export function OverwatchSearchView() {
  const { settings } = useAppSettings();
  const backendUrl = settings.backendUrl.replace(/\/+$/, "");
  const navigate = useNavigate();
  const { settings: owSettings, claimPlayer } = useOverwatchSettings();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || q.length < 2) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${backendUrl}/api/overwatch/players/search?name=${encodeURIComponent(q)}`,
        { signal: AbortSignal.timeout(10_000) },
      );
      const data = await res.json();
      if (data.success) {
        setResults(data.data.results ?? []);
      } else {
        setError(data.error ?? "Search failed");
        setResults(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Search Players
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for players by BattleTag to view their stats or claim them as your main account.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search BattleTag — Name#1234"
            className="w-full rounded-md border border-border bg-background/50 py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <span>{loading ? "Searching..." : "Search"}</span>
          <ArrowRight size={14} />
        </button>
      </form>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {results && results.length === 0 && !loading && (
        <div className="text-center text-sm text-muted-foreground py-8">
          No players found. Try a different BattleTag.
        </div>
      )}

      {results && results.length > 0 && (
        <div className="grid gap-3">
          {results.map((player) => (
            <div
              key={player.player_id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt=""
                    className="h-full w-full rounded-md object-cover"
                  />
                ) : (
                  <Search size={18} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{player.name}</div>
                {player.title && (
                  <div className="text-xs text-muted-foreground">
                    {player.title}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/overwatch/player/${encodeURIComponent(player.player_id)}`)}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  View
                </button>
                <button
                  onClick={() => claimPlayer(player.player_id, player.name)}
                  disabled={owSettings.claimedPlayerId === player.player_id}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {owSettings.claimedPlayerId === player.player_id ? "Claimed" : "Claim"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
