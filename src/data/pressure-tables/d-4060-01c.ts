import type { SourceRow, SourceTable } from "@/types/pressure";

/**
 * AP40.15-D-4060-01C – Reifendrucktabelle Typ 667, 668, 670
 * (Mercedes-Benz AG, printed 2026-03-05, P/03/26), page 1/1. Token conventions: see w-4060-01f.ts.
 *
 * This document does not state single/twin mounting → mounting "unspecified".
 * Load indices are given as printed (e.g. "110/108 N").
 */

const DOC = "AP40.15-D-4060-01C" as const;
const r = (tireSizeRaw: string, loadIndex: string, cells: string): SourceRow => ({
  tireSizeRaw,
  loadIndex,
  cells,
});

export const TABLES_D01C: SourceTable[] = [
  {
    id: "D01C-p1-VA",
    documentId: DOC,
    page: 1,
    title: "Reifen-Luftdruck in bar bei kalten Reifen – Vorderachse",
    axle: "VA",
    mounting: "unspecified",
    application: "standard",
    columns: ["1700", "1800", "1900", "2100", "2300", "2500", "2600", "2800", "3000"],
    rows: [
      r("185 R 14 C", "-", "4,5 - - - - - - - -"),
      r("195/70 R 15 C", "104/102 P", "- 4,5 - - - - - - -"),
      r("205/75 R 16 C", "110/108 N", "- 3,75 4,0 4,5 - - - - -"),
      r("205/75 R 17,5 C", "122/120 M", "- - - - - 5,5 - 6,0 6,25"),
      r("215/75 R 16 C", "113/111 N", "- 3,5 3,75 4,25 4,5 - - - -"),
      r("215/75 R 17,5 C", "124/123 M", "- - - - - 4,5 - 5,5 5,5"),
      r("225/75 R 16 C", "118/116 N", "- - - 4,25 4,25 - 5,25 - -"),
      r("235/75 R 17,5", "130/128 M", "- - - - - - - 5,0 -"),
      r("6,00 R 16 C", "-", "4,75 - - - - - - - -"),
      r("7.00 R 16 C", "113/112 N", "- - - 4,75 5,25 - - - -"),
      r("8 R 17,5", "-", "- - - 4,5? 5,0 - - - -"),
      r("8.5 R 17,5", "121/120 L", "- - - - - 5,25 - 6,0 -"),
      r("9,5 R 17,5", "129/127 L", "- - - - - 5,0 - 5,25 5,5"),
    ],
    cellNotes: {
      "10:3": "Zelle im Foto durch Verschmutzung teilweise verdeckt – Ablesung „4,5“ unsicher.",
    },
  },
  {
    id: "D01C-p1-HA",
    documentId: DOC,
    page: 1,
    title: "Reifen-Luftdruck in bar bei kalten Reifen – Hinterachse",
    axle: "HA",
    mounting: "unspecified",
    application: "standard",
    columns: ["2200", "2500", "2700", "3200", "3300", "3900", "4300", "4700", "5200", "5300", "5600"],
    rows: [
      r("185 R 14 C", "-", "2,75 - 3,75 4,5 - - - - - - -"),
      r("195/70 R 15 C", "104/102 P", "3,0 3,0 - 4,0 - - - - - - -"),
      r("205/75 R 16 C", "110/108 N", "3,0 3,0 3,0 3,75 - 4,75 - - - - -"),
      r("205/75 R 17,5 C", "122/120 M", "- - - - - 4,25 4,75 5,25 5,5 6,0 6,25"),
      r("215/75 R 16 C", "113/111 N", "2,0 2,5 - 3,25 3,5 4,25 4,5 - - - -"),
      r("215/75 R 17,5 C", "124/123 M", "- - - - - 4,25 4,5 4,75 5,75 5,75 6,0"),
      r("225/75 R 16 C", "118/116 N", "- - - 3,0 - 4,0 4,25 4,5 - - -"),
      r("235/75 R 17,5", "130/128 M", "- - - - - - - - - - 5,25"),
      r("6,00 R 16 C", "-", "4,0 - 4,0 4,75 - - - - - - -"),
      r("7.00 R 16 C", "113/112 N", "3,5 3,5 - 3,5 3,75 4,5 5,0 - - - -"),
      r("8 R 17,5", "-", "3,25 3,25 - - 3,5 4,25 - - - - -"),
      r("8.5 R 17,5", "121/120 L", "- - - - - 4,5 5,0 5,25 - 6,0 6,25"),
      r("9,5 R 17,5", "129/127 L", "- - - - - - - - - - 5,5"),
    ],
  },
  {
    id: "D01C-p1-RTW-VA",
    documentId: DOC,
    page: 1,
    title: "Rettungs-/Krankentransportfahrzeug – Vorderachse",
    axle: "VA",
    mounting: "unspecified",
    application: "ambulance",
    columns: ["1700", "1900", "2100", "2300", "2500"],
    rows: [
      r("185 R 14 C", "-", "4,5 - - - -"),
      r("205/75 R 16 C", "110/108 N", "3,75 4,5 4,5 - -"),
      r("215/75 R 16 C", "113/111 N", "- - - 4,5 -"),
    ],
  },
  {
    id: "D01C-p1-RTW-HA",
    documentId: DOC,
    page: 1,
    title: "Rettungs-/Krankentransportfahrzeug – Hinterachse",
    axle: "HA",
    mounting: "unspecified",
    application: "ambulance",
    columns: ["2000", "2200", "2400", "2600", "2800"],
    rows: [
      r("185 R 14 C", "-", "2,5 2,75 3,0 - -"),
      r("205/75 R 16 C", "110/108 N", "2,0 2,25 2,5 2,75 3,0"),
      r("215/75 R 16 C", "113/111 N", "- 2,0 2,5 2,75 3,0"),
    ],
  },
];
