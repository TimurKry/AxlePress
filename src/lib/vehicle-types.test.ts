import { describe, expect, it } from "vitest";
import {
  baumusterFromVin,
  familyForType,
  getAllTypeOptions,
  getApplicableDocuments,
  getTypeOptionsForFamily,
  matchesPattern,
  normalizeBaumuster,
} from "./vehicle-types";

describe("vehicle types", () => {
  it("normalises Baumuster input", () => {
    expect(normalizeBaumuster("963")).toBe("963");
    expect(normalizeBaumuster(" 963.403 ")).toBe("963.403");
    expect(normalizeBaumuster("963403")).toBe("963.403");
    expect(normalizeBaumuster("96")).toBeNull();
    expect(normalizeBaumuster("abc")).toBeNull();
    expect(normalizeBaumuster("963.4031")).toBeNull();
  });

  it("extracts the Baumuster from a VIN", () => {
    expect(baumusterFromVin("W1T96700910785698")).toBe("967.009");
    expect(baumusterFromVin("W1T9670091078569")).toBeNull();
    expect(baumusterFromVin("W1TABCDEF10785698")).toBeNull();
  });

  it("matches patterns only when the Baumuster is at least as specific", () => {
    expect(matchesPattern("963.403", "963")).toBe(true);
    expect(matchesPattern("934.215", "934.2")).toBe(true);
    expect(matchesPattern("934", "934.2")).toBe(false);
    expect(matchesPattern("9631.0", "963")).toBe(false);
  });

  it("resolves documents per Baumuster", () => {
    const ids = (t: string) => getApplicableDocuments(t).map((d) => d.documentId).sort();
    expect(ids("963")).toEqual(["AP40.15-W-4060-01C", "AP40.15-W-4060-01F"]);
    expect(ids("967.009")).toEqual(["AP40.15-W-4060-01C", "AP40.15-W-4060-01D", "AP40.15-W-4060-01F"]);
    expect(ids("970.6")).toEqual(["AP40.15-W-4060-01D"]);
    expect(ids("934.0")).toEqual(["AP40.15-W-4060-01F"]);
    expect(ids("670")).toEqual(["AP40.15-D-4060-01C"]);
    expect(ids("956.264")).toEqual([]);
  });

  it("resolves table groups without a model selection", () => {
    const ids = (t: string) => getApplicableDocuments(t).map((d) => d.documentId).sort();
    expect(ids("truck")).toEqual(["AP40.15-W-4060-01C", "AP40.15-W-4060-01D", "AP40.15-W-4060-01F"]);
    expect(ids("vario")).toEqual(["AP40.15-D-4060-01C"]);
  });

  it("reports exclusions that cannot be ruled out", () => {
    const [doc] = getApplicableDocuments("956");
    expect(doc.unresolvedExclusions).toEqual(["956.264", "956.265"]);
    expect(getApplicableDocuments("956.100")[0].unresolvedExclusions).toEqual([]);
  });

  it("maps only publicly referenced series to families", () => {
    expect(familyForType("963.403")).toBe("actros");
    expect(familyForType("964")).toBe("arocs");
    expect(familyForType("967")).toBe("atego");
    expect(familyForType("944.0")).toBeNull();
    expect(getTypeOptionsForFamily("arocs").map((o) => o.value)).toEqual(["964"]);
    expect(getTypeOptionsForFamily("advanced").length).toBe(getAllTypeOptions().length);
  });
});
