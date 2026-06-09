import { useCallback, useState } from "react";
import { GAMES, type GameId } from "../games/shared/types";

type OnboardingStep = "welcome" | "choose-games" | "default-game" | "handoff";

type Props = {
  onComplete: (installedGames: GameId[], activeGame: GameId) => void;
};

export function OnboardingView({ onComplete }: Props) {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [selectedGames, setSelectedGames] = useState<GameId[]>([]);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  const handleToggleGame = useCallback((gameId: GameId) => {
    setSelectedGames((prev) =>
      prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId],
    );
  }, []);

  const handleComplete = useCallback(() => {
    if (selectedGames.length === 0) return;
    const finalActive = activeGame ?? selectedGames[0];
    onComplete(selectedGames, finalActive);
  }, [selectedGames, activeGame, onComplete]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-8">
      <div className="w-full max-w-lg space-y-8">
        {step === "welcome" && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome to Crux
              </h1>
              <p className="text-muted-foreground">
                A multi-game companion for League of Legends and Overwatch 2.
                <br />
                Let&apos;s set up your games.
              </p>
            </div>
            <button
              onClick={() => setStep("choose-games")}
              className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Get Started
            </button>
          </div>
        )}

        {step === "choose-games" && (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                Choose Your Games
              </h2>
              <p className="text-sm text-muted-foreground">
                Select which games to install. You can add more later from
                Settings.
              </p>
            </div>

            <div className="grid gap-3">
              {GAMES.map((game) => {
                const selected = selectedGames.includes(game.id);
                return (
                  <button
                    key={game.id}
                    onClick={() => handleToggleGame(game.id)}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-colors ${
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-md flex items-center justify-center text-lg font-bold ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {game.id === "league" ? "L" : "O"}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{game.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {game.id === "league"
                          ? "Profile stats, champ select, recording"
                          : "Player search, career stats, hero tracking"}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selected && (
                        <svg
                          className="w-3 h-3 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep("welcome")}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
              <button
                onClick={() =>
                  setStep(selectedGames.length > 1 ? "default-game" : "handoff")
                }
                disabled={selectedGames.length === 0}
                className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "default-game" && (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                Default Game
              </h2>
              <p className="text-sm text-muted-foreground">
                Which game should open by default when Crux starts?
              </p>
            </div>

            <div className="grid gap-3">
              {selectedGames.map((gameId) => {
                const game = GAMES.find((g) => g.id === gameId)!;
                const selected = activeGame === gameId;
                return (
                  <button
                    key={gameId}
                    onClick={() => setActiveGame(gameId)}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-colors ${
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-md flex items-center justify-center text-lg font-bold ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {gameId === "league" ? "L" : "O"}
                    </div>
                    <div className="flex-1 font-medium">{game.label}</div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selected && (
                        <svg
                          className="w-3 h-3 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep("choose-games")}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
              <button
                onClick={() => setStep("handoff")}
                disabled={activeGame === null}
                className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "handoff" && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                You&apos;re All Set
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedGames.length === 1
                  ? `${GAMES.find((g) => g.id === selectedGames[0])?.label} is ready. Configure your Riot ID in Settings to get started.`
                  : `${selectedGames.length} games installed. ${GAMES.find((g) => g.id === activeGame)?.label} is your default.`}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Next steps:
              </p>
              <ul className="text-sm text-left max-w-xs mx-auto space-y-1">
                {selectedGames.includes("league") && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Configure Riot ID in Settings
                  </li>
                )}
                {selectedGames.includes("overwatch") && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Search players by BattleTag
                  </li>
                )}
              </ul>
            </div>

            <button
              onClick={handleComplete}
              className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Start Using Crux
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
