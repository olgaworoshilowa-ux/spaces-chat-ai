import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL(".", import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: appRoot,
  async rewrites() {
    return [
      { source: "/listings-final", destination: "/listings-final/index.html" },
      { source: "/listings-final/", destination: "/listings-final/index.html" },
      { source: "/assets/:path*", destination: "/spaces-static/assets/:path*" },
    ];
  },
};

export default nextConfig;
