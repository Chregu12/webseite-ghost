import { NextResponse } from "next/server";

// Server-side proxy to Ghost's Members API so we can offer a custom signup form
// in our headless frontend. Ghost sends a magic-link confirmation email
// (requires mail to be configured in Ghost).

const GHOST_URL = (process.env.GHOST_URL ?? "http://localhost:2368").replace(/\/$/, "");

export async function POST(request: Request) {
  let email = "";
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  try {
    // Recent Ghost versions require an integrity token to deter spam.
    let integrityToken: string | undefined;
    try {
      const tokenRes = await fetch(`${GHOST_URL}/members/api/integrity-token/`, {
        cache: "no-store",
      });
      if (tokenRes.ok) integrityToken = (await tokenRes.text()) || undefined;
    } catch {
      // Older Ghost without integrity tokens — proceed without it.
    }

    const res = await fetch(`${GHOST_URL}/members/api/send-magic-link/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        emailType: "signup",
        autoRedirect: true,
        ...(integrityToken ? { integrityToken } : {}),
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[newsletter] Ghost members API error:", res.status, detail);
      return NextResponse.json({ ok: false, error: "ghost_error" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[newsletter] request failed:", err);
    return NextResponse.json({ ok: false, error: "unreachable" }, { status: 502 });
  }
}
