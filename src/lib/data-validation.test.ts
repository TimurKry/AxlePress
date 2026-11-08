import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DOCUMENTS } from "@/data/documents";
import { SOURCE_TABLES } from "@/data/pressure-tables";
import { TYPE_APPLICABILITY } from "@/data/vehicles";
import { getDataset } from "./dataset";
import { pressureRecordSchema, validateRecords } from "./pressure-validation";
import { parseTable } from "./table-parser";

/**
 * Validation of the PRODUCTION dataset (transcribed manufacturer tables).
 * Run with `npm run validate:data`.
 */
describe("production dataset", () => {
  const { records } = getDataset();

  it("parses every table and every row has one token per column", () => {
    for (const table of SOURCE_TABLES) {
      expect(() => parseTable(table), table.id).not.toThrow();
    }
  });

  it("uses unique table ids that reference known documents and available pages", () => {
    const ids = SOURCE_TABLES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const table of SOURCE_TABLES) {
      const doc = DOCUMENTS[table.documentId];
      expect(doc, table.id).toBeDefined();
      expect(doc.pagesAvailable, table.id).toContain(table.page);
    }
  });

  it("every record passes schema validation", () => {
    for (const record of records) {
      const parsed = pressureRecordSchema.safeParse(record);
      expect(parsed.success, `${record.id}: ${parsed.success ? "" : parsed.error.message}`).toBe(true);
    }
  });

  it("has no duplicate or conflicting lookup keys and verified series are monotonic", () => {
    const issues = validateRecords(records);
    expect(issues.map((i) => `${i.type}: ${i.message}`)).toEqual([]);
  });

  it("keeps the documented anomalies out of the verified set", () => {
    const flagged = records.filter((r) => r.verification === "flagged").map((r) => r.id);
    expect(flagged).toEqual(
      expect.arrayContaining([
        "01F-p3-EB-4900:r7:c1", // 355/50 R 22,5 156 @ 5000 kg printed 8,25
        "01D-p1-VA-2900:r3:c7", // 305/70 R 19,5 1.VA @ 4400 kg printed 7,0
        "01D-p1-VA-4500:r0:c5", // 265/70 R 19,5 1.VA @ 5300 kg printed 7,8
      ]),
    );
    for (const id of flagged) {
      expect(records.find((r) => r.id === id)?.note, id).toBeTruthy();
    }
  });

  it("covers every applicability line with at least one table", () => {
    const docsWithTables = new Set(SOURCE_TABLES.map((t) => t.documentId));
    for (const line of TYPE_APPLICABILITY) {
      expect(docsWithTables.has(line.documentId), line.documentId).toBe(true);
    }
  });

  it("reports dataset statistics", () => {
    const verified = records.filter((r) => r.verification === "verified").length;
    const unverified = records.filter((r) => r.verification === "unverified").length;
    const flagged = records.filter((r) => r.verification === "flagged").length;
    // Snapshot of the transcription so that accidental edits are noticed in review.
    expect({ total: records.length, verified, unverified, flagged }).toMatchInlineSnapshot(`
      {
        "flagged": 7,
        "total": 1964,
        "unverified": 63,
        "verified": 1894,
      }
    `);
  });
});

describe("application code isolation", () => {
  it("never imports synthetic fixtures outside of tests", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "__fixtures__") walk(path);
        } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts")) {
          if (readFileSync(path, "utf8").includes("__fixtures__")) offenders.push(path);
        }
      }
    };
    walk(join(process.cwd(), "src"));
    expect(offenders).toEqual([]);
  });
});
