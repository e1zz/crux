import { db } from "./index";
import { owHeroes, owHeroCounters, owHeroSynergies } from "./schema";

const heroes = [
  { id: "winston", name: "Winston", role: "tank", archetype: "dive" },
  { id: "reinhardt", name: "Reinhardt", role: "tank", archetype: "rush" },
  { id: "sigma", name: "Sigma", role: "tank", archetype: "poke" },
  { id: "tracer", name: "Tracer", role: "damage", archetype: "dive" },
  { id: "widowmaker", name: "Widowmaker", role: "damage", archetype: "poke" },
  { id: "lucio", name: "Lúcio", role: "support", archetype: "rush" },
  { id: "ana", name: "Ana", role: "support", archetype: "poke" },
  { id: "kiriko", name: "Kiriko", role: "support", archetype: "dive" },
];

const counters = [
  { targetHeroId: "widowmaker", counterHeroId: "winston", weight: 4, reason: "Winston jumps her instantly (Dive beats Poke)" },
  { targetHeroId: "ana", counterHeroId: "winston", weight: 3, reason: "Winston bubble blocks her heals and sleeps" },
  { targetHeroId: "winston", counterHeroId: "reinhardt", weight: 3, reason: "Reinhardt swings through Winston shields (Rush beats Dive)" },
  { targetHeroId: "tracer", counterHeroId: "reinhardt", weight: 2, reason: "Harder for Tracer to dive static brawlers" },
  { targetHeroId: "reinhardt", counterHeroId: "sigma", weight: 3, reason: "Sigma out-ranges and burns shield down (Poke beats Rush)" },
  { targetHeroId: "lucio", counterHeroId: "sigma", weight: 2, reason: "Rocks and shields split Lúcio speed paths" },
  { targetHeroId: "sigma", counterHeroId: "tracer", weight: 3, reason: "Tracer blinks past his kinetic grasp and shield" },
];

const synergies = [
  { heroIdA: "winston", heroIdB: "tracer", score: 4, reason: "Classic Dive duo" },
  { heroIdA: "winston", heroIdB: "kiriko", score: 3, reason: "Kiriko can teleport into Dive engagements safely" },
  { heroIdA: "reinhardt", heroIdB: "lucio", score: 5, reason: "Speed boost is essential for Reinhardt to engage" },
  { heroIdA: "sigma", heroIdB: "ana", score: 4, reason: "Long-range resource management and nano-clutching" },
  { heroIdA: "widowmaker", heroIdB: "sigma", score: 3, reason: "Sigma creates distance for Widowmaker sightlines" },
];

async function seed() {
  console.log("🌱 Seeding Overwatch matrices...");

  console.log(`Injecting ${heroes.length} heroes...`);
  await db.delete(owHeroes);
  await db.insert(owHeroes).values(heroes);

  console.log(`Injecting ${counters.length} counters...`);
  await db.delete(owHeroCounters);
  await db.insert(owHeroCounters).values(counters);

  console.log(`Injecting ${synergies.length} synergies...`);
  await db.delete(owHeroSynergies);
  
  // Synergies should be bidirectional in the DB to make queries easier later, 
  // or the algorithm handles standardizing it. We'll store both directions for ease of use.
  const bidirectionalSynergies = synergies.flatMap(s => [
    { ...s },
    { heroIdA: s.heroIdB, heroIdB: s.heroIdA, score: s.score, reason: s.reason }
  ]);
  
  // Deduplicate just in case
  const uniqueSynergies = bidirectionalSynergies.filter((v, i, a) => 
    a.findIndex(t => (t.heroIdA === v.heroIdA && t.heroIdB === v.heroIdB)) === i
  );
  
  await db.insert(owHeroSynergies).values(uniqueSynergies);

  console.log("✅ Seed complete!");
}

seed().catch(console.error);
