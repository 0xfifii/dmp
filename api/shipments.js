import crypto from "node:crypto";
import { db, ensureTable, normNumber, STAGES } from "../lib/db.js";
import { isStaff } from "../lib/auth.js";

const clip = (v, n = 120) => String(v ?? "").trim().slice(0, n);
const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? v : null);

// Staff only: list, create, update status, delete.
export default async function handler(req, res) {
  if (!isStaff(req)) return res.status(401).json({ error: "Please log in." });
  try {
    await ensureTable();
    const sql = db();
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM shipments ORDER BY updated_at DESC LIMIT 500`;
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const s = {
        customer: clip(body.customer), phone: clip(body.phone, 40), size: clip(body.size, 40), cargo: clip(body.cargo, 40),
        origin: clip(body.origin), destination: clip(body.destination), container: clip(body.container, 20).toUpperCase(), eta: date(body.eta)
      };
      if (!s.customer || !s.origin || !s.destination) return res.status(400).json({ error: "Customer, from and to are required." });
      const events = JSON.stringify([{ at: new Date().toISOString(), text: STAGES[0] }]);
      for (let i = 0; i < 5; i++) {
        const number = "DMP-" + crypto.randomInt(100000, 1000000);
        const rows = await sql`INSERT INTO shipments (number, customer, phone, size, cargo, origin, destination, container, eta, stage, events)
          VALUES (${number}, ${s.customer}, ${s.phone}, ${s.size}, ${s.cargo}, ${s.origin}, ${s.destination}, ${s.container}, ${s.eta}, 0, ${events}::jsonb)
          ON CONFLICT (number) DO NOTHING RETURNING *`;
        if (rows.length) return res.status(201).json(rows[0]);
      }
      return res.status(500).json({ error: "Could not create a tracking number. Try again." });
    }

    if (req.method === "PATCH") {
      const number = normNumber(body.number);
      const stage = Number(body.stage);
      if (!Number.isInteger(stage) || stage < 0 || stage >= STAGES.length) return res.status(400).json({ error: "Invalid status." });
      const cur = await sql`SELECT stage FROM shipments WHERE number = ${number} LIMIT 1`;
      if (!cur.length) return res.status(404).json({ error: "Shipment not found." });
      const ev = JSON.stringify(cur[0].stage === stage ? [] : [{ at: new Date().toISOString(), text: STAGES[stage] }]);
      const eta = body.eta === undefined || body.eta === null ? undefined : date(body.eta);
      const rows = eta === undefined
        ? await sql`UPDATE shipments SET stage = ${stage}, events = events || ${ev}::jsonb, updated_at = now() WHERE number = ${number} RETURNING *`
        : await sql`UPDATE shipments SET stage = ${stage}, events = events || ${ev}::jsonb, eta = ${eta}::date, updated_at = now() WHERE number = ${number} RETURNING *`;
      return res.status(200).json(rows[0]);
    }

    if (req.method === "DELETE") {
      const number = normNumber(body.number || req.query.number);
      await sql`DELETE FROM shipments WHERE number = ${number}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Something went wrong. Try again." });
  }
}
