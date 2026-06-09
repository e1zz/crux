import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/crux.db";

export function ensureDatabaseDir() {
  if (!DATABASE_URL.startsWith("file:")) return;

  const rawPath = DATABASE_URL.slice("file:".length);
  const dir = dirname(rawPath);

  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
}
