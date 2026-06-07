import type { NextConfig } from "next";

const ghostImageDomain = process.env.GHOST_IMAGE_DOMAIN ?? "cms.example.com";

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
};

export default nextConfig;
