import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a lockfile in a parent folder cannot confuse Turbopack.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
