import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareModal } from "@/components/builder/share-modal";
import { getDictionary } from "@/lib/i18n";

vi.mock("qrcode", () => ({ toCanvas: vi.fn().mockResolvedValue(undefined) }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ShareModal", () => {
  it("shows the QR code, public URL, and only the requested sharing actions", () => {
    const onClose = vi.fn();

    render(
      <ShareModal
        dictionary={getDictionary("ru")}
        expiresAt="2026-08-18T12:00:00.000Z"
        locale="ru"
        onClose={onClose}
        open
        url="https://example.com/love/letters-for-you"
      />,
    );

    expect(screen.getByRole("dialog")).toHaveTextContent("История сохранена");
    expect(screen.getByRole("img", { name: "QR-код со ссылкой на историю" })).toBeInTheDocument();
    expect(screen.getByTestId("qr-heart")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/love/letters-for-you")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Копировать ссылку" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть" })).toHaveAttribute("href", "https://example.com/love/letters-for-you");

    fireEvent.click(screen.getByRole("button", { name: "Закрыть" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("reports clipboard failures and selects the link for manual copying", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    render(
      <ShareModal
        dictionary={getDictionary("en")}
        expiresAt="2026-08-18T12:00:00.000Z"
        locale="en"
        onClose={() => undefined}
        open
        url="https://example.com/love/letters-for-you"
      />,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toHaveFocus());
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Automatic copy failed");
    expect(document.activeElement).toHaveTextContent("https://example.com/love/letters-for-you");
  });

  it("traps focus, closes on Escape, and restores the trigger", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return <><button type="button" onClick={() => setOpen(true)}>Show sharing</button><ShareModal dictionary={getDictionary("en")} expiresAt="2026-08-18T12:00:00.000Z" locale="en" onClose={() => setOpen(false)} open={open} url="https://example.com/love/story" /></>;
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Show sharing" });
    trigger.focus();
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toHaveFocus());
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("link", { name: "Open" })).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
