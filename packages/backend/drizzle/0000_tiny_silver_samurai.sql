CREATE TABLE `api_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `champion_item_stats` (
	`champion_id` integer NOT NULL,
	`item_id` integer NOT NULL,
	`purchase_order` integer DEFAULT 0 NOT NULL,
	`games_played` integer DEFAULT 0 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`avg_purchase_time` integer DEFAULT 0,
	`patch` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `champion_matchup_stats` (
	`champion_id` integer NOT NULL,
	`item_id` integer NOT NULL,
	`vs_champion_id` integer NOT NULL,
	`games_played` integer DEFAULT 0 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`patch` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `crawler_queue` (
	`puuid` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`enqueued_at` integer NOT NULL,
	`last_attempt_at` integer,
	`error_message` text,
	`attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_auth_tokens` (
	`game_id` text NOT NULL,
	`token_key` text NOT NULL,
	`token_value` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`game_id`, `token_key`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`match_id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`data_json` text NOT NULL,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ow_hero_counters` (
	`target_hero_id` text NOT NULL,
	`counter_hero_id` text NOT NULL,
	`weight` integer NOT NULL,
	`reason` text,
	PRIMARY KEY(`target_hero_id`, `counter_hero_id`)
);
--> statement-breakpoint
CREATE TABLE `ow_hero_synergies` (
	`hero_id_a` text NOT NULL,
	`hero_id_b` text NOT NULL,
	`score` integer NOT NULL,
	`reason` text,
	PRIMARY KEY(`hero_id_a`, `hero_id_b`)
);
--> statement-breakpoint
CREATE TABLE `ow_heroes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`archetype` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ow_player_profiles` (
	`player_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`avatar` text,
	`last_updated_at` integer NOT NULL,
	`summary_json` text NOT NULL,
	`stats_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ow_profile_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`captured_at` integer NOT NULL,
	`stats_json` text NOT NULL,
	`delta_json` text
);
--> statement-breakpoint
CREATE TABLE `scripts_run` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`script_name` text NOT NULL,
	`args` text,
	`summoners_scraped` integer DEFAULT 0,
	`matches_scraped` integer DEFAULT 0,
	`errors` integer DEFAULT 0,
	`started_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `summoners` (
	`puuid` text PRIMARY KEY NOT NULL,
	`game_name` text NOT NULL,
	`tag_line` text NOT NULL,
	`platform` text NOT NULL,
	`account_json` text NOT NULL,
	`summoner_json` text NOT NULL,
	`league_json` text,
	`data_dragon_version` text NOT NULL,
	`fetched_at` integer NOT NULL
);
