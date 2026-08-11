import type { ProjectLocale } from "@/lib/types";

export function localeFromParam(value: string | string[] | undefined, fallback: ProjectLocale = "ru"): ProjectLocale {
  return value === "ru" || value === "uk" || value === "en" ? value : fallback;
}
