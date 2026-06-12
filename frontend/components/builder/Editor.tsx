"use client";

import { useEffect, useState } from "react";
import { Puck, type Data } from "@measured/puck";
import config from "@/puck/config";
import type { Resource } from "@/lib/ghost/admin";

type Rev = { index: number; at: string };

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
        setData((await res.json()).data as Data);
      } catch {
        setError("Verbindung fehlgeschlagen.");
      }
    })();
  }, [apiKey, type, slug, keyQ]);

  if (!slug) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
        Fehlender Slug. Aufruf: <code>/builder?type=pages&slug=&lt;slug&gt;&lang=de</code>
      </div>
    );
  }
  if (error) return <div style={{ padding: "2rem", color: "#ff7a7a" }}>{error}</div>;
  if (!data) return <div style={{ padding: "2rem" }}>Lädt …</div>;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

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

  async function openRevisions() {
    setRevs([]);
    try {
      const res = await fetch(`/api/builder/revisions?${keyQ}type=${type}&slug=${encodeURIComponent(slug)}`);
      const json = await res.json();
      setRevs(json.revisions ?? []);
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
        setRemount((r) => r + 1);
        setRevs(null);
        flash("Wiederhergestellt ✓");
      } else {
        flash("Wiederherstellen fehlgeschlagen");
      }
    } catch {
      flash("Wiederherstellen fehlgeschlagen");
    }
  }

  const btn: React.CSSProperties = {
    position: "fixed",
    top: "0.6rem",
    right: "1rem",
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

  return (
    <>
      <Puck key={remount} config={config} data={data} onPublish={onPublish} />

      <button type="button" style={btn} onClick={openRevisions}>
        ◷ Versionen
      </button>

      {revs !== null && (
        <div
          style={{
            position: "fixed",
            top: "3rem",
            right: "1rem",
            zIndex: 9999,
            width: 280,
            maxHeight: "60vh",
            overflowY: "auto",
            background: "#141417",
            color: "#ededef",
            border: "1px solid rgba(255,255,255,.18)",
            borderRadius: 10,
            padding: ".75rem",
            fontFamily: "system-ui",
            fontSize: ".85rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem" }}>
            <strong>Versionen</strong>
            <button type="button" onClick={() => setRevs(null)} style={{ ...btn, position: "static" }}>
              ✕
            </button>
          </div>
          {revs.length === 0 ? (
            <p style={{ opacity: 0.7 }}>Noch keine früheren Versionen.</p>
          ) : (
            revs.map((r) => (
              <div
                key={r.index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: ".35rem 0",
                  borderBottom: "1px solid rgba(255,255,255,.08)",
                }}
              >
                <span>{new Date(r.at).toLocaleString(lang)}</span>
                <button
                  type="button"
                  onClick={() => restore(r.index)}
                  style={{ ...btn, position: "static", padding: ".25rem .6rem" }}
                >
                  Wiederherstellen
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            zIndex: 9999,
            background: "#141417",
            color: "#ededef",
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: 8,
            padding: ".6rem 1rem",
            fontFamily: "system-ui",
            fontSize: ".9rem",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
