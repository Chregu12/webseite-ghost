import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { deleteDocAdmin, setStatusAdmin, type Resource } from "@/lib/ghost/admin";
import { builderAuthed } from "@/lib/builder";

// Manage a page/post from the dashboard: delete or change publish status.
// Protected by BUILDER_SECRET.
export async function POST(request: Request) {
  let body: { key?: string; type?: Resource; slug?: string; action?: string };
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
    else return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });

    if (!ok) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    revalidateTag("ghost");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[builder] manage failed:", err);
    return NextResponse.json({ ok: false, error: "manage_failed" }, { status: 502 });
  }
}
