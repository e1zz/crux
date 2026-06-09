import { useCallback, useMemo } from "react";
import { useNavigate, useParams, Outlet, type RouteObject } from "react-router-dom";

import { ProfileView } from "../../screens/ProfileView";
import { RecorderView } from "../../screens/RecorderView";
import { ChampSelectView } from "../../screens/ChampSelectView";
import { useLeagueApp } from "./context";
import { isLeagueConfigured } from "./hooks/useLeagueSettings";
import { useSummoner } from "../../hooks/useSummoner";
import { PLATFORM_REGIONS, type PlatformRegion } from "../../types/riot";
import { useAppSettings } from "../../hooks/useAppSettings";

function isPlatformRegion(value: string | undefined): value is PlatformRegion {
  return Boolean(value && PLATFORM_REGIONS.includes(value as PlatformRegion));
}

/** League home route — renders the user's own profile */
function LeagueHomeRoute() {
  const {
    effectiveSettings,
    configured,
    hasEnvKey,
    summoner,
    lcu,
    onOpenSettings,
  } = useLeagueApp();
  const navigate = useNavigate();

  return (
    <ProfileView
      status={summoner.status}
      data={summoner.data}
      error={summoner.error}
      configured={configured}
      hasIdentity={Boolean(
        effectiveSettings.gameName.trim() && effectiveSettings.tagLine.trim(),
      )}
      hasApiAccess={hasEnvKey}
      platform={effectiveSettings.platform}
      clientLive={lcu.isLive}
      isViewingOther={false}
      ownIdentity={{
        gameName: effectiveSettings.gameName,
        tagLine: effectiveSettings.tagLine,
      }}
      onRefresh={() => {
        void lcu.refetch();
        void summoner.refetch();
      }}
      onOpenSettings={onOpenSettings}
      onSelectPlayer={(gameName, tagLine) => {
        navigate(
          `/profile/${encodeURIComponent(effectiveSettings.platform)}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
        );
      }}
      onBackToOwn={() => navigate("/")}
    />
  );
}

/** Recorder route */
function LeagueRecorderRoute() {
  const { configured, gameActive, summoner, recorder, onOpenSettings } =
    useLeagueApp();

  return (
    <RecorderView
      gameActive={gameActive}
      recordingState={recorder.recordingState}
      elapsedSeconds={recorder.elapsedSeconds}
      lastSavedPath={recorder.lastSavedPath}
      errorMessage={recorder.errorMessage}
      settings={recorder.settings}
      summonerStatus={summoner.status}
      summonerData={summoner.data}
      summonerError={summoner.error}
      summonerConfigured={configured}
      onRefreshSummoner={() => void summoner.refetch()}
      onOpenRiotSettings={onOpenSettings}
      onStopRecording={recorder.stopRecording}
    />
  );
}

/** Champ select route */
function LeagueChampSelectRoute() {
  const { effectiveSettings, configured, summoner, champSelect, onOpenSettings } =
    useLeagueApp();
  const { settings: appSettings } = useAppSettings();

  return (
    <ChampSelectView
      status={champSelect.status}
      session={champSelect.data}
      error={champSelect.error}
      profileStatus={summoner.status}
      profileData={summoner.data}
      profileConfigured={configured}
      leagueSettings={effectiveSettings}
      appSettings={appSettings}
      onRefresh={() => {
        void champSelect.refetch();
        void summoner.refetch();
      }}
      onOpenSettings={onOpenSettings}
    />
  );
}

/** Other player profile route */
function LeagueOtherPlayerRoute() {
  const { effectiveSettings, hasEnvKey, onOpenSettings } = useLeagueApp();
  const { settings: appSettings } = useAppSettings();
  const navigate = useNavigate();
  const params = useParams<{
    platform: string;
    gameName: string;
    tagLine: string;
  }>();

  const routePlatform = isPlatformRegion(params.platform)
    ? params.platform
    : effectiveSettings.platform;
  const gameName = params.gameName ? decodeURIComponent(params.gameName) : "";
  const tagLine = params.tagLine
    ? decodeURIComponent(params.tagLine).replace(/^#/, "")
    : "";

  const targetSettings = useMemo(
    () => ({
      ...effectiveSettings,
      platform: routePlatform,
      gameName,
      tagLine,
    }),
    [effectiveSettings, routePlatform, gameName, tagLine],
  );

  const summoner = useSummoner(targetSettings, appSettings, { matchCount: 15 });
  const configured = isLeagueConfigured(targetSettings);

  const handleSelectPlayer = useCallback(
    (nextGameName: string, nextTagLine: string) => {
      navigate(
        `/profile/${encodeURIComponent(routePlatform)}/${encodeURIComponent(nextGameName)}/${encodeURIComponent(nextTagLine)}`,
      );
    },
    [navigate, routePlatform],
  );

  return (
    <ProfileView
      status={summoner.status}
      data={summoner.data}
      error={summoner.error}
      configured={configured}
      hasIdentity={Boolean(gameName.trim() && tagLine.trim())}
      hasApiAccess={hasEnvKey}
      platform={targetSettings.platform}
      clientLive={false}
      isViewingOther
      ownIdentity={{
        gameName: effectiveSettings.gameName,
        tagLine: effectiveSettings.tagLine,
      }}
      onRefresh={() => void summoner.refetch()}
      onOpenSettings={onOpenSettings}
      onSelectPlayer={handleSelectPlayer}
      onBackToOwn={() => navigate("/")}
    />
  );
}

/** Legacy redirect: /profile/:gameName/:tagLine -> /profile/:platform/:gameName/:tagLine */
function LeagueLegacyProfileRedirect() {
  const { effectiveSettings } = useLeagueApp();
  const params = useParams<{ gameName: string; tagLine: string }>();
  const navigate = useNavigate();

  const gameName = params.gameName ? decodeURIComponent(params.gameName) : "";
  const tagLine = params.tagLine
    ? decodeURIComponent(params.tagLine).replace(/^#/, "")
    : "";

  if (!gameName || !tagLine) {
    navigate("/", { replace: true });
    return null;
  }

  navigate(
    `/profile/${encodeURIComponent(effectiveSettings.platform)}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    { replace: true },
  );
  return null;
}

/** League Bootstrap Wrapper — provider lives at app-shell level */
function LeagueRoot() {
  return <Outlet />;
}

/** All League-owned routes */
export function createLeagueRoutes(): RouteObject[] {
  return [
    {
      element: <LeagueRoot />,
      children: [
        {
          path: "/",
          element: <LeagueHomeRoute />,
        },
        {
          path: "/recorder",
          element: <LeagueRecorderRoute />,
        },
        {
          path: "/champ-select",
          element: <LeagueChampSelectRoute />,
        },
        {
          path: "/profile/:platform/:gameName/:tagLine",
          element: <LeagueOtherPlayerRoute />,
        },
        {
          path: "/profile/:gameName/:tagLine",
          element: <LeagueLegacyProfileRedirect />,
        },
      ],
    },
  ];
}
