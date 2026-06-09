# TKT-001: Blizzard API Capability Spike

## Decision

**GO: Use OverFast API (community) as primary data source for Overwatch 2.**

Blizzard does not expose a public Community API for Overwatch 2 player profiles. The only viable path is to use a community-maintained API that scrapes Blizzard's public profile pages.

---

## Blizzard Official API Status

### What exists
- Battle.net developer portal at `develop.battle.net`
- "Overwatch 2 Game Data APIs" listed under documentation
- OAuth2 infrastructure (client credentials / user auth)
- Game Data APIs for static data: heroes, maps, gamemodes

### What does NOT exist
- No Overwatch 2 player profile/stats API
- No match history API
- No competitive rank API
- No live game state API
- No local client API (no equivalent to League's LCU)
- No `@blizzard-api/ow` or `@blizzard-api/ow2` package exists

### Conclusion
The official Battle.net APIs for Overwatch 2 are limited to static game data (heroes, maps). There is no player-facing profile or stats endpoint. This is a hard blocker for "official Blizzard integration only" for player data.

---

## Community API Landscape

### OverFast API (RECOMMENDED)
- **URL**: https://overfast-api.tekrop.fr
- **GitHub**: https://github.com/TeKrop/overfast-api
- **License**: MIT
- **Stack**: FastAPI + PostgreSQL + Valkey (Redis-compatible) + nginx
- **Rate limit**: 30 req/s per IP (burst 5)
- **Data source**: Scrapes Blizzard public profile pages

#### Endpoints
| Endpoint | Description | Cache TTL |
|----------|-------------|-----------|
| `GET /players?name={query}` | Search players by BattleTag | 10 min |
| `GET /players/{player_id}/summary` | Profile summary (name, avatar, comp ranks) | 10 min |
| `GET /players/{player_id}/stats/summary` | Aggregated stats (eliminations, damage, etc.) | 10 min |
| `GET /players/{player_id}/stats/career` | Per-hero career stats | 10 min |
| `GET /players/{player_id}/stats` | Full stats with labels | 10 min |
| `GET /players/{player_id}` | All player data (heavy) | 10 min |
| `GET /heroes` | Hero list with portraits/roles | 1 day |
| `GET /heroes/{hero_key}` | Hero details (abilities, lore) | 1 day |
| `GET /heroes/stats` | Hero pick/win stats | 1 day |
| `GET /maps` | Map list | 1 day |
| `GET /gamemodes` | Gamemode list | 1 day |
| `GET /roles` | Role list | 1 day |

#### Player ID format
BattleTag with `#` replaced by `-`: `TeKrop-2217`

#### Response shapes (from OpenAPI spec)

**Player Search**
```json
{
  "total": 1,
  "results": [
    {
      "player_id": "TeKrop-2217",
      "name": "TeKrop",
      "avatar": "https://...",
      "namecard": "https://...",
      "title": "Bytefixer",
      "career_url": "https://overfast-api.tekrop.fr/players/TeKrop-2217",
      "blizzard_id": "c65b8798...",
      "last_updated_at": 1704209332
    }
  ]
}
```

**Player Summary**
```json
{
  "name": "TeKrop",
  "avatar": "https://...",
  "namecard": "https://...",
  "title": "Bytefixer",
  "endorsement_level": 5,
  "competitive": {
    "tank": { "rank": 3500, "role_icon": "...", "tier_icon": "..." },
    "damage": { "rank": 3200, "role_icon": "...", "tier_icon": "..." },
    "support": { "rank": 2800, "role_icon": "...", "tier_icon": "..." }
  },
  "last_updated_at": 1704209332
}
```

**Player Stats Summary**
```json
{
  "general": {
    "average": {
      "assists": 4.39,
      "damage": 7814.06,
      "deaths": 7.19,
      "eliminations": 17.36,
      "healing": 2398
    },
    "games_lost": 6154,
    "games_played": 12702,
    "games_won": 6548
  }
}
```

### Other community APIs (backup options)

| API | URL | Status | Notes |
|-----|-----|--------|-------|
| OW-API.com | ow-api.com | Older, less maintained | Profile + complete stats + per-hero |
| OWAPI.eu | owapi.eu | Active | Simple profile/complete endpoints |
| Overwatch.wtf | overwatch.wtf | Active | Application-focused API |

---

## Crux Backend Architecture for Overwatch

### Recommended approach
Crux backend acts as a proxy/cache layer between the desktop app and OverFast API, same pattern as League/Riot.

```
Desktop App → Crux Backend → OverFast API → Blizzard profile pages
                         ↓
                    SQLite cache
```

### Why proxy instead of direct
- Cache responses to reduce OverFast API load
- Rate limit protection (30 req/s shared)
- Abstraction: swap data source later without changing desktop
- Consistent API pattern with League module

### Env vars needed
```
# Optional: only if self-hosting OverFast or using a different provider
OVERWATCH_API_URL=https://overfast-api.tekrop.fr
```

No Blizzard API key needed for player data (OverFast handles that).

### Proposed routes
```
GET /api/overwatch/health              → provider readiness check
GET /api/overwatch/players/search?name={query}  → player search
GET /api/overwatch/players/:playerId/summary    → profile summary
GET /api/overwatch/players/:playerId/stats      → aggregated stats
GET /api/overwatch/players/:playerId/heroes     → per-hero career stats
GET /api/overwatch/heroes                       → hero list (static)
GET /api/overwatch/heroes/:heroKey              → hero details (static)
GET /api/overwatch/maps                         → map list (static)
```

### Cache strategy
- Player data: 10 minutes (matches OverFast TTL)
- Static data (heroes, maps): 1 hour
- Health check: 30 seconds

---

## Desktop Local Client Detection

### League comparison
| Feature | League | Overwatch |
|---------|--------|-----------|
| Local API | LCU (port 2999) | None |
| Live game data | `/liveclientdata/allgamedata` | No equivalent |
| Champ select | LCU endpoint | No equivalent |
| Identity detection | LCU summoner endpoint | No equivalent |
| Running detection | LCU health check | Process detection only |

### Overwatch detection strategy
Since Overwatch has no local API, detection must use:

1. **Process detection**: Check if `Overwatch.exe` is running
   - `tasklist /FI "IMAGENAME eq Overwatch.exe"` on Windows
   - `pgrep Overwatch` on macOS/Linux
2. **Window detection**: Look for Overwatch window via Electron's `desktopCapturer`
3. **No live game state**: Cannot detect comp vs quickplay, current match, etc.

This is a significant limitation vs League. The recorder can auto-start, but no live match assistant features are possible.

---

## Limitations and Risks

### Hard limitations
1. No official Blizzard player stats API
2. No local client API for Overwatch
3. No live game state data
4. No match history (individual matches)
5. Community API data is scraped, not official
6. Community API could go down or change scraping targets

### Risks
1. **OverFast reliability**: If OverFast goes down, Crux loses Overwatch data
   - Mitigation: implement fallback to direct Blizzard profile page scraping or use OWAPI.eu as backup
2. **Blizzard blocks scraping**: If Blizzard changes profile page structure
   - Mitigation: OverFast maintainer updates scraper; we can self-host
3. **Rate limits**: 30 req/s shared on public instance
   - Mitigation: aggressive caching; self-host for higher limits
4. **Data freshness**: 10-minute cache means stats are delayed
   - Mitigation: acceptable for companion app use case

### What we CANNOT build (vs League)
- Live match assistant
- Champ select assistant
- Real-time game state
- Individual match history
- Live rank tracking during a game

### What we CAN build
- Player profile lookup
- Competitive rank summary (per role)
- Quick play / career stats
- Per-hero stats and playtime
- Hero/map reference data
- Auto-recording (process detection only)
- Profile browsing for friends

---

## Go/No-Go Decision

**GO** — with the following caveats documented:

1. Use OverFast API as primary data source (MIT, active, well-maintained)
2. Self-host OverFast if higher throughput needed
3. Accept that Overwatch module will be less feature-rich than League
4. No local client integration — process detection only for recorder
5. Cache aggressively to protect against provider downtime

### Next steps
1. Implement `games/overwatch` backend module with OverFast proxy
2. Add player search + summary + stats routes
3. Add static data caching (heroes, maps)
4. Build desktop Overwatch connection UI
5. Add process detection for recorder
