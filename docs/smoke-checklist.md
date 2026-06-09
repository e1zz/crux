# End-to-End Smoke Checklist

Verify the Crux multi-game platform across League and Overwatch.

## Prerequisites
- Backend running at `http://localhost:3001` with `RIOT_API_KEY` set
- Desktop app running
- League client optionally open for LCU-dependent tests

---

## 1. First-Run Onboarding

- [ ] **1.1** Start app with empty `localStorage` (clear `crux-game-config`, `crux-riot-settings`)
- [ ] **1.2** Onboarding wizard appears: "Welcome to Crux"
- [ ] **1.3** "Get Started" advances to game selection step
- [ ] **1.4** Both League and Overwatch are listed
- [ ] **1.5** Select League only → Continue → Default Game step is skipped (only one game)
- [ ] **1.6** Handoff shows League is ready, Riot ID hint
- [ ] **1.7** "Start Using Crux" → app shows League profile view
- [ ] **1.8** Sidebar shows Profile, Champ Select, Recorder, Sessions, Settings
- [ ] **1.9** Start fresh again, select both games
- [ ] **1.10** Default Game step appears, select Overwatch
- [ ] **1.11** Handoff shows both games installed, Overwatch as default
- [ ] **1.12** App opens, Overwatch search screen appears

---

## 2. League — Profile

- [ ] **2.1** Home screen shows ProfileView when League is active
- [ ] **2.2** Summoner data loads (profile icon, level, rank)
- [ ] **2.3** Ranked panel shows tier, LP, wins/losses, win rate bar
- [ ] **2.4** Match history rows appear, expandable with details (items, runes, KDA, participants)
- [ ] **2.5** Champions panel shows top played champions
- [ ] **2.6** Roles panel shows performance per role
- [ ] **2.7** Win/loss trend bar chart renders
- [ ] **2.8** Summary card shows aggregate win rate and KDA
- [ ] **2.9** Refresh button refetches summoner data
- [ ] **2.10** Profile icon loads from DataDragon CDN

---

## 3. League — Player Search

