/* Venora Jewels — private CAD sheet service (Cloudflare Worker).
   GET /cad/<path>  -> the CAD sheet from the private "venora-cad" bucket,
                       only for a signed-in admin (Firebase ID token in the Authorization header). */

const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
let jwks = { keys: [], expires: 0 };

const b64urlToBytes = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), c => c.charCodeAt(0));
const b64urlToJson = s => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

async function signingKeys() {
  if (Date.now() < jwks.expires && jwks.keys.length) return jwks.keys;
  const res = await fetch(JWKS_URL);
  const maxAge = Number((res.headers.get("cache-control") || "").match(/max-age=(\d+)/)?.[1] || 3600);
  jwks = { keys: (await res.json()).keys, expires: Date.now() + maxAge * 1000 };
  return jwks.keys;
}

/** Verify a Firebase Auth ID token; returns its claims or throws. */
async function verifyIdToken(token, projectId) {
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) throw new Error("malformed token");
  const header = b64urlToJson(h), claims = b64urlToJson(p);
  if (header.alg !== "RS256") throw new Error("bad alg");
  const jwk = (await signingKeys()).find(k => k.kid === header.kid);
  if (!jwk) throw new Error("unknown key");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(s), new TextEncoder().encode(h + "." + p));
  if (!ok) throw new Error("bad signature");
  const now = Math.floor(Date.now() / 1000);
  if (claims.aud !== projectId || claims.iss !== "https://securetoken.google.com/" + projectId) throw new Error("wrong project");
  if (!(claims.exp > now) || !(claims.iat <= now + 60) || !claims.sub) throw new Error("expired");
  return claims;
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ORIGINS.split(",").map(s => s.trim());
  return allowed.includes(origin)
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "GET, OPTIONS", "Vary": "Origin" }
    : {};
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Max-Age": "86400" } });

    if (request.method === "GET" && url.pathname.startsWith("/cad/")) {
      const auth = request.headers.get("Authorization") || "";
      if (!auth.startsWith("Bearer ")) return new Response("Login required", { status: 401, headers: cors });
      let claims;
      try { claims = await verifyIdToken(auth.slice(7), env.PROJECT_ID); }
      catch (e) { return new Response("Invalid login", { status: 401, headers: cors }); }
      const admins = env.ADMINS.split(",").map(s => s.trim().toLowerCase());
      if (!claims.email_verified || !admins.includes((claims.email || "").toLowerCase())) {
        return new Response("Admins only", { status: 403, headers: cors });
      }
      const key = decodeURIComponent(url.pathname.slice(5));
      if (!/_cad-(sheet|render).webp$/.test(key)) return new Response("Not found", { status: 404, headers: cors });
      const obj = await env.CAD.get(key);
      if (!obj) return new Response("Not found", { status: 404, headers: cors });
      return new Response(obj.body, {
        headers: { ...cors, "Content-Type": "image/webp", "Cache-Control": "private, max-age=3600" }
      });
    }

    return new Response("Not found", { status: 404, headers: cors });
  }
};
