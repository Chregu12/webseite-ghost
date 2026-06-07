"use client";

import { useState } from "react";

export default function Newsletter({
  title,
  intro,
  buttonLabel,
  placeholder,
  successText,
  errorText,
}: {
  title: string;
  intro: string;
  buttonLabel: string;
  placeholder: string;
  successText: string;
  errorText: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="card newsletter-card">
          <h2 className="section-title">{title}</h2>
          {intro && (
            <p className="muted" style={{ marginTop: "0.5rem" }}>
              {intro}
            </p>
          )}
          {status === "ok" ? (
            <p style={{ marginTop: "1.5rem", color: "var(--accent)" }}>{successText}</p>
          ) : (
            <form className="newsletter-form" onSubmit={onSubmit}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="newsletter-input"
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === "loading"}
              >
                {buttonLabel}
              </button>
            </form>
          )}
          {status === "error" && (
            <p style={{ marginTop: "0.75rem", color: "#ff7a7a" }}>{errorText}</p>
          )}
        </div>
      </div>
    </section>
  );
}
