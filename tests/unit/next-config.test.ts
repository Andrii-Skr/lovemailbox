import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import { afterEach, describe, expect, it, vi } from "vitest";
import defineNextConfig from "../../next.config";

afterEach(() => vi.unstubAllEnvs());

async function demoCsp(phase: string) {
  const config = defineNextConfig(phase);
  if (typeof config.headers !== "function") throw new Error("Headers are not configured");
  const rules = await config.headers();
  return rules.find((rule) => rule.source === "/demo")?.headers.find((header) => header.key === "Content-Security-Policy")?.value;
}

describe("demo CSP", () => {
  it("allows the configured production showcase origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_SHOWCASE_ORIGIN", "https://showcase.example/path");
    expect(await demoCsp(PHASE_PRODUCTION_BUILD)).toBe("frame-ancestors https://showcase.example");
  });

  it("keeps local showcase origins available in development", async () => {
    vi.stubEnv("NEXT_PUBLIC_SHOWCASE_ORIGIN", "https://showcase.example");
    const csp = await demoCsp(PHASE_DEVELOPMENT_SERVER);
    expect(csp).toContain("http://127.0.0.1:3400");
    expect(csp).toContain("https://showcase.example");
  });
});
