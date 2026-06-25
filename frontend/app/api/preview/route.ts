import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

// Enable Next.js draft mode to preview an unpublished Ghost post, then redirect
// to it. Share/open:
//   /api/preview?secret=<PREVIEW_SECRET>&slug=<draft-slug>&lang=de
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const slug = url.searchParams.get("slug");
  const lang = url.searchParams.get("lang") ?? "de";

  if (!process.env.PREVIEW_SECRET || secret !== process.env.PREVIEW_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!slug) {
    return NextResponse.json({ ok: false, error: "missing slug" }, { status: 400 });
  }

  (await draftMode()).enable();
  return NextResponse.redirect(new URL(`/${lang}/blog/${slug}`, url.origin));
}
