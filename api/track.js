import { db, ensureTable, normNumber } from "../lib/db.js";

// Public: look up one shipment by tracking number. Returns no customer details.
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const number = normNumber(req.query.id);
  if (!/^[A-Z0-9-]{4,30}$/.test(number)) return res.status(400).json({ error: "Enter a valid tracking number." });
  try {
    await ensureTable();
    const rows = await db()`SELECT number, size, cargo, origin, destination, container, eta, stage, events, updated_at
                            FROM shipments WHERE number = ${number} LIMIT 1`;
    if (!rows.length) return res.status(404).json({ error: "not_found" });
    return res.status(200).json(rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Tracking is not available right now." });
  }
}
