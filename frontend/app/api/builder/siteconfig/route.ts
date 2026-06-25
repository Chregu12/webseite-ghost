import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getDocAdmin, saveDocAdmin } from "@/lib/ghost/admin";
import { builderAuthed, jsonCodeBlock } from "@/lib/builder";

// Read/write the global site-config (hero, footer/social, section toggles) as a
// friendly form instead of raw JSON. Protected by BUILDER_SECRET.
const slugFor = (lang: string) => (lang === "en" ? "site-config-en" : "site-config");

function parseConfig(plaintext: string | null | undefined): Record<string, unknown> {
  if (!plaintext) return {};
  const t = plaintext.trim();
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s < 0 || e <= s) return {};
  try {
    return JSON.parse(t.slice(s, e + 1));
  } catch {
    return {};
  }
}

export async function GET(request: Request) {
  if (!builderAuthed(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const lang = new URL(request.url).searchParams.get("lang") || "de";
  const doc = await getDocAdmin("pages", slugFor(lang));
  return NextResponse.json({ ok: true, config: parseConfig(doc?.plaintext) });
}

export async function POST(request: Request) {
  let body: { key?: string; lang?: string; config?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!builderAuthed(request, body.key)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!body.config || typeof body.config !== "object") {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const lang = body.lang || "de";
  try {
    const doc = await getDocAdmin("pages", slugFor(lang));
    await saveDocAdmin("pages", slugFor(lang), {
      title: doc?.title ?? (lang === "en" ? "Site Config EN" : "Site Config"),
      html: jsonCodeBlock(body.config),
    });
    revalidateTag("ghost");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[builder] siteconfig save failed:", err);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 502 });
  }
}
