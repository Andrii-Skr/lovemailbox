import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoveExperience } from "@/components/experience/love-experience";
import { getDemoProject } from "@/lib/demo-project";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LoveExperience", () => {
  it("keeps the mailbox clickable when motion is reported as available", async () => {
    vi.stubGlobal("DeviceMotionEvent", class DeviceMotionEvent {});
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Android");

    render(<LoveExperience project={{ ...getDemoProject("en"), id: "motion-project" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Take a look" }));

    expect(await screen.findByRole("button", { name: "Mailbox" })).toBeEnabled();
  });
});
