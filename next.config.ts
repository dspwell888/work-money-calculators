import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: no backend, no database, no API routes. Every
  // calculation runs in the browser. This disables route handlers and ISR,
  // neither of which this site needs.
  output: "export",
  // Emit /salary-increase-calculator/index.html so the canonical URLs in the
  // page map keep their trailing slash on any static host.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
