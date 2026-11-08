"use client";

import { BookOpen, ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { DOCUMENTS, DOCUMENT_IDS } from "@/data/documents";
import { DATASET_DATE, DATASET_VERSION } from "@/data/pressure-tables";
import { useI18n } from "@/i18n";
import { getDataset } from "@/lib/dataset";

export function SourcesPanel() {
  const { t } = useI18n();
  const stats = useMemo(() => {
    const { records } = getDataset();
    return {
      verified: records.filter((r) => r.verification === "verified").length,
      unverified: records.filter((r) => r.verification === "unverified").length,
      flagged: records.filter((r) => r.verification === "flagged").length,
    };
  }, []);

  return (
    <details className="group rounded-2xl border border-border bg-surface" data-testid="sources-panel">
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 sm:px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center gap-2 font-semibold">
          <BookOpen aria-hidden className="size-5 text-accent" />
          {t("sources.title")}
        </span>
        <ChevronDown aria-hidden className="size-5 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-4 border-t border-border px-4 py-4 text-sm sm:px-5">
        <p className="tabular text-muted">
          {t("sources.dataset", { version: DATASET_VERSION, date: DATASET_DATE })} · {t("sources.stats", stats)}
        </p>
        <ul className="flex flex-col gap-3">
          {DOCUMENT_IDS.map((id) => {
            const d = DOCUMENTS[id];
            return (
              <li key={id} className="rounded-xl border border-border bg-surface-2 p-3">
                <p className="font-medium">
                  {t("sources.document", { id: d.id, title: d.title, publisher: d.publisher, printed: d.printed, revision: d.revision })}
                </p>
                <p className="text-xs text-subtle">
                  {t("sources.pages", { pages: d.pagesAvailable.join(", "), total: d.totalPages })}
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-xs text-muted">
                  {d.typeLines.map((line, i) => (
                    <li key={i}>
                      <span className="font-semibold text-subtle">{t("sources.types")}: </span>
                      {line.text}
                    </li>
                  ))}
                </ul>
                <ul className="mt-2 flex flex-col gap-1 text-xs italic text-subtle">
                  {d.notes.map((n, i) => (
                    <li key={i} lang="de">
                      „{n}“
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-subtle">{t("sources.docsLink")}</p>
      </div>
    </details>
  );
}
