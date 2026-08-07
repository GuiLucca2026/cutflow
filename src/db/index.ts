import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

const DB_PATH = process.env.CUTFLOW_DB_PATH || path.join(process.cwd(), "cutflow.db");

// A single shared connection across hot reloads in dev.
const globalForDb = globalThis as unknown as { __cutflowSqlite?: Database.Database };

const sqlite =
  globalForDb.__cutflowSqlite ??
  (globalForDb.__cutflowSqlite = new Database(DB_PATH));

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { sqlite };
