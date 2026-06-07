"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle({ label }: { label: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost"
      aria-label={label}
      title={label}
      style={{ padding: "0.4rem 0.6rem" }}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
