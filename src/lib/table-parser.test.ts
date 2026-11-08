import { describe, expect, it } from "vitest";
import type { SourceTable } from "@/types/pressure";
import { loadIndexKey, normalizeTireSize, parseCellToken, parseColumnHeader, parseTable, TableParseError } from "./table-parser";

describe("table parser", () => {
  it("parses cell tokens and preserves precision", () => {
    expect(parseCellToken("6,75")).toMatchObject({ kind: "value", value: 6.75, decimals: 2, status: "verified" });
    expect(parseCellToken("5,0")).toMatchObject({ value: 5, decimals: 1 });
    expect(parseCellToken("7,0?")).toMatchObject({ value: 7, status: "unverified" });
    expect(parseCellToken("8,25!")).toMatchObject({ value: 8.25, status: "flagged" });
    expect(parseCellToken("-")).toMatchObject({ kind: "dash", value: null });
    expect(parseCellToken("_")).toMatchObject({ kind: "empty", value: null });
    expect(parseCellToken("?")).toMatchObject({ kind: "illegible", value: null, status: "unverified" });
    expect(() => parseCellToken("5.0")).toThrow(TableParseError);
    expect(() => parseCellToken("0")).toThrow(TableParseError);
  });

  it("parses column headers", () => {
    expect(parseColumnHeader("2900")).toMatchObject({ kg: 2900, status: "verified" });
    expect(parseColumnHeader("4500?")).toMatchObject({ kg: 4500, status: "unverified" });
    expect(parseColumnHeader("?")).toMatchObject({ kg: null, status: "unverified" });
    expect(() => parseColumnHeader("10.000")).toThrow(TableParseError);
  });

  it("normalises tyre sizes", () => {
    expect(normalizeTireSize("245/70 R 17.5")).toBe("245/70 R 17,5");
    expect(normalizeTireSize("7.00  R 16 C")).toBe("7,00 R 16 C");
  });

  it("builds load index keys", () => {
    expect(loadIndexKey({ tireSizeRaw: "x", loadIndex: "156/150", cells: "" })).toBe("156/150");
    expect(loadIndexKey({ tireSizeRaw: "x", loadIndexSingle: "129", loadIndexTwin: "127", cells: "" })).toBe("EB 129 · ZW 127");
    expect(loadIndexKey({ tireSizeRaw: "x", loadIndexSingle: "136", cells: "" })).toBe("EB 136");
  });

  const table = (over: Partial<SourceTable>): SourceTable => ({
    id: "T",
    documentId: "AP40.15-W-4060-01F",
    page: 2,
    title: "t",
    mounting: "single",
    axle: "any",
    application: "standard",
    columns: ["1000", "2000"],
    rows: [{ tireSizeRaw: "1 R 22,5", loadIndex: "1", cells: "5,0 6,0" }],
    ...over,
  });

  it("rejects rows with the wrong number of cells", () => {
    expect(() => parseTable(table({ rows: [{ tireSizeRaw: "1 R 22,5", loadIndex: "1", cells: "5,0" }] }))).toThrow(
      /expected 2/,
    );
  });

  it("rejects notes on verified or missing cells", () => {
    expect(() => parseTable(table({ cellNotes: { "0:0": "x" } }))).toThrow(/verified cell/);
    expect(() => parseTable(table({ cellNotes: { "5:0": "x" } }))).toThrow(/missing cell/);
  });

  it("downgrades values under an unverified column header", () => {
    const parsed = parseTable(table({ columns: ["1000", "2000?"] }));
    expect(parsed.rows[0].cells[1].status).toBe("unverified");
  });
});
