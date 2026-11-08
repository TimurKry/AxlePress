/**
 * Core domain types for TruckPressure.
 *
 * The data flow is:
 *   SourceTable (literal transcription of a photographed table)
 *     → PressureRecord[] (one record per numeric cell, see lib/table-parser.ts)
 *       → lookup engine (lib/pressure-engine.ts)
 */

export type DocumentId =
  | "AP40.15-W-4060-01C"
  | "AP40.15-W-4060-01D"
  | "AP40.15-W-4060-01F"
  | "AP40.15-D-4060-01C";

/** Tyre mounting as stated by the source table. */
export type Mounting = "single" | "twin" | "unspecified";

/**
 * Axle designation exactly as used in the source table.
 * - "any": the table does not distinguish axles (22.5″ document 01F).
 * - "VA"/"HA": front / rear axle (17.5″ document, type 667/668/670 document).
 * - "1.VA"/"2.VA"/"1.HA"/"2.HA": numbered axles (19.5″ document).
 */
export type TableAxle = "any" | "VA" | "HA" | "1.VA" | "2.VA" | "1.HA" | "2.HA";

/** Vehicle application the table is valid for. */
export type Application = "standard" | "ambulance";

/**
 * Verification status of a single table cell.
 * - verified:   value is clearly legible in the photograph and consistent with its row.
 * - unverified: value (or its column header) is partially obscured (glare, smudge) – the
 *               reading is a best guess and MUST NOT be used for a recommendation.
 * - flagged:    value is legible, but implausible (e.g. breaks monotonicity, contradicts the
 *               row's load index) – it is preserved as printed but MUST NOT be used.
 */
export type VerificationStatus = "verified" | "unverified" | "flagged";

/** How a table cell looked in the source. */
export type CellKind = "value" | "dash" | "empty" | "illegible";

export interface SourceDocument {
  id: DocumentId;
  title: string;
  publisher: string;
  /** Print date visible in the page footer. */
  printed: string;
  /** Revision marker visible in the page footer (e.g. "P/02/26"). */
  revision: string;
  rimLabel: string;
  totalPages: number;
  /** Pages for which a photograph was provided. */
  pagesAvailable: number[];
  /** "Typ" lines exactly as printed on the first page. */
  typeLines: { page: number; text: string; rim: string }[];
  /** Notes printed on the document, quoted verbatim (German). */
  notes: string[];
}

export interface ColumnHeader {
  /** Axle load in kg, or null if the header is illegible. */
  kg: number | null;
  /** Header text as printed (normalised whitespace). */
  raw: string;
  status: VerificationStatus;
  note?: string;
}

export interface SourceRow {
  tireSizeRaw: string;
  /** Load index for 22.5″ and type 667/668/670 tables (single column). */
  loadIndex?: string;
  /** EB / ZW load index columns (17.5″ / 19.5″ tables). */
  loadIndexSingle?: string;
  loadIndexTwin?: string;
  /** Axle column (17.5″ / 19.5″ tables). */
  axle?: TableAxle;
  /** Space-separated cell tokens, one per column (see lib/table-parser.ts). */
  cells: string;
}

export interface SourceTable {
  id: string;
  documentId: DocumentId;
  page: number;
  title: string;
  /** Table-level axle (when the table is per axle) – rows may override. */
  axle?: TableAxle;
  /** Table-level mounting (22.5″ tables) – otherwise derived per row. */
  mounting?: Mounting;
  application: Application;
  columns: string[];
  rows: SourceRow[];
  /** Explanations for unverified / flagged cells, keyed "rowIndex:colIndex". */
  cellNotes?: Record<string, string>;
  /** Explanations for columns, keyed by column index. */
  columnNotes?: Record<number, string>;
}

export interface ParsedCell {
  kind: CellKind;
  raw: string;
  value: number | null;
  /** Number of decimals as printed (to preserve original precision). */
  decimals: number;
  status: VerificationStatus;
  note?: string;
}

export interface PressureRecord {
  id: string;
  documentId: DocumentId;
  page: number;
  tableId: string;
  rowIndex: number;
  colIndex: number;
  tireSize: string;
  tireSizeRaw: string;
  /** Canonical load index key used for lookup. */
  loadIndex: string;
  axle: TableAxle;
  mounting: Mounting;
  application: Application;
  axleLoadKg: number;
  pressureBar: number;
  pressureDecimals: number;
  rawCell: string;
  verification: VerificationStatus;
  note?: string;
}

export interface PressureLookupInput {
  /** Factory type (Baumuster), e.g. "963", "930.0" or "963.403". */
  vehicleType: string;
  tireSize: string;
  loadIndex: string;
  axlePosition: TableAxle;
  mounting: Mounting;
  axleLoadKg: number;
  application?: Application;
}

export type UnavailableReason =
  | "invalid_input"
  | "unknown_vehicle_type"
  | "unknown_tire_size"
  | "unsupported_mounting"
  | "unsupported_axle"
  | "unknown_load_index"
  | "below_documented_range"
  | "above_documented_range"
  | "no_exact_match"
  | "unverified_value"
  | "flagged_value"
  | "conflicting_records";

export interface NeighborEntry {
  axleLoadKg: number;
  pressureBar: number;
  pressureDecimals: number;
  documentId: DocumentId;
  page: number;
}

export type PressureLookupResult =
  | {
      status: "exact";
      pressureBar: number;
      pressureDecimals: number;
      sourceId: DocumentId;
      sourcePage: number;
      matchedAxleLoadKg: number;
      record: PressureRecord;
    }
  | {
      status: "unavailable";
      reason: UnavailableReason;
      /** Developer-facing explanation (English). UI text comes from i18n. */
      detail: string;
      /** Nearest verified documented values below / above the requested load. */
      lower?: NeighborEntry;
      higher?: NeighborEntry;
      /** The matched record when it exists but must not be used. */
      record?: PressureRecord;
      /** Verified documented range for the selected combination. */
      range?: { minKg: number; maxKg: number };
    };

export type AxleRole = "steering" | "driven" | "trailing" | "lift";

export interface AxleConfiguration {
  id: string;
  position: number;
  role: AxleRole;
  tireSize: string;
  /** Axle designation used in the source table (VA/HA/1.HA …, or "any"). */
  tableAxle: TableAxle | "";
  loadIndex: string;
  mounting: Mounting | "";
  axleLoadKg: number | null;
}

export type VehicleFamily = "actros" | "arocs" | "atego" | "advanced";

export interface VehicleConfiguration {
  vehicleFamily: VehicleFamily | "";
  factoryType: string;
  application: Application;
  axles: AxleConfiguration[];
}
