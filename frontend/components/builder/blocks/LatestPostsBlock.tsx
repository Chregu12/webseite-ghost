"use client";

import { useEffect, useState } from "react";

type P = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  feature_image: string | null;
  date: string;
};

// Dynamic builder block: fetches the latest posts (optionally by tag) at runtime.
export default function LatestPostsBlock({
  title,
  lang = "de",
  tag = "",
  limit = 3,
}: {
  title?: string;
  lang?: string;
  tag?: string;
  limit?: number;
}) {
  const [posts, setPosts] = useState<P[] | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams({ lang, limit: String(limit) });
    if (tag) sp.set("tag", tag);
    fetch(`/api/posts?${sp.toString()}`)
      .then((r) => r.json())
      .then((j) => setPosts(j.posts ?? []))
      .catch(() => setPosts([]));
  }, [lang, tag, limit]);

  return (
    <section className="section">
      <div className="container">
        {title && <h2 className="section-title">{title}</h2>}
        <div className="grid grid-3" style={{ marginTop: "2rem" }}>
          {(posts ?? []).map((p) => (
            <a key={p.id} href={`/${lang}/blog/${p.slug}`} className="card post-card">
              {p.feature_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="post-card-img" src={p.feature_image} alt="" />
              )}
              <h3>{p.title}</h3>
              {p.excerpt && <p className="muted">{p.excerpt}</p>}
              {p.date && <div className="post-meta">{p.date}</div>}
            </a>
          ))}
        </div>
        {posts && posts.length === 0 && (
          <p className="muted" style={{ marginTop: "1rem" }}>
            Keine Beiträge.
          </p>
        )}
      </div>
    </section>
  );
}
