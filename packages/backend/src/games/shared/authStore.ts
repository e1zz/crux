import { db } from "../../db";
import { gameAuthTokens } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { GameId } from "./types";

/** Store an auth token for a game */
export async function setAuth(
  gameId: GameId,
  key: string,
  value: string,
): Promise<void> {
  await db
    .insert(gameAuthTokens)
    .values({
      gameId,
      tokenKey: key,
      tokenValue: value,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [gameAuthTokens.gameId, gameAuthTokens.tokenKey],
      set: { tokenValue: value, createdAt: new Date() },
    });
}

/** Get an auth token for a game */
export async function getAuth(
  gameId: GameId,
  key: string,
): Promise<string | null> {
  const row = await db
    .select()
    .from(gameAuthTokens)
    .where(
      and(
        eq(gameAuthTokens.gameId, gameId),
        eq(gameAuthTokens.tokenKey, key),
      ),
    )
    .get();

  return row?.tokenValue ?? null;
}

/** List all auth token keys for a game */
export async function listAuthKeys(gameId: GameId): Promise<string[]> {
  const rows = await db
    .select({ tokenKey: gameAuthTokens.tokenKey })
    .from(gameAuthTokens)
    .where(eq(gameAuthTokens.gameId, gameId))
    .all();

  return rows.map((r) => r.tokenKey);
}

/** Clear all auth tokens for a game (used in remove: keep data, clear auth) */
export async function clearAuth(gameId: GameId): Promise<void> {
  await db
    .delete(gameAuthTokens)
    .where(eq(gameAuthTokens.gameId, gameId));
}

/** Clear auth tokens for all games */
export async function clearAllAuth(): Promise<void> {
  await db.delete(gameAuthTokens);
}
