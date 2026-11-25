import crypto from "node:crypto";

const COOKIE = "dmp_staff";
const DAYS = 7;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET must be set (16+ characters)");
  return s;
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function checkPassword(pw) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) throw new Error("ADMIN_PASSWORD is not set");
  const a = crypto.createHash("sha256").update(String(pw || "")).digest();
  const b = crypto.createHash("sha256").update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

export function setSession(res) {
  const exp = String(Date.now() + DAYS * 86400000);
  const token = exp + "." + sign(exp);
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DAYS * 86400}`);
}

export function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

export function isStaff(req) {
  const raw = String(req.headers.cookie || "");
  const m = raw.split(/;\s*/).find((c) => c.startsWith(COOKIE + "="));
  if (!m) return false;
  const [exp, sig] = m.slice(COOKIE.length + 1).split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}
