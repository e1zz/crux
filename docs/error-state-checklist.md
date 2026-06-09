# Error-State UX Checklist

Verify that every error state across the Crux platform is handled gracefully — no blank screens, unhandled loading states, or cryptic errors.

---

## 1. Network & Backend Errors

### 1.1 Backend Down
- [ ] **1.1.1** Backend unreachable → settings shows "API key not configured" indicator (red)
- [ ] **1.1.2** Summoner fetch fails → error message displayed in profile instead of blank
- [ ] **1.1.3** Champ select fetch fails → error state shown, not crash
- [ ] **1.1.4** Overwatch search fails → error displayed below search bar

### 1.2 API Key Missing
- [ ] **1.2.1** Backend running but no `RIOT_API_KEY` → health endpoint reports `hasApiKey: false`
- [ ] **1.2.2** League profile fetch returns 401 → error shown in UI
- [ ] **1.2.3** Top bar shows "Not signed in" when no Riot ID configured

### 1.3 Rate Limiting
- [ ] **1.3.1** Riot API rate limited (429) → error message explains temporary unavailability
- [ ] **1.3.2** Subsequent requests not hammered while rate limited

### 1.4 OverFast API
- [ ] **1.4.1** OverFast API unreachable → `/api/overwatch/health` returns `"degraded"`
- [ ] **1.4.2** Overwatch player search fails → error shown in UI, not blank
- [ ] **1.4.3** Overwatch player detail fails → error message with context

---

## 2. Riot ID / Identity Errors

### 2.1 Missing Identity
- [ ] **2.1.1** No gameName or tagLine set → profile shows "configure Riot ID" prompt
- [ ] **2.1.2** Top bar shows dashed border "Not signed in" chip when unconfigured
- [ ] **2.1.3** Champ select and recorder still accessible but data sections show prompts

### 2.2 Invalid Identity
- [ ] **2.2.1** Fetch summoner with invalid Riot ID → backend returns 4xx → error displayed
- [ ] **2.2.2** Search for invalid format ("justName") → error toast shown
- [ ] **2.2.3** Unranked player → league entries null, handled gracefully (no crash)
- [ ] **2.2.4** Player with no match history → empty match list, not error

---

## 3. League Client (LCU) Errors

### 3.1 Client Not Running
- [ ] **3.1.1** LCU unavailable → `useLcuCurrentSummoner` returns `"unavailable"` status
- [ ] **3.1.2** Profile shows client Live indicator as false/inactive
- [ ] **3.1.3** "Detect from client" in settings shows error when LCU not reachable
- [ ] **3.1.4** Champ select polling shows idle state when LCU not running

### 3.2 Client Connection Lost
- [ ] **3.2.1** Client closes while polling → last-known data preserved briefly
- [ ] **3.2.2** Status transitions from "live" to "unavailable" smoothly
- [ ] **3.2.3** No crash or infinite retry loop on disconnect

### 3.3 Champ Select Edge Cases
- [ ] **3.3.1** Not in champ select → "idle" status with empty state message
- [ ] **3.3.2** Champ select session has 0 allies → empty team shown, not crash
- [ ] **3.3.3** Item stats fetch fails during champ select → fallback shown
- [ ] **3.3.4** Champ select polling disabled when League not installed (`pollMs: 0`)

---

## 4. Recorder Errors

### 4.1 Screen Capture
- [ ] **4.1.1** No desktop sources available → error message displayed
- [ ] **4.1.2** User denies screen capture permission → handled gracefully
- [ ] **4.1.3** Target window/application not found → falls back to full screen
- [ ] **4.1.4** Audio capture unavailable → recorder starts video-only

### 4.2 Save Errors
- [ ] **4.2.1** Disk full → save fails, error shown, recording state = "error"
- [ ] **4.2.2** File path unavailable → error message, not crash
- [ ] **4.2.3** Recorder stopped mid-save → best-effort partial save

### 4.3 MediaRecorder Compatibility
- [ ] **4.3.1** No supported mime type → falls back to default
- [ ] **4.3.2** MediaRecorder error event → caught and displayed
- [ ] **4.3.3** Multiple concurrent recordings → prevented (ref check)

---

## 5. Game Lifecycle Errors

### 5.1 Install / Remove / Purge Errors
- [ ] **5.1.1** Remove last installed game → app returns to onboarding
- [ ] **5.1.2** Purge last installed game → app returns to onboarding
- [ ] **5.1.3** Install already-installed game → no-op, no duplicate state
- [ ] **5.1.4** Purge non-installed game → no-op

### 5.2 Active Game Errors
- [ ] **5.2.1** Active game is Overwatch before routes exist → "Game not available yet" shown
- [ ] **5.2.2** Active game is null → redirects to `/settings`
- [ ] **5.2.3** Changing active game during onboarding → handled

### 5.3 Backend Lifecycle Endpoints
- [ ] **5.3.1** Invalid gameId in lifecycle endpoint → appropriate error response
- [ ] **5.3.2** Purge while provider unavailable → best-effort cleanup

