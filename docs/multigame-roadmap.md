# Crux Multi-Game Expansion Plan

## Summary

Crux currently works as a League-first app across both desktop and backend. The goal is to evolve it into a modular multi-game platform, starting with Overwatch as the first additional game.

This plan locks the following product decisions:

- Crux asks users during first-run setup which games to install
- Users can choose one or multiple games
- Only installed games are shown and activated in the app
- Users can later add, remove, or fully delete a game from Settings
- Removing a game keeps local data but clears auth/session state
- Deleting a game completely clears auth/session state and all game-owned local data
- League backend routes move to `/api/league/*`
- Overwatch uses OverFast API (community, MIT) as primary data source (see `docs/overwatch-api-spike.md`)

## Goals

- Support multiple installable game modules in one Crux install
- Decouple League-specific logic from the global app shell
- Add game lifecycle management: install, remove, reinstall, delete completely
- Add Overwatch support starting with connection/stats first (via OverFast API)
- Keep retained data for removed games unless the user chooses full deletion

## Non-Goals

- Do not generalize League stats models into a fake shared cross-game schema
- Do not promise Overwatch live assistant or analytics (no local client API exists)
- Do not add native installer customization first; use first-run onboarding instead

## Current Constraints

### Desktop
Current app shell is in `apps/desktop/src/App.tsx` and directly wires:
- Riot settings
- LCU identity detection
- League game status polling
- Champ select polling
- League recorder integration
- Riot-specific top bar and navigation behavior

### Backend
Current backend is strongly League-shaped:
- `/api/summoner/...`
- `/api/stats/...`
- Riot-specific services and types
- League-specific DB tables and crawler/aggregator logic

## Product Model

### Game Lifecycle States
Each game should support:

- `not_installed`
- `installed`
- `removed_with_saved_data`

### Runtime/Connection State
Each game should expose:

- installed/not installed
- enabled/disabled
- active/inactive
- connected/disconnected/degraded
- running/not running
- retained data available/not available

### User Actions
Per game:

- Install game
- Remove game
- Delete game completely
- Reconnect account

### Lifecycle Semantics

#### Install game
- Register module in Crux
- Enable routes, settings, navigation, runtime hooks
- Restore retained local data if present
- Require fresh auth if prior auth was cleared

#### Remove game
- Hide game from UI
- Stop background polling/runtime logic
- Keep local cached/profile/derived data
- Clear auth/session/tokens
- Mark retained data as available

#### Delete game completely
- Do everything in remove
- Purge all game-owned cached/profile/raw/derived/settings data
- Clear retained-data markers

## Architecture Direction

## Desktop Module System

Add a `GameModule` contract for each game module.

Each game module should define:
- metadata
- routes
- settings section
- connection behavior
- runtime hooks
- recorder strategy
- cleanup behavior

### Proposed Desktop Structure
```text
apps/desktop/src/
  games/
    shared/
      types.ts
      registry.ts
      lifecycle.ts
      recorder.ts
    league/
      module.ts
      routes.tsx
      settings.ts
      hooks/
      screens/
      components/
      lib/
      types/
    overwatch/
      module.ts
      routes.tsx
      settings.ts
      hooks/
      screens/
      components/
      types/
```

### App Shell Responsibilities
The top-level shell should become game-aware instead of Riot-aware:
- active game
- installed games
- route registration from installed modules
- top bar from active module
- sidebar from installed modules

## Backend Module System

Add game modules under `packages/backend/src/games`.

### Proposed Backend Structure
```text
packages/backend/src/
  games/
    shared/
      types.ts
      registry.ts
      lifecycle.ts
      auth.ts
      cache.ts
    league/
      routes/
      services/
      types/
      lifecycle.ts
      index.ts
    overwatch/
      routes/
      services/
      types/
      lifecycle.ts
      index.ts
```

### Backend Provider Contract
Each game backend module should define:
- route registration
- health/config reporting
- auth management
- `clearAuth()`
- `purgeData()`
- `disableRuntime()`

