import type { Data } from "@measured/puck";

// The Puck layout for a page/post is stored as JSON inside a Ghost code block
// (the post/page content), readable via the Content API `plaintext` — the same
// proven mechanism as site-config. A marker distinguishes builder docs from
// ordinary Koenig-written content.
const MARKER = "__puck";

function isPuckPayload(obj: unknown): obj is { __puck: true; data: Data } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (obj as Record<string, unknown>)[MARKER] === true &&
    "data" in obj
  );
}

/** Parse Puck Data out of a page/post plaintext, or null if it isn't a builder doc. */
export function extractPuckData(plaintext: string | null | undefined): Data | null {
  if (!plaintext) return null;
  const t = plaintext.trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(t.slice(start, end + 1));
    return isPuckPayload(obj) ? obj.data : null;
  } catch {
    return null;
  }
}

/** Wrap Puck Data as an HTML code block for the Ghost Admin API (source=html). */
export function puckToHtml(data: Data): string {
  const json = JSON.stringify({ [MARKER]: true, data });
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<pre><code>${escaped}</code></pre>`;
}

export const EMPTY_DATA: Data = { content: [], root: {} } as Data;

/** Serialize a value as an HTML code block for Admin-API storage (source=html). */
export function jsonCodeBlock(value: unknown): string {
  const esc = JSON.stringify(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<pre><code>${esc}</code></pre>`;
}

export interface Redirect2 {
  from: string;
  to: string;
}

/** Parse a JSON array (e.g. redirects) out of a page plaintext. */
export function parseJsonArray<T = unknown>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  const t = raw.trim();
  const s = t.indexOf("[");
  const e = t.lastIndexOf("]");
  if (s === -1 || e <= s) return [];
  try {
    const a = JSON.parse(t.slice(s, e + 1));
    return Array.isArray(a) ? (a as T[]) : [];
  } catch {
    return [];
  }
}

/** Authorize a builder API request via ?key=, a body key, or the `builder` cookie. */
export function builderAuthed(request: Request, bodyKey?: string): boolean {
  const secret = process.env.BUILDER_SECRET;
  if (!secret) return false;
  const url = new URL(request.url);
  if (url.searchParams.get("key") === secret) return true;
  if (bodyKey && bodyKey === secret) return true;
  const cookie = request.headers.get("cookie") ?? "";
  const m = cookie.match(/(?:^|;\s*)builder=([^;]+)/);
  return !!m && decodeURIComponent(m[1]) === secret;
}

// ---- Version history --------------------------------------------------------
// Previous layouts are kept (newest first) in the page/post codeinjection_head
// (a free Admin-API field, never exposed via the Content API).
export interface Revision {
  at: string;
  data: Data;
}
export const MAX_REVISIONS = 10;

export function parseRevisions(raw: string | null | undefined): Revision[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as Revision[]) : [];
  } catch {
    return [];
  }
}

export function serializeRevisions(revs: Revision[]): string {
  return JSON.stringify(revs.slice(0, MAX_REVISIONS));
}

/** Push the current data onto the history (newest first, capped). */
export function pushRevision(
  current: Data | null,
  existingHead: string | null | undefined,
): string {
  const revs = parseRevisions(existingHead);
  const next = current ? [{ at: new Date().toISOString(), data: current }, ...revs] : revs;
  return serializeRevisions(next);
}
