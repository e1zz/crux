import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { PanelImperativeHandle, PanelSize } from "react-resizable-panels";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { AppSidebar } from "./components/AppSidebar";
import { TopBar } from "./components/TopBar";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "./components/ui/sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";
import { SettingsView } from "./screens/SettingsView";
import { SessionsView } from "./screens/SessionsView";
import { OnboardingView } from "./screens/OnboardingView";
import { GameUnavailableView } from "./screens/GameUnavailableView";
import { useGameStatus } from "./hooks/useGameStatus";
import { useRecorderSettings } from "./hooks/useRecorderSettings";
import { useAppSettings } from "./hooks/useAppSettings";
import { useRiotEnvStatus } from "./hooks/useRiotEnvStatus";
import { useDarkMode } from "./hooks/useDarkMode";
import { useGameConfig } from "./hooks/useGameConfig";
import {
  getActiveModule,
  getInstalledModules,
} from "./games/index";
import { LeagueProvider } from "./games/league/LeagueProvider";
import type { GameId } from "./games/shared/types";
import { GAMES } from "./games/shared/types";
import { Toaster, toast } from "./components/ui/sonner";

const SIDEBAR_WIDTH_STORAGE_KEY = "crux:sidebar-width";
const SIDEBAR_DEFAULT_WIDTH = 256;
const SIDEBAR_MIN_WIDTH = 208;
const SIDEBAR_MAX_WIDTH = 340;
const SIDEBAR_COLLAPSED_WIDTH = 48;

function clampSidebarWidth(value: number) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value));
}

