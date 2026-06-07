import { NextRequest, NextResponse } from "next/server";

const locales = ["de", "en"] as const;
const defaultLocale = "de";

function detectLocale(req: NextRequest): string {
  const accept = req.headers.get("accept-language")?.toLowerCase() ?? "";
  for (const locale of locales) {
    if (accept.startsWith(locale)) return locale;
  }
  return defaultLocale;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return NextResponse.next();

  const locale = detectLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, the API and anything with a file extension.
  matcher: ["/((?!_next|api|.*\\.).*)"],
};
