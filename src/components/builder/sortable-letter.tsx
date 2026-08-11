"use client";

/* eslint-disable react-hooks/refs -- dnd-kit intentionally exposes callback refs and listener refs for DOM binding. */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import type { Dictionary } from "@/lib/i18n";
import type { ProjectFormValues } from "@/lib/project-schema";

type Props = {
  fieldId: string;
  index: number;
  register: UseFormRegister<ProjectFormValues>;
  errors: FieldErrors<ProjectFormValues>;
  dictionary: Dictionary;
  onRemove: () => void;
  canRemove: boolean;
};

export function SortableLetter({ fieldId, index, register, errors, dictionary, onRemove, canRemove }: Props) {
  const sortable = useSortable({ id: fieldId });
  const style = { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition };
  const error = errors.letters?.[index];

  return (
    <div ref={sortable.setNodeRef} style={style} className="relative border-b border-[#77594b]/12 py-6 first:pt-2 last:border-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" className="grid size-11 touch-none place-items-center rounded-full text-[var(--muted)] hover:bg-black/5" aria-label="Drag letter" {...sortable.attributes} {...sortable.listeners}>
            <GripVertical className="size-5" />
          </button>
          <span className="font-display text-2xl font-semibold">{String(index + 1).padStart(2, "0")}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex min-h-11 items-center gap-2 text-xs font-semibold text-[var(--muted)]">
            <input suppressHydrationWarning type="checkbox" className="size-4 accent-[var(--wine)]" {...register(`letters.${index}.enabled`)} />
            {dictionary.enabled}
          </label>
          <Button type="button" variant="danger" size="icon" onClick={onRemove} disabled={!canRemove} aria-label={dictionary.delete}><Trash2 className="size-4" /></Button>
        </div>
      </div>
      <input suppressHydrationWarning type="hidden" {...register(`letters.${index}.id`)} />
      <input suppressHydrationWarning type="hidden" value={index} {...register(`letters.${index}.order`, { valueAsNumber: true })} />
      <div className="space-y-4">
        <div>
          <Label htmlFor={`letter-${index}-title`}>{dictionary.letterTitle}</Label>
          <Input id={`letter-${index}-title`} maxLength={80} {...register(`letters.${index}.title`)} />
        </div>
        <div>
          <Label htmlFor={`letter-${index}-message`}>{dictionary.letterMessage}</Label>
          <Textarea id={`letter-${index}-message`} maxLength={1200} aria-invalid={Boolean(error?.message)} aria-describedby={error?.message ? `letter-${index}-message-error` : undefined} {...register(`letters.${index}.message`)} />
          {error?.message?.message ? <p id={`letter-${index}-message-error`} role="alert" className="mt-2 text-xs text-[#a03647]">{error.message.message}</p> : null}
        </div>
      </div>
    </div>
  );
}
