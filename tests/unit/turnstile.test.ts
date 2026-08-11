// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "@/server/turnstile";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("verifyTurnstile", () => {
  it("rejects the always-pass test secret in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(verifyTurnstile("dummy-token", "127.0.0.1")).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
