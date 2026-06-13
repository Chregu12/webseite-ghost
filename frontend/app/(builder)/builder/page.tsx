"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { Resource } from "@/lib/ghost/admin";

const Editor = dynamic(() => import("@/components/builder/Editor"), { ssr: false });
const Dashboard = dynamic(() => import("@/components/builder/Dashboard"), { ssr: false });

function BuilderInner() {
  const sp = useSearchParams();
  const slug = sp.get("slug") ?? "";
  const lang = sp.get("lang") ?? "de";

  // No slug -> dashboard (list + create); with slug -> the editor.
  if (!slug) return <Dashboard lang={lang} />;

  return (
    <Editor
      apiKey={sp.get("key") ?? ""}
      type={(sp.get("type") ?? "pages") as Resource}
      slug={slug}
      lang={lang}
    />
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Lädt …</div>}>
      <BuilderInner />
    </Suspense>
  );
}
