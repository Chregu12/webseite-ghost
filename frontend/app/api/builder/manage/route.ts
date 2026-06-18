import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  deleteDocAdmin,
  setStatusAdmin,
  getDocAdmin,
  saveDocAdmin,
  renameDocAdmin,
  type Resource,
} from "@/lib/ghost/admin";
import {
  builderAuthed,
  extractPuckData,
  puckToHtml,
  parseJsonArray,
  jsonCodeBlock,
  type Redirect2,
} from "@/lib/builder";

// Manage a page/post from the dashboard: delete, change status, or duplicate.
// Protected by BUILDER_SECRET.
export async function POST(request: Request) {
  let body: {
    key?: string;
    type?: Resource;
    slug?: string;
    action?: string;
    toSlug?: string;
    lang?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const { key, type = "pages", slug, action } = body;
  if (!builderAuthed(request, key)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!slug || !action) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  try {
    let ok = false;
    if (action === "delete") ok = await deleteDocAdmin(type, slug);
    else if (action === "publish") ok = await setStatusAdmin(type, slug, "published");
    else if (action === "unpublish") ok = await setStatusAdmin(type, slug, "draft");
    else if (action === "duplicate") {
      const toSlug = (body.toSlug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
      if (!toSlug) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
      const src = await getDocAdmin(type, slug);
      const data = extractPuckData(src?.plaintext);
      if (!data) return NextResponse.json({ ok: false, error: "not_a_builder_doc" }, { status: 400 });
      await saveDocAdmin(type, toSlug, {
        title: `${src?.title ?? slug} (Kopie)`,
        html: puckToHtml(data),
        lang: body.lang,
      });
      ok = true;
    } else if (action === "rename") {
      const toSlug = (body.toSlug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
      if (!toSlug || toSlug === slug)
        return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
      ok = await renameDocAdmin(type, slug, toSlug);
      if (ok && type === "pages") {
        // Record a redirect from the old slug to the new one.
        const rdoc = await getDocAdmin("pages", "builder-redirects");
        const arr = parseJsonArray<Redirect2>(rdoc?.plaintext).filter((r) => r.from !== slug);
        arr.unshift({ from: slug, to: toSlug });
        await saveDocAdmin("pages", "builder-redirects", {
          title: "Builder Redirects",
          html: jsonCodeBlock(arr.slice(0, 300)),
        });
      }
    } else return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });

    if (!ok) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    revalidateTag("ghost");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[builder] manage failed:", err);
    return NextResponse.json({ ok: false, error: "manage_failed" }, { status: 502 });
  }
}
