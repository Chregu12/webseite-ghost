"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export interface SearchItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
}

export default function SearchClient({
  items,
  lang,
  placeholder,
  noResults,
}: {
  items: SearchItem[];
  lang: string;
  placeholder: string;
  noResults: string;
}) {
  const [query, setQuery] = useState("");

  // Pre-fill from ?q= (used by the schema.org SearchAction and shared links).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      `${item.title} ${item.excerpt} ${item.tags.join(" ")}`
        .toLowerCase()
        .includes(term),
    );
  }, [query, items]);

  return (
    <div style={{ marginTop: "2rem" }}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus
        className="newsletter-input"
        style={{ maxWidth: "100%", width: "100%" }}
      />

      {results.length === 0 ? (
        <p className="muted" style={{ marginTop: "1.5rem" }}>
          {noResults}
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, marginTop: "1.5rem" }}>
          {results.map((item) => (
            <li
              key={item.id}
              style={{ padding: "1rem 0", borderBottom: "1px solid var(--border)" }}
            >
              <Link href={`/${lang}/blog/${item.slug}`}>
                <strong>{item.title}</strong>
              </Link>
              {item.excerpt && (
                <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                  {item.excerpt}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
