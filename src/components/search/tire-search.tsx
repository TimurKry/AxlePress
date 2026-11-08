"use client";

import { ChevronDown, CircleCheck, Search, Thermometer, TriangleAlert, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { loadIndexLabel } from "@/components/calculator/axle-card";
import { SourceRowsView } from "@/components/result/source-rows-view";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { describedBy, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { lookupPressure } from "@/lib/pressure-engine";
import { getSeriesRows } from "@/lib/source-rows";
import { loadIndexMatches, parseTireCode } from "@/lib/tire-code";
import { buildLadder, getSeriesForSize, searchSizes, verifiedRange, type TireSeries } from "@/lib/tire-search";
import { cn } from "@/lib/utils";

const MAX_SUGGESTIONS = 12;

/** Heading for a group of load-index options (only the attributes that actually differ). */
function groupHeading(s: TireSeries, t: (k: MessageKey) => string): string {
  const parts: string[] = [];
  if (s.group === "vario") parts.push(t(s.application === "ambulance" ? "search.groupAmbulance" : "search.groupVario"));
  if (s.axle !== "any") parts.push(t(`tableAxle.${s.axle}`));
  if (s.mounting !== "unspecified") parts.push(t(`mounting.${s.mounting}`));
  return parts.join(" · ");
}

export function TireSearch() {
  const { t, formatKg, formatPressure } = useI18n();
  const uid = useId();
  const [query, setQuery] = useState("");
  const [size, setSize] = useState<string | null>(null);
  const [seriesKey, setSeriesKey] = useState<string | null>(null);
  const [loadText, setLoadText] = useState("");

  const suggestions = useMemo(() => (query.trim() && !size ? searchSizes(query) : []), [query, size]);
  const series = useMemo(() => (size ? getSeriesForSize(size) : []), [size]);
  const code = useMemo(() => parseTireCode(query), [query]);
  const codeMatches = useMemo(
    () =>
      code && code.tireSize === size && code.single !== null
        ? series.filter((s) => loadIndexMatches(s.loadIndex, s.mounting, code)).map((s) => s.key)
        : [],
    [code, size, series],
  );

  const selected =
    series.find((s) => s.key === seriesKey) ??
    (series.length === 1 ? series[0] : codeMatches.length === 1 ? series.find((s) => s.key === codeMatches[0]) : undefined);

  function chooseSize(next: string) {
    setSize(next);
    setSeriesKey(null);
    setLoadText("");
    // keep a typed load index (e.g. "315/80 R22.5 156/150") so that matching rows are marked
    if (!parseTireCode(query) || parseTireCode(query)?.tireSize !== next) setQuery(next);
  }

  function clear() {
    setQuery("");
    setSize(null);
    setSeriesKey(null);
    setLoadText("");
  }

  // Group the load-index options by their heading (axle / mounting / Vario).
  const groups = useMemo(() => {
    const map = new Map<string, TireSeries[]>();
    for (const s of series) {
      const h = groupHeading(s, t);
      map.set(h, [...(map.get(h) ?? []), s]);
    }
    return [...map.entries()];
  }, [series, t]);

  return (
    <section aria-labelledby="search-heading" id="search" className="scroll-mt-20">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-4 sm:pt-5">
          <div className="flex items-center gap-3">
            <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-surface-3 text-accent">
              <Search className="size-5" />
            </span>
            <h2 id="search-heading" className="text-lg font-semibold tracking-tight">
              {t("search.title")}
            </h2>
          </div>

          <Field id={`${uid}-q`} label={t("search.label")} hint={t("search.hint")}>
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-subtle" />
              <Input
                id={`${uid}-q`}
                data-testid="size-search"
                className="pl-11 pr-11 text-lg"
                type="text"
                role="searchbox"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                enterKeyHint="search"
                placeholder={t("search.placeholder")}
                value={query}
                aria-describedby={describedBy(`${uid}-q`, true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSize(null);
                  setSeriesKey(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && suggestions.length > 0) chooseSize(suggestions[0].tireSize);
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={clear}
                  aria-label={t("search.clear")}
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-subtle hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X aria-hidden className="size-4" />
                </button>
              )}
            </div>
          </Field>

          {!size && query.trim() !== "" && (
            <div data-testid="size-suggestions">
              {suggestions.length === 0 ? (
                <p className="text-sm text-subtle">{t("search.noResults")}</p>
              ) : (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {suggestions.slice(0, MAX_SUGGESTIONS).map((s) => (
                    <li key={s.tireSize}>
                      <button
                        type="button"
                        onClick={() => chooseSize(s.tireSize)}
                        className="flex min-h-12 w-full flex-col items-start justify-center rounded-xl border border-border bg-surface-2 px-3 py-2 text-left font-semibold tabular hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {s.tireSize}
                        {!s.groups.includes("truck") && <span className="text-xs font-normal text-subtle">{t("search.onlyVario")}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {size && (
            <div className="flex flex-col gap-3" data-testid="load-index-options">
              <p className="text-sm font-medium text-muted">{t("search.chooseLoadIndex")}</p>
              {groups.map(([heading, items]) => (
                <div key={heading} className="flex flex-col gap-1.5">
                  {heading && <span className="text-xs font-semibold uppercase tracking-wide text-subtle">{heading}</span>}
                  <div className="flex flex-wrap gap-2">
                    {items.map((s) => {
                      const active = selected?.key === s.key;
                      const hinted = codeMatches.includes(s.key);
                      return (
                        <button
                          key={s.key}
                          type="button"
                          aria-pressed={active}
                          data-testid="li-option"
                          onClick={() => {
                            setSeriesKey(s.key);
                          }}
                          className={cn(
                            "min-h-11 rounded-xl border px-3.5 text-base font-semibold tabular transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active
                              ? "border-accent bg-accent/15 text-text"
                              : hinted
                                ? "border-accent/50 bg-surface-2 text-text"
                                : "border-border bg-surface-2 text-muted hover:text-text",
                          )}
                        >
                          {loadIndexLabel(s.loadIndex, t)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selected && (
            <SeriesResult
              series={selected}
              loadText={loadText}
              onLoadText={setLoadText}
              t={t}
              formatKg={formatKg}
              formatPressure={formatPressure}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function SeriesResult({
  series,
  loadText,
  onLoadText,
  t,
  formatKg,
  formatPressure,
}: {
  series: TireSeries;
  loadText: string;
  onLoadText: (v: string) => void;
  t: ReturnType<typeof useI18n>["t"];
  formatKg: (v: number) => string;
  formatPressure: (v: number, d: number) => string;
}) {
  const uid = useId();
  const ladder = useMemo(() => buildLadder(series.records), [series]);
  const range = useMemo(() => verifiedRange(series.records), [series]);
  const trimmed = loadText.trim();
  const loadValid = /^\d{1,6}$/.test(trimmed);
  const loadInvalid = trimmed !== "" && !loadValid;
  const input = useMemo(
    () => ({
      vehicleType: series.group,
      tireSize: series.tireSize,
      loadIndex: series.loadIndex,
      axlePosition: series.axle,
      mounting: series.mounting,
      application: series.application,
    }),
    [series],
  );
  const result = loadValid ? lookupPressure({ ...input, axleLoadKg: Number(trimmed) }) : null;
  const exactKg = result?.status === "exact" ? result.matchedAxleLoadKg : null;
  const sourceRows = useMemo(() => getSeriesRows(input), [input]);
  const kgRange = (from: number, to: number) => (from === to ? formatKg(from) : `${formatKg(from)} … ${formatKg(to)}`);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-2 p-4" data-testid="series-result">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-lg font-bold tabular">{series.tireSize}</span>
        <span className="text-muted">· LI {loadIndexLabel(series.loadIndex, t)}</span>
        {series.mounting !== "unspecified" && <Badge variant="neutral">{t(`mounting.${series.mounting}`)}</Badge>}
        {series.axle !== "any" && <Badge variant="neutral">{t(`tableAxle.${series.axle}`)}</Badge>}
        {series.group === "vario" && <Badge variant="accent">{t("search.groupVario")}</Badge>}
      </div>

      {range && (
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-bold tracking-tight tabular" data-testid="pressure-range">
            {range.min.pressureBar === range.max.pressureBar
              ? `${formatPressure(range.min.pressureBar, range.min.pressureDecimals)} ${t("results.bar")}`
              : t("search.range", {
                  min: formatPressure(range.min.pressureBar, range.min.pressureDecimals),
                  max: formatPressure(range.max.pressureBar, range.max.pressureDecimals),
                })}
          </p>
          <p className="flex items-start gap-1.5 text-sm text-warn">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {t("search.rangeHint")}
          </p>
        </div>
      )}

      <Field
        id={`${uid}-load`}
        label={t("search.loadOptional")}
        hint={t("search.loadOptionalHint")}
        error={loadInvalid ? t("axle.loadInvalid") : undefined}
      >
        <div className="relative">
          <Input
            id={`${uid}-load`}
            data-testid="search-axle-load"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            enterKeyHint="done"
            placeholder="7100"
            className="pr-12 text-lg font-semibold tabular"
            value={loadText}
            aria-invalid={loadInvalid}
            aria-describedby={describedBy(`${uid}-load`, true, loadInvalid)}
            onChange={(e) => onLoadText(e.target.value)}
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-subtle">{t("unit.kg")}</span>
        </div>
      </Field>

      {result?.status === "exact" && (
        <div className="rounded-xl border border-ok/30 bg-ok-bg p-4" role="status" data-testid="search-exact">
          <p className="text-sm text-muted">{t("results.recommended")}</p>
          <p className="flex items-baseline gap-2">
            <span className="text-5xl font-bold leading-none tabular">{formatPressure(result.pressureBar, result.pressureDecimals)}</span>
            <span className="text-xl font-semibold text-muted">{t("results.bar")}</span>
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ok">
            <CircleCheck aria-hidden className="size-4" />
            {t("results.sourceRef", { doc: result.sourceId, page: result.sourcePage })}
          </p>
        </div>
      )}
      {result?.status === "unavailable" && (
        <div className="rounded-xl border border-warn/35 bg-warn-bg p-4 text-sm" role="alert" data-testid="search-unavailable">
          <p className="font-semibold text-warn">{t("results.noValue")}</p>
          <p className="mt-1 text-muted">{t(`reason.${result.reason}`)}</p>
          {(result.lower || result.higher) && (
            <ul className="mt-2 flex flex-col gap-0.5 tabular text-muted">
              {result.lower && (
                <li>
                  {t("results.neighborLower")}: {formatKg(result.lower.axleLoadKg)} {t("unit.kg")} →{" "}
                  {formatPressure(result.lower.pressureBar, result.lower.pressureDecimals)} {t("results.bar")}
                </li>
              )}
              {result.higher && (
                <li>
                  {t("results.neighborHigher")}: {formatKg(result.higher.axleLoadKg)} {t("unit.kg")} →{" "}
                  {formatPressure(result.higher.pressureBar, result.higher.pressureDecimals)} {t("results.bar")}
                </li>
              )}
            </ul>
          )}
          <p className="mt-2 text-xs text-subtle">{t("results.noInterpolation")}</p>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-muted">{t("search.ladderTitle")}</p>
        <table className="w-full border-collapse text-sm tabular" data-testid="pressure-ladder">
          <thead>
            <tr className="text-left text-xs text-subtle">
              <th scope="col" className="pb-1.5 font-medium">
                {t("search.ladderLoad")} ({t("unit.kg")})
              </th>
              <th scope="col" className="pb-1.5 text-right font-medium">
                {t("search.ladderPressure")} ({t("results.bar")})
              </th>
            </tr>
          </thead>
          <tbody>
            {ladder.map((step) => {
              const hit = exactKg !== null && exactKg >= step.fromKg && exactKg <= step.toKg;
              return (
                <tr
                  key={step.fromKg}
                  data-highlight={hit ? "true" : undefined}
                  className={cn("border-t border-border", hit && "bg-accent/15 font-bold text-text")}
                >
                  <td className="py-2 pr-2">{kgRange(step.fromKg, step.toKg)}</td>
                  <td className="py-2 text-right">
                    {step.status === "verified" && step.pressureBar !== null ? (
                      <span className="text-base font-semibold">{formatPressure(step.pressureBar, step.pressureDecimals)}</span>
                    ) : (
                      <span className={cn("text-xs", step.status === "flagged" ? "text-danger" : "text-subtle")}>
                        {step.status === "flagged" ? t("search.flagged") : t("search.unverified")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-subtle">{t("search.ladderNote")}</p>
      </div>

      <p className="flex items-center gap-2 text-sm font-medium text-accent">
        <Thermometer aria-hidden className="size-4" />
        {t("results.coldReminder")}
      </p>

      <details className="group rounded-xl border border-border bg-surface">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-xl px-3.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {t("search.source", { doc: series.documentId, pages: series.pages.join(", ") })}
          <ChevronDown aria-hidden className="size-4 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border p-3.5">
          <SourceRowsView rows={sourceRows} highlightKg={exactKg} matchedRecordId={result?.status === "exact" ? result.record.id : undefined} />
        </div>
      </details>
    </div>
  );
}
