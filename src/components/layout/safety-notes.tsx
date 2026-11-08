"use client";

import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/i18n";

export function SafetyNotes() {
  const { t } = useI18n();
  const items = ["safety.cold", "safety.load", "safety.plate", "safety.guide", "safety.noGuess"] as const;
  return (
    <section aria-labelledby="safety-heading" className="rounded-2xl border border-warn/30 bg-warn-bg p-4 sm:p-5">
      <h2 id="safety-heading" className="flex items-center gap-2 text-base font-semibold text-warn">
        <ShieldAlert aria-hidden className="size-5" />
        {t("safety.title")}
      </h2>
      <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-text/90 marker:text-warn">
        {items.map((k) => (
          <li key={k}>{t(k)}</li>
        ))}
      </ul>
    </section>
  );
}
