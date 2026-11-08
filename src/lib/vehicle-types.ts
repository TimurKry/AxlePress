import { FAMILY_MAPPINGS, TYPE_APPLICABILITY, type FamilyMapping, type TypeApplicability } from "@/data/vehicles";
import type { DocumentId, VehicleFamily } from "@/types/pressure";

const BAUMUSTER = /^\d{3}(\.\d{1,3})?$/;

/**
 * Normalise user input for a factory type (Baumuster).
 * Accepts "963", "963.4", "963.403", "963403", "963 403". Returns null if invalid.
 */
export function normalizeBaumuster(input: string): string | null {
  const compact = input.trim().replace(/\s+/g, "");
  if (BAUMUSTER.test(compact)) return compact;
  if (/^\d{4,6}$/.test(compact)) return `${compact.slice(0, 3)}.${compact.slice(3)}`;
  return null;
}

/**
 * Extract the Baumuster from a 17-character vehicle identification number (FIN/VIN).
 * For Mercedes-Benz trucks, characters 4–9 typically encode the Baumuster
 * (e.g. W1T967009… → 967.009). This is a helper only – the user must confirm the
 * result against the type plate.
 */
export function baumusterFromVin(input: string): string | null {
  const vin = input.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return null;
  const digits = vin.slice(3, 9);
  if (!/^\d{6}$/.test(digits)) return null;
  return `${digits.slice(0, 3)}.${digits.slice(3)}`;
}

/** True when the Baumuster is at least as specific as the pattern and starts with it. */
export function matchesPattern(baumuster: string, pattern: string): boolean {
  if (baumuster === pattern) return true;
  if (!pattern.includes(".")) return baumuster.startsWith(`${pattern}.`);
  return baumuster.startsWith(pattern);
}

export interface ApplicableDocument {
  documentId: DocumentId;
  page: number;
  line: number;
  pattern: string;
  /** Exclusions that cannot be ruled out because the Baumuster is not specific enough. */
  unresolvedExclusions: string[];
}

export function getApplicableDocuments(
  vehicleType: string,
  applicability: TypeApplicability[] = TYPE_APPLICABILITY,
): ApplicableDocument[] {
  const baumuster = normalizeBaumuster(vehicleType);
  if (!baumuster) return [];
  const result: ApplicableDocument[] = [];
  for (const entry of applicability) {
    const pattern = entry.patterns.find((p) => matchesPattern(baumuster, p));
    if (!pattern) continue;
    if (entry.exclusions.some((ex) => matchesPattern(baumuster, ex))) continue;
    const unresolvedExclusions = entry.exclusions.filter(
      (ex) => ex.startsWith(baumuster) && ex !== baumuster && matchesPattern(ex, pattern),
    );
    result.push({ documentId: entry.documentId, page: entry.page, line: entry.line, pattern, unresolvedExclusions });
  }
  return result;
}

export function getApplicableDocumentIds(
  vehicleType: string,
  applicability: TypeApplicability[] = TYPE_APPLICABILITY,
): Set<DocumentId> {
  return new Set(getApplicableDocuments(vehicleType, applicability).map((d) => d.documentId));
}

function comparePatterns(a: string, b: string): number {
  return a.localeCompare(b, "en", { numeric: true });
}

export interface TypeOption {
  /** Pattern as printed (expanded), used as the factory type value. */
  value: string;
  series: string;
  family: Exclude<VehicleFamily, "advanced"> | null;
  familyLabel: string | null;
  documents: DocumentId[];
  exclusions: string[];
}

/** All factory-type patterns found in the documents, sorted. */
export function getAllTypeOptions(applicability: TypeApplicability[] = TYPE_APPLICABILITY): TypeOption[] {
  const byPattern = new Map<string, TypeOption>();
  for (const entry of applicability) {
    for (const pattern of entry.patterns) {
      const series = pattern.slice(0, 3);
      const mapping: FamilyMapping | undefined = FAMILY_MAPPINGS.find((m) => m.series === series);
      const existing = byPattern.get(pattern);
      const exclusions = entry.exclusions.filter((ex) => matchesPattern(ex, pattern));
      if (existing) {
        if (!existing.documents.includes(entry.documentId)) existing.documents.push(entry.documentId);
        existing.exclusions.push(...exclusions.filter((e) => !existing.exclusions.includes(e)));
      } else {
        byPattern.set(pattern, {
          value: pattern,
          series,
          family: mapping?.family ?? null,
          familyLabel: mapping?.label ?? null,
          documents: [entry.documentId],
          exclusions,
        });
      }
    }
  }
  return [...byPattern.values()].sort((a, b) => comparePatterns(a.value, b.value));
}

export function getTypeOptionsForFamily(family: VehicleFamily | ""): TypeOption[] {
  const all = getAllTypeOptions();
  if (family === "advanced") return all;
  if (!family) return [];
  return all.filter((o) => o.family === family);
}

export function familyForType(vehicleType: string): Exclude<VehicleFamily, "advanced"> | null {
  const baumuster = normalizeBaumuster(vehicleType);
  if (!baumuster) return null;
  return FAMILY_MAPPINGS.find((m) => m.series === baumuster.slice(0, 3))?.family ?? null;
}
