import { VEHICLE_GROUPS, type VehicleGroup } from "@/data/vehicles";
import type { Application, DocumentId, Mounting, PressureRecord, TableAxle, VerificationStatus } from "@/types/pressure";
import { getDataset, type Dataset } from "./dataset";
import { seriesKey } from "./pressure-validation";
import { parseTireCode } from "./tire-code";

/**
 * Search-first view: tyre size → load-index row → pressure "ladder" (all documented axle loads).
 * Only documented table cells are shown; unverified / flagged cells are listed without a value.
 */

export interface TireSeries {
  key: string;
  group: VehicleGroup;
  documentId: DocumentId;
  application: Application;
  tireSize: string;
  loadIndex: string;
  axle: TableAxle;
  mounting: Mounting;
  pages: number[];
  records: PressureRecord[];
}

function groupOf(documentId: DocumentId): VehicleGroup {
  return (Object.keys(VEHICLE_GROUPS) as VehicleGroup[]).find((g) =>
    (VEHICLE_GROUPS[g] as readonly DocumentId[]).includes(documentId),
  )!;
}

/** Comparable form of a size or a query: letters and digits only, upper case. */
export function compactSize(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export interface SizeEntry {
  tireSize: string;
  groups: VehicleGroup[];
}

export function getSearchableSizes(dataset: Dataset = getDataset()): SizeEntry[] {
  const map = new Map<string, Set<VehicleGroup>>();
  for (const r of dataset.records) {
    const set = map.get(r.tireSize) ?? new Set<VehicleGroup>();
    set.add(groupOf(r.documentId));
    map.set(r.tireSize, set);
  }
  return [...map.entries()]
    .map(([tireSize, groups]) => ({ tireSize, groups: [...groups].sort() }))
    .sort((a, b) => a.tireSize.localeCompare(b.tireSize, "de", { numeric: true }));
}

/** Filter sizes by a free-text query ("315/80", "31580", "315/80 R22.5 156/150", "22,5"). */
export function searchSizes(query: string, sizes: SizeEntry[] = getSearchableSizes()): SizeEntry[] {
  const q = compactSize(query);
  if (!q) return sizes;
  const parsed = parseTireCode(query);
  if (parsed) {
    const exact = sizes.filter((s) => s.tireSize === parsed.tireSize);
    if (exact.length > 0) return exact;
  }
  const starts = sizes.filter((s) => compactSize(s.tireSize).startsWith(q));
  const contains = sizes.filter((s) => !starts.includes(s) && compactSize(s.tireSize).includes(q));
  return [...starts, ...contains];
}

const AXLE_ORDER: TableAxle[] = ["any", "VA", "1.VA", "2.VA", "HA", "1.HA", "2.HA"];
const MOUNTING_ORDER: Mounting[] = ["single", "twin", "unspecified"];
const GROUP_ORDER: VehicleGroup[] = ["truck", "vario"];

/** All table rows (series) for one tyre size across all documents. */
export function getSeriesForSize(tireSize: string, dataset: Dataset = getDataset()): TireSeries[] {
  const map = new Map<string, TireSeries>();
  for (const r of dataset.records) {
    if (r.tireSize !== tireSize) continue;
    const key = seriesKey(r);
    let s = map.get(key);
    if (!s) {
      s = {
        key,
        group: groupOf(r.documentId),
        documentId: r.documentId,
        application: r.application,
        tireSize: r.tireSize,
        loadIndex: r.loadIndex,
        axle: r.axle,
        mounting: r.mounting,
        pages: [],
        records: [],
      };
      map.set(key, s);
    }
    s.records.push(r);
    if (!s.pages.includes(r.page)) s.pages.push(r.page);
  }
  const list = [...map.values()];
  for (const s of list) {
    s.records.sort((a, b) => a.axleLoadKg - b.axleLoadKg);
    s.pages.sort((a, b) => a - b);
  }
  return list.sort(
    (a, b) =>
      GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) ||
      (a.application === b.application ? 0 : a.application === "standard" ? -1 : 1) ||
      AXLE_ORDER.indexOf(a.axle) - AXLE_ORDER.indexOf(b.axle) ||
      MOUNTING_ORDER.indexOf(a.mounting) - MOUNTING_ORDER.indexOf(b.mounting) ||
      a.loadIndex.localeCompare(b.loadIndex, "de", { numeric: true }),
  );
}

export interface LadderStep {
  fromKg: number;
  toKg: number;
  /** Number of documented table columns in this step. */
  columns: number;
  status: VerificationStatus;
  /** Only set for verified steps. */
  pressureBar: number | null;
  pressureDecimals: number;
}

/**
 * Documented axle loads → pressure, with consecutive table columns that carry the SAME verified
 * value merged into one step ("4 600 … 8 700 kg → 5,0 bar"). Unverified / flagged cells are kept as
 * separate steps without a value. No value is created for loads that are not in the table.
 */
export function buildLadder(records: PressureRecord[]): LadderStep[] {
  const steps: LadderStep[] = [];
  for (const r of [...records].sort((a, b) => a.axleLoadKg - b.axleLoadKg)) {
    const last = steps[steps.length - 1];
    if (
      last &&
      r.verification === "verified" &&
      last.status === "verified" &&
      last.pressureBar === r.pressureBar &&
      last.pressureDecimals === r.pressureDecimals
    ) {
      last.toKg = r.axleLoadKg;
      last.columns += 1;
      continue;
    }
    steps.push({
      fromKg: r.axleLoadKg,
      toKg: r.axleLoadKg,
      columns: 1,
      status: r.verification,
      pressureBar: r.verification === "verified" ? r.pressureBar : null,
      pressureDecimals: r.pressureDecimals,
    });
  }
  return steps;
}

export function verifiedRange(records: PressureRecord[]): { min: PressureRecord; max: PressureRecord } | null {
  const verified = records.filter((r) => r.verification === "verified");
  if (verified.length === 0) return null;
  const byPressure = [...verified].sort((a, b) => a.pressureBar - b.pressureBar || a.axleLoadKg - b.axleLoadKg);
  return { min: byPressure[0], max: byPressure[byPressure.length - 1] };
}
