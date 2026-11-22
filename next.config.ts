import type { NextConfig } from "next";

// Stamped at build time so the hub can show "Last updated" in the side menu.
// If Steve asks for a change and this date doesn't move, the new version didn't go live.
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
