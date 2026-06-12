import { NextResponse } from "next/server";
import { getDocAdmin, type Resource } from "@/lib/ghost/admin";
import { extractPuckData, EMPTY_DATA } from "@/lib/builder";

// Load a page/post's Puck layout for the editor. Protected by BUILDER_SECRET.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const type = (url.searchParams.get("type") ?? "pages") as Resource;
  const slug = url.searchParams.get("slug") ?? "";

  if (!process.env.BUILDER_SECRET || key !== process.env.BUILDER_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!slug || (type !== "pages" && type !== "posts")) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const doc = await getDocAdmin(type, slug);
  const data = extractPuckData(doc?.plaintext) ?? EMPTY_DATA;
  return NextResponse.json({ ok: true, data, title: doc?.title ?? slug });
}
