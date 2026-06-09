import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Cached summoner profiles fetched from the Riot API.
 * Stores everything needed to render a summoner card without re-fetching.
 */
export const summoners = sqliteTable("summoners", {
  puuid: text("puuid").primaryKey(),
  gameName: text("game_name").notNull(),
  tagLine: text("tag_line").notNull(),
  platform: text("platform").notNull(),

  /** JSON: RiotAccount */
  accountJson: text("account_json").notNull(),

  /** JSON: RiotSummoner */
  summonerJson: text("summoner_json").notNull(),

  /** JSON: RiotLeagueEntry[] (nullable — unranked players) */
  leagueJson: text("league_json"),

  /** Data Dragon version used when this profile was cached */
  dataDragonVersion: text("data_dragon_version").notNull(),

  /** When this row was last refreshed from the Riot API */
  fetchedAt: integer("fetched_at", { mode: "timestamp" }).notNull(),
});

/**
 * Cached match details from the Riot API.
 * Matches rarely change, so they can be cached indefinitely.
 */
export const matches = sqliteTable("matches", {
  matchId: text("match_id").primaryKey(),
  platform: text("platform").notNull(),

  /** JSON: RiotMatch */
  dataJson: text("data_json").notNull(),

  /** When this row was last refreshed from the Riot API */
  fetchedAt: integer("fetched_at", { mode: "timestamp" }).notNull(),
});

/**
 * Generic key-value cache for miscellaneous API responses
 * (e.g. DataDragon versions, API responses with TTL).
 */
export const apiCache = sqliteTable("api_cache", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

// ── Aggregated Stats Tables ──────────────────────────────────────────────────

/**
 * Per-champion item win rates aggregated across all scraped matches.
 * One row per (champion, item, purchase_order, patch) combination.
 */
export const championItemStats = sqliteTable("champion_item_stats", {
  championId: integer("champion_id").notNull(),
  itemId: integer("item_id").notNull(),
  /** 1 = first completed item, 2 = second, 3+ = later items, 0 = any order */
  purchaseOrder: integer("purchase_order").notNull().default(0),
  gamesPlayed: integer("games_played").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  avgPurchaseTime: integer("avg_purchase_time").default(0),
  patch: text("patch").notNull(),
});

/**
 * Matchup-specific item stats: how a champion performs with an item
 * against a specific enemy champion.
 */
export const championMatchupStats = sqliteTable("champion_matchup_stats", {
  championId: integer("champion_id").notNull(),
  itemId: integer("item_id").notNull(),
  vsChampionId: integer("vs_champion_id").notNull(),
  gamesPlayed: integer("games_played").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  patch: text("patch").notNull(),
});

// ── Crawler State ────────────────────────────────────────────────────────────

/** Tracks PUUIDs queued for crawling to enable crash recovery. */
export const crawlerQueue = sqliteTable("crawler_queue", {
  puuid: text("puuid").primaryKey(),
  platform: text("platform").notNull(),
  /** 'queued' | 'in_progress' | 'done' | 'error' */
  status: text("status").notNull().default("queued"),
  enqueuedAt: integer("enqueued_at", { mode: "timestamp" }).notNull(),
  lastAttemptAt: integer("last_attempt_at", { mode: "timestamp" }),
  errorMessage: text("error_message"),
  attempts: integer("attempts").notNull().default(0),
});

/** Optional log of scraper runs. */
export const scriptsRun = sqliteTable("scripts_run", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scriptName: text("script_name").notNull(),
  args: text("args"),
  summonersScraped: integer("summoners_scraped").default(0),
  matchesScraped: integer("matches_scraped").default(0),
  errors: integer("errors").default(0),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// ── Game Auth & Lifecycle ─────────────────────────────────────────────────────

/**
 * Per-game auth tokens/session data.
 * Separated from retained data so remove (clear auth) vs purge (delete all)
 * are distinct operations.
 */
export const gameAuthTokens = sqliteTable("game_auth_tokens", {
  /** Game identifier (e.g. "league", "overwatch") */
  gameId: text("game_id").notNull(),
  /** Token key (e.g. "api_key", "access_token", "session") */
  tokenKey: text("token_key").notNull(),
  /** Token value */
  tokenValue: text("token_value").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.gameId, table.tokenKey] }),
}));

// ── Overwatch Matrices & Profiles ─────────────────────────────────────────────

export const owHeroes = sqliteTable("ow_heroes", {
  id: text("id").primaryKey(), // e.g. "winston"
  name: text("name").notNull(),
  role: text("role").notNull(), // "tank", "damage", "support"
  archetype: text("archetype").notNull(), // "dive", "rush", "poke"
});

export const owHeroCounters = sqliteTable("ow_hero_counters", {
  targetHeroId: text("target_hero_id").notNull(),
  counterHeroId: text("counter_hero_id").notNull(),
  weight: integer("weight").notNull(), // 2 (soft) to 4 (hard)
  reason: text("reason"),
}, (table) => ({
  pk: primaryKey({ columns: [table.targetHeroId, table.counterHeroId] }),
}));

export const owHeroSynergies = sqliteTable("ow_hero_synergies", {
  heroIdA: text("hero_id_a").notNull(),
  heroIdB: text("hero_id_b").notNull(),
  score: integer("score").notNull(),
  reason: text("reason"),
}, (table) => ({
  pk: primaryKey({ columns: [table.heroIdA, table.heroIdB] }),
}));

export const owPlayerProfiles = sqliteTable("ow_player_profiles", {
  playerId: text("player_id").primaryKey(), // e.g. "TeKrop-2217"
  name: text("name").notNull(),
  avatar: text("avatar"),
  lastUpdatedAt: integer("last_updated_at", { mode: "timestamp" }).notNull(),
  summaryJson: text("summary_json").notNull(),
  statsJson: text("stats_json").notNull(),
});

export const owProfileSnapshots = sqliteTable("ow_profile_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: text("player_id").notNull(),
  capturedAt: integer("captured_at", { mode: "timestamp" }).notNull(),
  statsJson: text("stats_json").notNull(), // The full stats blob at this point in time
  deltaJson: text("delta_json"), // The inferred match data (diff from previous)
});
