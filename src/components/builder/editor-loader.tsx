"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ProjectBuilder } from "@/components/builder/project-builder";
import { Button } from "@/components/ui/button";
import { loadEditToken } from "@/lib/edit-access";
import type { EditableLoveProject } from "@/lib/types";

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export function EditorLoader({ projectId }: { projectId: string }) {
  const hydrated = useSyncExternalStore(subscribeToHydration, getClientHydrationSnapshot, getServerHydrationSnapshot);
  const token = hydrated ? loadEditToken(projectId) : null;
  const [state, setState] = useState<"loading" | "denied" | "ready" | "error">("loading");
  const [project, setProject] = useState<EditableLoveProject | null>(null);
  const [openShareOnLoad, setOpenShareOnLoad] = useState(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    fetch(`/api/projects/${projectId}`, { headers: { authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async (response) => {
        if (response.status === 403) { setState("denied"); return; }
        if (!response.ok) { setState("error"); return; }
        const result = await response.json() as { project: EditableLoveProject };
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get("saved") === "1") {
          setOpenShareOnLoad(true);
          currentUrl.searchParams.delete("saved");
          window.history.replaceState(window.history.state, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
        }
        setProject(result.project);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState("error");
      });

    return () => controller.abort();
  }, [projectId, token]);

  if (state === "ready" && project && token) return <ProjectBuilder initialProject={project} editToken={token} openShareOnLoad={openShareOnLoad} />;
  if (!hydrated || (token && state === "loading")) return <main className="grid min-h-[100svh] place-items-center bg-[#f4eee2]"><p className="font-display text-3xl">Opening the mailbox…</p></main>;
  return (
    <main className="paper-grain grid min-h-[100svh] place-items-center bg-[#f4eee2] px-6 text-center">
      <div className="max-w-xl"><div className="intro-envelope mx-auto"/><h1 className="font-display mt-8 text-5xl font-semibold">{!token || state === "denied" ? "Этот ключ остался на другом устройстве" : "Не удалось открыть проект"}</h1><p className="mt-5 text-sm leading-7 text-[var(--muted)]">Редактирование доступно только в браузере, где создавалась история. Публичная ссылка продолжит работать до окончания срока.</p><Button asChild className="mt-7"><a href="/create">Создать новую историю</a></Button></div>
    </main>
  );
}