## API Plan

### League
Replace current public shape with:
- `/api/league/health`
- `/api/league/profile/:platform/:gameName/:tagLine`
- `/api/league/stats/items/:championId`
- `/api/league/stats/items/:championId/vs/:enemyId`
- `/api/league/stats/champions`
- `/api/league/stats/info`

### Overwatch
See `docs/overwatch-api-spike.md` for full decision. Routes proxy OverFast API:
- `/api/overwatch/health` — provider readiness
- `/api/overwatch/players/search?name={query}` — player search
- `/api/overwatch/players/:playerId/summary` — profile summary
- `/api/overwatch/players/:playerId/stats` — aggregated stats
- `/api/overwatch/players/:playerId/heroes` — per-hero career stats
- `/api/overwatch/heroes` — hero list (static, cached)
- `/api/overwatch/maps` — map list (static, cached)

## Data Strategy

Retained data stays in existing app storage for now.

### Important Rule
Sensitive auth/session state must be stored separately from retained reusable data.

### Remove Game
- clear auth only
- keep cached/profile/derived data

### Delete Game Completely
- clear auth
- delete all game-owned data
- remove lifecycle markers

### Ownership Map Requirement
Each game module must explicitly own:
- DB rows/tables
- cache keys
- tokens/session data
- settings keys
- recorder-specific preferences

## Onboarding Plan

Use a first-run setup wizard inside Electron rather than native installer customization.

### First-Run Flow
1. Welcome
2. Choose games to install
3. Choose default active game
4. Per-game setup handoff
5. Finish

### Settings > Games
Each game card should show:
- Installed / Not installed / Removed with saved data
- Connected / Not connected
- Data saved locally / No saved data

Each game card should allow:
- Install
- Remove game
- Delete game completely
- Reconnect account

## Overwatch Plan

See `docs/overwatch-api-spike.md` for full API decision.

### Data Source
- OverFast API (community, MIT): `https://overfast-api.tekrop.fr`
- Crux backend proxies and caches responses
- No Blizzard auth needed for player data

### Overwatch V1 Scope
- player search by BattleTag
- profile summary (name, avatar, comp ranks)
- career stats (eliminations, damage, healing, etc.)
- per-hero stats and playtime
- hero/map reference data
- local running detection for recorder
- no auth flow required (OverFast has no auth)

### Overwatch V1 Non-Commitments
- live match assistant (no local client API exists)
- hero recommendation engine
- full analytics pipeline
- League-style live client features
- individual match history (not available)
- real-time rank tracking during games

### What's Different From League
| Feature | League | Overwatch |
|---------|--------|-----------|
| Data source | Riot API (official) | OverFast API (community scraper) |
| Local client | LCU API | None |
| Live game state | Yes | No |
| Match history | Full match data | Aggregated stats only |
| Auth required | API key | None |
| Process detection | LCU health check | Process/window detection |

## Recorder Plan

The recorder should become game-aware.

### Refactor Direction
- split recorder core from League-specific trigger logic
- move League trigger logic into League module
- add per-game recorder strategies
- allow recorder mode:
  - active game only
  - all installed games

## Migration Plan for Existing Users

Existing League users should be migrated automatically.

### Migration Rules
- existing Riot settings become League module settings
- existing install state becomes:
  - `installedGames = ["league"]`
  - `enabledGames = ["league"]`
  - `activeGame = "league"`
- existing League behavior should remain functional after migration

## Ticket Backlog

## Phase 0: Discovery
- `TKT-001` Blizzard API Capability Spike — **DONE** (see `docs/overwatch-api-spike.md`)

## Phase 1: Shared Multi-Game Model
- `TKT-002` Define Shared Game Types — **DONE**
- `TKT-003` Define Desktop `GameModule` Contract — **DONE**
- `TKT-004` Define Backend Game Provider Contract — **DONE**
- `TKT-005` Add Persistent Installed Game State Model — **DONE**

