import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./src/db/path";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
