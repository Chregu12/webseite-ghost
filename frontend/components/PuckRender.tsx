"use client";

import { Render, type Data } from "@measured/puck";
import config from "@/puck/config";

// Renders a saved Puck (drag-and-drop) layout on the public site. Marked client
// so Puck's runtime works; Next still server-renders it to HTML for SEO.
export default function PuckRender({ data }: { data: Data }) {
  return <Render config={config} data={data} />;
}
