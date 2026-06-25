"use client";

import { useCallback, useEffect, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cfg = any;

const SECTION_LABELS: Record<string, string> = {
  logos: "Logo-Leiste",
  features: "Features",
  showcase: "Showcase",
  latestPosts: "Neueste Beiträge",
  testimonials: "Testimonials",
  newsletter: "Newsletter",
  comments: "Kommentare",
};

export default function SiteSettings() {
  const [lang, setLang] = useState<"de" | "en">("de");
  const [config, setConfig] = useState<Cfg>(null);
  const [social, setSocial] = useState<{ name: string; url: string }[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async (l: "de" | "en") => {
    setConfig(null);
    const r = await fetch(`/api/builder/siteconfig?lang=${l}`);
    if (!r.ok) {
      setMsg("Laden fehlgeschlagen");
      return;
    }
    const cfg = (await r.json()).config ?? {};
    setConfig(cfg);
    setSocial(
      Object.entries(cfg.footer?.social ?? {}).map(([name, url]) => ({ name, url: String(url) })),
    );
  }, []);

  useEffect(() => {
    load(lang);
  }, [lang, load]);

  const hero = config?.hero ?? {};
  const sections = config?.sections ?? {};

  const setHero = (f: string, v: string) =>
    setConfig((c: Cfg) => ({ ...c, hero: { ...(c.hero ?? {}), [f]: v } }));
  const setCta = (which: string, f: string, v: string) =>
    setConfig((c: Cfg) => ({
      ...c,
      hero: { ...(c.hero ?? {}), [which]: { ...((c.hero ?? {})[which] ?? {}), [f]: v } },
    }));
  const toggleSection = (k: string) =>
    setConfig((c: Cfg) => ({ ...c, sections: { ...(c.sections ?? {}), [k]: !(c.sections ?? {})[k] } }));

  async function save() {
    setMsg("Speichert …");
    const out = {
      ...config,
      footer: {
        ...(config.footer ?? {}),
        social: Object.fromEntries(social.filter((s) => s.name.trim()).map((s) => [s.name.trim(), s.url])),
      },
    };
    const r = await fetch("/api/builder/siteconfig", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang, config: out }),
    });
    setMsg(r.ok ? "Gespeichert ✓" : "Fehler beim Speichern");
  }

  const input = { width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-strong)", background: "var(--bg)", color: "var(--text)" } as React.CSSProperties;
  const labelStyle = { display: "block", fontSize: ".8rem", margin: ".75rem 0 .25rem" } as React.CSSProperties;

  return (
    <div className="card" style={{ padding: "1.25rem", marginTop: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Seiten-Infos</h2>
        <select value={lang} onChange={(e) => setLang(e.target.value as "de" | "en")} style={{ ...input, width: 120 }}>
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>
      </div>

      {!config ? (
        <p className="muted" style={{ marginTop: "1rem" }}>Lädt …</p>
      ) : (
        <>
          <h3 style={{ fontSize: ".95rem", marginTop: "1rem" }}>Hero</h3>
          <label style={labelStyle}>Eyebrow</label>
          <input style={input} value={hero.eyebrow ?? ""} onChange={(e) => setHero("eyebrow", e.target.value)} />
          <label style={labelStyle}>Überschrift</label>
          <input style={input} value={hero.headline ?? ""} onChange={(e) => setHero("headline", e.target.value)} />
          <label style={labelStyle}>Untertitel</label>
          <textarea style={{ ...input, minHeight: 60 }} value={hero.subtitle ?? ""} onChange={(e) => setHero("subtitle", e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
            <div>
              <label style={labelStyle}>CTA 1 — Text</label>
              <input style={input} value={hero.ctaPrimary?.label ?? ""} onChange={(e) => setCta("ctaPrimary", "label", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>CTA 1 — Link</label>
              <input style={input} value={hero.ctaPrimary?.url ?? ""} onChange={(e) => setCta("ctaPrimary", "url", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>CTA 2 — Text</label>
              <input style={input} value={hero.ctaSecondary?.label ?? ""} onChange={(e) => setCta("ctaSecondary", "label", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>CTA 2 — Link</label>
              <input style={input} value={hero.ctaSecondary?.url ?? ""} onChange={(e) => setCta("ctaSecondary", "url", e.target.value)} />
            </div>
          </div>

          <h3 style={{ fontSize: ".95rem", marginTop: "1.5rem" }}>Footer & Kontakt</h3>
          <label style={labelStyle}>Footer-Text</label>
          <input style={input} value={config.footer?.text ?? ""} onChange={(e) => setConfig((c: Cfg) => ({ ...c, footer: { ...(c.footer ?? {}), text: e.target.value } }))} />
          <label style={labelStyle}>Social-Links / Kontakt</label>
          {social.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: ".5rem", marginBottom: ".35rem" }}>
              <input style={{ ...input, flex: "0 0 30%" }} placeholder="Name (github)" value={s.name} onChange={(e) => setSocial((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input style={input} placeholder="https://…" value={s.url} onChange={(e) => setSocial((arr) => arr.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <button className="btn btn-ghost" style={{ padding: ".3rem .6rem", color: "#ff7a7a" }} onClick={() => setSocial((arr) => arr.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button className="btn btn-ghost" style={{ padding: ".3rem .7rem" }} onClick={() => setSocial((arr) => [...arr, { name: "", url: "" }])}>+ Link</button>

          <h3 style={{ fontSize: ".95rem", marginTop: "1.5rem" }}>Sektionen (Startseite)</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", marginTop: ".5rem" }}>
            {Object.keys(SECTION_LABELS).map((k) => (
              <label key={k} style={{ display: "flex", gap: ".35rem", alignItems: "center", fontSize: ".85rem" }}>
                <input type="checkbox" checked={Boolean(sections[k])} onChange={() => toggleSection(k)} />
                {SECTION_LABELS[k]}
              </label>
            ))}
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", gap: ".75rem", alignItems: "center" }}>
            <button className="btn btn-primary" onClick={save}>Speichern</button>
            {msg && <span className="muted" style={{ fontSize: ".85rem" }}>{msg}</span>}
          </div>
        </>
      )}
    </div>
  );
}
