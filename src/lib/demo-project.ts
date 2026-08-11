import { defaultsByLocale } from "@/lib/project-schema";
import type { ProjectLocale, PublicLoveProject } from "@/lib/types";

export function getDemoProject(locale: ProjectLocale): PublicLoveProject {
  const source = defaultsByLocale[locale];
  return {
    id: "love-mailbox-demo",
    slug: "demo",
    expiresAt: "2099-12-31T23:59:59.000Z",
    locale,
    title: source.title,
    senderName: source.senderName,
    recipientName: source.recipientName,
    introText: source.introText,
    buttonText: source.buttonText,
    shakeHint: source.shakeHint,
    finalMessage: source.finalMessage,
    letters: source.letters.map((message, order) => ({ id: `demo-${locale}-${order}`, title: "", message, order, enabled: true })),
  };
}
