import type { Config } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não configurada — ver README.md.");
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // CUTFLOW's tables live in their own "cutflow" schema inside the shared
  // Supabase project (separate from G2's own "public" schema) — this tells
  // drizzle-kit to only manage that schema, so `db:push` never touches or
  // drops any of G2's existing tables.
  schemaFilter: ["cutflow"],
  dbCredentials: {
    url: connectionString,
  },
} satisfies Config;
