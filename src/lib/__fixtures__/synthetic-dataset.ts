/**
 * ⚠️ SYNTHETIC TEST FIXTURE – NOT MANUFACTURER DATA ⚠️
 *
 * Invented values used only by unit tests to exercise edge cases of the lookup engine.
 * This module must never be imported by application code (enforced by a unit test).
 */
import type { TypeApplicability } from "@/data/vehicles";
import type { SourceTable } from "@/types/pressure";
import type { Dataset } from "../dataset";
import { buildRecords } from "../table-parser";

const SYNTH_DOC = "AP40.15-W-4060-01F" as const;

export const SYNTHETIC_TABLES: SourceTable[] = [
  {
    id: "SYNTH-single",
    documentId: SYNTH_DOC,
    page: 99,
    title: "SYNTHETIC single",
    mounting: "single",
    axle: "any",
    application: "standard",
    columns: ["5000", "6000", "7000", "8000?", "?"],
    rows: [
      { tireSizeRaw: "111/11 R 22,5", loadIndex: "150", cells: "5,0 6,0 7,0 8,0 9,0" },
      { tireSizeRaw: "111/11 R 22,5", loadIndex: "151", cells: "5,0 - _ ? -" },
      { tireSizeRaw: "222/22 R 22,5", loadIndex: "150", cells: "5,0 6,5? 9,0! 7,0 -" },
    ],
    cellNotes: { "2:1": "synthetic unverified", "2:2": "synthetic flagged" },
  },
  {
    id: "SYNTH-twin",
    documentId: SYNTH_DOC,
    page: 99,
    title: "SYNTHETIC twin",
    mounting: "twin",
    axle: "any",
    application: "standard",
    columns: ["9000", "10000"],
    rows: [{ tireSizeRaw: "111/11 R 22,5", loadIndex: "150/146", cells: "6,0 6,5" }],
  },
  {
    id: "SYNTH-axle",
    documentId: "AP40.15-W-4060-01C",
    page: 99,
    title: "SYNTHETIC per axle",
    application: "standard",
    columns: ["3000", "4000"],
    rows: [
      { tireSizeRaw: "333/33 R 17.5", axle: "VA", loadIndexSingle: "130", cells: "6,0 7,0" },
      { tireSizeRaw: "333/33 R 17.5", axle: "HA", loadIndexSingle: "130", loadIndexTwin: "128", cells: "5,0 5,5" },
    ],
  },
];

export const SYNTHETIC_APPLICABILITY: TypeApplicability[] = [
  { documentId: SYNTH_DOC, page: 99, line: 1, patterns: ["999", "998.1"], exclusions: ["999.123"] },
  { documentId: "AP40.15-W-4060-01C", page: 99, line: 1, patterns: ["997"], exclusions: [] },
];

export function syntheticDataset(tables: SourceTable[] = SYNTHETIC_TABLES): Dataset {
  return { records: buildRecords(tables), applicability: SYNTHETIC_APPLICABILITY, tables };
}
