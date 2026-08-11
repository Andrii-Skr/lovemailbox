import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input suppressHydrationWarning className={cn("min-h-12 w-full rounded-xl border border-[rgba(92,54,44,.14)] bg-white/65 px-4 text-[15px] text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)]/55 focus:border-[var(--rose)] focus:bg-white focus:ring-4 focus:ring-[var(--rose)]/8", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea suppressHydrationWarning className={cn("min-h-28 w-full resize-y rounded-xl border border-[rgba(92,54,44,.14)] bg-white/65 px-4 py-3 text-[15px] leading-6 text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)]/55 focus:border-[var(--rose)] focus:bg-white focus:ring-4 focus:ring-[var(--rose)]/8", className)} {...props} />;
}
