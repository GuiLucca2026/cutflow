import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL não configurada. Aponte para o Postgres do mesmo projeto Supabase usado pelo login (ver README.md)."
  );
}

// A single shared connection across hot reloads in dev. `prepare: false` is
// required when connecting through Supabase's pooled connection (pgbouncer
// in transaction mode, port 6543) — see README.md.
const globalForDb = globalThis as unknown as { __cutflowSql?: ReturnType<typeof postgres> };

const client =
  globalForDb.__cutflowSql ??
  (globalForDb.__cutflowSql = postgres(connectionString, { prepare: false }));

export const db = drizzle(client, { schema });
export { client as sql };
