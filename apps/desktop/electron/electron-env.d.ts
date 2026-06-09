/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string;
    VITE_PUBLIC: string;
  }
}

type RecordingSession = {
  filename: string;
  path: string;
  size: number;
  createdAt: number;
};

type ExportParams = {
  sourcePath: string;
  startSec?: number;
  endSec?: number;
  speedMultiplier?: number;
};

type ExportResult = {
  success: boolean;
  session?: RecordingSession;
  error?: string;
};

type GameStatusPayload = {
  active: boolean;
  gameId: string | null;
  clientRunning: boolean;
  matchRunning: boolean;
};

type OverwatchScoreboardResult = {
  battleTags: string[];
};

interface Window {
  electronAPI: {
    openExternalUrl: (url: string) => Promise<boolean>;
    onGameStatus: (
      listener: (payload: GameStatusPayload) => void,
    ) => () => void;
    getDesktopSources: () => Promise<Array<{ id: string; name: string }>>;
    checkOverwatchRunning: () => Promise<boolean>;
    saveRecording: (
      recordingBuffer: ArrayBuffer,
      limits: { maxCount: number; maxSizeGB: number },
    ) => Promise<string>;
    getRecordings: () => Promise<RecordingSession[]>;
    deleteRecording: (filePath: string) => Promise<boolean>;
    exportRecording: (params: ExportParams) => Promise<ExportResult>;
    getCurrentSummonerFromClient: () => Promise<
      import("../src/types/riot").LcuCurrentSummonerResult
    >;
    getChampSelectSessionFromClient: () => Promise<
      import("../src/types/riot").LcuChampSelectSessionResult
    >;
    onOverwatchScoreboard: (
      listener: (payload: OverwatchScoreboardResult) => void,
    ) => () => void;
    setOcrDebugMode: (enabled: boolean) => Promise<void>;
  };
}
