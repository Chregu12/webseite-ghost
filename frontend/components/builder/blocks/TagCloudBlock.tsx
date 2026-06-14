"use client";

import { useEffect, useState } from "react";

type T = { name: string; slug: string; count: number };

// Dynamic builder block: a cloud of public tags linking to their archive pages.
export default function TagCloudBlock({
  title,
  lang = "de",
}: {
  title?: string;
  lang?: string;
}) {
  const [tags, setTags] = useState<T[] | null>(null);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((j) => setTags(j.tags ?? []))
      .catch(() => setTags([]));
  }, []);

  return (
    <section className="section">
      <div className="container">
        {title && <h2 className="section-title">{title}</h2>}
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.6rem",
          }}
        >
          {(tags ?? []).map((t) => (
            <a
              key={t.slug}
              href={`/${lang}/tags/${t.slug}`}
              className="eyebrow"
              style={{ textTransform: "none" }}
            >
              {t.name}
              {t.count > 0 && <span className="muted"> · {t.count}</span>}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
