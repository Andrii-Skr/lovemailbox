import type { Metadata } from "next";
import { ProjectBuilder } from "@/components/builder/project-builder";
import { localeFromParam } from "@/lib/locale-param";
import { createDefaultProject } from "@/lib/project-schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Создать историю",
  description: "Наполните виртуальный почтовый ящик письмами для особенного человека.",
};

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }) {
  const { lang } = await searchParams;
  return <ProjectBuilder defaultProject={createDefaultProject(localeFromParam(lang))} />;
}
