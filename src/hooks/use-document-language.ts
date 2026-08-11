"use client";

import { useEffect } from "react";
import type { ProjectLocale } from "@/lib/types";

export function useDocumentLanguage(locale: ProjectLocale, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const previousLanguage = document.documentElement.lang;
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = previousLanguage;
    };
  }, [enabled, locale]);
}
