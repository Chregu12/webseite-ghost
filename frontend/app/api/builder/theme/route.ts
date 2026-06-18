import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getDocAdmin, saveDocAdmin } from "@/lib/ghost/admin";
import { builderAuthed } from "@/lib/builder";

// Set the site accent colour from the dashboard. Stored in the site-config page
// JSON (integration keys may edit pages, but NOT Ghost settings). The layout
// prefers this over the Ghost brand colour. Protected by BUILDER_SECRET.
export async function POST(request: Request) {
  let body: { key?: string; accent?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!builderAuthed(request, body.key)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const accent = body.accent ?? "";
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) {
    return NextResponse.json({ ok: false, error: "invalid_color" }, { status: 400 });
  }

  try {
    const doc = await getDocAdmin("pages", "site-config");
    let cfg: Record<string, unknown> = {};
    if (doc?.plaintext) {
      const t = doc.plaintext.trim();
      const s = t.indexOf("{");
      const e = t.lastIndexOf("}");
      if (s >= 0 && e > s) {
        try {
          cfg = JSON.parse(t.slice(s, e + 1));
        } catch {
          cfg = {};
        }
      }
    }
    cfg.accent = accent;
    const json = JSON.stringify(cfg, null, 2)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    await saveDocAdmin("pages", "site-config", {
      title: doc?.title ?? "Site Config",
      html: `<pre><code>${json}</code></pre>`,
    });
    revalidateTag("ghost");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[builder] theme failed:", err);
    return NextResponse.json({ ok: false, error: "theme_failed" }, { status: 502 });
  }
}
