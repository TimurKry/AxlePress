"use client";

import { FileText, Info, TriangleAlert, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { describedBy, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Segmented } from "@/components/ui/segmented";
import { DOCUMENTS } from "@/data/documents";
import { useI18n } from "@/i18n";
import { hasAmbulanceTables } from "@/lib/options";
import {
  baumusterFromVin,
  familyForType,
  getApplicableDocuments,
  getTypeOptionsForFamily,
  matchesPattern,
  normalizeBaumuster,
} from "@/lib/vehicle-types";
import type { Application, VehicleConfiguration, VehicleFamily } from "@/types/pressure";
import { SectionHeading } from "./section-heading";

interface Props {
  config: VehicleConfiguration;
  onFamily: (family: VehicleFamily) => void;
  onFactoryType: (factoryType: string, family?: VehicleFamily) => void;
  onApplication: (application: Application) => void;
}

const FAMILY_ORDER: VehicleFamily[] = ["actros", "arocs", "atego", "advanced"];

export function VehicleSection({ config, onFamily, onFactoryType, onApplication }: Props) {
  const { t } = useI18n();
  const [exactInput, setExactInput] = useState<string | null>(null);
  const [exactError, setExactError] = useState<string | null>(null);
  const [vinNote, setVinNote] = useState<string | null>(null);

  const options = useMemo(() => getTypeOptionsForFamily(config.vehicleFamily), [config.vehicleFamily]);

  // The most specific listed pattern that the current factory type belongs to.
  const selectedPattern = useMemo(() => {
    const matching = options.filter((o) => config.factoryType && matchesPattern(config.factoryType, o.value));
    return matching.sort((a, b) => b.value.length - a.value.length)[0]?.value ?? "";
  }, [options, config.factoryType]);

  const isExact = config.factoryType !== "" && config.factoryType !== selectedPattern;
  const exactValue = exactInput ?? (isExact ? config.factoryType : "");
  const docs = useMemo(() => (config.factoryType ? getApplicableDocuments(config.factoryType) : []), [config.factoryType]);
  const unresolved = [...new Set(docs.flatMap((d) => d.unresolvedExclusions))];
  const showApplication = config.factoryType !== "" && hasAmbulanceTables(config.factoryType);

  function applyExact(raw: string) {
    setExactInput(raw);
    setVinNote(null);
    const trimmed = raw.trim();
    if (!trimmed) {
      setExactError(null);
      if (isExact) onFactoryType(selectedPattern);
      return;
    }
    const fromVin = trimmed.length === 17 ? baumusterFromVin(trimmed) : null;
    const baumuster = fromVin ?? normalizeBaumuster(trimmed);
    if (!baumuster) {
      setExactError(t("vehicle.invalidType"));
      return;
    }
    if (fromVin) setVinNote(t("vehicle.fromVin", { bm: fromVin }));
    if (getApplicableDocuments(baumuster).length === 0) {
      setExactError(t("vehicle.noDocs"));
      return;
    }
    const family = config.vehicleFamily || familyForType(baumuster) || "advanced";
    const familyOptions = getTypeOptionsForFamily(family);
    if (!familyOptions.some((o) => matchesPattern(baumuster, o.value))) {
      setExactError(t("vehicle.mismatch", { bm: baumuster, type: t(`family.${family}`) }));
      return;
    }
    // If a different series than the selected one was typed, the typed value wins.
    setExactError(null);
    onFactoryType(baumuster, family);
  }

  return (
    <section aria-labelledby="vehicle-heading" className="scroll-mt-20" id="vehicle">
      <Card>
        <CardHeader>
          <SectionHeading id="vehicle-heading" icon={<Truck />} title={t("vehicle.title")} step={t("vehicle.step")} />
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Segmented<VehicleFamily>
            name="family"
            label={t("vehicle.family")}
            value={config.vehicleFamily}
            onChange={(f) => {
              setExactInput(null);
              setExactError(null);
              setVinNote(null);
              onFamily(f);
            }}
            options={FAMILY_ORDER.map((f) => ({ value: f, label: t(`family.${f}`), testId: `family-${f}` }))}
          />

          <Field
            id="factory-type"
            label={t("vehicle.type")}
            hint={config.vehicleFamily ? t("vehicle.typeHint") : t("vehicle.familyFirst")}
          >
            <NativeSelect
              id="factory-type"
              data-testid="factory-type"
              value={selectedPattern}
              disabled={!config.vehicleFamily}
              aria-describedby={describedBy("factory-type", true)}
              onChange={(e) => {
                setExactInput(null);
                setExactError(null);
                setVinNote(null);
                onFactoryType(e.target.value);
              }}
            >
              <option value="">{t("vehicle.typePlaceholder")}</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value}
                  {o.familyLabel ? ` · ${o.familyLabel}` : ""}
                  {` (${o.documents.map((d) => DOCUMENTS[d].rimLabel).join(", ")})`}
                </option>
              ))}
            </NativeSelect>
          </Field>

          {config.vehicleFamily && config.vehicleFamily !== "advanced" && (
            <p className="flex gap-2 rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-subtle">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
              {t("vehicle.mappingNote")}
            </p>
          )}

          <Field
            id="exact-type"
            label={t("vehicle.exactType")}
            hint={vinNote ?? t("vehicle.exactTypeHint")}
            error={exactError}
          >
            <Input
              id="exact-type"
              data-testid="exact-type"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              placeholder={t("vehicle.exactTypePlaceholder")}
              value={exactValue}
              aria-invalid={!!exactError}
              aria-describedby={describedBy("exact-type", true, exactError)}
              onChange={(e) => applyExact(e.target.value)}
              onBlur={() => {
                if (!exactError) setExactInput(null);
              }}
            />
          </Field>

          {unresolved.length > 0 && (
            <p role="note" className="flex gap-2 rounded-xl border border-warn/30 bg-warn-bg p-3 text-sm text-warn">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {t("vehicle.exclusion", { list: unresolved.join(", ") })}
            </p>
          )}

          {docs.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted">{t("vehicle.documents")}</span>
              <ul className="flex flex-wrap gap-2" data-testid="applicable-docs">
                {[...new Map(docs.map((d) => [d.documentId, d])).values()].map((d) => (
                  <li key={d.documentId}>
                    <Badge variant="accent">
                      <FileText aria-hidden />
                      {d.documentId} · {DOCUMENTS[d.documentId].rimLabel}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showApplication && (
            <Segmented<Application>
              name="application"
              label={t("vehicle.application")}
              value={config.application}
              columns="grid-cols-1 sm:grid-cols-2"
              onChange={onApplication}
              options={[
                { value: "standard", label: t("application.standard") },
                { value: "ambulance", label: t("application.ambulance") },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
