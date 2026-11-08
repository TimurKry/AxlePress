import type { ColumnHeader, ParsedCell, PressureLookupInput, SourceTable } from "@/types/pressure";
import { getDataset, getParsedTable, type Dataset } from "./dataset";
import { loadIndexKey, normalizeTireSize, rowAxle, rowMounting } from "./table-parser";
import { getApplicableDocumentIds } from "./vehicle-types";

export interface SeriesRow {
  table: SourceTable;
  rowIndex: number;
  columns: ColumnHeader[];
  cells: ParsedCell[];
}

/**
 * All original table rows (including rows that contain only dashes) that belong to the
 * selected series – used for the "Originaltabellenwerte anzeigen" view.
 */
export function getSeriesRows(
  input: Omit<PressureLookupInput, "axleLoadKg">,
  dataset: Dataset = getDataset(),
): SeriesRow[] {
  const docs = getApplicableDocumentIds(input.vehicleType, dataset.applicability);
  const application = input.application ?? "standard";
  const result: SeriesRow[] = [];
  for (const table of dataset.tables) {
    if (!docs.has(table.documentId) || table.application !== application) continue;
    const parsed = getParsedTable(table.id, dataset);
    if (!parsed) continue;
    parsed.rows.forEach(({ row, cells }, rowIndex) => {
      if (
        normalizeTireSize(row.tireSizeRaw) === input.tireSize &&
        loadIndexKey(row) === input.loadIndex &&
        rowAxle(table, row) === input.axlePosition &&
        rowMounting(table, row) === input.mounting
      ) {
        result.push({ table, rowIndex, columns: parsed.columns, cells });
      }
    });
  }
  return result;
}
