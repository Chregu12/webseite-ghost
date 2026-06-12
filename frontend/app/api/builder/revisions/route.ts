import { NextResponse } from "next/server";
import { getDocAdmin, type Resource } from "@/lib/ghost/admin";
import { parseRevisions, builderAuthed } from "@/lib/builder";

// List saved layout revisions (metadata only). Protected by BUILDER_SECRET.
export async function GET(request: Request) {
  if (!builderAuthed(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const u = new URL(request.url);
  const type = (u.searchParams.get("type") ?? "pages") as Resource;
  const slug = u.searchParams.get("slug") ?? "";
  if (!slug) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const doc = await getDocAdmin(type, slug);
  const revisions = parseRevisions(doc?.codeinjection_head).map((r, index) => ({
    index,
    at: r.at,
  }));
  return NextResponse.json({ ok: true, revisions });
}
