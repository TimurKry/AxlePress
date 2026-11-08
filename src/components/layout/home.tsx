"use client";

import { Calculator } from "@/components/calculator/calculator";
import { TireSearch } from "@/components/search/tire-search";
import { useI18n } from "@/i18n";
import { SafetyNotes } from "./safety-notes";
import { SourcesPanel } from "./sources-panel";

export function Home() {
  const { t } = useI18n();
  return (
    <main id="top" className="mx-auto flex max-w-5xl flex-col gap-5 px-4 pb-24 pt-6 sm:pb-12 sm:pt-8">
      <a href="#search" className="sr-only focus:not-sr-only focus:rounded-lg focus:bg-surface-2 focus:p-2">
        {t("app.skip")}
      </a>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("app.tagline")}</h1>
        <p className="text-sm text-subtle">{t("app.independent")}</p>
      </div>
      <TireSearch />
      <Calculator />
      <SafetyNotes />
      <SourcesPanel />
    </main>
  );
}
