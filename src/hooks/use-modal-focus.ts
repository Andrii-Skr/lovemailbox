"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function isTopmostModal(container: HTMLElement) {
  const dialogs = document.querySelectorAll<HTMLElement>("[role='dialog'][aria-modal='true']");
  return dialogs.item(dialogs.length - 1) === container;
}

export function useModalFocus(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  { fallbackFocusSelector, lockScroll = true }: { fallbackFocusSelector?: string; lockScroll?: boolean } = {},
) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const fallbackFocus = fallbackFocusSelector ? container.closest("main")?.querySelector<HTMLElement>(fallbackFocusSelector) : null;
    const previousOverflow = document.body.style.overflow;
    const focusInitial = window.requestAnimationFrame(() => {
      const target = container.querySelector<HTMLElement>("[data-modal-initial-focus]") ?? container;
      target.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopmostModal(container)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    if (lockScroll) document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusInitial);
      window.removeEventListener("keydown", handleKeyDown);
      if (lockScroll) document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
      else if (fallbackFocus) window.requestAnimationFrame(() => { if (fallbackFocus.isConnected) fallbackFocus.focus(); });
    };
  }, [containerRef, fallbackFocusSelector, lockScroll, open]);
}
