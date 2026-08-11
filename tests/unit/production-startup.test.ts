// @vitest-environment node

import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("production startup", () => {
  it("rejects example credentials instead of starting the server", () => {
    const result = spawnSync(process.execPath, ["scripts/start-production.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL: "postgresql://lovemailbox:change-me@db:5432/lovemailbox",
        NEXT_PUBLIC_SITE_URL: "https://love.example.com",
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
        TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
        IP_HASH_SECRET: "replace-with-at-least-32-random-characters",
      },
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("insecure production configuration");
    expect(result.stderr).toContain("Cloudflare's test key");
  });

  it("rejects a non-HTTPS public URL", () => {
    const result = spawnSync(process.execPath, ["scripts/start-production.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL: "postgresql://lovemailbox:secure-password@db:5432/lovemailbox",
        NEXT_PUBLIC_SITE_URL: "http://love.example.com",
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "production-site-key",
        TURNSTILE_SECRET_KEY: "production-secret-key",
        IP_HASH_SECRET: "0123456789abcdef0123456789abcdef",
      },
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("NEXT_PUBLIC_SITE_URL must use HTTPS");
  });
});
