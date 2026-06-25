import type { Metadata } from "next";
import "../globals.css";
import "@measured/puck/puck.css";

// Standalone root layout for the drag-and-drop builder (no site header/footer).
export const metadata: Metadata = { robots: { index: false } };

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
