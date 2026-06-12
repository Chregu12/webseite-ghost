import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getDocAdmin, saveDocAdmin, type Resource } from "@/lib/ghost/admin";
import {
  parseRevisions,
  extractPuckData,
  pushRevision,
  puckToHtml,
  builderAuthed,
} from "@/lib/builder";

// Restore a previous layout revision. Protected by BUILDER_SECRET.
export async function POST(request: Request) {
  let body: { key?: string; type?: Resource; slug?: string; index?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const { key, type = "pages", slug, index } = body;
  if (!builderAuthed(request, key)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!slug || typeof index !== "number") {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const doc = await getDocAdmin(type, slug);
  const revs = parseRevisions(doc?.codeinjection_head);
  const target = revs[index];
  if (!target) {
    return NextResponse.json({ ok: false, error: "no_such_revision" }, { status: 404 });
  }

  try {
    // Save the current layout as a revision, then restore the target.
    const head = pushRevision(extractPuckData(doc?.plaintext), doc?.codeinjection_head);
    await saveDocAdmin(type, slug, {
      html: puckToHtml(target.data),
      codeinjectionHead: head,
    });
    revalidateTag("ghost");
    return NextResponse.json({ ok: true, data: target.data });
  } catch (err) {
    console.error("[builder] restore failed:", err);
    return NextResponse.json({ ok: false, error: "restore_failed" }, { status: 502 });
  }
}
