import { NextResponse } from "next/server";
import { listDocsAdmin } from "@/lib/ghost/admin";
import { builderAuthed } from "@/lib/builder";

// List pages/posts for the builder dashboard. Protected by BUILDER_SECRET.
export async function GET(request: Request) {
  if (!builderAuthed(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const [pages, posts] = await Promise.all([
    listDocsAdmin("pages"),
    listDocsAdmin("posts"),
  ]);
  return NextResponse.json({ ok: true, pages, posts });
}
