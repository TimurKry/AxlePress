"use client";

import { Gauge, Thermometer } from "lucide-react";
import { SectionHeading } from "@/components/calculator/section-heading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import type { AxleResult } from "@/lib/axle-results";
import type { VehicleConfiguration } from "@/types/pressure";
import { AxleResultCard } from "./axle-result-card";
import { TruckDiagram } from "./truck-diagram";

export function ResultsSection({ config, results }: { config: VehicleConfiguration; results: AxleResult[] }) {
  const { t } = useI18n();
  const ok = results.filter((r) => r.kind === "lookup" && r.result.status === "exact").length;
  const anyLookup = results.some((r) => r.kind === "lookup");

  return (
    <section id="results" aria-labelledby="results-heading" className="scroll-mt-20">
      <Card>
        <CardHeader>
          <SectionHeading id="results-heading" icon={<Gauge />} title={t("results.title")} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface-2 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{t("results.overview")}</p>
            <TruckDiagram axles={config.axles} results={results} />
            <p className="mt-1 text-sm text-muted" data-testid="results-summary" aria-live="polite">
              {anyLookup ? t("results.summary", { ok, total: results.length }) : t("results.empty")}
            </p>
          </div>
          <p className="flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-2.5 text-sm font-medium text-accent">
            <Thermometer aria-hidden className="size-4 shrink-0" />
            {t("results.coldReminder")}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {config.axles.map((axle, i) => (
              <AxleResultCard key={axle.id} config={config} axle={axle} result={results[i]} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
