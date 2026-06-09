import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  History,
  Moon,
  Settings,
  Sun,
  Zap,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { StatusPill, type StatusPillVariant } from "./StatusPill";
import { cn } from "@/lib/utils";
import type { RecordingState } from "../types/recorder";
import type { GameNavItem } from "../games/shared/module";
import type { GameId } from "../games/shared/types";

type InstalledGameEntry = {
  id: GameId;
  label: string;
  homePath: string;
};

const SHARED_NAV_ITEMS: GameNavItem[] = [
  { to: "/sessions", label: "Sessions", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

function deriveStatus(
  gameActive: boolean,
  state: RecordingState,
): StatusPillVariant {
  if (state === "recording") return "recording";
  if (state === "saving") return "saving";
  if (state === "error") return "error";
  if (gameActive) return "live";
  return "idle";
}

function pathMatches(pathname: string, item: GameNavItem) {
  if (item.end) return pathname === item.to;
  return pathname.startsWith(item.to);
}

type Props = {
  /** Navigation items from the active game module */
  moduleNavItems?: GameNavItem[];
  /** Home route path of the active module (for logo click) */
  homePath?: string;
  /** All installed games for the switcher dropdown */
  installedGames?: InstalledGameEntry[];
  /** Currently active game ID */
  activeGameId?: GameId | null;
  /** Called when user selects a different game from the switcher */
  onSelectGame?: (gameId: GameId, homePath: string) => void;
  gameActive: boolean;
  recordingState: RecordingState;
  isDark: boolean;
  onToggleDark: () => void;
};

export function AppSidebar({
  moduleNavItems,
  homePath,
  installedGames,
  activeGameId,
  onSelectGame,
  gameActive,
  recordingState,
  isDark,
  onToggleDark,
}: Props) {
  const status = deriveStatus(gameActive, recordingState);
  const location = useLocation();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const activeGame = installedGames?.find((g) => g.id === activeGameId);
  const otherGames = installedGames?.filter((g) => g.id !== activeGameId) ?? [];

  return (
    <Sidebar side="left" collapsible="icon" className="border-r border-border">
      <SidebarHeader className="px-3 py-3">
        {/* Game switcher */}
        <div className="flex items-center gap-2">
          <NavLink
            to={homePath ?? "/"}
            title="Go to active game home"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
          >
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.12)]">
              <Zap size={14} strokeWidth={2.5} />
            </span>
            <span className="font-display text-[15px] font-semibold tracking-[-0.025em] text-sidebar-foreground group-data-[collapsible=icon]:hidden truncate">
              {activeGame?.label ?? "Crux"}
            </span>
          </NavLink>

          {otherGames.length > 0 && (
            <div className="relative group-data-[collapsible=icon]:hidden">
              <button
                type="button"
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                title="Switch game"
              >
                <ChevronDown
                  size={14}
                  className={cn(
                    "transition-transform duration-200",
                    switcherOpen && "rotate-180",
                  )}
                />
              </button>

              {switcherOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setSwitcherOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-md border border-border bg-popover shadow-lg p-1">
                    {otherGames.map((game) => (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => {
                          onSelectGame?.(game.id, game.homePath);
                          setSwitcherOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors"
                      >
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                          {game.id === "league" ? "L" : "O"}
                        </span>
                        {game.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="gap-2">
        {/* Game module navigation */}
        {moduleNavItems && moduleNavItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em]">
              Navigate
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {moduleNavItems.map((item) => {
                  const active = pathMatches(location.pathname, item);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className={cn(
                          "relative font-medium transition-colors",
                          active
                            ? "text-sidebar-foreground"
                            : "text-muted-foreground hover:text-sidebar-foreground",
                        )}
                      >
                        <NavLink to={item.to} end={item.end}>
                          {active && (
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-y-1.5 left-0 w-[2px] rounded-r-full bg-primary"
                            />
                          )}
                          <Icon size={15} />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Shared navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em]">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SHARED_NAV_ITEMS.map((item) => {
                const active = pathMatches(location.pathname, item);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={cn(
                        "relative font-medium transition-colors",
                        active
                          ? "text-sidebar-foreground"
                          : "text-muted-foreground hover:text-sidebar-foreground",
                      )}
                    >
                      <NavLink to={item.to} end={item.end}>
                        {active && (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-y-1.5 left-0 w-[2px] rounded-r-full bg-primary"
                          />
                        )}
                        <Icon size={15} />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em]">
            Status
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <StatusPill variant={status} className="w-full justify-start" />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-2 py-2">
        <button
          type="button"
          onClick={onToggleDark}
          aria-label="Toggle theme"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="group flex h-8 w-full items-center gap-2 rounded-md px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            <Sun
              size={14}
              className={cn(
                "absolute transition-all duration-300 ease-out",
                isDark
                  ? "rotate-0 scale-100 opacity-100"
                  : "-rotate-90 scale-50 opacity-0",
              )}
            />
            <Moon
              size={14}
              className={cn(
                "absolute transition-all duration-300 ease-out",
                isDark
                  ? "rotate-90 scale-50 opacity-0"
                  : "rotate-0 scale-100 opacity-100",
              )}
            />
          </span>
          <span className="group-data-[collapsible=icon]:hidden">
            {isDark ? "Light mode" : "Dark mode"}
          </span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
