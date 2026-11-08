import type {
  ColumnHeader,
  Mounting,
  ParsedCell,
  PressureRecord,
  SourceRow,
  SourceTable,
  TableAxle,
  VerificationStatus,
} from "@/types/pressure";

/**
 * Cell token grammar (see src/data/pressure-tables/w-4060-01f.ts):
 *   "5,0"   value, verified           "5,0?"  value, unverified reading
 *   "8,25!" value, flagged anomaly    "?"     illegible
 *   "-"     printed dash              "_"     empty cell
 */
const VALUE_TOKEN = /^(\d{1,2}),(\d{1,2})([?!])?$/;
const HEADER_TOKEN = /^(\d{3,5})(\?)?$/;

export class TableParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TableParseError";
  }
}

export function parseCellToken(raw: string): ParsedCell {
  if (raw === "-") return { kind: "dash", raw, value: null, decimals: 0, status: "verified" };
  if (raw === "_") return { kind: "empty", raw, value: null, decimals: 0, status: "verified" };
  if (raw === "?") return { kind: "illegible", raw, value: null, decimals: 0, status: "unverified" };
  const match = VALUE_TOKEN.exec(raw);
  if (!match) throw new TableParseError(`Invalid cell token "${raw}"`);
  const [, whole, fraction, marker] = match;
  const value = Number(`${whole}.${fraction}`);
  const status: VerificationStatus = marker === "?" ? "unverified" : marker === "!" ? "flagged" : "verified";
  return { kind: "value", raw, value, decimals: fraction.length, status };
}

export function parseColumnHeader(raw: string, note?: string): ColumnHeader {
  if (raw === "?") return { kg: null, raw, status: "unverified", note };
  const match = HEADER_TOKEN.exec(raw);
  if (!match) throw new TableParseError(`Invalid column header "${raw}"`);
  return { kg: Number(match[1]), raw, status: match[2] ? "unverified" : "verified", note };
}

/** "245/70 R 17.5" → "245/70 R 17,5"; "7.00 R 16 C" → "7,00 R 16 C". */
export function normalizeTireSize(raw: string): string {
  return raw.replace(/\./g, ",").replace(/\s+/g, " ").trim();
}

/** Canonical load-index key used by the lookup. */
export function loadIndexKey(row: SourceRow): string {
  if (row.loadIndex !== undefined) return row.loadIndex.trim();
  if (row.loadIndexSingle === undefined) {
    throw new TableParseError(`Row "${row.tireSizeRaw}" has no load index`);
  }
  const single = `EB ${row.loadIndexSingle.trim()}`;
  return row.loadIndexTwin ? `${single} · ZW ${row.loadIndexTwin.trim()}` : single;
}

export function rowMounting(table: SourceTable, row: SourceRow): Mounting {
  if (table.mounting) return table.mounting;
  return row.loadIndexTwin ? "twin" : "single";
}

export function rowAxle(table: SourceTable, row: SourceRow): TableAxle {
  return row.axle ?? table.axle ?? "any";
}

export function splitCells(row: SourceRow): string[] {
  return row.cells.trim().split(/\s+/);
}

function combineStatus(cell: VerificationStatus, column: VerificationStatus): VerificationStatus {
  if (cell === "flagged") return "flagged";
  if (cell === "unverified" || column === "unverified") return "unverified";
  return "verified";
}

export interface ParsedTable {
  table: SourceTable;
  columns: ColumnHeader[];
  rows: { row: SourceRow; cells: ParsedCell[] }[];
}

export function parseTable(table: SourceTable): ParsedTable {
  const columns = table.columns.map((raw, i) => parseColumnHeader(raw, table.columnNotes?.[i]));
  const rows = table.rows.map((row, rowIndex) => {
    const tokens = splitCells(row);
    if (tokens.length !== columns.length) {
      throw new TableParseError(
        `Table ${table.id} row ${rowIndex} (${row.tireSizeRaw}) has ${tokens.length} cells, expected ${columns.length}`,
      );
    }
    const cells = tokens.map((token, colIndex) => {
      const cell = parseCellToken(token);
      const status = cell.kind === "value" ? combineStatus(cell.status, columns[colIndex].status) : cell.status;
      const note = table.cellNotes?.[`${rowIndex}:${colIndex}`] ?? (status !== "verified" ? columns[colIndex].note : undefined);
      return { ...cell, status, note };
    });
    return { row, cells };
  });
  // Notes must refer to existing, non-verified cells – catches typos in the data files.
  for (const key of Object.keys(table.cellNotes ?? {})) {
    const [r, c] = key.split(":").map(Number);
    const cell = rows[r]?.cells[c];
    if (!cell) throw new TableParseError(`Table ${table.id}: cell note ${key} refers to a missing cell`);
    if (cell.status === "verified") {
      throw new TableParseError(`Table ${table.id}: cell note ${key} is attached to a verified cell`);
    }
  }
  return { table, columns, rows };
}

/** Convert a parsed table into lookup records – one per numeric cell with a known axle load. */
export function tableToRecords(parsed: ParsedTable): PressureRecord[] {
  const { table, columns } = parsed;
  const records: PressureRecord[] = [];
  parsed.rows.forEach(({ row, cells }, rowIndex) => {
    cells.forEach((cell, colIndex) => {
      const column = columns[colIndex];
      if (cell.kind !== "value" || cell.value === null || column.kg === null) return;
      records.push({
        id: `${table.id}:r${rowIndex}:c${colIndex}`,
        documentId: table.documentId,
        page: table.page,
        tableId: table.id,
        rowIndex,
        colIndex,
        tireSize: normalizeTireSize(row.tireSizeRaw),
        tireSizeRaw: row.tireSizeRaw,
        loadIndex: loadIndexKey(row),
        axle: rowAxle(table, row),
        mounting: rowMounting(table, row),
        application: table.application,
        axleLoadKg: column.kg,
        pressureBar: cell.value,
        pressureDecimals: cell.decimals,
        rawCell: cell.raw,
        verification: cell.status,
        note: cell.note,
      });
    });
  });
  return records;
}

export function buildRecords(tables: SourceTable[]): PressureRecord[] {
  return tables.flatMap((t) => tableToRecords(parseTable(t)));
}
