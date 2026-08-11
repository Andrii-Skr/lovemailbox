import { redirect } from "next/navigation";
import { localeFromParam } from "@/lib/locale-param";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }) {
  const { lang } = await searchParams;
  const locale = localeFromParam(lang);
  redirect(`/create?lang=${locale}`);
}
