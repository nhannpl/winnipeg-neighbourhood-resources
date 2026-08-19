import type { NextConfig } from "next";

const basePath = "/winnipeg-neighbourhood-resources";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
