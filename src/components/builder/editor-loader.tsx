"use client";

import { useEffect, useState } from "react";
import { ProjectBuilder } from "@/components/builder/project-builder";
import { Button } from "@/components/ui/button";
import { loadEditToken } from "@/lib/edit-access";
import type { EditableLoveProject } from "@/lib/types";

export function EditorLoader({ projectId }: { projectId: string }) {
  const [token] = useState(() => loadEditToken(projectId));
  const [state, setState] = useState<"loading" | "denied" | "ready" | "error">(() => token ? "loading" : "denied");
  const [project, setProject] = useState<EditableLoveProject | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/projects/${projectId}`, { headers: { authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (response.status === 403) { setState("denied"); return; }
        if (!response.ok) { setState("error"); return; }
        const result = await response.json() as { project: EditableLoveProject };
        setProject(result.project);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [projectId, token]);

  if (state === "ready" && project && token) return <ProjectBuilder initialProject={project} editToken={token} />;
  if (state === "loading") return <main className="grid min-h-[100svh] place-items-center bg-[#f4eee2]"><p className="font-display text-3xl">Opening the mailbox…</p></main>;
  return (
    <main className="paper-grain grid min-h-[100svh] place-items-center bg-[#f4eee2] px-6 text-center">
      <div className="max-w-xl"><div className="intro-envelope mx-auto"/><h1 className="font-display mt-8 text-5xl font-semibold">{state === "denied" ? "Этот ключ остался на другом устройстве" : "Не удалось открыть проект"}</h1><p className="mt-5 text-sm leading-7 text-[var(--muted)]">Редактирование доступно только в браузере, где создавалась история. Публичная ссылка продолжит работать до окончания срока.</p><Button asChild className="mt-7"><a href="/create">Создать новую историю</a></Button></div>
    </main>
  );
}
