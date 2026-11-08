import type { SourceRow, SourceTable, TableAxle } from "@/types/pressure";

/**
 * AP40.15-W-4060-01D – Reifendrucktabelle 19,5″ (Daimler Truck AG, printed 2026-03-05, P/02/26)
 * Pages 1/2 and 2/2. Token conventions: see w-4060-01f.ts.
 *
 * Columns "EB" / "ZW" contain load indices (Einzel- / Zwillingsbereifung).
 * Rows that list a ZW load index are treated as twin-mounted, rows without one as single.
 */

const DOC = "AP40.15-W-4060-01D" as const;
const r = (
  tireSizeRaw: string,
  axle: TableAxle,
  loadIndexSingle: string,
  loadIndexTwin: string | undefined,
  cells: string,
): SourceRow => ({ tireSizeRaw, axle, loadIndexSingle, loadIndexTwin, cells });

const MOUNTING_AMBIGUOUS =
  "Wert entspricht exakt der Einzelbereifungs-Kurve (vgl. 1. VA), obwohl die Zeile einen ZW-Loadindex angibt und höhere Achslasten der Zwillings-Kurve folgen. Bereifungsart unklar – Rückfrage beim Hersteller erforderlich.";

export const TABLES_01D: SourceTable[] = [
  // ───────────────────────────── Page 1 ─────────────────────────────
  {
    id: "01D-p1-VA-2900",
    documentId: DOC,
    page: 1,
    title: "Reifendrucktabelle 19,5″",
    application: "standard",
    columns: ["2900", "3200", "3400", "3800", "4000", "4100", "4300", "4400?"],
    columnNotes: {
      7: "Spaltenkopf durch Reflexion teilweise verdeckt (letzte Ziffer). Ablesung „4400“ unsicher – alle Werte dieser Spalte unverifiziert.",
    },
    rows: [
      r("245/70 R 19,5", "1.VA", "136", undefined, "_ 5,5 6,0 6,8 7,3 _ _ 7,8"),
      r("265/70 R 19,5", "1.VA", "140", undefined, "5,0 5,1 5,4 6,1 6,4 6,6 6,9 7,0"),
      r("285/70 R 19,5", "1.VA", "144/145", undefined, "5,0 5,0 5,2 5,8 6,1 6,2 6,5 6,7"),
      r("305/70 R 19,5", "1.VA", "147/148", undefined, "5,0 5,0 5,0 5,0 5,7 5,9 6,1 7,0!"),
    ],
    cellNotes: {
      "3:7":
        "Gedruckt „7,0“ – nicht monoton gegenüber 4500 kg (6,4 bar) der Folgetabelle. Zusätzlich Spaltenkopf unsicher. Nicht verwendbar.",
    },
  },
  {
    id: "01D-p1-VA-4500",
    documentId: DOC,
    page: 1,
    title: "Reifendrucktabelle 19,5″",
    application: "standard",
    columns: ["4500", "4700", "4900", "5000", "5100", "5300", "5400", "5450"],
    rows: [
      r("265/70 R 19,5", "1.VA", "140", undefined, "7,2 7,5 7,8 8,0 _ 7,8! _ _"),
      r("285/70 R 19,5", "1.VA", "144/145", undefined, "6,8 7,1 7,4 7,6 7,7 8,0 8,2 8,3"),
      r("305/70 R 19,5", "1.VA", "147/148", undefined, "6,4 6,7 7,0 7,1 7,3 7,6 7,7 7,8"),
    ],
    cellNotes: {
      "0:5":
        "Gedruckt „7,8“ – nicht monoton (5000 kg: 8,0 bar) und oberhalb der Tragfähigkeit für LI 140 bei Einzelbereifung (2 × 2500 kg). Nicht verwendbar.",
    },
  },
  {
    id: "01D-p1-VA-5600",
    documentId: DOC,
    page: 1,
    title: "Reifendrucktabelle 19,5″",
    application: "standard",
    // The printed table has two further columns without header and without values.
    columns: ["5600", "5700", "6000", "6100", "6300"],
    rows: [
      r("285/70 R 19,5", "1.VA", "144/145", undefined, "8,5 _ _ _ _"),
      r("305/70 R 19,5", "1.VA", "147/148", undefined, "8,0 8,1 8,6 8,7 9,0"),
      r("305/70 R 19,5", "2.VA", "147/148", undefined, "_ _ 8,6 _ 9,0"),
    ],
  },
  {
    id: "01D-p1-HA-3200",
    documentId: DOC,
    page: 1,
    title: "Reifendrucktabelle 19,5″",
    application: "standard",
    columns: ["3200", "3800", "4600", "5000", "5100", "5300", "5700", "5900"],
    rows: [
      r("245/70 R 19,5", "1.HA", "136", undefined, "5,5 6,8 _ _ _ _ _ _"),
      r("265/70 R 19,5", "1.HA", "140", "138", "_ 5,0 5,0 5,0 _ 5,0 5,0 5,0"),
      r("285/70 R 19,5", "1.HA", "144/145", "142/143", "_ 5,0 5,0 5,0 _ 5,0 5,0 5,0"),
      r("265/70 R 19,5", "2.HA", "140", "138", "_ _ _ _ 5,0 _ _ _"),
    ],
  },
  {
    id: "01D-p1-HA-6000",
    documentId: DOC,
    page: 1,
    title: "Reifendrucktabelle 19,5″",
    application: "standard",
    columns: ["6000", "6100", "6200", "6700", "6800", "7000", "7200", "7500"],
    rows: [
      r("265/70 R 19,5", "1.HA", "140", "138", "5,1 _ 5,3 5,7 5,8 5,9 6,1 _"),
      r("285/70 R 19,5", "1.HA", "144/145", "142/143", "5,0 _ 5,0 5,4 5,5 5,6 5,8 _"),
      r("285/70 R 19,5", "2.HA", "144/145", "142/143", "5,0 5,0 _ _ _ _ _ 6,0"),
    ],
  },
  {
    id: "01D-p1-HA-7800",
    documentId: DOC,
    page: 1,
    title: "Reifendrucktabelle 19,5″",
    application: "standard",
    columns: ["7800", "8000", "8100", "8300", "8900", "9000", "9300", "9500"],
    rows: [
      r("245/70 R 19,5", "1.HA", "136", "136", "_ _ 7,6 _ _ _ _ _"),
      r("265/70 R 19,5", "1.HA", "140", "138", "6,6 _ 6,9 7,0 7,5 7,6 7,9 _"),
      r("285/70 R 19,5", "1.HA", "144/145", "142/143", "6,3 _ 6,5 6,7 7,1 7,2 7,5 7,6"),
      r("265/70 R 19,5", "2.HA", "140", "138", "_ _ _ _ _ 7,6 _ _"),
      r("285/70 R 19,5", "2.HA", "144/145", "142/143", "_ 6,4 _ _ _ 7,2 _ 7,6"),
    ],
  },
  {
    id: "01D-p1-HA-10000",
    documentId: DOC,
    page: 1,
    title: "Reifendrucktabelle 19,5″",
    application: "standard",
    columns: ["10000", "10100", "10300", "10400", "10500", "10800", "11200"],
    rows: [
      r("285/70 R 19,5", "1.HA", "144/145", "142/143", "8,0 8,1 8,3 8,3 8,4 8,7 9,0"),
      r("285/70 R 19,5", "2.HA", "144/145", "142/143", "8,0 _ _ _ 8,4 _ _"),
    ],
  },
  {
    id: "01D-p1-HA-3800-305",
    documentId: DOC,
    page: 1,
    title: "Reifendrucktabelle 19,5″",
    application: "standard",
    columns: ["3800", "4600", "5000", "5100", "5700", "5900", "6000", "6100"],
    rows: [
      r("305/70 R 19,5", "1.HA", "147/148", "145", "5,0 5,0 5,0 _ _ 5,0 5,0 _"),
      r("305/70 R 19,5", "1.HA", "147/148", undefined, "_ _ _ _ 8,1 _ _ _"),
      r("305/70 R 19,5", "2.HA", "147/148", "145", "_ _ _ 7,3! _ _ 8,6! 8,7!"),
    ],
    cellNotes: {
      "2:3": MOUNTING_AMBIGUOUS,
      "2:6": MOUNTING_AMBIGUOUS,
      "2:7": MOUNTING_AMBIGUOUS,
    },
  },
  {
    id: "01D-p1-HA-6200-305",
    documentId: DOC,
    page: 1,
    title: "Reifendrucktabelle 19,5″",
    application: "standard",
    columns: ["6200", "6300", "6700", "7000", "7200", "7800", "8000", "8100"],
    rows: [
      r("305/70 R 19,5", "1.HA", "147/148", "145", "5,0 _ 5,2 5,4 5,6 6,1 _ 6,3"),
      r("305/70 R 19,5", "1.HA", "147/148", undefined, "8,9 _ _ _ _ _ _ _"),
      r("305/70 R 19,5", "2.HA", "147/148", "145", "_ 9,0! _ _ _ _ 6,2 _"),
    ],
    cellNotes: {
      "2:1": MOUNTING_AMBIGUOUS,
    },
  },
  // ───────────────────────────── Page 2 ─────────────────────────────
  {
    id: "01D-p2-HA-8300-305",
    documentId: DOC,
    page: 2,
    title: "Reifendrucktabelle 19,5″",
    application: "standard",
    columns: ["8300", "8800", "8900", "9000", "9300", "9500", "10000", "10100"],
    rows: [
      r("305/70 R 19,5", "1.HA", "147/148", "145", "6,4 _ 6,9 7,0 7,2 7,4 7,8 7,8"),
      r("305/70 R 19,5", "2.HA", "147/148", "145", "_ 6,8 _ 7,0 _ 7,4 7,8 _"),
    ],
  },
  {
    id: "01D-p2-HA-10300-305",
    documentId: DOC,
    page: 2,
    title: "Reifendrucktabelle 19,5″",
    application: "standard",
    columns: ["10300", "10400", "10500", "10800", "11000", "11200", "11500"],
    rows: [
      r("305/70 R 19,5", "1.HA", "147/148", "145", "8,0 8,1 8,1 8,4 8,5 8,7 8,9"),
      r("305/70 R 19,5", "2.HA", "147/148", "145", "_ _ 8,1 _ _ _ _"),
    ],
  },
];
