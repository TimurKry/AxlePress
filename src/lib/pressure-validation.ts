import { z } from "zod";
import type { PressureRecord } from "@/types/pressure";

const documentId = z.enum([
  "AP40.15-W-4060-01C",
  "AP40.15-W-4060-01D",
  "AP40.15-W-4060-01F",
  "AP40.15-D-4060-01C",
]);

export const pressureRecordSchema = z
  .object({
    id: z.string().min(1),
    documentId,
    page: z.number().int().positive(),
    tableId: z.string().min(1),
    rowIndex: z.number().int().nonnegative(),
    colIndex: z.number().int().nonnegative(),
    tireSize: z.string().regex(/^[0-9,/]+ R \d{2}(,\d)?( C)?$/),
    tireSizeRaw: z.string().min(1),
    loadIndex: z.string().min(1),
    axle: z.enum(["any", "VA", "HA", "1.VA", "2.VA", "1.HA", "2.HA"]),
    mounting: z.enum(["single", "twin", "unspecified"]),
    application: z.enum(["standard", "ambulance"]),
    axleLoadKg: z.number().int().min(1000).max(20000),
    pressureBar: z.number().min(1).max(10),
    pressureDecimals: z.number().int().min(1).max(2),
    rawCell: z.string().min(1),
    verification: z.enum(["verified", "unverified", "flagged"]),
    note: z.string().optional(),
  })
  .strict()
  .superRefine((record, ctx) => {
    if (record.verification !== "verified" && !record.note) {
      ctx.addIssue({ code: "custom", message: "Non-verified records must carry an explanatory note" });
    }
  });

/** Key identifying one lookup cell. Two records with the same key are duplicates. */
export function lookupKey(r: Pick<PressureRecord, "documentId" | "application" | "tireSize" | "loadIndex" | "axle" | "mounting" | "axleLoadKg">): string {
  return [r.documentId, r.application, r.tireSize, r.loadIndex, r.axle, r.mounting, r.axleLoadKg].join("|");
}

/** Key identifying a series (one table row across all its continuation tables). */
export function seriesKey(r: Pick<PressureRecord, "documentId" | "application" | "tireSize" | "loadIndex" | "axle" | "mounting">): string {
  return [r.documentId, r.application, r.tireSize, r.loadIndex, r.axle, r.mounting].join("|");
}

export interface ValidationIssue {
  type: "schema" | "duplicate" | "conflict" | "non_monotonic";
  message: string;
  recordIds: string[];
}

export function validateRecords(records: PressureRecord[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const record of records) {
    const parsed = pressureRecordSchema.safeParse(record);
    if (!parsed.success) {
      issues.push({
        type: "schema",
        message: `${record.id}: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
        recordIds: [record.id],
      });
    }
  }

  const byKey = new Map<string, PressureRecord[]>();
  for (const record of records) {
    const key = lookupKey(record);
    byKey.set(key, [...(byKey.get(key) ?? []), record]);
  }
  for (const [key, group] of byKey) {
    if (group.length < 2) continue;
    const distinct = new Set(group.map((r) => r.pressureBar));
    issues.push({
      type: distinct.size > 1 ? "conflict" : "duplicate",
      message: `${distinct.size > 1 ? "Conflicting" : "Duplicate"} records for ${key}: ${group
        .map((r) => `${r.id}=${r.pressureBar}`)
        .join(", ")}`,
      recordIds: group.map((r) => r.id),
    });
  }

  issues.push(...findMonotonicityViolations(records));
  return issues;
}

/**
 * Within one series, verified pressures must not decrease with increasing axle load.
 * Implausible printed values must be marked "flagged" in the data files – otherwise this fails.
 */
export function findMonotonicityViolations(records: PressureRecord[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const series = new Map<string, PressureRecord[]>();
  for (const r of records) {
    if (r.verification !== "verified") continue;
    const key = seriesKey(r);
    series.set(key, [...(series.get(key) ?? []), r]);
  }
  for (const [key, group] of series) {
    const sorted = [...group].sort((a, b) => a.axleLoadKg - b.axleLoadKg);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].pressureBar < sorted[i - 1].pressureBar) {
        issues.push({
          type: "non_monotonic",
          message: `${key}: ${sorted[i - 1].axleLoadKg} kg → ${sorted[i - 1].pressureBar} bar, ${sorted[i].axleLoadKg} kg → ${sorted[i].pressureBar} bar`,
          recordIds: [sorted[i - 1].id, sorted[i].id],
        });
      }
    }
  }
  return issues;
}
