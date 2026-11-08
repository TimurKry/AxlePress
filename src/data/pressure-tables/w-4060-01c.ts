import type { SourceRow, SourceTable, TableAxle } from "@/types/pressure";

/**
 * AP40.15-W-4060-01C – Reifendrucktabelle 17,5″ (Daimler Truck AG, printed 2026-03-05, P/02/26)
 * Page 1/1. Token conventions: see w-4060-01f.ts.
 *
 * Columns "EB" (Einzelbereifung) and "ZW" (Zwillingsbereifung) contain load indices.
 * Rows that list a ZW load index are treated as twin-mounted, rows without one as single.
 */

const DOC = "AP40.15-W-4060-01C" as const;
const r = (
  tireSizeRaw: string,
  axle: TableAxle,
  loadIndexSingle: string,
  loadIndexTwin: string | undefined,
  cells: string,
): SourceRow => ({ tireSizeRaw, axle, loadIndexSingle, loadIndexTwin, cells });

export const TABLES_01C: SourceTable[] = [
  {
    id: "01C-p1-VA-2900",
    documentId: DOC,
    page: 1,
    title: "Reifendrucktabelle 17,5″ – Vorderachse",
    application: "standard",
    columns: ["2900", "3200", "3400", "3600", "3800", "4000", "4100", "4300", "4400"],
    rows: [
      r("9,5 R 17,5", "VA", "129", undefined, "5,9 6,5 6,9 7,3 _ _ _ _ _"),
      r("10,00 R 17,5", "VA", "134", undefined, "5,5 6,0 6,4 6,8 7,2 7,5 7,7 _ _"),
      r("215/75 R 17,5", "VA", "126", undefined, "6,2 6,8 7,2 _ _ _ _ _ _"),
      r("215/75 R 17,5", "VA", "128", undefined, "_ 6,5 6,9 7,3 _ _ _ _ _"),
      r("215/75 R 17,5", "VA", "135", undefined, "_ 6,0 6,4 6,8 7,2 7,6 _ _ _"),
      r("225/75 R 17,5", "VA", "128/129", undefined, "5,9 6,5 6,9 7,3 _ _ _ _ _"),
      r("235/75 R 17,5", "VA", "130/132", undefined, "5,8 6,4 6,8 _ 7,6 8,0 _ _ _"),
      r("245/70 R 17.5", "VA", "136", undefined, "5,5 6,1 6,5 _ 7,2 7,6 7,8 8,2 8,3"),
    ],
  },
  {
    id: "01C-p1-HA-3800",
    documentId: DOC,
    page: 1,
    title: "Reifendrucktabelle 17,5″ – Hinterachse",
    application: "standard",
    columns: ["3800", "4300", "4600", "5000", "5300", "5700", "5900", "6000", "6200"],
    rows: [
      r("9,5 R 17,5", "HA", "129", "127", "5,0 _ 5,0 5,4 5,7 6,1 6,3 6,4 6,6"),
      r("10,00 R 17,5", "HA", "134", "132", "5,0 _ _ _ 5,3 5,7 5,9 6,0 6,2"),
      r("215/75 R 17,5", "HA", "126", "124", "5,0 _ 5,2 5,7 6,0 6,5 6,7 6,8 7,0"),
      r("215/75 R 17,5", "HA", "133/135", undefined, "_ 8,5 _ _ _ _ _ _ _"),
      r("225/75 R 17,5", "HA", "128/129", "126/127", "5,0 _ 5,0 5,4 5,7 6,1 6,3 6,4 6,6"),
      r("235/75 R 17,5", "HA", "130/132", "128/130", "5,0 _ 5,0 5,3 5,6 6,0 6,2 6,3 6,5"),
      r("245/70 R 17.5", "HA", "136", "134", "5,0 _ 5,0 5,0 5,3 5,7 5,9 6,0 6,2"),
    ],
  },
  {
    id: "01C-p1-HA-6700",
    documentId: DOC,
    page: 1,
    title: "Reifendrucktabelle 17,5″ – Hinterachse",
    application: "standard",
    columns: ["6700", "6800", "7000", "7200", "7800", "8100", "8300"],
    rows: [
      r("9,5 R 17,5", "HA", "129", "127", "7,2 7,3 7,5 _ _ _ _"),
      r("10,00 R 17,5", "HA", "134", "132", "6,7 6,8 7,0 7,2 7,8 _ _"),
      r("225/75 R 17,5", "HA", "128/129", "126/127", "7,2 7,3 7,5 _ _ _ _"),
      r("235/75 R 17,5", "HA", "130/132", "128/130", "7,1 7,2 7,4 7,6 _ _ _"),
      r("245/70 R 17.5", "HA", "136", "134", "6,7 6,8 7,0 7,2 7,8 8,1 8,3"),
    ],
  },
];