function getInitialSidebarWidth() {
  if (typeof window === "undefined") return SIDEBAR_DEFAULT_WIDTH;

  const saved = Number(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
  return Number.isFinite(saved)
    ? clampSidebarWidth(saved)
    : SIDEBAR_DEFAULT_WIDTH;
}

const SHELL_PATHS = ["/settings", "/sessions"];

function isOnShellRoute(pathname: string) {
  return SHELL_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(getInitialSidebarWidth);
  const { config, installGame, setActiveGame, isInstalled } = useGameConfig();
  const activeModule = getActiveModule(config);
  const detected = useGameStatus();
  const gameActive = detected.active;
  const detectedGameId = detected.gameId;
  const previousDetectedRef = useRef<GameId | null>(null);
  const dismissedUninstalledRef = useRef<GameId | null>(null);
  const navigate = useNavigate();
  const {
    recorderProfiles,
    activeRecorderProfileId,
    setActiveRecorderProfileId,
    updateRecorderProfile,
    addRecorderProfile,
    removeRecorderProfile,
  } = useRecorderSettings();
  const { settings: appSettings, setSettings: setAppSettings } =
    useAppSettings();
  const { hasEnvKey } = useRiotEnvStatus(appSettings.backendUrl);
  const { isDark, toggle: toggleDark } = useDarkMode();
  const location = useLocation();

  const setResizableSidebarWidth = useCallback((width: number) => {
    const nextWidth = clampSidebarWidth(width);
    setSidebarWidth(nextWidth);
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(nextWidth));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "r") {
        e.preventDefault();
        window.location.reload();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-switch active game and/or prompt install when a game is detected
  useEffect(() => {
    if (!detectedGameId || detectedGameId === previousDetectedRef.current) {
      return;
    }
    previousDetectedRef.current = detectedGameId;
    const gameLabel = GAMES.find((g) => g.id === detectedGameId)?.label ?? detectedGameId;

    if (isInstalled(detectedGameId)) {
      if (config.activeGame !== detectedGameId) {
        setActiveGame(detectedGameId);
        toast.success(`Switched to ${gameLabel}`, { duration: 3000 });
      }
      // If on a game-owned route from a different module, navigate to detected game home
      if (!isOnShellRoute(location.pathname)) {
        const otherModule = getInstalledModules(config).find(
          (m) => m.id !== detectedGameId,
        );
        if (otherModule?.routes.some((r) => location.pathname.startsWith(r.path ?? ""))) {
          const detectedMod =
            getInstalledModules(config).find((m) => m.id === detectedGameId);
          if (detectedMod) {
            navigate(detectedMod.navigation.homePath, { replace: true });
          }
        }
      }
    } else {
      // Game detected but not installed — show install prompt
      if (dismissedUninstalledRef.current !== detectedGameId) {
        toast(`${gameLabel} detected`, {
          description: `Install the Crux ${gameLabel} module to enable game-specific features.`,
          duration: 8000,
          action: {
            label: "Install now",
            onClick: () => {
              installGame(detectedGameId);
              setActiveGame(detectedGameId);
              dismissedUninstalledRef.current = null;
            },
          },
          cancel: {
            label: "Open settings",
            onClick: () => {
              navigate("/settings");
            },
          },
          onDismiss: () => {
            dismissedUninstalledRef.current = detectedGameId;
          },
          onAutoClose: () => {
            dismissedUninstalledRef.current = detectedGameId;
          },
        });
      }
    }
  }, [
    detectedGameId,
    installGame,
    setActiveGame,
    isInstalled,
    config.activeGame,
    config,
    location.pathname,
    navigate,
  ]);

  // Reset dismissed ref when detected game goes away
  useEffect(() => {
    if (!detectedGameId) {
      previousDetectedRef.current = null;
      // Allow re-prompt next time a game is detected
      // (do NOT clear dismissedUninstalledRef here — only clear on install)
    }
  }, [detectedGameId]);

  const handleOnboardingComplete = useCallback(
    (installedGames: GameId[], active: GameId) => {
      for (const gameId of installedGames) {
        installGame(gameId);
      }
      setActiveGame(active);
    },
    [installGame, setActiveGame],
  );

  if (config.installedGames.length === 0) {
    return <OnboardingView onComplete={handleOnboardingComplete} />;
  }

  const moduleNavItems = activeModule?.navigation.items;
  const TopBarContent = activeModule?.shell.topBar;
  const installedGameEntries = getInstalledModules(config).map((m) => ({
    id: m.id,
    label: m.label,
    homePath: m.navigation.homePath,
  }));
  const leagueInstalled = config.installedGames.includes("league");

  // Wrap content with active module providers when needed
  const content = (
    <SidebarInset className="max-h-svh overflow-y-auto bg-background text-foreground">
      <TopBar topBarContent={TopBarContent} />

      <main className="w-full flex-1 px-6 py-5">
        <div
          key={location.pathname}
          className="animate-in fade-in-50 slide-in-from-bottom-1 duration-300"
        >
          <Routes location={location}>
            {/* Root redirect: send / to active module homePath (must be first to take precedence) */}
            {activeModule && activeModule.navigation.homePath !== "/" && (
              <Route
                path="/"
                element={
                  <Navigate to={activeModule.navigation.homePath} replace />
                }
              />
            )}

            {getInstalledModules(config).flatMap((mod) =>
              mod.routes.map((route, i) => {
                const key = `${mod.id}-${route.path ?? i}`;

                if (route.children) {
                  return (
                    <Route key={key} path={route.path} element={route.element}>
                      {route.children.map((child, j) => (
                        <Route key={j} path={child.path} element={child.element} />
                      ))}
                    </Route>
                  );
                }

                return (
                  <Route
                    key={key}
                    path={route.path}
                    element={route.element}
                  />
                );
              }),
            )}

            <Route
              path="/settings"
              element={
                <SettingsView
                  recorderProfiles={recorderProfiles}
                  activeRecorderProfileId={activeRecorderProfileId}
                  onActiveRecorderProfileChange={setActiveRecorderProfileId}
                  onRecorderProfileChange={updateRecorderProfile}
                  onAddRecorderProfile={addRecorderProfile}
                  onRemoveRecorderProfile={removeRecorderProfile}
                  appSettings={appSettings}
                  onAppSettingsChange={setAppSettings}
                  hasEnvRiotKey={hasEnvKey}
                  isDark={isDark}
                  onToggleDark={toggleDark}
                />
              }
            />
            <Route path="/sessions" element={<SessionsView />} />

            {activeModule && !activeModule.routes.length && (
              <Route
                path="*"
                element={
                  <GameUnavailableView gameLabel={activeModule.label} />
                }
              />
            )}

            {!activeModule && (
              <Route path="*" element={<Navigate to="/settings" replace />} />
            )}
          </Routes>
        </div>
      </main>
    </SidebarInset>
  );

  const wrappedContent = leagueInstalled ? (
    <LeagueProvider>{content}</LeagueProvider>
  ) : (
    content
  );

  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <ResizableAppLayout
        sidebarWidth={sidebarWidth}
        onSidebarWidthChange={setResizableSidebarWidth}
        sidebar={
          <AppSidebar
            moduleNavItems={moduleNavItems}
            homePath={activeModule?.navigation.homePath}
            installedGames={installedGameEntries}
            activeGameId={config.activeGame}
            onSelectGame={(id, path) => {
              setActiveGame(id);
              navigate(path);
            }}
            gameActive={gameActive}
            recordingState={"idle"}
            isDark={isDark}
            onToggleDark={toggleDark}
          />
        }
      >
        {wrappedContent}
      </ResizableAppLayout>
      <Toaster isDark={isDark} />
    </SidebarProvider>
  );
}

type ResizableAppLayoutProps = {
  sidebar: ReactNode;
  sidebarWidth: number;
  onSidebarWidthChange: (width: number) => void;
  children: ReactNode;
};

function ResizableAppLayout({
  sidebar,
  sidebarWidth,
  onSidebarWidthChange,
  children,
}: ResizableAppLayoutProps) {
  const { isMobile, open, setOpen } = useSidebar();
  const sidebarPanelRef = useRef<PanelImperativeHandle | null>(null);
  const sidebarWidthRef = useRef(sidebarWidth);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    const panel = sidebarPanelRef.current;
    if (!panel || isMobile) return;

    if (open) {
      panel.resize(`${sidebarWidthRef.current}px`);
    } else {
      panel.collapse();
    }
  }, [isMobile, open]);

  if (isMobile) {
    return (
      <>
        {sidebar}
        {children}
      </>
    );
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      id="crux-app-layout"
      className="min-h-svh"
    >
      <ResizablePanel
        panelRef={sidebarPanelRef}
        id="app-sidebar"
        collapsible
        collapsedSize={`${SIDEBAR_COLLAPSED_WIDTH}px`}
        defaultSize={`${sidebarWidth}px`}
        groupResizeBehavior="preserve-pixel-size"
        minSize={`${SIDEBAR_MIN_WIDTH}px`}
        maxSize={`${SIDEBAR_MAX_WIDTH}px`}
        onResize={(size: PanelSize) => {
          if (size.inPixels <= SIDEBAR_COLLAPSED_WIDTH + 2) {
            if (open) setOpen(false);
            return;
          }

          if (!open) setOpen(true);
          onSidebarWidthChange(size.inPixels);
        }}
        className="overflow-visible"
      >
        {sidebar}
      </ResizablePanel>
      <ResizableHandle
        withHandle
        className="z-20 bg-border/60 transition-colors hover:bg-primary/40 data-[resize-handle-state=drag]:bg-primary/70"
      />
      <ResizablePanel id="app-content" minSize="40%">
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
