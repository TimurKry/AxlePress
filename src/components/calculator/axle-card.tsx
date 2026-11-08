"use client";

import { ChevronDown, CircleCheck, CircleDot, Copy, CopyCheck, ScanLine, Trash2, TriangleAlert } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { describedBy, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Segmented } from "@/components/ui/segmented";
import { useI18n } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import type { AxleResult } from "@/lib/axle-results";
import { MIN_AXLES } from "@/lib/config-codec";
import {
  getDocumentedLoads,
  getLoadIndices,
  getMountings,
  getTableAxles,
  getTireSizes,
  type Scope,
} from "@/lib/options";
import { parseTireCode } from "@/lib/tire-code";
import { cn } from "@/lib/utils";
import type { AxleConfiguration, AxleRole, Mounting, TableAxle } from "@/types/pressure";

const ROLES: AxleRole[] = ["steering", "driven", "trailing", "lift"];

interface Props {
  axle: AxleConfiguration;
  allAxles: AxleConfiguration[];
  scope: Scope | null;
  result: AxleResult;
  tableAxleSuggested: boolean;
  onChange: (patch: Partial<AxleConfiguration>) => void;
  onRemove: () => void;
  onCopyTo: (targetIds: string[]) => void;
  onCopyFrom: (sourceId: string) => void;
}

export function loadIndexLabel(key: string, t: (k: MessageKey) => string): string {
  return key === "-" ? t("loadIndex.none") : key;
}

function sameTyres(a: AxleConfiguration, b: AxleConfiguration): boolean {
  return a.tireSize === b.tireSize && a.mounting === b.mounting && a.loadIndex === b.loadIndex;
}

