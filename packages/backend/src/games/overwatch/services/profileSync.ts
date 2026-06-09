import { db } from "../../../db";
import { owPlayerProfiles, owProfileSnapshots } from "../../../db/schema";
import { getPlayerSummary, getPlayerStats, type OverwatchPlayerStatsFilters, type OverwatchPlayerStats } from "./overfast";
import { eq, desc } from "drizzle-orm";

export type EnrichedPlayerProfile = {
  summary: any;
  stats: any;
  deltas: any; // The diff from the last snapshot
};

function calculateDelta(oldStats: OverwatchPlayerStats, newStats: OverwatchPlayerStats) {
  const delta: any = {};
  
  // Basic general stats delta
  if (oldStats?.general && newStats?.general) {
    delta.general = {
      games_played: (newStats.general.games_played || 0) - (oldStats.general.games_played || 0),
      games_won: (newStats.general.games_won || 0) - (oldStats.general.games_won || 0),
      games_lost: (newStats.general.games_lost || 0) - (oldStats.general.games_lost || 0),
    };
  }

  // TODO: Add more granular delta calculations here if needed (e.g. per hero)
  
  return delta;
}

export async function syncPlayerProfile(
  playerId: string,
  filters: OverwatchPlayerStatsFilters = {}
): Promise<EnrichedPlayerProfile> {
  // 1. Fetch fresh data from OverFast API
  const [summary, stats] = await Promise.all([
    getPlayerSummary(playerId),
    getPlayerStats(playerId, filters)
  ]);

  // 2. Fetch the most recent snapshot from DB
  const lastSnapshot = await db
    .select()
    .from(owProfileSnapshots)
    .where(eq(owProfileSnapshots.playerId, playerId))
    .orderBy(desc(owProfileSnapshots.capturedAt))
    .limit(1)
    .get();

  let deltas = {};

  if (lastSnapshot) {
    try {
      const oldStats = JSON.parse(lastSnapshot.statsJson);
      deltas = calculateDelta(oldStats, stats);
    } catch (err) {
      console.error("Failed to parse old stats JSON for deltas", err);
    }
  }

  const now = new Date();

  // 3. Upsert the player profile summary
  await db
    .insert(owPlayerProfiles)
    .values({
      playerId,
      name: summary.username ?? playerId,
      avatar: summary.avatar,
      lastUpdatedAt: now,
      summaryJson: JSON.stringify(summary),
      statsJson: JSON.stringify(stats),
    })
    .onConflictDoUpdate({
      target: owPlayerProfiles.playerId,
      set: {
        name: summary.username ?? playerId,
        avatar: summary.avatar,
        lastUpdatedAt: now,
        summaryJson: JSON.stringify(summary),
        statsJson: JSON.stringify(stats),
      }
    });

  // 4. Save a new snapshot if stats have changed or if we don't have one
  // Simple heuristic: if games played changed, save a new snapshot.
  // We can refine this to deep equality checks if needed.
  const oldGamesPlayed = lastSnapshot ? JSON.parse(lastSnapshot.statsJson)?.general?.games_played : -1;
  const newGamesPlayed = stats?.general?.games_played ?? 0;

  if (!lastSnapshot || oldGamesPlayed !== newGamesPlayed) {
    await db.insert(owProfileSnapshots).values({
      playerId,
      capturedAt: now,
      statsJson: JSON.stringify(stats),
      deltaJson: JSON.stringify(deltas),
    });
  }

  return {
    summary,
    stats,
    deltas,
  };
}
