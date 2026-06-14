"use client";

import { useEffect, useState } from "react";

type A = { name: string; slug: string; bio: string; profile_image: string | null };

// Dynamic builder block: lists site authors with a link to their author page.
export default function AuthorsBlock({
  title,
  lang = "de",
}: {
  title?: string;
  lang?: string;
}) {
  const [authors, setAuthors] = useState<A[] | null>(null);

  useEffect(() => {
    fetch("/api/authors")
      .then((r) => r.json())
      .then((j) => setAuthors(j.authors ?? []))
      .catch(() => setAuthors([]));
  }, []);

  return (
    <section className="section">
      <div className="container">
        {title && <h2 className="section-title">{title}</h2>}
        <div className="grid grid-3" style={{ marginTop: "2rem" }}>
          {(authors ?? []).map((a) => (
            <a key={a.slug} href={`/${lang}/author/${a.slug}`} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {a.profile_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.profile_image}
                    alt=""
                    width={48}
                    height={48}
                    style={{ borderRadius: "999px", objectFit: "cover" }}
                  />
                )}
                <h3 style={{ fontSize: "1.05rem" }}>{a.name}</h3>
              </div>
              {a.bio && (
                <p className="muted" style={{ marginTop: "0.75rem" }}>
                  {a.bio}
                </p>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
