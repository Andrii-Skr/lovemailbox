// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { DemoReady } from "@/components/experience/demo-ready";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

test("posts the versioned readiness contract", () => {
  vi.stubEnv("NEXT_PUBLIC_SHOWCASE_ORIGIN", "https://justours.love");
  const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => undefined);
  render(<DemoReady />);
  expect(postMessage).toHaveBeenCalledWith(
    { type: "justours:demo-ready", version: 1, app: "love-mailbox" },
    "https://justours.love",
  );
});
