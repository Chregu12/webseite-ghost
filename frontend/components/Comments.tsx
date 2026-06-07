"use client";

import { useEffect, useRef } from "react";

// Mounts Ghost's native comments UI (members-based). All values are passed from
// the server (no NEXT_PUBLIC needed); the content API key is browser-safe.
export default function Comments({
  ghostUrl,
  apiKey,
  postId,
  title,
  scriptUrl,
}: {
  ghostUrl: string;
  apiKey: string;
  postId: string;
  title: string;
  scriptUrl: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !ghostUrl || !apiKey || !postId) return;
    if (el.dataset.mounted) return; // guard against double-mount (StrictMode)
    el.dataset.mounted = "1";

    const script = document.createElement("script");
    script.defer = true;
    script.src = scriptUrl;
    const attrs: Record<string, string> = {
      "data-ghost-comments": ghostUrl,
      "data-api": `${ghostUrl}/ghost/api/content/`,
      "data-admin": `${ghostUrl}/ghost/`,
      "data-key": apiKey,
      "data-post-id": postId,
      "data-title": title,
      "data-count": "true",
      "data-color-scheme": "dark",
    };
    for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v);
    el.appendChild(script);
  }, [ghostUrl, apiKey, postId, title, scriptUrl]);

  return (
    <section className="section" aria-label="Comments">
      <div className="container">
        <div ref={ref} />
      </div>
    </section>
  );
}
