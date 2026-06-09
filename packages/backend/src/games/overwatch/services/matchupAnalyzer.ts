import { db } from "../../../db";
import { owHeroCounters, owHeroes } from "../../../db/schema";
import { inArray, eq } from "drizzle-orm";

export type MatchupAnalysisResult = {
  heroId: string;
  name: string;
  role: string;
  archetype: string;
  score: number;
  reasons: string[];
};

export async function analyzeMatchup(
  enemyHeroIds: string[],
): Promise<MatchupAnalysisResult[]> {
  if (!enemyHeroIds || enemyHeroIds.length === 0) {
    return [];
  }

  // 1. Fetch all counters against the provided enemy heroes
  const counters = await db
    .select({
      counterHeroId: owHeroCounters.counterHeroId,
      targetHeroId: owHeroCounters.targetHeroId,
      weight: owHeroCounters.weight,
      reason: owHeroCounters.reason,
    })
    .from(owHeroCounters)
    .where(inArray(owHeroCounters.targetHeroId, enemyHeroIds));

  // 2. Fetch all hero metadata so we can return rich data
  const allHeroes = await db.select().from(owHeroes);
  const heroMap = new Map(allHeroes.map((h) => [h.id, h]));

  // 3. Aggregate scores per friendly hero (the counter)
  const scoreMap = new Map<
    string,
    { score: number; reasons: string[] }
  >();

  for (const c of counters) {
    const current = scoreMap.get(c.counterHeroId) || { score: 0, reasons: [] };
    
    current.score += c.weight;
    
    // Format a nice reason string
    const targetHero = heroMap.get(c.targetHeroId);
    const targetName = targetHero?.name ?? c.targetHeroId;
    if (c.reason) {
      current.reasons.push(`vs ${targetName}: ${c.reason}`);
    }

    scoreMap.set(c.counterHeroId, current);
  }

  // 4. Map back to result objects and sort descending by score
  const results: MatchupAnalysisResult[] = [];
  
  for (const [heroId, data] of scoreMap.entries()) {
    const heroMeta = heroMap.get(heroId);
    if (!heroMeta) continue; // Should not happen if DB is consistent

    results.push({
      heroId,
      name: heroMeta.name,
      role: heroMeta.role,
      archetype: heroMeta.archetype,
      score: data.score,
      reasons: data.reasons,
    });
  }

  // Sort by highest score first
  results.sort((a, b) => b.score - a.score);

  return results;
}
