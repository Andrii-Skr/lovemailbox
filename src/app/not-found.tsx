import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="sunset-scene paper-grain grid min-h-[100svh] place-items-center px-6 text-center">
      <div className="relative z-10 max-w-xl">
        <Mail className="mx-auto size-10 text-[var(--wine)]" strokeWidth={1.4} />
        <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.28em] text-[#70483e]">Return to sender</p>
        <h1 className="font-display mt-4 text-6xl font-semibold leading-[.92]">Эта история уже завершилась</h1>
        <p className="mx-auto mt-6 max-w-sm text-sm leading-7 text-[#755d55]">Ссылка могла истечь или адрес был изменён. Но всегда можно наполнить новый ящик.</p>
        <Button asChild className="mt-8"><a href="/create">Создать свою историю</a></Button>
      </div>
    </main>
  );
}
