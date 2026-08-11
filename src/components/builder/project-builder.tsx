"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, MailPlus, Plus, RefreshCw, Save, Share2, Smartphone, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { LoveExperience } from "@/components/experience/love-experience";
import { ShareModal } from "@/components/builder/share-modal";
import { SortableLetter } from "@/components/builder/sortable-letter";
import { TurnstileWidget } from "@/components/builder/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { useDocumentLanguage } from "@/hooks/use-document-language";
import { useModalFocus } from "@/hooks/use-modal-focus";
import { saveEditToken } from "@/lib/edit-access";
import { getDictionary } from "@/lib/i18n";
import { createDefaultProject, projectSchema, type ProjectFormValues } from "@/lib/project-schema";
import type { EditableLoveProject, ProjectLocale, PublicLoveProject } from "@/lib/types";

type Props = { initialProject?: EditableLoveProject; defaultProject?: ProjectFormValues; editToken?: string; openShareOnLoad?: boolean };

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} role="alert" className="mt-2 text-xs text-[#a03647]">{message}</p> : null;
}

export function ProjectBuilder({ initialProject, defaultProject, editToken, openShareOnLoad = false }: Props) {
  const router = useRouter();
  const [projectMeta, setProjectMeta] = useState(initialProject);
  const [token, setToken] = useState("");
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "conflict">("idle");
  const [message, setMessage] = useState("");
  const [simulationSignal, setSimulationSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [shareOpen, setShareOpen] = useState(openShareOnLoad);
  const [previewExpiry] = useState(() => new Date(Date.now() + 604800000).toISOString());
  const mobilePreviewRef = useRef<HTMLDivElement>(null);
  const hydrated = useSyncExternalStore(subscribeToHydration, getClientHydrationSnapshot, getServerHydrationSnapshot);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialProject ?? defaultProject ?? createDefaultProject("ru"),
    mode: "onBlur",
  });
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "letters", keyName: "fieldId" });
  const watched = useWatch({ control: form.control });
  const locale = (watched.locale ?? "ru") as ProjectLocale;
  const dictionary = getDictionary(locale);
  const { errors, isDirty } = form.formState;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useDocumentLanguage(locale);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const previewProject: PublicLoveProject = useMemo(() => ({
    id: projectMeta?.id ?? "preview",
    slug: projectMeta?.slug ?? "preview",
    expiresAt: projectMeta?.expiresAt ?? previewExpiry,
    locale,
    title: watched.title ?? "",
    senderName: watched.senderName ?? "",
    recipientName: watched.recipientName ?? "",
    introText: watched.introText ?? "",
    buttonText: watched.buttonText ?? "",
    shakeHint: watched.shakeHint ?? "",
    finalMessage: watched.finalMessage ?? "",
    letters: (watched.letters ?? []).map((letter, index) => ({
      id: letter?.id ?? `preview-${index}`,
      title: letter?.title ?? "",
      message: letter?.message ?? "",
      enabled: letter?.enabled ?? true,
      order: index,
    })),
  }), [locale, previewExpiry, projectMeta, watched]);

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = fields.findIndex((field) => field.fieldId === event.active.id);
    const newIndex = fields.findIndex((field) => field.fieldId === event.over?.id);
    const reordered = arrayMove(form.getValues("letters"), oldIndex, newIndex).map((letter, order) => ({ ...letter, order }));
    move(oldIndex, newIndex);
    form.setValue("letters", reordered, { shouldDirty: true, shouldValidate: true });
    setResetSignal((value) => value + 1);
  }

  const handleTurnstile = useCallback((value: string) => setToken(value), []);

  async function submit(values: ProjectFormValues) {
    if (!projectMeta && !token) {
      setStatus("error");
      setMessage(dictionary.turnstileError);
      return;
    }
    setStatus("saving");
    setMessage("");
    const normalized = { ...values, letters: values.letters.map((letter, order) => ({ ...letter, order })) };
    try {
      if (!projectMeta) {
        const response = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ project: normalized, turnstileToken: token }) });
        const result = await response.json() as { project?: EditableLoveProject; editToken?: string; message?: string };
        if (response.status === 403) {
          setToken("");
          setTurnstileResetSignal((value) => value + 1);
        }
        if (!response.ok || !result.project || !result.editToken) throw new Error(result.message ?? "Could not create project");
        saveEditToken(result.project.id, result.editToken);
        setStatus("saved");
        router.push(`/editor/${result.project.id}?saved=1`);
        return;
      }
      const response = await fetch(`/api/projects/${projectMeta.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${editToken}` },
        body: JSON.stringify({ ...normalized, updatedAt: projectMeta.updatedAt }),
      });
      const result = await response.json() as { project?: EditableLoveProject; message?: string };
      if (response.status === 409) { setStatus("conflict"); setMessage(dictionary.conflict); return; }
      if (!response.ok || !result.project) throw new Error(result.message ?? "Could not save project");
      setProjectMeta(result.project);
      form.reset(result.project);
      setStatus("saved");
      setShareOpen(true);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not save project");
    }
  }

  const closeShare = useCallback(() => setShareOpen(false), []);
  const closeMobilePreview = useCallback(() => setMobilePreview(false), []);
  useModalFocus(mobilePreview, mobilePreviewRef, closeMobilePreview);

  return (
    <main lang={locale} inert={!hydrated} aria-busy={!hydrated} data-hydrated={hydrated ? "true" : "false"} className="paper-grain min-h-screen bg-[#f4eee2]">
      <header className="sticky top-0 z-50 border-b border-[#5e4035]/10 bg-[#f4eee2]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3"><MailPlus className="size-5 text-[var(--wine)]"/><span className="font-display text-xl font-bold sm:text-2xl">{dictionary.brand}</span></div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="locale">{dictionary.language}</label>
            <select suppressHydrationWarning id="locale" className="h-9 rounded-full border border-[#5e4035]/14 bg-white/55 px-3 text-xs font-semibold uppercase tracking-[.08em] text-[var(--ink)] outline-none transition hover:bg-white/80 focus:border-[var(--rose)] focus:ring-2 focus:ring-[var(--wine)]/15" {...form.register("locale")}>
              <option value="ru">RU</option>
              <option value="uk">UA</option>
              <option value="en">EN</option>
            </select>
            <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobilePreview(true)} aria-label={dictionary.preview}><Smartphone className="size-5" /></Button>
            {projectMeta ? <Button type="button" variant="ghost" size="icon" onClick={() => setShareOpen(true)} aria-label={dictionary.share}><Share2 className="size-5" /></Button> : null}
            {status === "saved" && !isDirty ? <span className="hidden items-center gap-1 text-xs font-semibold text-[#52704c] sm:flex"><Check className="size-4" />{dictionary.saved}</span> : null}
            {status !== "saving" && isDirty ? <span className="hidden text-xs font-semibold text-[#8a5b3f] sm:block">{dictionary.unsaved}</span> : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1480px] gap-0 lg:grid-cols-[minmax(0,1fr)_520px]">
        <form suppressHydrationWarning className="min-w-0 px-5 py-10 lg:px-10 xl:px-16" onSubmit={form.handleSubmit(submit)}>
          <div className="mx-auto max-w-2xl">
            <p className="text-[10px] font-extrabold uppercase tracking-[.26em] text-[var(--rose)]">{dictionary.createKicker}</p>
            <h1 className="font-display mt-4 text-5xl font-semibold leading-[.95] sm:text-7xl">{projectMeta ? dictionary.editor : dictionary.createHeading}</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--muted)]">{dictionary.createLead}</p>

            <section className="mt-12">
              <div className="mb-7 flex items-baseline justify-between border-b border-[#735342]/12 pb-4"><h2 className="font-display text-3xl font-semibold">{dictionary.project}</h2><span className="text-xs text-[var(--muted)]">01</span></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label htmlFor="title">{dictionary.projectTitle}</Label><Input id="title" maxLength={80} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "title-error" : undefined} {...form.register("title")} /><FieldError id="title-error" message={errors.title?.message} /></div>
                <div><Label htmlFor="sender">{dictionary.sender}</Label><Input id="sender" maxLength={60} aria-invalid={Boolean(errors.senderName)} aria-describedby={errors.senderName ? "sender-error" : undefined} {...form.register("senderName")} /><FieldError id="sender-error" message={errors.senderName?.message} /></div>
                <div><Label htmlFor="recipient">{dictionary.recipient}</Label><Input id="recipient" maxLength={60} aria-invalid={Boolean(errors.recipientName)} aria-describedby={errors.recipientName ? "recipient-error" : undefined} {...form.register("recipientName")} /><FieldError id="recipient-error" message={errors.recipientName?.message} /></div>
                <div className="sm:col-span-2"><Label htmlFor="intro">{dictionary.intro}</Label><Textarea id="intro" maxLength={280} aria-invalid={Boolean(errors.introText)} aria-describedby={errors.introText ? "intro-error" : undefined} {...form.register("introText")} /><FieldError id="intro-error" message={errors.introText?.message} /></div>
                <div><Label htmlFor="button">{dictionary.button}</Label><Input id="button" maxLength={40} aria-invalid={Boolean(errors.buttonText)} aria-describedby={errors.buttonText ? "button-error" : undefined} {...form.register("buttonText")} /><FieldError id="button-error" message={errors.buttonText?.message} /></div>
                <div><Label htmlFor="hint">{dictionary.shakeHint}</Label><Input id="hint" maxLength={80} aria-invalid={Boolean(errors.shakeHint)} aria-describedby={errors.shakeHint ? "hint-error" : undefined} {...form.register("shakeHint")} /><FieldError id="hint-error" message={errors.shakeHint?.message} /></div>
              </div>
            </section>

            <section className="mt-14">
              <div className="mb-6 flex items-center justify-between border-b border-[#735342]/12 pb-4"><div className="flex items-baseline gap-3"><h2 className="font-display text-3xl font-semibold">{dictionary.letters}</h2><span className="text-xs text-[var(--muted)]">{fields.length}/30</span></div><Button type="button" variant="outline" size="sm" disabled={fields.length >= 30} onClick={() => append({ id: crypto.randomUUID(), title: "", message: "", order: fields.length, enabled: true })}><Plus className="size-4" />{dictionary.addLetter}</Button></div>
              <DndContext id="letters-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((field) => field.fieldId)} strategy={verticalListSortingStrategy}>
                  {fields.map((field, index) => <SortableLetter key={field.fieldId} fieldId={field.fieldId} index={index} register={form.register} errors={errors} dictionary={dictionary} onRemove={() => remove(index)} canRemove={fields.length > 1} />)}
                </SortableContext>
              </DndContext>
              {typeof errors.letters?.message === "string" ? <p role="alert" className="text-sm text-[#a03647]">{errors.letters.message}</p> : null}
            </section>

            <section className="mt-14 border-t border-[#735342]/12 pt-8">
              <Label htmlFor="final">{dictionary.final}</Label><Textarea id="final" maxLength={600} className="min-h-40" aria-invalid={Boolean(errors.finalMessage)} aria-describedby={errors.finalMessage ? "final-error" : undefined} {...form.register("finalMessage")} /><FieldError id="final-error" message={errors.finalMessage?.message} />
            </section>

            {!projectMeta ? <div className="mt-8"><TurnstileWidget errorMessage={dictionary.turnstileError} onToken={handleTurnstile} resetSignal={turnstileResetSignal} /></div> : null}
            {message ? <p role="status" className={`mt-5 text-sm ${status === "error" || status === "conflict" ? "text-[#a03647]" : "text-[#52704c]"}`}>{message}</p> : null}
            <Button className="mt-7 min-w-44" type="submit" disabled={status === "saving"}><Save className="size-4" />{status === "saving" ? dictionary.saving : dictionary.save}</Button>
          </div>
        </form>

        <aside className="hidden border-l border-[#5e4035]/10 bg-[#e9dfcf] px-8 py-9 lg:block">
          <div className="sticky top-24">
            <div className="mb-4 flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[.24em] text-[var(--muted)]">{dictionary.preview}</p><div className="flex gap-1"><Button type="button" variant="ghost" size="sm" onClick={() => setSimulationSignal((value) => value + 1)}>{dictionary.simulate}</Button><Button type="button" variant="ghost" size="icon" onClick={() => setResetSignal((value) => value + 1)} aria-label={dictionary.resetPreview}><RefreshCw className="size-4" /></Button></div></div>
            <div className="mx-auto h-[720px] w-[390px] overflow-hidden rounded-[46px] border-[8px] border-[#2c2624] bg-black shadow-[0_30px_80px_rgba(54,38,30,.25)]"><LoveExperience project={previewProject} preview simulationSignal={simulationSignal} resetSignal={resetSignal} /></div>
          </div>
        </aside>
      </div>

      {mobilePreview ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#3d2e29]/70 p-3 backdrop-blur-md lg:hidden">
          <div ref={mobilePreviewRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={dictionary.preview} className="relative h-[min(780px,calc(100svh-24px))] w-[min(390px,calc(100vw-24px))] overflow-hidden rounded-[42px] border-[7px] border-[#292321] bg-black shadow-2xl">
            <LoveExperience project={previewProject} preview simulationSignal={simulationSignal} resetSignal={resetSignal} />
            <div className="absolute inset-x-3 top-3 z-50 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSimulationSignal((value) => value + 1)}>{dictionary.simulate}</Button>
              <Button type="button" variant="outline" size="icon" onClick={() => setResetSignal((value) => value + 1)} aria-label={dictionary.resetPreview}><RefreshCw className="size-4" /></Button>
              <Button data-modal-initial-focus type="button" variant="outline" size="icon" onClick={closeMobilePreview} aria-label={dictionary.closePreview}><X className="size-4" /></Button>
            </div>
          </div>
        </div>
      ) : null}

      {projectMeta ? <ShareModal dictionary={dictionary} expiresAt={projectMeta.expiresAt} locale={locale} onClose={closeShare} open={shareOpen} url={shareOpen ? `${window.location.origin}/love/${projectMeta.slug}` : ""} /> : null}
    </main>
  );
}
