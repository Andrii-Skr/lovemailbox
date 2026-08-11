import type { LoveLetter, LoveProject } from "@prisma/client";
import type { EditableLoveProject, PublicLoveProject } from "@/lib/types";

type ProjectWithLetters = LoveProject & { letters: LoveLetter[] };

export function toPublicProject(project: ProjectWithLetters): PublicLoveProject {
  return {
    id: project.id,
    slug: project.slug,
    locale: project.locale,
    title: project.title,
    senderName: project.senderName,
    recipientName: project.recipientName,
    introText: project.introText,
    buttonText: project.buttonText,
    shakeHint: project.shakeHint,
    finalMessage: project.finalMessage,
    expiresAt: project.expiresAt.toISOString(),
    letters: project.letters.toSorted((a, b) => a.order - b.order).map((letter) => ({
      id: letter.id,
      title: letter.title ?? "",
      message: letter.message,
      order: letter.order,
      enabled: letter.enabled,
    })),
  };
}

export function toEditableProject(project: ProjectWithLetters): EditableLoveProject {
  return { ...toPublicProject(project), updatedAt: project.updatedAt.toISOString() };
}
