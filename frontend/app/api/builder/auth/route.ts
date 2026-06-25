import { NextResponse } from "next/server";

// Builder login/logout. `/api/builder/auth?key=<BUILDER_SECRET>&redirect=/de`
// sets an httpOnly cookie used by the builder APIs, plus a non-httpOnly marker
// so the frontend can show the "Edit" button. `?logout=1` clears them.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect") || "/";
  const target = new URL(redirect, url.origin);

  if (url.searchParams.get("logout")) {
    const res = NextResponse.redirect(target);
    res.cookies.delete("builder");
    res.cookies.delete("builder_ui");
    return res;
  }

  const key = url.searchParams.get("key");
  if (!process.env.BUILDER_SECRET || key !== process.env.BUILDER_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const res = NextResponse.redirect(target);
  const maxAge = 60 * 60 * 8;
  res.cookies.set("builder", process.env.BUILDER_SECRET, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  res.cookies.set("builder_ui", "1", { sameSite: "lax", path: "/", maxAge });
  return res;
}
