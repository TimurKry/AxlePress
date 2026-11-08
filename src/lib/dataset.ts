import { SOURCE_TABLES } from "@/data/pressure-tables";
import { TYPE_APPLICABILITY, type TypeApplicability } from "@/data/vehicles";
import type { PressureRecord, SourceTable } from "@/types/pressure";
import { buildRecords, parseTable, type ParsedTable } from "./table-parser";

/** A dataset is the set of records plus the factory-type applicability lines. */
export interface Dataset {
  records: PressureRecord[];
  applicability: TypeApplicability[];
  tables: SourceTable[];
}

let cached: Dataset | null = null;
const parsedCache = new Map<string, ParsedTable>();

/** The production dataset built from the transcribed manufacturer tables. */
export function getDataset(): Dataset {
  if (!cached) {
    cached = {
      records: buildRecords(SOURCE_TABLES),
      applicability: TYPE_APPLICABILITY,
      tables: SOURCE_TABLES,
    };
  }
  return cached;
}

export function getParsedTable(tableId: string, dataset: Dataset = getDataset()): ParsedTable | null {
  const hit = parsedCache.get(tableId);
  if (hit && dataset === cached) return hit;
  const table = dataset.tables.find((t) => t.id === tableId);
  if (!table) return null;
  const parsed = parseTable(table);
  if (dataset === cached) parsedCache.set(tableId, parsed);
  return parsed;
}
