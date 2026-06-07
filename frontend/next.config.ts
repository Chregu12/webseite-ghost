import type { NextConfig } from "next";
import { readFileSync } from "node:fs";

const ghostImageDomain = process.env.GHOST_IMAGE_DOMAIN ?? "cms.example.com";

// Managed 301/302 redirects (e.g. for changed slugs, legacy WP paths like /feed).
// Edit redirects.json — { source, destination, permanent }.
type Redirect = { source: string; destination: string; permanent: boolean };
let redirectList: Redirect[] = [];
try {
  redirectList = JSON.parse(
    readFileSync(new URL("./redirects.json", import.meta.url), "utf8"),
  );
} catch {
  // no redirects file / invalid JSON — proceed with none
}

const nextConfig: NextConfig = {
  // Self-contained server build for the Docker image.
  output: "standalone",
  images: {
    remotePatterns: [
      // Ghost-served images in production (cms domain)
      { protocol: "https", hostname: ghostImageDomain },
      // Local development Ghost
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "ghost" },
    ],
  },
  async redirects() {
    return redirectList;
  },
};

export default nextConfig;
