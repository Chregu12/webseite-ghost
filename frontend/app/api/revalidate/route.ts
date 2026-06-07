import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// Ghost webhook target. Configure a webhook in Ghost Admin (Integrations) for
// post.*, page.*, tag.* and settings.changed pointing at:
//   https://<site>/api/revalidate?secret=<REVALIDATE_SECRET>
//
// All content fetches are tagged "ghost" (plus finer-grained tags), so a single
// revalidateTag("ghost") refreshes everything; we also clear specific tags.

const SECRET = process.env.REVALIDATE_SECRET;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const provided =
    url.searchParams.get("secret") ?? request.headers.get("x-revalidate-secret");

  if (!SECRET || provided !== SECRET) {
    return NextResponse.json({ revalidated: false, error: "unauthorized" }, {
      status: 401,
    });
  }

  // Refresh all Ghost-derived content. Finer mapping can be added later by
  // inspecting the webhook payload's resource type.
  for (const tag of ["ghost", "posts", "pages", "tags", "settings"]) {
    revalidateTag(tag);
  }

  return NextResponse.json({ revalidated: true, now: Date.now() });
}

// Allow a simple health check.
export async function GET() {
  return NextResponse.json({ ok: true });
}
