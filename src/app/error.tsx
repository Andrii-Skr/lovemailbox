"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-[100svh] place-items-center bg-[#f4eee2] px-6 text-center"><div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[var(--rose)]">Письмо потерялось по дороге</p><h1 className="font-display mt-4 text-6xl font-semibold">Попробуем ещё раз?</h1><Button className="mt-7" onClick={reset}>Вернуться к истории</Button></div></main>;
}
