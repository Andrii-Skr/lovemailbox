"use client";

import { useEffect, useRef } from "react";

export type ShakeOptions = {
  enabled: boolean;
  threshold?: number;
  peakWindowMs?: number;
  cooldownMs?: number;
  onShake: () => void;
  onSample?: () => void;
};

type Vector = { x: number; y: number; z: number };

export function createShakeProcessor({ threshold = 17, peakWindowMs = 450, cooldownMs = 1700, onShake }: Omit<ShakeOptions, "enabled" | "onSample">) {
  let lastIncludingGravity: Vector | null = null;
  let firstPeakAt = 0;
  let lastPeakAt = 0;
  let lastTriggerAt = -Infinity;

  return (event: Pick<DeviceMotionEvent, "acceleration" | "accelerationIncludingGravity">, now = Date.now()) => {
    const direct = event.acceleration;
    const gravity = event.accelerationIncludingGravity;
    let vector: Vector | null = null;

    if (direct && direct.x != null && direct.y != null && direct.z != null) {
      vector = { x: direct.x, y: direct.y, z: direct.z };
    } else if (gravity && gravity.x != null && gravity.y != null && gravity.z != null) {
      const current = { x: gravity.x, y: gravity.y, z: gravity.z };
      if (lastIncludingGravity) {
        vector = { x: current.x - lastIncludingGravity.x, y: current.y - lastIncludingGravity.y, z: current.z - lastIncludingGravity.z };
      }
      lastIncludingGravity = current;
    }
    if (!vector) return false;

    const magnitude = Math.hypot(vector.x, vector.y, vector.z);
    if (magnitude < threshold || now - lastPeakAt < 70) return false;
    lastPeakAt = now;

    if (!firstPeakAt || now - firstPeakAt > peakWindowMs) {
      firstPeakAt = now;
      return false;
    }
    firstPeakAt = 0;
    if (now - lastTriggerAt < cooldownMs) return false;
    lastTriggerAt = now;
    onShake();
    return true;
  };
}

export function useShakeDetection(options: ShakeOptions) {
  const callbackRef = useRef(options.onShake);
  const sampleRef = useRef(options.onSample);

  useEffect(() => {
    callbackRef.current = options.onShake;
    sampleRef.current = options.onSample;
  }, [options.onShake, options.onSample]);

  useEffect(() => {
    if (!options.enabled) return;
    const processor = createShakeProcessor({
      threshold: options.threshold,
      peakWindowMs: options.peakWindowMs,
      cooldownMs: options.cooldownMs,
      onShake: () => callbackRef.current(),
    });
    const listener = (event: DeviceMotionEvent) => {
      sampleRef.current?.();
      processor(event);
    };
    window.addEventListener("devicemotion", listener, { passive: true });
    return () => window.removeEventListener("devicemotion", listener);
  }, [options.enabled, options.threshold, options.peakWindowMs, options.cooldownMs]);
}
