import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
