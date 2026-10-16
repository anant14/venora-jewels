/* Venora Jewels — admin service (Cloudflare Worker). Every route needs a signed-in admin
   (Firebase ID token in the Authorization header).
   GET  /cad/<path>  -> CAD sheet from the private "venora-cad" bucket
   POST /upload[?folder=stock] -> stores an image (JPG/PNG/WebP, max 15 MB) or, for stock,
                        a video (MP4/MOV/WebM, max 95 MB) in the public "venora-media" bucket
                        under offers/ or stock/ and returns its public URL */

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
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Vary": "Origin" }
    : {};
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Max-Age": "86400" } });

    const isCad = request.method === "GET" && url.pathname.startsWith("/cad/");
    const isUpload = request.method === "POST" && url.pathname === "/upload";
    if (!isCad && !isUpload) return new Response("Not found", { status: 404, headers: cors });

    // admins only
    const auth = request.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) return new Response("Login required", { status: 401, headers: cors });
    let claims;
    try { claims = await verifyIdToken(auth.slice(7), env.PROJECT_ID); }
    catch (e) { return new Response("Invalid login", { status: 401, headers: cors }); }
    const admins = env.ADMINS.split(",").map(s => s.trim().toLowerCase());
    if (!claims.email_verified || !admins.includes((claims.email || "").toLowerCase())) {
      return new Response("Admins only", { status: 403, headers: cors });
    }

    if (isUpload) {
      const IMAGES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
      const VIDEOS = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };
      const folder = url.searchParams.get("folder") === "stock" ? "stock" : "offers";
      const type = (request.headers.get("Content-Type") || "").split(";")[0].trim();
      const ext = IMAGES[type] || (folder === "stock" && VIDEOS[type]);
      if (!ext) return Response.json({ error: folder === "stock" ? "Please upload a JPG/PNG/WebP photo or an MP4/MOV/WebM video." : "Please upload a JPG, PNG or WebP image." }, { status: 415, headers: cors });
      const max = VIDEOS[type] ? 95 * 1024 * 1024 : 15 * 1024 * 1024;
      const len = Number(request.headers.get("Content-Length") || 0);
      if (len > max) return Response.json({ error: `File is larger than ${max / 1048576} MB.` }, { status: 413, headers: cors });
      const day = new Date().toISOString().slice(0, 10);
      const key = `${folder}/${day}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      // stream straight into R2 (videos can be large)
      await env.MEDIA.put(key, request.body, { httpMetadata: { contentType: type, cacheControl: "public, max-age=31536000" } });
      return Response.json({ url: `${env.MEDIA_URL}/${key}` }, { headers: cors });
    }

    {
      const key = decodeURIComponent(url.pathname.slice(5));
      if (!/_cad-(sheet|render).webp$/.test(key)) return new Response("Not found", { status: 404, headers: cors });
      const obj = await env.CAD.get(key);
      if (!obj) return new Response("Not found", { status: 404, headers: cors });
      return new Response(obj.body, {
        headers: { ...cors, "Content-Type": "image/webp", "Cache-Control": "private, max-age=3600" }
      });
    }
  }
};