export function AxleCard({
  axle,
  allAxles,
  scope,
  result,
  tableAxleSuggested,
  onChange,
  onRemove,
  onCopyTo,
  onCopyFrom,
}: Props) {
  const { t, formatKg, formatPressure } = useI18n();
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const [loadText, setLoadText] = useState<string | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);

  const sizes = useMemo(() => (scope ? getTireSizes(scope) : []), [scope]);
  const mountings = useMemo(() => (scope && axle.tireSize ? getMountings(scope, axle.tireSize) : []), [scope, axle.tireSize]);
  const tableAxles = useMemo(
    () => (scope && axle.tireSize && axle.mounting ? getTableAxles(scope, axle.tireSize, axle.mounting) : []),
    [scope, axle.tireSize, axle.mounting],
  );
  const loadIndices = useMemo(
    () =>
      scope && axle.tireSize && axle.mounting && axle.tableAxle
        ? getLoadIndices(scope, axle.tireSize, axle.mounting, axle.tableAxle)
        : [],
    [scope, axle.tireSize, axle.mounting, axle.tableAxle],
  );
  const documentedLoads = useMemo(
    () =>
      scope && axle.tireSize && axle.mounting && axle.tableAxle && axle.loadIndex
        ? getDocumentedLoads(scope, axle.tireSize, axle.mounting, axle.tableAxle, axle.loadIndex)
        : [],
    [scope, axle.tireSize, axle.mounting, axle.tableAxle, axle.loadIndex],
  );

  const loadValue = loadText ?? (axle.axleLoadKg === null ? "" : String(axle.axleLoadKg));
  const loadInvalid = loadText !== null && loadText.trim() !== "" && !/^\d{1,6}$/.test(loadText.trim());
  const others = allAxles.filter((a) => a.id !== axle.id);
  const previous = allAxles.find((a) => a.position === axle.position - 1);
  const canCopyPrevious = !!scope && !!previous?.tireSize && !sameTyres(previous, axle);
  // Only ask for the table axle when the table actually offers a choice (17,5″ / 19,5″).
  const hideTableAxle = tableAxles.length <= 1;

  // Feedback for the sidewall quick entry
  const codeText = axle.tireCode ?? "";
  const parsedCode = codeText.trim() ? parseTireCode(codeText) : null;
  let codeHint: string = t("axle.codeHint");
  let codeError: string | undefined;
  if (codeText.trim() && scope) {
    if (!parsedCode) codeError = t("axle.codeInvalid");
    else if (!sizes.includes(parsedCode.tireSize)) codeError = t("axle.codeUnknownSize", { size: parsedCode.tireSize });
    else
      codeHint = t("axle.codeRecognized", {
        size: parsedCode.tireSize,
        li: parsedCode.single === null ? "–" : `${parsedCode.single}${parsedCode.twin ? `/${parsedCode.twin}` : ""}`,
      });
  }

  function setLoad(raw: string) {
    setLoadText(raw);
    const trimmed = raw.trim();
    if (trimmed === "") onChange({ axleLoadKg: null });
    else if (/^\d{1,6}$/.test(trimmed)) onChange({ axleLoadKg: Number(trimmed) });
    else onChange({ axleLoadKg: null });
  }

  return (
    <Card data-testid={`axle-card-${axle.position}`} className="animate-fade-in">
      <CardHeader className="items-center pb-0">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-surface-3 text-sm font-bold text-accent tabular">
            {axle.position}
          </span>
          <h3 className="text-base font-semibold">{t("axle.label", { n: axle.position })}</h3>
        </div>
        <div className="flex items-center gap-1">
          {others.length > 0 && (
            <div className="relative">
              <label htmlFor={id("copy")} className="sr-only">
                {t("axle.copyTo")}
              </label>
              <Copy aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <select
                id={id("copy")}
                data-testid={`copy-axle-${axle.position}`}
                value=""
                disabled={!axle.tireSize}
                title={t("axle.copyTo")}
                onChange={(e) => {
                  const target = e.target.value;
                  if (!target) return;
                  const ids = target === "*" ? others.map((o) => o.id) : [target];
                  onCopyTo(ids);
                  setCopyNote(t("axle.copied", { from: axle.position }));
                  window.setTimeout(() => setCopyNote(null), 2500);
                }}
                className="h-10 w-10 cursor-pointer appearance-none rounded-xl border border-border bg-surface-2 text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 sm:w-auto sm:pl-9 sm:pr-3 sm:text-sm sm:text-muted"
              >
                <option value="">{t("axle.copyTo")}</option>
                {others.map((o) => (
                  <option key={o.id} value={o.id}>
                    {t("axle.label", { n: o.position })}
                  </option>
                ))}
                {others.length > 1 && <option value="*">{t("axle.copyAll")}</option>}
              </select>
            </div>
          )}
          {allAxles.length > MIN_AXLES && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label={t("axle.remove", { n: axle.position })}
              data-testid={`remove-axle-${axle.position}`}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-3 gap-y-3.5">
        {copyNote && (
          <p role="status" className="col-span-2 text-sm text-ok">
            {copyNote}
          </p>
        )}

        <Field id={id("code")} label={t("axle.code")} hint={codeHint} error={codeError} className="col-span-2">
          <div className="relative">
            <ScanLine aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-subtle" />
            <Input
              id={id("code")}
              data-testid={`tire-code-${axle.position}`}
              className="pl-11"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              enterKeyHint="next"
              disabled={!scope}
              placeholder={t("axle.codePlaceholder")}
              value={codeText}
              aria-invalid={!!codeError}
              aria-describedby={describedBy(id("code"), true, codeError)}
              onChange={(e) => onChange({ tireCode: e.target.value })}
            />
          </div>
        </Field>

        {canCopyPrevious && previous && (
          <Button
            variant="secondary"
            size="sm"
            className="col-span-2"
            data-testid={`same-as-previous-${axle.position}`}
            onClick={() => onCopyFrom(previous.id)}
          >
            <CopyCheck />
            {t("axle.sameAs", { n: previous.position })}
          </Button>
        )}

        <Field id={id("role")} label={t("axle.role")}>
          <NativeSelect
            id={id("role")}
            data-testid={`role-${axle.position}`}
            value={axle.role}
            onChange={(e) => onChange({ role: e.target.value as AxleRole })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`role.${r}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field id={id("size")} label={t("axle.tireSize")}>
          <NativeSelect
            id={id("size")}
            data-testid={`tire-size-${axle.position}`}
            value={axle.tireSize}
            disabled={!scope}
            onChange={(e) => onChange({ tireSize: e.target.value })}
          >
            <option value="">{t("axle.tireSizePlaceholder")}</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </Field>

        {mountings.length > 0 ? (
          <Segmented<Mounting>
            name={id("mounting")}
            label={t("axle.mounting")}
            value={axle.mounting}
            className="col-span-2"
            columns={mountings.length === 1 ? "grid-cols-1" : "grid-cols-2"}
            onChange={(m) => onChange({ mounting: m })}
            options={mountings.map((m) => ({
              value: m,
              label: t(`mounting.${m}`),
              testId: `mounting-${axle.position}-${m}`,
            }))}
          />
        ) : (
          <Field id={id("mounting")} label={t("axle.mounting")} className="col-span-2">
            <NativeSelect id={id("mounting")} disabled value="">
              <option value="">{t("axle.mountingPlaceholder")}</option>
            </NativeSelect>
          </Field>
        )}

        {!hideTableAxle && (
          <Field
            id={id("table-axle")}
            label={t("axle.tableAxle")}
            hint={tableAxleSuggested && axle.tableAxle && tableAxles.length > 1 ? t("axle.tableAxleSuggested") : undefined}
          >
            <NativeSelect
              id={id("table-axle")}
              data-testid={`table-axle-${axle.position}`}
              value={axle.tableAxle}
              aria-describedby={describedBy(id("table-axle"), tableAxleSuggested && axle.tableAxle && tableAxles.length > 1)}
              onChange={(e) => onChange({ tableAxle: e.target.value as TableAxle | "" })}
            >
              <option value="">{t("axle.tableAxlePlaceholder")}</option>
              {tableAxles.map((a) => (
                <option key={a} value={a}>
                  {t(`tableAxle.${a}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}

        <Field
          id={id("li")}
          label={t("axle.loadIndex")}
          hint={hideTableAxle ? t("axle.loadIndexHint") : undefined}
          className={hideTableAxle ? "col-span-2" : undefined}
        >
          <NativeSelect
            id={id("li")}
            data-testid={`load-index-${axle.position}`}
            value={axle.loadIndex}
            disabled={loadIndices.length === 0}
            aria-describedby={describedBy(id("li"), hideTableAxle)}
            onChange={(e) => onChange({ loadIndex: e.target.value })}
          >
            <option value="">{t("axle.loadIndexPlaceholder")}</option>
            {loadIndices.map((li) => (
              <option key={li} value={li}>
                {loadIndexLabel(li, t)}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field
          id={id("load")}
          label={t("axle.load")}
          hint={t("axle.loadHint")}
          error={loadInvalid ? t("axle.loadInvalid") : undefined}
          className="col-span-2"
        >
          <div className="relative">
            <Input
              id={id("load")}
              data-testid={`axle-load-${axle.position}`}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              enterKeyHint="done"
              placeholder="7100"
              className="pr-12 text-lg font-semibold tabular"
              value={loadValue}
              aria-invalid={loadInvalid}
              aria-describedby={describedBy(id("load"), true, loadInvalid)}
              onChange={(e) => setLoad(e.target.value)}
              onBlur={() => setLoadText(null)}
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-subtle">{t("unit.kg")}</span>
          </div>
        </Field>

        {documentedLoads.length > 0 && (
          <details className="group col-span-2" data-testid={`documented-loads-toggle-${axle.position}`}>
            <summary className="flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-lg text-sm text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span>
                {t("axle.documentedLoads")} <span className="text-subtle">({documentedLoads.length})</span>
              </span>
              <ChevronDown aria-hidden className="size-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            {documentedLoads.some((l) => l.status !== "verified") && (
              <p className="mb-2 text-xs text-subtle">{t("axle.documentedLoadsUnverified")}</p>
            )}
            <div className="flex flex-wrap gap-1.5 pt-1" data-testid={`documented-loads-${axle.position}`}>
              {documentedLoads.map((l) => {
                const active = axle.axleLoadKg === l.axleLoadKg;
                return (
                  <button
                    key={l.axleLoadKg}
                    type="button"
                    onClick={() => {
                      setLoadText(null);
                      onChange({ axleLoadKg: l.axleLoadKg });
                    }}
                    aria-pressed={active}
                    className={cn(
                      "h-9 rounded-lg border px-2.5 text-sm tabular transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "border-accent bg-accent/15 text-text"
                        : l.status === "verified"
                          ? "border-border bg-surface-2 text-muted hover:text-text"
                          : "border-dashed border-border bg-transparent text-subtle line-through decoration-subtle/60",
                    )}
                  >
                    {formatKg(l.axleLoadKg)}
                  </button>
                );
              })}
            </div>
          </details>
        )}

        <InlineResult result={result} formatPressure={formatPressure} />
      </CardContent>
    </Card>
  );
}

function InlineResult({
  result,
  formatPressure,
}: {
  result: AxleResult;
  formatPressure: (v: number, d: number) => string;
}) {
  const { t } = useI18n();
  if (result.kind === "incomplete") return null;
  const r = result.result;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "col-span-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm",
        r.status === "exact" ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn",
      )}
    >
      {r.status === "exact" ? (
        <CircleCheck aria-hidden className="size-4 shrink-0" />
      ) : (
        <TriangleAlert aria-hidden className="size-4 shrink-0" />
      )}
      {r.status === "exact" ? (
        <span>
          <strong className="text-base tabular">
            {formatPressure(r.pressureBar, r.pressureDecimals)} {t("results.bar")}
          </strong>{" "}
          <span className="text-muted">· {t("results.coldReminder")}</span>
        </span>
      ) : (
        <span>{t(`reason.${r.reason}`)}</span>
      )}
      <a
        href="#results"
        className="ml-auto inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium underline-offset-2 hover:underline"
      >
        <CircleDot aria-hidden className="size-3.5" />
        {t("results.jump")}
      </a>
    </div>
  );
}
