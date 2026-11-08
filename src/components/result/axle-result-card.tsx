"use client";

import { ChevronDown, CircleCheck, CircleX, FileText, ShieldAlert, Thermometer } from "lucide-react";
import { useMemo } from "react";
import { loadIndexLabel } from "@/components/calculator/axle-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DATASET_VERSION } from "@/data/pressure-tables";
import { DOCUMENTS } from "@/data/documents";
import { useI18n } from "@/i18n";
import type { AxleResult } from "@/lib/axle-results";
import { getSeriesRows } from "@/lib/source-rows";
import { cn } from "@/lib/utils";
import type { AxleConfiguration, NeighborEntry, VehicleConfiguration } from "@/types/pressure";
import { SourceRowsView } from "./source-rows-view";

interface Props {
  config: VehicleConfiguration;
  axle: AxleConfiguration;
  result: AxleResult;
}

export function AxleResultCard({ config, axle, result }: Props) {
  const { t, formatKg, formatPressure } = useI18n();

  const seriesRows = useMemo(() => (result.kind === "lookup" ? getSeriesRows(result.input) : []), [result]);
  const heading = (
    <div className="flex items-center gap-2 text-sm font-semibold text-muted">
      <span className="grid size-7 place-items-center rounded-lg bg-surface-3 text-xs font-bold text-accent tabular">{axle.position}</span>
      {t("axle.label", { n: axle.position })} · {t(`role.${axle.role}`)}
    </div>
  );

  if (result.kind === "incomplete") {
    return (
      <Card className="border-dashed p-4 sm:p-5" data-testid={`result-card-${axle.position}`} data-status="incomplete">
        {heading}
        <p className="mt-3 text-sm text-subtle">
          {t("results.incomplete")} – {t("results.missing", { fields: result.missing.map((k) => t(k)).join(", ") })}
        </p>
      </Card>
    );
  }

  const r = result.result;
  const exact = r.status === "exact";
  const factoryType = config.factoryType;
  const details: [string, string][] = [
    [t("detail.vehicle"), config.vehicleFamily ? t(`family.${config.vehicleFamily}`) : "–"],
    [t("detail.factoryType"), factoryType],
    [t("detail.tireSize"), axle.tireSize],
    [t("detail.loadIndex"), loadIndexLabel(axle.loadIndex, t)],
    [t("detail.tableAxle"), t(`tableAxle.${result.input.axlePosition}`)],
    [t("detail.mounting"), t(`mounting.${result.input.mounting}`)],
    [t("detail.axleLoad"), `${formatKg(result.input.axleLoadKg)} kg`],
  ];
  if (config.application === "ambulance") details.splice(2, 0, [t("vehicle.application"), t("application.ambulance")]);

  const neighbor = (n: NeighborEntry | undefined, label: string) =>
    n ? (
      <li className="flex justify-between gap-3">
        <span className="text-subtle">{label}</span>
        <span className="tabular text-muted">
          {formatKg(n.axleLoadKg)} kg → {formatPressure(n.pressureBar, n.pressureDecimals)} {t("results.bar")}
        </span>
      </li>
    ) : null;

  return (
    <Card
      className={cn("overflow-hidden", exact ? "border-ok/30" : "border-warn/35")}
      data-testid={`result-card-${axle.position}`}
      data-status={r.status}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        {heading}
        {exact ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted">{t("results.recommended")}</p>
            <p className="flex items-baseline gap-2" data-testid={`pressure-${axle.position}`}>
              <span className="text-6xl font-bold leading-none tracking-tight text-text tabular sm:text-7xl">
                {formatPressure(r.pressureBar, r.pressureDecimals)}
              </span>
              <span className="text-2xl font-semibold text-muted">{t("results.bar")}</span>
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-accent">
              <Thermometer aria-hidden className="size-4" />
              {t("results.coldReminder")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2" role="alert">
            <p className="flex items-start gap-2 text-base font-semibold text-warn" data-testid={`no-value-${axle.position}`}>
              <CircleX aria-hidden className="mt-0.5 size-5 shrink-0" />
              {t("results.noValue")}
            </p>
            <p className="text-sm text-muted">{t(`reason.${r.reason}`)}</p>
            {r.reason === "unverified_value" && <p className="text-sm text-muted">{t("results.unverifiedCell")}</p>}
            {r.reason === "flagged_value" && <p className="text-sm text-muted">{t("results.flaggedCell")}</p>}
            {r.record?.note && (
              <p className="rounded-lg bg-surface-2 p-2.5 text-xs leading-relaxed text-subtle">
                <span className="font-semibold text-muted">{t("results.note")}: </span>
                {r.record.note}
              </p>
            )}
            {(r.lower || r.higher) && (
              <div className="mt-1 rounded-xl border border-border bg-surface-2 p-3 text-sm">
                <p className="mb-2 text-xs text-subtle">{t("results.neighbors")}</p>
                <ul className="flex flex-col gap-1">
                  {neighbor(r.lower, t("results.neighborLower"))}
                  {neighbor(r.higher, t("results.neighborHigher"))}
                </ul>
              </div>
            )}
            {r.range && (
              <p className="text-xs text-subtle">
                {t("results.range", { min: formatKg(r.range.minKg), max: formatKg(r.range.maxKg) })}
              </p>
            )}
            <p className="text-xs text-subtle">{t("results.noInterpolation")}</p>
          </div>
        )}

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-border pt-4 text-sm">
          {details.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-subtle">{k}</dt>
              <dd className="text-right font-medium text-text tabular">{v}</dd>
            </div>
          ))}
          {exact && (
            <>
              <dt className="text-subtle">{t("results.matchedLoad")}</dt>
              <dd className="text-right font-medium tabular">{formatKg(r.matchedAxleLoadKg)} kg</dd>
              <dt className="text-subtle">{t("results.source")}</dt>
              <dd className="text-right font-medium" data-testid={`source-${axle.position}`}>
                <span className="inline-flex items-center gap-1">
                  <FileText aria-hidden className="size-3.5 text-muted" />
                  {t("results.sourceRef", { doc: r.sourceId, page: r.sourcePage })}
                </span>
                <span className="block text-xs font-normal text-subtle">
                  {DOCUMENTS[r.sourceId].publisher}, {DOCUMENTS[r.sourceId].printed}, {DOCUMENTS[r.sourceId].revision}
                </span>
              </dd>
              <dt className="text-subtle">{t("results.verification")}</dt>
              <dd className="text-right">
                <Badge variant="ok">
                  <CircleCheck aria-hidden />
                  {t("results.verified")}
                </Badge>
                <span className="mt-0.5 block text-xs text-subtle">{t("results.verifiedDetail")}</span>
              </dd>
            </>
          )}
          <dt className="text-subtle">{t("detail.dataset")}</dt>
          <dd className="text-right text-xs text-muted tabular">{DATASET_VERSION}</dd>
        </dl>

        {seriesRows.length > 0 && (
          <details className="group rounded-xl border border-border bg-surface-2">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 px-3.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
              {t("results.showOriginal")}
              <ChevronDown aria-hidden className="size-4 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border p-3.5">
              <SourceRowsView
                rows={seriesRows}
                highlightKg={result.input.axleLoadKg}
                matchedRecordId={exact ? r.record.id : undefined}
              />
            </div>
          </details>
        )}

        {!exact && (
          <p className="flex items-start gap-2 text-xs text-subtle">
            <ShieldAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            {t("safety.noGuess")}
          </p>
        )}
      </div>
    </Card>
  );
}
