// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // keep typechecking on; only disable if you must
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
