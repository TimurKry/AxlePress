import { describe, expect, it } from "vitest";
import type { AxleConfiguration } from "@/types/pressure";
import {
  getDocumentedLoads,
  getLoadIndices,
  getMountings,
  getTableAxles,
  getTireSizes,
  hasAmbulanceTables,
  normalizeAxle,
  suggestTableAxle,
} from "./options";

const scope963 = { vehicleType: "963", application: "standard" as const };
const scope967 = { vehicleType: "967", application: "standard" as const };

const axle = (over: Partial<AxleConfiguration>): AxleConfiguration => ({
  id: "a1",
  position: 1,
  role: "steering",
  tireSize: "",
  tableAxle: "",
  loadIndex: "",
  mounting: "",
  axleLoadKg: null,
  ...over,
});

describe("dependent options", () => {
  it("lists only documented tyre sizes for the factory type", () => {
    const sizes = getTireSizes(scope963);
    expect(sizes).toContain("315/80 R 22,5");
    expect(sizes).toContain("245/70 R 17,5");
    expect(sizes).not.toContain("285/70 R 19,5");
  });

  it("filters mounting, axle and load index", () => {
    expect(getMountings(scope963, "315/80 R 22,5")).toEqual(["single", "twin"]);
    expect(getTableAxles(scope963, "315/80 R 22,5", "twin")).toEqual(["any"]);
    expect(getLoadIndices(scope963, "315/80 R 22,5", "twin", "any")).toEqual(["154/150", "156/150"]);
    expect(getTableAxles(scope967, "285/70 R 19,5", "twin")).toEqual(["1.HA", "2.HA"]);
  });

  it("returns documented loads with verification status", () => {
    const loads = getDocumentedLoads(scope963, "315/70 R 22,5", "single", "any", "156");
    expect(loads.find((l) => l.axleLoadKg === 4400)?.status).toBe("verified");
    expect(loads.find((l) => l.axleLoadKg === 4500)?.status).toBe("unverified");
  });

  it("suggests table axles from role and order", () => {
    const axles = [
      { id: "1", role: "steering" as const },
      { id: "2", role: "driven" as const },
      { id: "3", role: "trailing" as const },
    ];
    expect(suggestTableAxle(axles, "1", ["1.VA", "2.VA", "1.HA", "2.HA"])).toBe("1.VA");
    expect(suggestTableAxle(axles, "3", ["1.VA", "1.HA", "2.HA"])).toBe("2.HA");
    expect(suggestTableAxle(axles, "2", ["VA", "HA"])).toBe("HA");
    expect(suggestTableAxle(axles, "3", ["1.HA"])).toBe("1.HA");
    expect(suggestTableAxle(axles, "1", ["1.HA", "2.HA"])).toBe("");
  });

  it("clears dependent fields that become invalid", () => {
    const a = axle({ tireSize: "315/80 R 22,5", mounting: "twin", loadIndex: "156/150", tableAxle: "any" });
    expect(normalizeAxle(a, [a], scope963)).toMatchObject({ loadIndex: "156/150", tableAxle: "any" });
    // twin mounting stays valid for 245/70 R 17,5 (rear axle only) → axle and load index follow
    const changed = normalizeAxle({ ...a, tireSize: "245/70 R 17,5" }, [a], scope963);
    expect(changed).toMatchObject({ mounting: "twin", tableAxle: "HA", loadIndex: "EB 136 · ZW 134" });
    const single = normalizeAxle({ ...a, tireSize: "245/70 R 17,5", mounting: "single" }, [a], scope963);
    expect(single).toMatchObject({ tableAxle: "VA", loadIndex: "EB 136" });
    const unknown = normalizeAxle({ ...a, tireSize: "999/99 R 22,5" }, [a], scope963);
    expect(unknown).toMatchObject({ tireSize: "", mounting: "", loadIndex: "", tableAxle: "" });
  });

  it("detects ambulance tables", () => {
    expect(hasAmbulanceTables("670")).toBe(true);
    expect(hasAmbulanceTables("963")).toBe(false);
  });
});

describe("quick entry and defaults", () => {
  it("pre-selects mounting and load index from the sidewall code when unambiguous", () => {
    const rear = axle({ id: "r", role: "driven", tireSize: "315/80 R 22,5", tireCode: "315/80 R22.5 156/150 L" });
    // 315/80 R 22,5 exists single (154, 156) and twin (154/150, 156/150) – the code alone matches both mountings
    const n = normalizeAxle(rear, [rear], scope963);
    expect(n.mounting).toBe("");
    const twin = normalizeAxle({ ...rear, mounting: "twin" }, [rear], scope963);
    expect(twin).toMatchObject({ tableAxle: "any", loadIndex: "156/150" });
    const single = normalizeAxle({ ...rear, mounting: "single" }, [rear], scope963);
    expect(single).toMatchObject({ loadIndex: "156" });
  });

  it("selects the mounting from the code when only one mounting matches", () => {
    const a = axle({ id: "x", role: "driven", tireSize: "9,5 R 17,5", tireCode: "9.5 R 17.5 129/127" });
    // EB 129 · ZW 127 only exists on the rear axle (twin); VA single "EB 129" also matches 129 → two mountings
    expect(normalizeAxle(a, [a], scope967).mounting).toBe("");
    const b = axle({ id: "y", role: "driven", tireSize: "315/70 R 22,5", tireCode: "315/70 R22.5 154/150" });
    // single table has 315/70 LI 154 (matches 154), twin table has 148/150 (150 matches twin) → still two
    expect(normalizeAxle(b, [b], scope963).mounting).toBe("");
  });

  it("ignores a code that refers to a different tyre size", () => {
    const a = axle({ id: "z", role: "driven", tireSize: "385/65 R 22,5", mounting: "single", tableAxle: "any", tireCode: "315/80 R22.5 156" });
    expect(normalizeAxle(a, [a], scope963).loadIndex).toBe("");
  });

  it("defaults steering axles to single mounting", () => {
    const front = axle({ id: "f", role: "steering", tireSize: "315/80 R 22,5" });
    expect(normalizeAxle(front, [front], scope963)).toMatchObject({ mounting: "single", tableAxle: "any", loadIndex: "" });
    const drive = axle({ id: "d", role: "driven", tireSize: "315/80 R 22,5" });
    expect(normalizeAxle(drive, [drive], scope963).mounting).toBe("");
  });
});
