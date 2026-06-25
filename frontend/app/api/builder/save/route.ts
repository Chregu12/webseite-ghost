import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getDocAdmin, saveDocAdmin, type Resource } from "@/lib/ghost/admin";
import { puckToHtml, builderAuthed, extractPuckData, pushRevision } from "@/lib/builder";

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
    // Keep the previous layout as a revision before overwriting.
    const current = await getDocAdmin(type, slug);
    const head = pushRevision(extractPuckData(current?.plaintext), current?.codeinjection_head);
    // Page-level SEO comes from the Puck root props.
    const root = ((data as { root?: { props?: Record<string, string> } })?.root?.props) ?? {};
    await saveDocAdmin(type, slug, {
      title: root.title || title,
      html: puckToHtml(data as never),
      lang,
      codeinjectionHead: head,
      metaTitle: root.metaTitle,
      metaDescription: root.metaDescription,
      ogImage: root.ogImage,
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
