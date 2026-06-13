"use client";

import { useEffect, useState } from "react";

type Doc = { slug: string; title: string };

export default function Dashboard({ lang }: { lang: string }) {
  const [pages, setPages] = useState<Doc[] | null>(null);
  const [posts, setPosts] = useState<Doc[] | null>(null);
  const [err, setErr] = useState("");
  const [newType, setNewType] = useState<"pages" | "posts">("pages");
  const [newSlug, setNewSlug] = useState("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/builder/list");
      if (!r.ok) {
        setErr(
          r.status === 401
            ? "Nicht eingeloggt — zuerst /api/builder/auth?key=<BUILDER_SECRET> aufrufen."
            : "Laden fehlgeschlagen.",
        );
        return;
      }
      const j = await r.json();
      setPages((j.pages ?? []).filter((p: Doc) => !p.slug.startsWith("site-config")));
      setPosts(j.posts ?? []);
    })();
  }, []);

  function open(type: string, slug: string) {
    window.location.href = `/builder?type=${type}&slug=${encodeURIComponent(slug)}&lang=${lang}`;
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    const s = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    if (s) open(newType, s);
  }

  const list = (type: "pages" | "posts", docs: Doc[] | null) => (
    <div className="card" style={{ padding: "1.25rem" }}>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>
        {type === "pages" ? "Seiten" : "Beiträge"}
      </h2>
      {!docs ? (
        <p className="muted">Lädt …</p>
      ) : docs.length === 0 ? (
        <p className="muted">Keine.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: ".4rem" }}>
          {docs.map((d) => (
            <li key={d.slug} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {d.title} <span className="muted">/{d.slug}</span>
              </span>
              <button className="btn btn-secondary" style={{ padding: ".3rem .8rem" }} onClick={() => open(type, d.slug)}>
                Bearbeiten
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 920 }}>
        <h1 className="section-title">Page-Builder</h1>
        <p className="muted" style={{ marginTop: ".5rem" }}>
          Seite/Beitrag auswählen oder neu anlegen. Startseite:{" "}
          <button className="btn btn-ghost" style={{ padding: ".2rem .5rem" }} onClick={() => open("pages", lang === "en" ? "home-en" : "home")}>
            Startseite bearbeiten
          </button>
        </p>

        {err && <p style={{ color: "#ff7a7a", marginTop: "1rem" }}>{err}</p>}

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginTop: "2rem" }}>
          {list("pages", pages)}
          {list("posts", posts)}
        </div>

        <form onSubmit={create} className="card" style={{ padding: "1.25rem", marginTop: "1.25rem" }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>Neu anlegen</h2>
          <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as "pages" | "posts")}
              className="newsletter-input"
              style={{ maxWidth: 160 }}
            >
              <option value="pages">Seite</option>
              <option value="posts">Beitrag</option>
            </select>
            <input
              className="newsletter-input"
              style={{ maxWidth: 280 }}
              placeholder="slug (z. B. leistungen)"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Bauen →
            </button>
          </div>
          <p className="muted" style={{ marginTop: ".75rem", fontSize: ".85rem" }}>
            Wird beim ersten Speichern in Ghost angelegt.
          </p>
        </form>
      </div>
    </main>
  );
}
