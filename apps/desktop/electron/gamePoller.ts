import https from "node:https";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

type GameId = "league" | "overwatch";

export type GameStatusPayload = {
  active: boolean;
  gameId: GameId | null;
  /** Whether the game client/lobby is running (LeagueClientUx.exe or Overwatch.exe) */
  clientRunning: boolean;
  /** Whether a match is actively running (LCU live game API on port 2999) */
  matchRunning: boolean;
};

type StatusChangeCallback = (payload: GameStatusPayload) => void;

export type GamePoller = {
  start: () => void;
  stop: () => void;
  getCurrentStatus: () => GameStatusPayload;
};

function checkLeagueLiveGame(): Promise<boolean> {
  return new Promise((resolve) => {
    const request = https.request(
      {
        hostname: "127.0.0.1",
        port: 2999,
        path: "/liveclientdata/allgamedata",
        method: "GET",
        rejectUnauthorized: false,
        timeout: 2000,
      },
      (response) => {
        response.resume();
        resolve(response.statusCode === 200);
      },
    );

    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => resolve(false));
    request.end();
  });
}

async function checkLeagueClientProcess(): Promise<boolean> {
  try {
    if (process.platform === "win32") {
      const { stdout } = await execAsync(
        'tasklist /FI "IMAGENAME eq LeagueClientUx.exe" 2>NUL',
        { timeout: 3000 },
      );
      return stdout.toLowerCase().includes("leagueclientux.exe");
    }
    const { stdout } = await execAsync("pgrep -x LeagueClientUx", {
      timeout: 3000,
    });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function checkOverwatchRunning(): Promise<boolean> {
  try {
    if (process.platform === "win32") {
      const { stdout } = await execAsync(
        'tasklist /FI "IMAGENAME eq Overwatch.exe" 2>NUL',
        { timeout: 3000 },
      );
      return stdout.toLowerCase().includes("overwatch.exe");
    }
    // On Linux, Proton/Wine processes often have .exe appended or different casing.
    // Use case-insensitive partial match (-i) instead of exact match (-x).
    const { stdout } = await execAsync("pgrep -i overwatch", { timeout: 3000 });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export function createGamePoller(
  onStatusChange: StatusChangeCallback,
): GamePoller {
  let pollInterval: NodeJS.Timeout | null = null;
  let currentStatus: GameStatusPayload = {
    active: false,
    gameId: null,
    clientRunning: false,
    matchRunning: false,
  };

  async function detectGame(): Promise<GameStatusPayload> {
    // Check League client process first (fastest)
    const leagueClientRunning = await checkLeagueClientProcess();

    if (leagueClientRunning) {
      const matchRunning = await checkLeagueLiveGame();
      return {
        active: true,
        gameId: "league",
        clientRunning: true,
        matchRunning,
      };
    }

    // Overwatch: client = match (single process)
    const overwatchRunning = await checkOverwatchRunning();
    if (overwatchRunning) {
      return {
        active: true,
        gameId: "overwatch",
        clientRunning: true,
        matchRunning: true,
      };
    }

    return {
      active: false,
      gameId: null,
      clientRunning: false,
      matchRunning: false,
    };
  }

  async function pollGameStatus() {
    const status = await detectGame();
    if (
      status.gameId !== currentStatus.gameId ||
      status.active !== currentStatus.active ||
      status.clientRunning !== currentStatus.clientRunning ||
      status.matchRunning !== currentStatus.matchRunning
    ) {
      currentStatus = status;
      onStatusChange(status);
    }
  }

  return {
    start() {
      if (pollInterval) return;
      void pollGameStatus();
      pollInterval = setInterval(() => {
        void pollGameStatus();
      }, 3000);
    },
    stop() {
      if (!pollInterval) return;
      clearInterval(pollInterval);
      pollInterval = null;
    },
    getCurrentStatus() {
      return currentStatus;
    },
  };
}
