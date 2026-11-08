"use client";

import { DATASET_DATE, DATASET_VERSION } from "@/data/pressure-tables";
import { useI18n } from "@/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-10 border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-xs leading-relaxed text-subtle">
        <p className="font-medium text-muted">{t("app.independent")}</p>
        <p>{t("footer.disclaimer")}</p>
        <p className="tabular" data-testid="dataset-version">
          {t("sources.dataset", { version: DATASET_VERSION, date: DATASET_DATE })}
        </p>
      </div>
    </footer>
  );
}
