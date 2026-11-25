import { checkPassword, setSession, clearSession, isStaff } from "../lib/auth.js";

const tries = new Map(); // simple per-instance throttle

export default async function handler(req, res) {
  try {
    if (req.method === "GET") return res.status(200).json({ staff: isStaff(req) });
    if (req.method === "DELETE") { clearSession(res); return res.status(200).json({ ok: true }); }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0] || "x";
    const t = tries.get(ip) || { n: 0, at: Date.now() };
    if (Date.now() - t.at > 15 * 60000) { t.n = 0; t.at = Date.now(); }
    if (t.n >= 10) return res.status(429).json({ error: "Too many attempts. Wait 15 minutes." });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (!checkPassword(body.password)) { t.n++; tries.set(ip, t); return res.status(401).json({ error: "Wrong password." }); }
    tries.delete(ip);
    setSession(res);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Login is not set up yet. Check ADMIN_PASSWORD and SESSION_SECRET." });
  }
}
