"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { Resource } from "@/lib/ghost/admin";

const Editor = dynamic(() => import("@/components/builder/Editor"), { ssr: false });

function BuilderInner() {
  const sp = useSearchParams();
  return (
    <Editor
      apiKey={sp.get("key") ?? ""}
      type={(sp.get("type") ?? "pages") as Resource}
      slug={sp.get("slug") ?? ""}
      lang={sp.get("lang") ?? "de"}
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
