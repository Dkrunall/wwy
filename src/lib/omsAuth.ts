// Signed, expiring session tokens (HMAC-SHA256). Replaces constant cookie values like
// `oms_auth=1` and `wwy_dev=1`, which anyone could set by hand.
// Uses Web Crypto so it also runs in proxy.ts.

export const OMS_COOKIE = "oms_auth";
export const OMS_SESSION_SECONDS = 60 * 60 * 12; // 12 hours

const encoder = new TextEncoder();

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// `scope` keeps tokens apart: an OMS token can't be replayed as a dev-gate token.
export async function createSignedToken(scope: string, seconds: number): Promise<string | null> {
  const secret = process.env.OMS_SESSION_SECRET;
  if (!secret) return null;
  const expires = String(Date.now() + seconds * 1000);
  return `${expires}.${await sign(`${scope}.${expires}`, secret)}`;
}

// Fails closed: a missing secret, malformed token, bad signature or expiry all return false.
export async function verifySignedToken(scope: string, token: string | undefined): Promise<boolean> {
  const secret = process.env.OMS_SESSION_SECRET;
  if (!secret || !token) return false;
  const [expires, sig, ...rest] = token.split(".");
  if (!expires || !sig || rest.length > 0) return false;
  if (!(Number(expires) > Date.now())) return false;
  return safeEqual(sig, await sign(`${scope}.${expires}`, secret));
}

export const createOmsToken = () => createSignedToken("oms", OMS_SESSION_SECONDS);
export const verifyOmsToken = (token: string | undefined) => verifySignedToken("oms", token);
