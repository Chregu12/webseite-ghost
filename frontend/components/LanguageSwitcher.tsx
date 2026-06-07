"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const locales = ["de", "en"] as const;

export default function LanguageSwitcher({
  lang,
  label,
}: {
  lang: string;
  label: string;
}) {
  const pathname = usePathname() ?? `/${lang}`;
  const other = lang === "de" ? "en" : "de";
  // Swap the leading /<locale> segment, keeping the rest of the path.
  const segments = pathname.split("/");
  if (locales.includes(segments[1] as (typeof locales)[number])) {
    segments[1] = other;
  } else {
    segments.splice(1, 0, other);
  }
  const target = segments.join("/") || `/${other}`;

  return (
    <Link href={target} className="btn btn-ghost" style={{ padding: "0.4rem 0.7rem" }}>
      {label}
    </Link>
  );
}
