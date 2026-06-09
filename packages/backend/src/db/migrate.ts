/**
 * Database migration — creates tables if they don't exist.
 *
 * Can be:
 *   - Imported and called at startup (auto-migration in src/index.ts)
 *   - Run standalone: `bun run src/db/migrate.ts`
 */

import { createClient } from "@libsql/client";
import { DATABASE_URL, ensureDatabaseDir } from "./path";

ensureDatabaseDir();

export async function migrate() {
  const client = createClient({ url: DATABASE_URL });

  console.log(`Migrating database: ${DATABASE_URL}`);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS summoners (
      puuid TEXT PRIMARY KEY,
      game_name TEXT NOT NULL,
      tag_line TEXT NOT NULL,
      platform TEXT NOT NULL,
      account_json TEXT NOT NULL,
      summoner_json TEXT NOT NULL,
      league_json TEXT,
      data_dragon_version TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS matches (
      match_id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      data_json TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS api_cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);

  // Aggregated stats tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS champion_item_stats (
      champion_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      purchase_order INTEGER NOT NULL DEFAULT 0,
      games_played INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      avg_purchase_time INTEGER DEFAULT 0,
      patch TEXT NOT NULL,
      PRIMARY KEY (champion_id, item_id, purchase_order, patch)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS champion_matchup_stats (
      champion_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      vs_champion_id INTEGER NOT NULL,
      games_played INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      patch TEXT NOT NULL,
      PRIMARY KEY (champion_id, item_id, vs_champion_id, patch)
    )
  `);

  // Crawler state
  await client.execute(`
    CREATE TABLE IF NOT EXISTS crawler_queue (
      puuid TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      enqueued_at INTEGER NOT NULL,
      last_attempt_at INTEGER,
      error_message TEXT,
      attempts INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Scripts run log
  await client.execute(`
    CREATE TABLE IF NOT EXISTS scripts_run (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      script_name TEXT NOT NULL,
      args TEXT,
      summoners_scraped INTEGER DEFAULT 0,
      matches_scraped INTEGER DEFAULT 0,
      errors INTEGER DEFAULT 0,
      started_at INTEGER NOT NULL,
      completed_at INTEGER
    )
  `);

  // Game Auth & Lifecycle
  await client.execute(`
    CREATE TABLE IF NOT EXISTS game_auth_tokens (
      game_id TEXT NOT NULL,
      token_key TEXT NOT NULL,
      token_value TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (game_id, token_key)
    )
  `);

  // Overwatch Matrices & Profiles
  await client.execute(`
    CREATE TABLE IF NOT EXISTS ow_heroes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      archetype TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS ow_hero_counters (
      target_hero_id TEXT NOT NULL,
      counter_hero_id TEXT NOT NULL,
      weight INTEGER NOT NULL,
      reason TEXT,
      PRIMARY KEY (target_hero_id, counter_hero_id)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS ow_hero_synergies (
      hero_id_a TEXT NOT NULL,
      hero_id_b TEXT NOT NULL,
      score INTEGER NOT NULL,
      reason TEXT,
      PRIMARY KEY (hero_id_a, hero_id_b)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS ow_player_profiles (
      player_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT,
      last_updated_at INTEGER NOT NULL,
      summary_json TEXT NOT NULL,
      stats_json TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS ow_profile_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL,
      captured_at INTEGER NOT NULL,
      stats_json TEXT NOT NULL,
      delta_json TEXT
    )
  `);

  console.log("Migration complete.");
  await client.close();
}

// Allow standalone execution: `bun run src/db/migrate.ts`
const isMainModule =
  import.meta.path === Bun.main || process.argv[1]?.endsWith("migrate.ts");
if (isMainModule) {
  await migrate();
}
