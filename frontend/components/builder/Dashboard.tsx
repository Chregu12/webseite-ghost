"use client";

import { useCallback, useEffect, useState } from "react";

type Doc = { slug: string; title: string; status: string };

export default function Dashboard({ lang }: { lang: string }) {
  const [pages, setPages] = useState<Doc[] | null>(null);
  const [posts, setPosts] = useState<Doc[] | null>(null);
  const [err, setErr] = useState("");
  const [newType, setNewType] = useState<"pages" | "posts">("pages");
  const [newSlug, setNewSlug] = useState("");

  const reload = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function open(type: string, slug: string) {
    window.location.href = `/builder?type=${type}&slug=${encodeURIComponent(slug)}&lang=${lang}`;
  }

  async function manage(type: "pages" | "posts", slug: string, action: string) {
    if (action === "delete" && !confirm(`„${slug}“ wirklich löschen?`)) return;
    await fetch("/api/builder/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, slug, action }),
    });
    reload();
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    const s = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    if (s) open(newType, s);
  }

  const btn = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: ".3rem .7rem",
    fontSize: ".82rem",
    ...extra,
  });

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
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: ".6rem" }}>
          {docs.map((d) => (
            <li
              key={d.slug}
              style={{ display: "flex", justifyContent: "space-between", gap: ".75rem", alignItems: "center" }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                {d.status !== "published" && (
                  <span
                    style={{
                      fontSize: ".7rem",
                      border: "1px solid var(--border-strong)",
                      borderRadius: 999,
                      padding: "0 .4rem",
                      marginRight: ".4rem",
                      opacity: 0.8,
                    }}
                  >
                    {d.status}
                  </span>
                )}
                {d.title} <span className="muted">/{d.slug}</span>
              </span>
              <span style={{ display: "flex", gap: ".35rem", flexShrink: 0 }}>
                <button className="btn btn-secondary" style={btn()} onClick={() => open(type, d.slug)}>
                  Bearbeiten
                </button>
                <button
                  className="btn btn-ghost"
                  style={btn()}
                  onClick={() => manage(type, d.slug, d.status === "published" ? "unpublish" : "publish")}
                >
                  {d.status === "published" ? "Verbergen" : "Veröffentlichen"}
                </button>
                <button
                  className="btn btn-ghost"
                  style={btn({ color: "#ff7a7a" })}
                  onClick={() => manage(type, d.slug, "delete")}
                >
                  Löschen
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 980 }}>
        <h1 className="section-title">Page-Builder</h1>
        <p className="muted" style={{ marginTop: ".5rem" }}>
          Seite/Beitrag auswählen oder neu anlegen.{" "}
          <button className="btn btn-ghost" style={btn()} onClick={() => open("pages", lang === "en" ? "home-en" : "home")}>
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
