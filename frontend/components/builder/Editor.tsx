"use client";

import { useEffect, useRef, useState } from "react";
import { Puck, type Data } from "@measured/puck";
import config from "@/puck/config";
import type { Resource } from "@/lib/ghost/admin";

type Rev = { index: number; at: string };
type Snippet = { name: string; content: unknown[] };

// Give freshly-inserted blocks new ids so they don't collide with existing ones.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function regenIds(items: any[]): any[] {
  const rid = () => Math.random().toString(36).slice(2, 10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (it: any): any => {
    const props = { ...(it.props || {}), id: rid() };
    for (const k of Object.keys(props)) {
      const v = props[k];
      if (Array.isArray(v) && v.length && v[0] && typeof v[0] === "object" && "type" in v[0]) {
        props[k] = v.map(walk);
      }
    }
    return { ...it, props };
  };
  return (items || []).map(walk);
}

export default function Editor({
  apiKey,
  type,
  slug,
  lang,
}: {
  apiKey: string;
  type: Resource;
  slug: string;
  lang: string;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [remount, setRemount] = useState(0);
  const [revs, setRevs] = useState<Rev[] | null>(null);
  const [snips, setSnips] = useState<Snippet[] | null>(null);
  const [snipName, setSnipName] = useState("");
  const liveRef = useRef<Data | null>(null);

  const keyQ = apiKey ? `key=${encodeURIComponent(apiKey)}&` : "";

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/builder/load?${keyQ}type=${type}&slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          setError(res.status === 401 ? "Nicht autorisiert (falscher key)." : "Laden fehlgeschlagen.");
          return;
        }
        const d = (await res.json()).data as Data;
        setData(d);
        liveRef.current = d;
      } catch {
        setError("Verbindung fehlgeschlagen.");
      }
    })();
  }, [apiKey, type, slug, keyQ]);

  if (!slug) {
    return <div style={{ padding: "2rem" }}>Fehlender Slug.</div>;
  }
  if (error) return <div style={{ padding: "2rem", color: "#ff7a7a" }}>{error}</div>;
  if (!data) return <div style={{ padding: "2rem" }}>Lädt …</div>;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }
  const base = () => liveRef.current ?? (data as Data);

  async function onPublish(payload: Data) {
    flash("Speichert …");
    try {
      const res = await fetch("/api/builder/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey, type, slug, lang, data: payload }),
      });
      flash(res.ok ? "Gespeichert ✓" : "Fehler beim Speichern");
    } catch {
      flash("Fehler beim Speichern");
    }
  }

  // ---- Revisions ----
  async function openRevisions() {
    setRevs([]);
    try {
      const res = await fetch(`/api/builder/revisions?${keyQ}type=${type}&slug=${encodeURIComponent(slug)}`);
      setRevs((await res.json()).revisions ?? []);
    } catch {
      setRevs([]);
    }
  }
  async function restore(index: number) {
    flash("Stellt wieder her …");
    try {
      const res = await fetch("/api/builder/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey, type, slug, index }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setData(json.data as Data);
        liveRef.current = json.data as Data;
        setRemount((r) => r + 1);
        setRevs(null);
        flash("Wiederhergestellt ✓");
      } else flash("Wiederherstellen fehlgeschlagen");
    } catch {
      flash("Wiederherstellen fehlgeschlagen");
    }
  }

  // ---- Snippets / templates ----
  async function openSnippets() {
    setSnips([]);
    try {
      const res = await fetch(`/api/builder/snippets?${keyQ}`);
      setSnips((await res.json()).snippets ?? []);
    } catch {
      setSnips([]);
    }
  }
  async function postSnippets(list: Snippet[]) {
    await fetch("/api/builder/snippets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: apiKey, snippets: list }),
    });
    setSnips(list);
  }
  async function saveSnippet() {
    const content = (base() as { content?: unknown[] }).content ?? [];
    const list = [...(snips ?? []), { name: snipName.trim() || "Vorlage", content }];
    setSnipName("");
    flash("Vorlage gespeichert ✓");
    await postSnippets(list);
  }
  function insertSnippet(s: Snippet) {
    const b = base() as Data & { content: unknown[] };
    const merged = { ...b, content: [...(b.content ?? []), ...regenIds(s.content as unknown[])] } as Data;
    setData(merged);
    liveRef.current = merged;
    setRemount((r) => r + 1);
    setSnips(null);
    flash("Vorlage eingefügt ✓");
  }
  async function deleteSnippet(i: number) {
    await postSnippets((snips ?? []).filter((_, j) => j !== i));
  }

  const btn: React.CSSProperties = {
    position: "fixed",
    top: "0.6rem",
    zIndex: 9999,
    background: "#141417",
    color: "#ededef",
    border: "1px solid rgba(255,255,255,.18)",
    borderRadius: 8,
    padding: ".4rem .8rem",
    fontFamily: "system-ui",
    fontSize: ".85rem",
    cursor: "pointer",
  };
  const panel: React.CSSProperties = {
    position: "fixed",
    top: "3rem",
    right: "1rem",
    zIndex: 9999,
    width: 300,
    maxHeight: "60vh",
    overflowY: "auto",
    background: "#141417",
    color: "#ededef",
    border: "1px solid rgba(255,255,255,.18)",
    borderRadius: 10,
    padding: ".75rem",
    fontFamily: "system-ui",
    fontSize: ".85rem",
  };

  return (
    <>
      <Puck
        key={remount}
        config={config}
        data={data}
        onChange={(d) => {
          liveRef.current = d;
        }}
        onPublish={onPublish}
      />

      <button type="button" style={{ ...btn, right: "1rem" }} onClick={openRevisions}>
        ◷ Versionen
      </button>
      <button type="button" style={{ ...btn, right: "8.5rem" }} onClick={openSnippets}>
        ▦ Vorlagen
      </button>

      {revs !== null && (
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem" }}>
            <strong>Versionen</strong>
            <button type="button" onClick={() => setRevs(null)} style={{ ...btn, position: "static" }}>✕</button>
          </div>
          {revs.length === 0 ? (
            <p style={{ opacity: 0.7 }}>Noch keine früheren Versionen.</p>
          ) : (
            revs.map((r) => (
              <div key={r.index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".35rem 0", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                <span>{new Date(r.at).toLocaleString(lang)}</span>
                <button type="button" onClick={() => restore(r.index)} style={{ ...btn, position: "static", padding: ".25rem .6rem" }}>Wiederherstellen</button>
              </div>
            ))
          )}
        </div>
      )}

      {snips !== null && (
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem" }}>
            <strong>Vorlagen</strong>
            <button type="button" onClick={() => setSnips(null)} style={{ ...btn, position: "static" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: ".4rem", marginBottom: ".75rem" }}>
            <input
              value={snipName}
              onChange={(e) => setSnipName(e.target.value)}
              placeholder="Name"
              style={{ flex: 1, minWidth: 0, padding: "4px 8px", borderRadius: 6, border: "1px solid #555", background: "#0a0a0b", color: "#ededef" }}
            />
            <button type="button" onClick={saveSnippet} style={{ ...btn, position: "static" }}>Aktuelles speichern</button>
          </div>
          {snips.length === 0 ? (
            <p style={{ opacity: 0.7 }}>Noch keine Vorlagen.</p>
          ) : (
            snips.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".4rem", padding: ".35rem 0", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                <span style={{ display: "flex", gap: ".3rem", flexShrink: 0 }}>
                  <button type="button" onClick={() => insertSnippet(s)} style={{ ...btn, position: "static", padding: ".25rem .6rem" }}>Einfügen</button>
                  <button type="button" onClick={() => deleteSnippet(i)} style={{ ...btn, position: "static", padding: ".25rem .5rem", color: "#ff7a7a" }}>✕</button>
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: "1rem", right: "1rem", zIndex: 9999, background: "#141417", color: "#ededef", border: "1px solid rgba(255,255,255,.14)", borderRadius: 8, padding: ".6rem 1rem", fontFamily: "system-ui", fontSize: ".9rem" }}>
          {toast}
        </div>
      )}
    </>
  );
}
