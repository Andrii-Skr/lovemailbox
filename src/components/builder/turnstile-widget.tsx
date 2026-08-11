"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; theme: "light"; appearance: "interaction-only"; callback: (token: string) => void; "expired-callback": () => void }) => string;
      remove: (widgetId: string) => void;
      reset?: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget({ errorMessage, onToken, resetSignal = 0 }: { errorMessage: string; onToken: (token: string) => void; resetSignal?: number }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!ready || !siteKey || !container.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      theme: "light",
      appearance: "interaction-only",
      callback: onToken,
      "expired-callback": () => onToken(""),
    });
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [onToken, ready, siteKey]);

  useEffect(() => {
    if (resetSignal === 0 || !widgetId.current || !window.turnstile?.reset) return;
    onToken("");
    window.turnstile.reset(widgetId.current);
  }, [onToken, resetSignal]);

  if (!siteKey) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => { setLoadFailed(false); setReady(true); }}
        onError={() => { setReady(false); setLoadFailed(true); onToken(""); }}
      />
      <div ref={container} />
      {loadFailed ? <p role="alert" className="mt-2 text-sm text-[#a03647]">{errorMessage}</p> : null}
    </>
  );
}
