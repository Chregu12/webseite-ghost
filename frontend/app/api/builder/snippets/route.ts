import { NextResponse } from "next/server";
import { getDocAdmin, saveDocAdmin } from "@/lib/ghost/admin";
import { builderAuthed, parseJsonArray, jsonCodeBlock } from "@/lib/builder";

// Reusable block templates (snippets), stored in a builder-snippets page.
// GET lists them; POST replaces the whole list. Protected by BUILDER_SECRET.
export async function GET(request: Request) {
  if (!builderAuthed(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const doc = await getDocAdmin("pages", "builder-snippets");
  return NextResponse.json({ ok: true, snippets: parseJsonArray(doc?.plaintext) });
}

export async function POST(request: Request) {
  let body: { key?: string; snippets?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!builderAuthed(request, body.key)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!Array.isArray(body.snippets)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  try {
    await saveDocAdmin("pages", "builder-snippets", {
      title: "Builder Snippets",
      html: jsonCodeBlock(body.snippets.slice(0, 100)),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[builder] snippets save failed:", err);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 502 });
  }
}
