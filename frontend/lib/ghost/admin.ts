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

export function adminConfigured(): boolean {
  return ADMIN_KEY.includes(":");
}

async function adminFetch(path: string, init: RequestInit = {}) {
  const t = token();
  if (!t) throw new Error("GHOST_ADMIN_API_KEY not configured");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Ghost ${t}`,
      "Content-Type": "application/json",
      "Accept-Version": API_VERSION,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.message ?? `HTTP ${res.status}`);
  }
  return json;
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

/** Upload an image to Ghost; returns its public URL. */
export async function uploadImageAdmin(file: Blob, filename: string): Promise<string> {
  const t = token();
  if (!t) throw new Error("GHOST_ADMIN_API_KEY not configured");
  const form = new FormData();
  form.append("file", file, filename);
  form.append("purpose", "image");
  const res = await fetch(`${API}/images/upload/`, {
    method: "POST",
    headers: { Authorization: `Ghost ${t}`, "Accept-Version": API_VERSION },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.errors?.[0]?.message ?? `HTTP ${res.status}`);
  const url = json.images?.[0]?.url;
  if (!url) throw new Error("no image url returned");
  return url;
}

export type Resource = "pages" | "posts";

export interface AdminDoc {
  id: string;
  title: string;
  updated_at: string;
  plaintext: string | null;
  codeinjection_head: string | null;
}

/** Read a page/post (incl. drafts) for the builder. */
export async function getDocAdmin(
  resource: Resource,
  slug: string,
): Promise<AdminDoc | null> {
  try {
    const json = await adminFetch(
      `/${resource}/slug/${encodeURIComponent(slug)}/?formats=plaintext`,
    );
    const doc = json[resource]?.[0];
    if (!doc) return null;
    return {
      id: doc.id,
      title: doc.title,
      updated_at: doc.updated_at,
      plaintext: doc.plaintext ?? null,
      codeinjection_head: doc.codeinjection_head ?? null,
    };
  } catch {
    return null;
  }
}

/** Create or update a page/post's content (builder save). Upsert by slug. */
export async function saveDocAdmin(
  resource: Resource,
  slug: string,
  fields: { title?: string; html: string; lang?: string; codeinjectionHead?: string },
): Promise<void> {
  const existing = await getDocAdmin(resource, slug);
  const tags = fields.lang ? [{ name: `#${fields.lang}` }] : undefined;
  const codeFields =
    fields.codeinjectionHead !== undefined
      ? { codeinjection_head: fields.codeinjectionHead }
      : {};
  if (existing) {
    await adminFetch(`/${resource}/${existing.id}/?source=html`, {
      method: "PUT",
      body: JSON.stringify({
        [resource]: [
          {
            html: fields.html,
            updated_at: existing.updated_at,
            ...(fields.title ? { title: fields.title } : {}),
            ...codeFields,
          },
        ],
      }),
    });
  } else {
    await adminFetch(`/${resource}/?source=html`, {
      method: "POST",
      body: JSON.stringify({
        [resource]: [
          {
            slug,
            title: fields.title ?? slug,
            html: fields.html,
            status: "published",
            ...(tags ? { tags } : {}),
            ...codeFields,
          },
        ],
      }),
    });
  }
}
