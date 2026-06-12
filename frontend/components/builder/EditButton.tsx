"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Floating "Edit" button, shown only to a logged-in builder (builder_ui cookie).
// Deep-links into the builder for the current page/post.
const NON_BUILDABLE = new Set(["tags", "author", "search"]);

function target(pathname: string): { type: string; slug: string; lang: string } | null {
  const parts = pathname.split("/").filter(Boolean);
  const lang = parts[0] === "en" ? "en" : "de";
  const enSuffix = lang === "en" ? "-en" : "";

  // Home
  if (parts.length <= 1) return { type: "pages", slug: `home${enSuffix}`, lang };

  const seg = parts[1];
  if (seg === "blog") {
    return parts[2] ? { type: "posts", slug: parts[2], lang } : null; // list not buildable
  }
  if (NON_BUILDABLE.has(seg)) return null;
  // about/contact use a per-language slug; other pages share one slug.
  const slug = seg === "about" || seg === "contact" ? `${seg}${enSuffix}` : seg;
  return { type: "pages", slug, lang };
}

export default function EditButton() {
  const pathname = usePathname() ?? "/";
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(/(?:^|;\s*)builder_ui=1/.test(document.cookie));
  }, []);

  if (!enabled) return null;
  const t = target(pathname);
  if (!t) return null;

  return (
    <a
      href={`/builder?type=${t.type}&slug=${encodeURIComponent(t.slug)}&lang=${t.lang}`}
      className="builder-edit-fab"
    >
      ✎ Bearbeiten
    </a>
  );
}