- [ ] **3.1** Top bar shows Riot ID chip (gameName#tagLine + platform)
- [ ] **3.2** Top bar search input accepts "Name#TAG" format
- [ ] **3.3** Search with valid Riot ID navigates to `/profile/:platform/:name/:tag`
- [ ] **3.4** Other player profile loads with their summoner data
- [ ] **3.5** "Back to my profile" returns to home
- [ ] **3.6** Search with invalid format shows error toast
- [ ] **3.7** Legacy route `/profile/:gameName/:tagLine` redirects to current format

---

## 4. League — Champ Select

- [ ] **4.1** Champ Select nav item visible in sidebar
- [ ] **4.2** When League client is NOT running: shows idle/"no champ select" state
- [ ] **4.3** When League client is running in champ select: shows item recommendations
- [ ] **4.4** Item recommendations fetch from backend stats endpoint
- [ ] **4.5** Refresh button triggers refetch
- [ ] **4.6** Polling stops when League is not installed (`pollMs: 0`)

---

## 5. League — Recorder

- [ ] **5.1** Recorder nav item visible in sidebar
- [ ] **5.2** RecorderView shows recording controls, elapsed timer, summoner info
- [ ] **5.3** Auto-recording starts when game active and recorder enabled
- [ ] **5.4** Stop button stops recording and saves video
- [ ] **5.5** Save path displayed after save
- [ ] **5.6** Error state shown if screen capture fails
- [ ] **5.7** Recorder mode selector in Settings works (active game only / all installed games)

---

## 6. Sessions

- [ ] **6.1** Sessions nav item visible in sidebar
- [ ] **6.2** Lists recorded video files from Electron
- [ ] **6.3** Playback, rename, delete actions work
- [ ] **6.4** Empty state when no recordings exist

---

## 7. Settings

- [ ] **7.1** Settings nav item visible in sidebar
- [ ] **7.2** Backend URL input works, health indicator updates
- [ ] **7.3** Riot ID fields (game name, tagline, region) persist across reload
- [ ] **7.4** "Detect from League client" fills Riot ID when client is running
- [ ] **7.5** Recorder device profiles: add, edit, remove, switch active
- [ ] **7.6** Resolution, FPS, storage limits change per profile
- [ ] **7.7** Recorder mode dropdown shows "Active game only" / "All installed games"
- [ ] **7.8** Dark/light mode toggle works and persists
- [ ] **7.9** Games management section shows both games with status
- [ ] **7.10** Install/Remove/Delete buttons work per game
- [ ] **7.11** Active game can be set in Settings

---

## 8. Game Lifecycle — Install / Remove / Purge

- [ ] **8.1** Remove League → sidebar hides League nav, League routes unavailable
- [ ] **8.2** Remove League → Riot settings preserved in localStorage
- [ ] **8.3** Reinstall League → sidebar shows League nav again
- [ ] **8.4** Purge League → Riot settings removed from localStorage
- [ ] **8.5** Install Overwatch → sidebar shows Search nav item
- [ ] **8.6** Remove Overwatch → sidebar hides Overwatch nav
- [ ] **8.7** Purge Overwatch → Overwatch settings cleared

---

## 9. Overwatch — Player Search

- [ ] **9.1** When Overwatch is active, Overwatch search screen appears
- [ ] **9.2** Search input accepts BattleTag format
- [ ] **9.3** Search with <2 characters shows validation error
- [ ] **9.4** Search returns results from OverFast API
- [ ] **9.5** Results list shows player name, ID, avatar
- [ ] **9.6** Click result navigates to player detail view
- [ ] **9.7** Empty state shown when no results

---

## 10. Overwatch — Player Detail

- [ ] **10.1** Player summary shows name, avatar, title, endorsement
- [ ] **10.2** Competitive ranks displayed for tank/damage/support
- [ ] **10.3** Career averages: games played, win rate, elims, deaths, assists, damage, healing
- [ ] **10.4** Loading spinner shown while fetching
- [ ] **10.5** Error state shown if OverFast API is unreachable
- [ ] **10.6** "Unranked" shown for roles without rank

---

## 11. Game Switching

- [ ] **11.1** Setting active game to League shows League sidebar + top bar
- [ ] **11.2** Setting active game to Overwatch shows Overwatch sidebar
- [ ] **11.3** Shared pages (Settings, Sessions) remain accessible regardless of active game
- [ ] **11.4** Active game persists across app reload

---

## 12. Backend Health

- [ ] **12.1** `GET /api/health` returns `{ status: "ok", hasApiKey: true }`
- [ ] **12.2** `GET /api/games` returns both League and Overwatch states
- [ ] **12.3** `GET /api/games/league/health` returns League provider health
- [ ] **12.4** `GET /api/games/overwatch/health` returns Overwatch provider health
- [ ] **12.5** `GET /api/overwatch/health` returns `"ok"` or `"degraded"`
- [ ] **12.6** League profile endpoint returns valid data
- [ ] **12.7** League stats endpoints return item recommendations
- [ ] **12.8** Overwatch search endpoint returns results
- [ ] **12.9** Overwatch player summary endpoint returns data

---

## 13. Backend Lifecycle Endpoints

- [ ] **13.1** `GET /api/games` lists both games
- [ ] **13.2** `POST /api/games/:gameId/install` sets state to installed
- [ ] **13.3** `POST /api/games/:gameId/remove` sets state to removed, auth cleared
- [ ] **13.4** `POST /api/games/:gameId/purge` removes state, data deleted

---

## 14. Migration — Existing League Users

- [ ] **14.1** Set `crux-riot-settings` in localStorage with valid gameName/tagLine
- [ ] **14.2** No `crux-game-config` key present
- [ ] **14.3** App loads → League auto-installed, active game = League
- [ ] **14.4** `crux-game-config` is now present with installedGames: ["league"]
- [ ] **14.5** All existing League behavior works normally
