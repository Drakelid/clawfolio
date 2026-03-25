import path from "path";
import type { NextConfig } from "next";

const PUBLIC_PATH_PREFIX = "/portfolio";

const nextConfig: NextConfig = {
  assetPrefix: process.env.NODE_ENV === "production" ? PUBLIC_PATH_PREFIX : undefined,
  cacheComponents: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
