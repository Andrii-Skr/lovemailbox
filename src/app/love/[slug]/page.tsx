import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { LoveExperience } from "@/components/experience/love-experience";
import { prisma } from "@/server/db";
import { toPublicProject } from "@/server/project-dto";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };
const slugPattern = /^for-[a-z0-9-]{1,44}$/;

const getProject = cache(async (slug: string) => {
  if (!slugPattern.test(slug)) return null;
  return prisma.loveProject.findFirst({
    where: { slug, expiresAt: { gt: new Date() } },
    include: { letters: { where: { enabled: true }, orderBy: { order: "asc" } } },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Love Mailbox", robots: { index: false, follow: false, nocache: true } };
  const namePair = `${project.senderName} ♥ ${project.recipientName}`;
  return {
    title: namePair,
    description: `${namePair} — несколько тёплых писем в одном почтовом ящике.`,
    robots: { index: false, follow: false, nocache: true },
    openGraph: { title: namePair, description: "Someone filled a mailbox with warm words for you.", type: "website" },
  };
}

export default async function LovePage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project || project.letters.length === 0) notFound();
  return <LoveExperience project={toPublicProject(project)} />;
}