---

## 6. Loading States

### 6.1 Profile Loading
- [ ] **6.1.1** Initial profile fetch → skeleton placeholders shown
- [ ] **6.1.2** Profile refresh → previous data stays visible during refetch
- [ ] **6.1.3** Match history loading → expandable rows with skeleton

### 6.2 Overwatch Loading
- [ ] **6.2.1** Player search in progress → loading spinner
- [ ] **6.2.2** Player detail fetch in progress → centered spinner
- [ ] **6.2.3** Heroes/maps static data loading → cached, minimal loading state

### 6.3 Champ Select Loading
- [ ] **6.3.1** Item stats loading → loading indicator in recommendations
- [ ] **6.3.2** Session data polling → no visible loading flash on each poll

### 6.4 Recorder Loading
- [ ] **6.4.1** Recording start in progress → state transitions to "recording"
- [ ] **6.4.2** Saving in progress → "saving" state shown

---

## 7. Empty States

### 7.1 Profile Empty States
- [ ] **7.1.1** No match history → "No recent matches" message
- [ ] **7.1.2** No ranked data → "Unranked" display
- [ ] **7.1.3** No champion stats → "Not enough games" message

### 7.2 Overwatch Empty States
- [ ] **7.2.1** Search returns 0 results → "No players found" message
- [ ] **7.2.2** Player has no competitive ranks → "Unranked" per role
- [ ] **7.2.3** Player has no stats data → empty state message

### 7.3 Sessions Empty States
- [ ] **7.3.1** No saved recordings → empty state message
- [ ] **7.3.2** Loading failures → error message, not crash

### 7.4 Settings Empty States
- [ ] **7.4.1** No recorder profiles → default profile created
- [ ] **7.4.2** No games installed → shown in games management

---

## 8. Data Dragon / Static Assets

### 8.1 Icon Failures
- [ ] **8.1.1** Champion icon 404 → placeholder shown
- [ ] **8.1.2** Profile icon 404 → fallback display
- [ ] **8.1.3** Item icon 404 → placeholder or text fallback
- [ ] **8.1.4** Overwatch avatar 404 → initial-letter placeholder

### 8.2 Data Dragon Fetch Failures
- [ ] **8.2.1** Version fetch fails → defaults to "14.1.1"
- [ ] **8.2.2** Champion map fetch fails → error logged, empty map returned
- [ ] **8.2.3** Item map fetch fails → empty map returned

---

## 9. Migration & Persistence Errors

### 9.1 Corrupted localStorage
- [ ] **9.1.1** Invalid JSON in game config → returns `DEFAULT_GAME_CONFIG`
- [ ] **9.1.2** Invalid JSON in Riot settings → returns `DEFAULT_RIOT_SETTINGS`
- [ ] **9.1.3** Invalid JSON in recorder settings → returns sanitized defaults
- [ ] **9.1.4** Invalid JSON in LP history → resets, no crash

### 9.2 Missing Keys
- [ ] **9.2.1** No `crux-game-config` → shows onboarding
- [ ] **9.2.2** No `crux-riot-settings` → uses defaults
- [ ] **9.2.3** No `crux-settings` → creates default recorder profile

---

## 10. Electron-Specific Errors

### 10.1 IPC Channel Failures
- [ ] **10.1.1** `getDesktopSources` fails → recorder error shown
- [ ] **10.1.2** `getCurrentSummonerFromClient` fails → LCU shows `"unavailable"`
- [ ] **10.1.3** `getChampSelectSessionFromClient` fails → idle state with error
- [ ] **10.1.4** `checkOverwatchRunning` not available → falls back to `false`
- [ ] **10.1.5** `saveRecording` fails → error state in recorder

### 10.2 Window Focus
- [ ] **10.2.1** Window loses focus → LCU polling may recheck on refocus
- [ ] **10.2.2** Recording continues in background

---

## 11. Route / Navigation Errors

### 11.1 Invalid Routes
- [ ] **11.1.1** Navigate to unknown route → stays on current page or shows empty state
- [ ] **11.1.2** Navigate to League route when League not installed → handled by routing

### 11.2 Deep Links
- [ ] **11.2.1** Direct link to other player profile while League installed → loads correctly
- [ ] **11.2.2** Legacy redirect (`/profile/:name/:tag`) → redirects correctly

---

## 12. Data Freshness & Cache

### 12.1 Stale Data Indicators
- [ ] **12.1.1** Cached summoner data → no stale indicator needed (cache TTL 2 min)
- [ ] **12.1.2** Overwatch player data cached 10 min → no stale indicator
- [ ] **12.1.3** Refresh buttons available on profile and champ select

### 12.2 Cache Miss
- [ ] **12.2.1** First-time summoner fetch → fetches from Riot API, caches
- [ ] **12.2.2** First-time Overwatch search → fetches from OverFast, caches
- [ ] **12.2.3** Expired cache entries → next request fetches fresh data
