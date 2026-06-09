import type { RouteObject } from "react-router-dom";
import { OverwatchHomeView } from "./screens/OverwatchHomeView";
import { OverwatchPlayerView } from "./screens/OverwatchPlayerView";
import { OverwatchCompanionView } from "./screens/OverwatchCompanionView";
import { OverwatchSearchView } from "./screens/OverwatchSearchView";

export function createOverwatchRoutes(): RouteObject[] {
  return [
    { path: "/overwatch", element: <OverwatchHomeView /> },
    { path: "/overwatch/search", element: <OverwatchSearchView /> },
    { path: "/overwatch/player/:playerId", element: <OverwatchPlayerView /> },
    { path: "/overwatch/companion", element: <OverwatchCompanionView /> },
  ];
}
