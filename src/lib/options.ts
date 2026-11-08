import type { Application, AxleConfiguration, AxleRole, Mounting, PressureRecord, TableAxle, VerificationStatus } from "@/types/pressure";
import { getDataset, type Dataset } from "./dataset";
import { getApplicableDocumentIds } from "./vehicle-types";

/**
 * Helpers for the dependent selection fields. Every option list is derived from the
 * dataset, so invalid combinations cannot be selected in the UI.
 * Order of dependency: factory type → tyre size → mounting → table axle → load index.
 */

const naturalCompare = (a: string, b: string) => a.localeCompare(b, "de", { numeric: true });

export interface Scope {
  vehicleType: string;
  application: Application;
}

function scopeRecords(scope: Scope, dataset: Dataset): PressureRecord[] {
  const docs = getApplicableDocumentIds(scope.vehicleType, dataset.applicability);
  if (docs.size === 0) return [];
  return dataset.records.filter((r) => docs.has(r.documentId) && r.application === scope.application);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function hasAmbulanceTables(vehicleType: string, dataset: Dataset = getDataset()): boolean {
  return scopeRecords({ vehicleType, application: "ambulance" }, dataset).length > 0;
}

export function getTireSizes(scope: Scope, dataset: Dataset = getDataset()): string[] {
  return unique(scopeRecords(scope, dataset).map((r) => r.tireSize)).sort(naturalCompare);
}

export function getMountings(scope: Scope, tireSize: string, dataset: Dataset = getDataset()): Mounting[] {
  const order: Mounting[] = ["single", "twin", "unspecified"];
  const found = new Set(scopeRecords(scope, dataset).filter((r) => r.tireSize === tireSize).map((r) => r.mounting));
  return order.filter((m) => found.has(m));
}

const AXLE_ORDER: TableAxle[] = ["any", "VA", "1.VA", "2.VA", "HA", "1.HA", "2.HA"];

export function getTableAxles(
  scope: Scope,
  tireSize: string,
  mounting: Mounting,
  dataset: Dataset = getDataset(),
): TableAxle[] {
  const found = new Set(
    scopeRecords(scope, dataset)
      .filter((r) => r.tireSize === tireSize && r.mounting === mounting)
      .map((r) => r.axle),
  );
  return AXLE_ORDER.filter((a) => found.has(a));
}

export function getLoadIndices(
  scope: Scope,
  tireSize: string,
  mounting: Mounting,
  axle: TableAxle,
  dataset: Dataset = getDataset(),
): string[] {
  return unique(
    scopeRecords(scope, dataset)
      .filter((r) => r.tireSize === tireSize && r.mounting === mounting && r.axle === axle)
      .map((r) => r.loadIndex),
  ).sort(naturalCompare);
}

export interface DocumentedLoad {
  axleLoadKg: number;
  status: VerificationStatus;
}

/** Documented axle loads for a complete series (for the quick-pick chips). */
export function getDocumentedLoads(
  scope: Scope,
  tireSize: string,
  mounting: Mounting,
  axle: TableAxle,
  loadIndex: string,
  dataset: Dataset = getDataset(),
): DocumentedLoad[] {
  const byLoad = new Map<number, VerificationStatus>();
  for (const r of scopeRecords(scope, dataset)) {
    if (r.tireSize !== tireSize || r.mounting !== mounting || r.axle !== axle || r.loadIndex !== loadIndex) continue;
    const prev = byLoad.get(r.axleLoadKg);
    // A load counts as verified only if every record at that load is verified.
    byLoad.set(r.axleLoadKg, prev && prev !== "verified" ? prev : r.verification);
  }
  return [...byLoad.entries()].map(([axleLoadKg, status]) => ({ axleLoadKg, status })).sort((a, b) => a.axleLoadKg - b.axleLoadKg);
}

/**
 * Suggest the table axle designation for an axle from its role and order.
 * Steering axles → VA / n.VA, all other axles → HA / n.HA. Returns "" when no
 * suggestion is available among the documented options (user must choose).
 */
export function suggestTableAxle(
  axles: Pick<AxleConfiguration, "id" | "role">[],
  axleId: string,
  available: TableAxle[],
): TableAxle | "" {
  if (available.length === 1) return available[0];
  const axle = axles.find((a) => a.id === axleId);
  if (!axle) return "";
  const isFront = (role: AxleRole) => role === "steering";
  const group = axles.filter((a) => isFront(a.role) === isFront(axle.role));
  const ordinal = group.findIndex((a) => a.id === axleId) + 1;
  const prefix = isFront(axle.role) ? "VA" : "HA";
  const candidates = [`${ordinal}.${prefix}`, prefix] as TableAxle[];
  return candidates.find((c) => available.includes(c)) ?? "";
}

/**
 * Bring an axle configuration into a consistent state: every dependent field must be one of
 * the documented options for its parents; otherwise it is cleared. Single options are
 * auto-selected (this is not a guess – there is only one documented choice).
 */
export function normalizeAxle(
  axle: AxleConfiguration,
  allAxles: AxleConfiguration[],
  scope: Scope,
  dataset: Dataset = getDataset(),
): AxleConfiguration {
  const next: AxleConfiguration = { ...axle };
  const sizes = getTireSizes(scope, dataset);
  if (!sizes.includes(next.tireSize)) next.tireSize = "";
  if (!next.tireSize) return { ...next, mounting: "", tableAxle: "", loadIndex: "" };

  const mountings = getMountings(scope, next.tireSize, dataset);
  if (!mountings.includes(next.mounting as Mounting)) next.mounting = mountings.length === 1 ? mountings[0] : "";
  if (!next.mounting) return { ...next, tableAxle: "", loadIndex: "" };

  const axles = getTableAxles(scope, next.tireSize, next.mounting, dataset);
  if (!axles.includes(next.tableAxle as TableAxle)) {
    next.tableAxle = suggestTableAxle(allAxles, axle.id, axles);
  }
  if (!next.tableAxle) return { ...next, loadIndex: "" };

  const indices = getLoadIndices(scope, next.tireSize, next.mounting, next.tableAxle, dataset);
  if (!indices.includes(next.loadIndex)) next.loadIndex = indices.length === 1 ? indices[0] : "";
  return next;
}
