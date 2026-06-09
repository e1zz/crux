import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";
import { DATABASE_URL, ensureDatabaseDir } from "./path";

ensureDatabaseDir();

const sqlite = createClient({
  url: DATABASE_URL,
});

export const db = drizzle(sqlite, { schema });
export default db;
