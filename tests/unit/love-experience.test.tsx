import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoveExperience } from "@/components/experience/love-experience";
import { getDemoProject } from "@/lib/demo-project";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LoveExperience", () => {
  it("delays the tap fallback when motion is available", () => {
    vi.useFakeTimers();
    vi.stubGlobal("DeviceMotionEvent", class DeviceMotionEvent {});
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Android");

    render(<LoveExperience project={{ ...getDemoProject("en"), id: "motion-project" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Take a look" }));

    const mailbox = screen.getByRole("button", { name: "Mailbox" });
    expect(mailbox).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Shake your phone");

    act(() => vi.advanceTimersByTime(7999));
    expect(mailbox).toBeDisabled();

    act(() => vi.advanceTimersByTime(1));
    expect(mailbox).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("Tap the mailbox");
  });

  it("keeps the tap fallback immediately available without motion support", () => {
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Desktop");

    render(<LoveExperience project={{ ...getDemoProject("en"), id: "no-motion-project" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Take a look" }));

    expect(screen.getByRole("button", { name: "Mailbox" })).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("Tap the mailbox");
  });
});
