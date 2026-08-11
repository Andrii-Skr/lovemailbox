"use client";

import { useEffect } from "react";

const LOCAL_SHOWCASE_ORIGINS = new Set(["http://127.0.0.1:3400", "http://localhost:3400"]);

function showcaseOrigin() {
  if (process.env.NEXT_PUBLIC_SHOWCASE_ORIGIN) {
    try {
      return new URL(process.env.NEXT_PUBLIC_SHOWCASE_ORIGIN).origin;
    } catch {
      return "https://justours.love";
    }
  }
  if (process.env.NODE_ENV !== "development") return "https://justours.love";
  try {
    const referrerOrigin = new URL(document.referrer).origin;
    if (LOCAL_SHOWCASE_ORIGINS.has(referrerOrigin)) return referrerOrigin;
  } catch {
    // Empty and malformed referrers use the canonical local showcase origin.
  }
  return "http://127.0.0.1:3400";
}

export function DemoReady() {
  useEffect(() => {
    const targetOrigin = showcaseOrigin();
    const announce = () => window.parent.postMessage(
      { type: "justours:demo-ready", version: 1, app: "love-mailbox" },
      targetOrigin,
    );
    announce();
    const retry = window.setTimeout(announce, 350);
    return () => window.clearTimeout(retry);
  }, []);
  return null;
}
