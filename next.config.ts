import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const productionShowcaseOrigin = "https://justours.love";
const localShowcaseOrigins = ["http://127.0.0.1:3400", "http://localhost:3400"];

function configuredShowcaseOrigin() {
  const value = process.env.NEXT_PUBLIC_SHOWCASE_ORIGIN ?? productionShowcaseOrigin;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_SHOWCASE_ORIGIN must be a valid absolute URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("NEXT_PUBLIC_SHOWCASE_ORIGIN must use HTTP or HTTPS");
  return url.origin;
}

export default function defineNextConfig(phase: string): NextConfig {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER;
  const frameAncestors = new Set(isDevelopment ? [...localShowcaseOrigins, configuredShowcaseOrigin()] : [configuredShowcaseOrigin()]);
  const demoFrameAncestors = `frame-ancestors ${Array.from(frameAncestors).join(" ")}`;

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