## Phase 2: League Extraction
- `TKT-006` Namespace League Backend Routes — **DONE**
- `TKT-007` Move League Backend Into `games/league` — **DONE**
- `TKT-008` Update Desktop League Fetch Paths — **DONE**
- `TKT-009` Create Desktop League Module — **DONE**
- `TKT-010` Stop Global League Polling — **DONE**

## Phase 3: Onboarding
- `TKT-011` Build First-Run Onboarding Gate — **DONE**
- `TKT-012` Build "Choose Games to Install" Step — **DONE**
- `TKT-013` Build Default Active Game Step — **DONE**
- `TKT-014` Add Per-Game Onboarding Hand-off — **DONE**

## Phase 4: App Shell
- `TKT-015` Make Sidebar Game-Aware — **DONE**
- `TKT-016` Make Top Bar Game-Aware — **DONE**
- `TKT-017` Route Registration by Installed Module — **DONE**

## Phase 5: Settings and Lifecycle UI
- `TKT-018` Add Games Management Section — **DONE**
- `TKT-019` Add "Install Game" Flow — **DONE**
- `TKT-020` Add "Remove Game" Flow — **DONE**
- `TKT-021` Add "Delete Game Completely" Flow — **DONE**
- `TKT-022` Add Confirmation UX for Remove/Delete — **DONE**

## Phase 6: Backend Auth/Data Lifecycle
- `TKT-023` Add Auth Storage Boundary — **DONE**
- `TKT-024` Add Game Lifecycle Service Registry — **DONE**
- `TKT-025` Add Backend Lifecycle Endpoints — **DONE**
- `TKT-026` Add Data Ownership Map for League — **DONE**

## Phase 7: Overwatch Backend
- `TKT-027` Create Backend `games/overwatch` Module — **DONE**
- `TKT-028` Add OverFast Config/Health Endpoint — **DONE**
- `TKT-029` Implement OverFast Proxy Service — **DONE**
- `TKT-030` Add Overwatch Auth Status/Disconnect Endpoints — **DONE**
- `TKT-031` Add Initial Overwatch Profile Endpoint — **DONE**
- `TKT-032` Add Overwatch Data Ownership Map — **DONE**

## Phase 8: Overwatch Desktop
- `TKT-033` Create Desktop Overwatch Module — **DONE**
- `TKT-034` Add Overwatch Connection UI — **DONE**
- `TKT-035` Add Overwatch Running Detection — **DONE**
- `TKT-036` Add Overwatch Home/Profile Screen — **DONE**

## Phase 9: Recorder
- `TKT-037` Define Shared Recorder Strategy Contract — **DONE**
- `TKT-038` Move League Recorder Logic Into League Module — **DONE**
- `TKT-039` Add Overwatch Recorder Strategy — **DONE**
- `TKT-040` Add Multi-Game Recorder Mode Settings — **DONE**

## Phase 10: QA and Migration
- `TKT-041` Add Migration Plan for Existing League Users — **DONE**
- `TKT-042` Add End-to-End Smoke Checklist — **DONE**
- `TKT-043` Add Error-State UX Checklist — **DONE**

## Suggested Execution Order

1. `TKT-001`
2. `TKT-002`
3. `TKT-003`
4. `TKT-004`
5. `TKT-005`
6. `TKT-006`
7. `TKT-007`
8. `TKT-008`
9. `TKT-009`
10. `TKT-041`

## Risks

- OverFast API (community scraper) may go down or change scraping targets
- Blizzard could block profile page scraping
- Overwatch has no local client API — no live game state possible
- current backend migration system is basic and may need explicit schema migration work
- top-level UI currently assumes Riot concepts in multiple places

## Success Criteria

Crux is successful when:
- the app supports multiple installable game modules
- League is fully isolated as a module
- first-run setup supports choosing one or multiple games
- removed games retain local data but clear auth
- fully deleted games remove all local data and auth
- Overwatch can fetch player profiles, comp ranks, and career stats via OverFast API
