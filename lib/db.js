import { neon } from "@neondatabase/serverless";

let sql = null;
let ready = null;

export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!sql) sql = neon(process.env.DATABASE_URL);
  return sql;
}

// Creates the table the first time the site runs.
export async function ensureTable() {
  if (!ready) {
    const q = db();
    ready = q`CREATE TABLE IF NOT EXISTS shipments (
      number       TEXT PRIMARY KEY,
      customer     TEXT NOT NULL,
      phone        TEXT DEFAULT '',
      size         TEXT DEFAULT '',
      cargo        TEXT DEFAULT '',
      origin       TEXT NOT NULL,
      destination  TEXT NOT NULL,
      container    TEXT DEFAULT '',
      eta          DATE,
      stage        INTEGER NOT NULL DEFAULT 0,
      events       JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )`.catch((e) => { ready = null; throw e; });
  }
  return ready;
}

export const STAGES = ["Booked", "Loaded at origin", "Departed port", "On the water", "Arrived at port", "Ready for pickup"];

export function normNumber(v) {
  const s = String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.startsWith("DMP") ? "DMP-" + s.slice(3) : s;
}
