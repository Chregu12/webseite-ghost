import "server-only";
import crypto from "node:crypto";
import type { GhostPost } from "./types";

// Minimal Ghost Admin API client — used only for draft preview (the Admin API
// can read unpublished posts, the Content API cannot). Requires
// GHOST_ADMIN_API_KEY (<id>:<secret>).
const GHOST_URL = (process.env.GHOST_URL ?? "http://localhost:2368").replace(/\/$/, "");
const ADMIN_KEY = process.env.GHOST_ADMIN_API_KEY ?? "";
const API = `${GHOST_URL}/ghost/api/admin`;
const API_VERSION = process.env.GHOST_API_VERSION ?? "v6.0";

function token(): string | null {
  if (!ADMIN_KEY.includes(":")) return null;
  const [id, secret] = ADMIN_KEY.split(":");
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const data = `${b64({ alg: "HS256", typ: "JWT", kid: id })}.${b64({
    iat: now,
    exp: now + 300,
    aud: "/admin/",
  })}`;
  const sig = crypto
    .createHmac("sha256", Buffer.from(secret, "hex"))
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

/** Fetch a post by slug incl. drafts (for preview). Returns null if not found. */
export async function getPostBySlugAdmin(slug: string): Promise<GhostPost | null> {
  const t = token();
  if (!t) return null;
  try {
    const res = await fetch(
      `${API}/posts/slug/${encodeURIComponent(slug)}/?formats=html&include=tags,authors`,
      {
        headers: { Authorization: `Ghost ${t}`, "Accept-Version": API_VERSION },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.posts?.[0] ?? null;
  } catch (err) {
    console.error("[admin] preview fetch failed:", err);
    return null;
  }
}
