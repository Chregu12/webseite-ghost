"use client";

import { useState } from "react";

// Custom Puck field: URL input + drag/click image upload to Ghost.
export default function ImageField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const key = new URLSearchParams(window.location.search).get("key") ?? "";
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/builder/upload?key=${encodeURIComponent(key)}`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (res.ok && json.url) onChange(json.url);
      else setError(json.error ?? "Upload fehlgeschlagen");
    } catch {
      setError("Upload fehlgeschlagen");
    }
    setBusy(false);
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Bild-URL oder hochladen"
        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", width: "100%" }}
      />
      <label
        style={{
          display: "inline-block",
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px dashed #999",
          cursor: "pointer",
          fontSize: ".85rem",
          textAlign: "center",
        }}
      >
        {busy ? "Lädt …" : "⬆ Bild hochladen"}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
      </label>
      {error && <span style={{ color: "#c00", fontSize: ".8rem" }}>{error}</span>}
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" style={{ maxWidth: "100%", borderRadius: 6 }} />
      )}
    </div>
  );
}
