import path from "path";
import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/base-path";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  cacheComponents: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
