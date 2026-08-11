import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TurnstileWidget } from "@/components/builder/turnstile-widget";

const scriptState = vi.hoisted(() => ({ onReady: undefined as (() => void) | undefined }));

vi.mock("next/script", () => ({
  default: ({ onReady }: { onReady?: () => void }) => {
    scriptState.onReady = onReady;
    return null;
  },
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  scriptState.onReady = undefined;
  delete window.turnstile;
});

describe("TurnstileWidget", () => {
  it("renders again when Next Script reports an already-loaded script as ready", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    const renderWidget = vi.fn().mockReturnValueOnce("widget-1").mockReturnValueOnce("widget-2");
    const removeWidget = vi.fn();
    window.turnstile = { render: renderWidget, remove: removeWidget };

    const first = render(<TurnstileWidget errorMessage="Unavailable" onToken={() => undefined} />);
    act(() => scriptState.onReady?.());
    expect(renderWidget).toHaveBeenCalledTimes(1);
    expect(renderWidget).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ appearance: "interaction-only" }),
    );
    first.unmount();
    expect(removeWidget).toHaveBeenCalledWith("widget-1");

    render(<TurnstileWidget errorMessage="Unavailable" onToken={() => undefined} />);
    act(() => scriptState.onReady?.());
    expect(renderWidget).toHaveBeenCalledTimes(2);
  });

  it("resets an issued challenge after a failed verification", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    const resetWidget = vi.fn();
    window.turnstile = { render: vi.fn().mockReturnValue("widget-1"), remove: vi.fn(), reset: resetWidget };

    const view = render(<TurnstileWidget errorMessage="Unavailable" onToken={() => undefined} resetSignal={0} />);
    act(() => scriptState.onReady?.());
    view.rerender(<TurnstileWidget errorMessage="Unavailable" onToken={() => undefined} resetSignal={1} />);

    expect(resetWidget).toHaveBeenCalledWith("widget-1");
  });
});
