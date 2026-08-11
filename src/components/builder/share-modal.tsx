"use client";

import { Check, Copy, ExternalLink, Heart, QrCode, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useModalFocus } from "@/hooks/use-modal-focus";
import type { Dictionary } from "@/lib/i18n";
import type { ProjectLocale } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Props = {
  dictionary: Dictionary;
  expiresAt: string;
  locale: ProjectLocale;
  onClose: () => void;
  open: boolean;
  url: string;
};

export function ShareModal({ dictionary, expiresAt, locale, onClose, open, url }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const urlRef = useRef<HTMLParagraphElement>(null);
  const copiedTimerRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const closeModal = useCallback(() => {
    setCopied(false);
    setCopyFailed(false);
    setQrFailed(false);
    onClose();
  }, [onClose]);

  useModalFocus(open, dialogRef, closeModal);

  useEffect(() => () => {
    if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
  }, []);

  useEffect(() => {
    if (!open || !url || !canvasRef.current) return;
    let cancelled = false;

    async function drawQrCode() {
      try {
        const { toCanvas } = await import("qrcode");
        if (cancelled || !canvasRef.current) return;
        await toCanvas(canvasRef.current, url, {
          width: 256,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#382823", light: "#fffdf7" },
        });
      } catch {
        if (!cancelled) setQrFailed(true);
      }
    }

    void drawQrCode();
    return () => { cancelled = true; };
  }, [open, url]);

  async function copyUrl() {
    setCopyFailed(false);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const selection = window.getSelection();
      if (selection && urlRef.current) {
        const range = document.createRange();
        range.selectNodeContents(urlRef.current);
        selection.removeAllRanges();
        selection.addRange(range);
        urlRef.current.focus();
      }
      setCopied(false);
      setCopyFailed(true);
    }
  }

  if (!open) return null;

  return (
    <div className="share-backdrop fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#382823]/68 p-4 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
      <section ref={dialogRef} tabIndex={-1} className="share-dialog relative my-auto w-full max-w-[560px] overflow-hidden rounded-[32px] bg-[#fffaf0] px-5 py-7 shadow-[0_32px_100px_rgba(41,27,23,.42)] sm:px-10 sm:py-9" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <Button data-modal-initial-focus type="button" variant="ghost" size="icon" className="absolute right-3 top-3" onClick={closeModal} aria-label={dictionary.closeShare}>
          <X className="size-5" />
        </Button>

        <div className="pr-10">
          <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-[var(--wine)] text-white">
            <QrCode className="size-5" />
          </div>
          <h2 id="share-title" className="font-display text-4xl font-semibold leading-none sm:text-5xl">{dictionary.shareTitle}</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">{dictionary.shareLead}</p>
        </div>

        <div className="mt-7 grid items-center gap-6 sm:grid-cols-[180px_minmax(0,1fr)]">
          <div className="relative mx-auto grid aspect-square w-[180px] place-items-center rounded-[22px] border border-[#735342]/12 bg-[#fffdf7] p-3 shadow-[0_14px_35px_rgba(73,49,40,.1)]">
            {qrFailed ? <p className="px-4 text-center text-xs text-[#a03647]">{dictionary.qrError}</p> : null}
            <canvas ref={canvasRef} className={qrFailed ? "hidden" : "block !h-auto !w-full max-w-full"} role="img" aria-label={dictionary.qrAlt} />
            {!qrFailed ? (
              <span data-testid="qr-heart" className="absolute left-1/2 top-1/2 z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#fffdf7] shadow-[0_0_0_3px_#fffdf7]" aria-hidden="true">
                <Heart className="size-4 fill-[var(--wine)] text-[var(--wine)]" strokeWidth={1.8} />
              </span>
            ) : null}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[var(--rose)]">{dictionary.storyLink}</p>
            <p ref={urlRef} tabIndex={-1} className="mt-2 break-all rounded-2xl border border-[#735342]/12 bg-white/60 px-4 py-3 text-sm leading-5 text-[var(--ink)]">{url}</p>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{dictionary.expires}: {formatDate(expiresAt, locale)}</p>
            {copyFailed ? <p role="status" className="mt-2 text-xs leading-5 text-[#a03647]">{dictionary.copyError}</p> : null}
          </div>
        </div>

        <div className="mt-7 grid gap-2 sm:grid-cols-2">
          <Button type="button" onClick={copyUrl}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? dictionary.copied : dictionary.copy}
          </Button>
          <Button asChild variant="outline">
            <a href={url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />{dictionary.open}</a>
          </Button>
        </div>
      </section>
    </div>
  );
}
