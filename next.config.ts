import path from "path";
import type { NextConfig } from "next";

const BASE_PATH = "/portfolio";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  cacheComponents: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
