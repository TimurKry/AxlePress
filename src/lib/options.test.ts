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
