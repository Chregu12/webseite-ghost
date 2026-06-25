"use client";

import { useState } from "react";

export default function ContactForm({
  labels,
}: {
  labels: {
    name: string;
    email: string;
    message: string;
    send: string;
    success: string;
    error: string;
  };
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("loading");
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus("ok");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <p style={{ color: "var(--accent)", marginTop: "1.5rem" }}>{labels.success}</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="contact-form">
      <input
        name="name"
        required
        placeholder={labels.name}
        aria-label={labels.name}
        className="newsletter-input"
      />
      <input
        type="email"
        name="email"
        required
        placeholder={labels.email}
        aria-label={labels.email}
        className="newsletter-input"
      />
      <textarea
        name="message"
        required
        rows={5}
        placeholder={labels.message}
        aria-label={labels.message}
        className="newsletter-input"
        style={{ maxWidth: "100%", resize: "vertical" }}
      />
      {/* Honeypot — hidden from users, bots tend to fill it. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ display: "none" }}
      />
      <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
        {labels.send}
      </button>
      {status === "error" && (
        <p style={{ color: "#ff7a7a" }}>{labels.error}</p>
      )}
    </form>
  );
}
