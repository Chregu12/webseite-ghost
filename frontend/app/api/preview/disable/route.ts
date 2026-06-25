import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  (await draftMode()).disable();
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") ?? "de";
  return NextResponse.redirect(new URL(`/${lang}`, url.origin));
}
