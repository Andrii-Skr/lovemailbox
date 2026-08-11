"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MailboxArt } from "@/components/experience/mailbox-art";
import { NamePair } from "@/components/experience/name-pair";
import { Button } from "@/components/ui/button";
import { useShakeDetection } from "@/hooks/use-shake-detection";
import { useDocumentLanguage } from "@/hooks/use-document-language";
import { useModalFocus } from "@/hooks/use-modal-focus";
import { getDictionary } from "@/lib/i18n";
import type { LoveLetterInput, MotionCapability, PublicLoveProject } from "@/lib/types";

type SceneState = "intro" | "ready" | "dropping" | "landed" | "reading" | "final-delay" | "complete";
type Props = { project: PublicLoveProject; preview?: boolean; demo?: boolean; simulationSignal?: number; resetSignal?: number };

type MotionEventWithPermission = typeof DeviceMotionEvent & { requestPermission?: () => Promise<"granted" | "denied"> };
const TAP_FALLBACK_DELAY_MS = 8000;

export function LoveExperience({ project, preview = false, demo = false, simulationSignal = 0, resetSignal = 0 }: Props) {
  const dictionary = getDictionary(project.locale);
  const readOnly = preview || demo;
  const letters = useMemo(() => project.letters.filter((letter) => letter.enabled).toSorted((a, b) => a.order - b.order), [project.letters]);
  const [scene, setScene] = useState<SceneState>(preview ? "ready" : "intro");
  const [motionCapability, setMotionCapability] = useState<MotionCapability>(preview ? "unsupported" : "unknown");
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [current, setCurrent] = useState<LoveLetterInput | null>(null);
  const [reading, setReading] = useState<LoveLetterInput | null>(null);
  const [tapFallbackAvailable, setTapFallbackAvailable] = useState(false);
  const timers = useRef<number[]>([]);
  const letterDialogRef = useRef<HTMLDivElement>(null);

  useDocumentLanguage(project.locale, !preview);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const nextLetter = letters.find((letter) => !openedIds.includes(letter.id));

  const releaseLetter = useCallback(() => {
    if (scene !== "ready" || !nextLetter) return;
    setTapFallbackAvailable(false);
    setCurrent(nextLetter);
    setScene("dropping");
    const timer = window.setTimeout(() => setScene("landed"), 1150);
    timers.current.push(timer);
  }, [nextLetter, scene]);

  useShakeDetection({ enabled: !readOnly && scene === "ready" && motionCapability === "granted", onShake: releaseLetter });

  useEffect(() => {
    if (readOnly || scene !== "ready" || motionCapability !== "granted" || tapFallbackAvailable) return;
    const timer = window.setTimeout(() => setTapFallbackAvailable(true), TAP_FALLBACK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [motionCapability, readOnly, scene, tapFallbackAvailable]);

  useEffect(() => {
    if (!preview || simulationSignal <= 0) return;
    const timer = window.setTimeout(releaseLetter, 0);
    return () => window.clearTimeout(timer);
  }, [preview, releaseLetter, simulationSignal]);

  useEffect(() => {
    if (!preview) return;
    const timer = window.setTimeout(() => {
      clearTimers();
      setOpenedIds([]);
      setCurrent(null);
      setReading(null);
      setScene("ready");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [clearTimers, preview, resetSignal]);

  async function enterScene() {
    if (demo) {
      setMotionCapability("unsupported");
      setScene("ready");
      return;
    }
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
    if (!mobile || !("DeviceMotionEvent" in window)) {
      setMotionCapability("unsupported");
      setScene("ready");
      return;
    }
    const motionEvent = DeviceMotionEvent as MotionEventWithPermission;
    if (typeof motionEvent.requestPermission === "function") {
      try {
        const permission = await motionEvent.requestPermission();
        setMotionCapability(permission === "granted" ? "granted" : "denied");
      } catch {
        setMotionCapability("denied");
      }
    } else {
      setMotionCapability("granted");
    }
    setScene("ready");
  }

  function openLetter(letter: LoveLetterInput) {
    if (scene !== "landed" && scene !== "ready") return;
    setTapFallbackAvailable(false);
    setReading(letter);
    setScene("reading");
  }

  function closeLetter() {
    if (!reading) return;
    const wasCurrent = current?.id === reading.id;
    const nextOpened = openedIds.includes(reading.id) ? openedIds : [...openedIds, reading.id];
    setOpenedIds(nextOpened);
    setReading(null);
    if (wasCurrent) setCurrent(null);

    if (nextOpened.length === letters.length) {
      setScene("final-delay");
      const timer = window.setTimeout(() => setScene("complete"), 1100);
      timers.current.push(timer);
    } else {
      setScene("ready");
    }
  }

  function restart() {
    clearTimers();
    setOpenedIds([]);
    setCurrent(null);
    setReading(null);
    setScene(preview ? "ready" : "intro");
  }

  useModalFocus(scene === "reading", letterDialogRef, closeLetter, { fallbackFocusSelector: "[data-mailbox-focus]" });

  const openedLetters = letters.filter((letter) => openedIds.includes(letter.id));
  const isFallback = readOnly || motionCapability === "denied" || motionCapability === "unsupported";
  const mailboxCanRelease = scene === "ready" && (isFallback || tapFallbackAvailable);
  const previewFinalFontSize = Math.max(20, Math.min(32, 37 - project.finalMessage.length * 0.05));

  if (scene === "intro") {
    return (
      <main lang={project.locale} className="sunset-scene paper-grain flex min-h-[100svh] items-center justify-center px-6 py-[max(32px,env(safe-area-inset-top))] text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }} className="relative z-10 mx-auto max-w-3xl">
          <motion.div className="intro-envelope mx-auto" initial={{ rotate: -9, scale: .85 }} animate={{ rotate: -4, scale: 1 }} transition={{ type: "spring", delay: .15 }} />
          <NamePair className="mt-9 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#74453e]" heartClassName="text-[var(--wine)]" senderName={project.senderName} recipientName={project.recipientName} />
          <h1 className="font-display mt-5 text-[clamp(2.35rem,6.5vw,4.7rem)] font-semibold leading-[.96] text-[#49322b]">{project.introText}</h1>
          <Button className="mt-8 min-w-40" onClick={enterScene}>{project.buttonText}</Button>
        </motion.div>
      </main>
    );
  }

  return (
    <main lang={project.locale} className={`sunset-scene paper-grain relative overflow-hidden ${preview ? "phone-preview h-full min-h-0 pt-3" : "min-h-[100svh] pt-[max(18px,env(safe-area-inset-top))]"}`}>
      <AnimatePresence mode="wait">
        {scene === "complete" ? (
          <motion.section key="complete" className="final-scene absolute inset-0 z-40 grid place-items-center px-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,246,199,.82),transparent_55%)]" />
            <div className="relative max-w-5xl">
              <motion.svg viewBox="0 0 24 22" className="final-heart mx-auto w-10 text-[var(--wine)]" fill="currentColor" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: .35 }}><path d="M12 21S1 14.8 1 7.2C1 3.7 3.5 1.3 6.8 1.3c2.2 0 4 1.1 5.2 3 1.2-1.9 3-3 5.2-3 3.3 0 5.8 2.4 5.8 5.9C23 14.8 12 21 12 21Z"/></motion.svg>
              <h1 className="final-message font-display mt-7 max-h-[62svh] overflow-y-auto whitespace-pre-line text-[clamp(2.65rem,5.8vw,5rem)] font-semibold leading-[.92] text-[#4c332c]" style={preview ? { fontSize: `${previewFinalFontSize}px` } : undefined}>{project.finalMessage}</h1>
              <Button variant="ghost" className="final-restart mt-8" onClick={restart}><RotateCcw className="size-4" />{dictionary.restart}</Button>
            </div>
          </motion.section>
        ) : (
          <motion.section key="mailbox" className={`relative mx-auto flex max-w-5xl flex-col items-center justify-end ${preview ? "h-full min-h-0" : "min-h-[calc(100svh-24px)]"}`} initial={preview ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="scene-hint animate-hint" role="status">
              {scene === "landed" ? dictionary.tapLetter : isFallback || tapFallbackAvailable ? dictionary.tapMailbox : project.shakeHint}
            </div>
            <MailboxArt
              senderName={project.senderName}
              recipientName={project.recipientName}
              remainingCount={Math.max(0, letters.length - openedIds.length - (current ? 1 : 0))}
              fallenLetters={openedLetters}
              fallingLetter={scene === "dropping" ? current ?? undefined : undefined}
              shaking={scene === "dropping"}
              empty={scene === "final-delay"}
              interactive={mailboxCanRelease}
              onMailboxClick={releaseLetter}
              onLetterClick={openLetter}
            />
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scene === "landed" && current ? (
          <motion.button
            type="button"
            className="absolute bottom-[6%] left-1/2 z-30 h-20 w-28 -translate-x-1/2 rounded bg-[#fff8e7] shadow-2xl"
            initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .85 }}
            onClick={() => openLetter(current)} aria-label={dictionary.tapLetter}
          ><span className="font-display text-lg italic text-[var(--wine)]">{project.recipientName}</span></motion.button>
        ) : null}
        {scene === "reading" && reading ? (
          <motion.div ref={letterDialogRef} tabIndex={-1} className="letter-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="letter-title" onClick={closeLetter}>
            <motion.article className="letter-paper" initial={{ y: 80, rotate: -2, scale: .88 }} animate={{ y: 0, rotate: 0, scale: 1 }} exit={{ y: 50, scale: .94 }} transition={{ type: "spring", damping: 22 }} onClick={(event) => event.stopPropagation()}>
              <button data-modal-initial-focus type="button" className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full text-[var(--muted)] hover:bg-black/5" onClick={closeLetter} aria-label={dictionary.close}><X className="size-5" /></button>
              <NamePair className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[var(--rose)]" heartClassName="text-[var(--wine)]" senderName={project.senderName} recipientName={project.recipientName} />
              <h2 id="letter-title" className="font-display mt-5 text-4xl font-semibold leading-tight">{reading.title || project.recipientName}</h2>
              <p className="font-display mt-6 whitespace-pre-line text-[clamp(1.35rem,4vw,1.8rem)] leading-[1.45] text-[#574039]">{reading.message}</p>
              <Button variant="outline" className="mt-9" onClick={closeLetter}>{dictionary.close}</Button>
            </motion.article>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
