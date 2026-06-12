"use client";

import { useEffect, useState } from "react";
import { Puck, type Data } from "@measured/puck";
import config from "@/puck/config";
import type { Resource } from "@/lib/ghost/admin";

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

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(
          `/api/builder/load?key=${encodeURIComponent(apiKey)}&type=${type}&slug=${encodeURIComponent(slug)}`,
        );
        if (!res.ok) {
          setError(res.status === 401 ? "Nicht autorisiert (falscher key)." : "Laden fehlgeschlagen.");
          return;
        }
        const json = await res.json();
        setData(json.data as Data);
      } catch {
        setError("Verbindung fehlgeschlagen.");
      }
    })();
  }, [apiKey, type, slug]);

  if (!slug) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
        Fehlender Slug. Aufruf: <code>/builder?key=&lt;BUILDER_SECRET&gt;&type=pages&slug=&lt;slug&gt;&lang=de</code>
      </div>
    );
  }
  if (error) return <div style={{ padding: "2rem", color: "#ff7a7a" }}>{error}</div>;
  if (!data) return <div style={{ padding: "2rem" }}>Lädt …</div>;

  async function onPublish(payload: Data) {
    setToast("Speichert …");
    try {
      const res = await fetch("/api/builder/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey, type, slug, lang, data: payload }),
      });
      setToast(res.ok ? "Gespeichert ✓" : "Fehler beim Speichern");
    } catch {
      setToast("Fehler beim Speichern");
    }
    setTimeout(() => setToast(""), 4000);
  }

  return (
    <>
      <Puck config={config} data={data} onPublish={onPublish} />
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
