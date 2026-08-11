"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { NamePair } from "@/components/experience/name-pair";
import type { LoveLetterInput } from "@/lib/types";

type Props = {
  senderName: string;
  recipientName: string;
  remainingCount: number;
  fallenLetters: LoveLetterInput[];
  fallingLetter?: LoveLetterInput;
  shaking: boolean;
  empty: boolean;
  interactive: boolean;
  onMailboxClick: () => void;
  onLetterClick: (letter: LoveLetterInput) => void;
};

function seedFromId(id: string) {
  return Array.from(id).reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7);
}

export function letterTrajectory(id: string) {
  const seed = seedFromId(id);
  return {
    x: ((seed % 101) - 50) * 1.25,
    rotation: ((seed >> 3) % 31) - 15,
    duration: 0.95 + ((seed >> 7) % 24) / 100,
  };
}

export function MailboxArt(props: Props) {
  const visibleStack = Math.min(props.remainingCount, 7);
  return (
    <div className="mailbox-stage" aria-label={`${props.senderName} ♥ ${props.recipientName}`}>
      <div className="house-silhouette" aria-hidden="true" />
      <div className="mailbox-wrap">
        <motion.div
          className="mailbox-motion"
          animate={props.shaking ? { x: [0, -10, 10, -6, 0], rotate: [0, -2, 2, -1, 0] } : { x: 0, rotate: [0, 0.35, 0] }}
          transition={props.shaking ? { duration: 0.55 } : { duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            className="mailbox-asset"
            src="/mailbox-roadside-v2.png"
            width={1254}
            height={1254}
            sizes="(max-width: 640px) 112vw, 580px"
            loading="eager"
            alt=""
            aria-hidden="true"
          />
          {visibleStack > 0 ? (
            <div className="mailbox-letter-stack" aria-hidden="true">
              {Array.from({ length: visibleStack }, (_, index) => (
                <span
                  className="mailbox-stack-envelope"
                  key={index}
                  style={{
                    left: `${2 + ((visibleStack - index - 1) % 3) * 5}%`,
                    top: `${28 + (visibleStack - index - 1) * 6}%`,
                    transform: `rotate(${-2 - (visibleStack - index - 1) * 3}deg)`,
                  }}
                />
              ))}
            </div>
          ) : null}
          <NamePair className="mailbox-label" layout="stacked" senderName={props.senderName} recipientName={props.recipientName} />
          <button data-mailbox-focus className="mailbox-button" type="button" onClick={props.onMailboxClick} disabled={!props.interactive} aria-label="Mailbox" />
        </motion.div>
      </div>

      {props.fallenLetters.map((letter, index) => {
        const path = letterTrajectory(letter.id);
        return (
          <button
            key={letter.id}
            type="button"
            className="fallen-envelope"
            style={{ left: `calc(50% + ${path.x - 56}px)`, bottom: `${1 + (index % 3) * 3}%`, transform: `rotate(${path.rotation}deg) scale(${index > 6 ? .9 : 1})` }}
            onClick={() => props.onLetterClick(letter)}
            aria-label={letter.title || "Open letter"}
          />
        );
      })}

      {props.fallingLetter ? (() => {
        const path = letterTrajectory(props.fallingLetter.id);
        return (
          <motion.button
            type="button"
            className="fallen-envelope"
            style={{ left: "calc(50% + 110px)", bottom: "53%" }}
            initial={{ x: 0, y: 0, rotate: -4, scale: .72, opacity: .7 }}
            animate={{ x: path.x - 110, y: [0, -90, 260], rotate: path.rotation + 180, scale: 1, opacity: 1 }}
            transition={{ duration: path.duration, times: [0, .28, 1], ease: [0.24, 0.72, 0.32, 1] }}
            aria-hidden="true"
            tabIndex={-1}
          />
        );
      })() : null}
    </div>
  );
}
