"use client";

import { Gauge, Plus, RotateCcw, Settings2, X } from "lucide-react";
import { useMemo } from "react";
import { ResultsSection } from "@/components/result/results-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DATASET_VERSION } from "@/data/pressure-tables";
import { useI18n } from "@/i18n";
import { MAX_AXLES, MIN_AXLES } from "@/lib/config-codec";
import { getApplicableDocumentIds } from "@/lib/vehicle-types";
import { AxleCard } from "./axle-card";
import { SavedVehicles } from "./saved-vehicles";
import { SectionHeading } from "./section-heading";
import { useCalculator } from "./use-calculator";
import { VehicleSection } from "./vehicle-section";

export function Calculator() {
  const { t } = useI18n();
  const { config, results, actions, isUserTableAxle, datasetNotice, hydrated } = useCalculator();

  const scope = useMemo(
    () =>
      config.factoryType && getApplicableDocumentIds(config.factoryType).size > 0
        ? { vehicleType: config.factoryType, application: config.application }
        : null,
    [config.factoryType, config.application],
  );
  const ok = results.filter((r) => r.kind === "lookup" && r.result.status === "exact").length;

  return (
    <div className="flex flex-col gap-5" data-hydrated={hydrated ? "true" : "false"} data-testid="calculator">
      {datasetNotice && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-warn/40 bg-warn-bg p-4 text-sm text-warn">
          <p className="flex-1">{t("results.datasetChanged", { old: datasetNotice.old, new: DATASET_VERSION })}</p>
          <button type="button" onClick={actions.dismissNotice} aria-label="OK" className="rounded-lg p-1 hover:bg-warn-bg">
            <X aria-hidden className="size-4" />
          </button>
        </div>
      )}

      <VehicleSection
        config={config}
        onFamily={actions.setFamily}
        onFactoryType={actions.setFactoryType}
        onApplication={actions.setApplication}
      />

      <section aria-labelledby="axles-heading" id="axles" className="scroll-mt-20">
        <Card className="border-transparent bg-transparent shadow-none">
          <CardHeader className="px-0 pt-0 sm:px-0 sm:pt-0">
            <SectionHeading id="axles-heading" icon={<Settings2 />} title={t("axles.title")} step={t("axles.step")} />
            <span className="text-xs text-subtle">{t("axles.limit", { min: MIN_AXLES, max: MAX_AXLES })}</span>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-0 pb-0 sm:px-0 sm:pb-0">
            {!scope && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-subtle">{t("axles.noType")}</p>}
            {config.axles.map((axle, i) => (
              <AxleCard
                key={axle.id}
                axle={axle}
                allAxles={config.axles}
                scope={scope}
                result={results[i]}
                tableAxleSuggested={!isUserTableAxle(axle.id)}
                onChange={(patch) => actions.updateAxle(axle.id, patch)}
                onRemove={() => actions.removeAxle(axle.id)}
                onCopyTo={(ids) => actions.copyAxle(axle.id, ids)}
              />
            ))}
            <div className="grid grid-cols-[1fr_auto] gap-3 sm:flex">
              <Button
                variant="outline"
                onClick={actions.addAxle}
                disabled={config.axles.length >= MAX_AXLES}
                data-testid="add-axle"
                className="whitespace-nowrap"
              >
                <Plus />
                {t("axles.add")}
              </Button>
              <Button variant="ghost" onClick={actions.reset} data-testid="reset" className="whitespace-nowrap">
                <RotateCcw />
                {t("actions.reset")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <ResultsSection config={config} results={results} />

      <SavedVehicles config={config} onLoad={actions.load} />

      {/* Mobile quick access to the result overview */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
        <a
          href="#results"
          className="pointer-events-auto flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent font-semibold text-accent-contrast shadow-lg shadow-black/30"
        >
          <Gauge aria-hidden className="size-5" />
          {t("results.jump")} · {ok}/{results.length}
        </a>
      </div>
    </div>
  );
}
