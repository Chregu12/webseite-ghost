import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { saveDocAdmin, type Resource } from "@/lib/ghost/admin";
import { puckToHtml, builderAuthed } from "@/lib/builder";

// Persist a Puck layout to the page/post content via the Admin API, then
// revalidate. Protected by BUILDER_SECRET.
export async function POST(request: Request) {
  let body: { key?: string; type?: Resource; slug?: string; lang?: string; title?: string; data?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const { key, type = "pages", slug, lang, title, data } = body;
  if (!builderAuthed(request, key)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!slug || !data || (type !== "pages" && type !== "posts")) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  try {
    await saveDocAdmin(type, slug, {
      title,
      html: puckToHtml(data as never),
      lang,
    });
    revalidateTag("ghost");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[builder] save failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "save_failed" },
      { status: 502 },
    );
  }
}
