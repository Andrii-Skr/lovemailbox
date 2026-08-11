import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function defineNextConfig(phase: string): NextConfig {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER;
  const demoFrameAncestors = isDevelopment
    ? "frame-ancestors http://127.0.0.1:3400 http://localhost:3400"
    : "frame-ancestors https://justours.love";

  return {
    output: "standalone",
    poweredByHeader: false,
    allowedDevOrigins: [
      "127.0.0.1",
      "localhost",
      "strain-stuff-plaza-disc.trycloudflare.com",
    ],
    async headers() {
      return [
        {
          source: "/demo",
          headers: [
            { key: "Content-Security-Policy", value: demoFrameAncestors },
            { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "X-Content-Type-Options", value: "nosniff" },
          ],
        },
        ...["/", "/create", "/editor/:path*", "/love/:path*", "/api/:path*"].map((source) => ({
          source,
          headers: [
            { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          ],
        })),
      ];
    },
  };
}
