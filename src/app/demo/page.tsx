import type { Metadata } from "next";
import { DemoReady } from "@/components/experience/demo-ready";
import { LoveExperience } from "@/components/experience/love-experience";
import { getDemoProject } from "@/lib/demo-project";
import { localeFromParam } from "@/lib/locale-param";

export const metadata: Metadata = {
  title: "Love Mailbox preview",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }) {
  const { lang } = await searchParams;
  const locale = localeFromParam(lang, "en");
  return <main className="h-svh overflow-hidden"><LoveExperience project={getDemoProject(locale)} demo /><DemoReady /></main>;
}
