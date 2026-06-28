import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/blog/*/pdf": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
      "./fonts/**/*",
    ],
  },
};

export default nextConfig;
