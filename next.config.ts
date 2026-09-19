import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ||
  (isPages ? "/cv-by-jev" : "");

const nextConfig: NextConfig = {
  ...(isPages
    ? {
        output: "export" as const,
        trailingSlash: true,
      }
    : {}),
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  serverExternalPackages: ["unpdf", "jsdom", "@mozilla/readability"],
  // Cloud / browser previews hit 127.0.0.1 / Cursor hosts while Next may treat
  // localhost as origin. Without this, /_next/* and HMR are blocked and the
  // client never hydrates (static SSR form POSTs as native GET).
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.cursor.sh",
    "*.cursor.com",
    "*.cursorusercontent.com",
  ],
};

export default nextConfig;
