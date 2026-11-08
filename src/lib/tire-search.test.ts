import { describe, expect, it } from "vitest";
import { lookupPressure } from "./pressure-engine";
import { buildLadder, getSearchableSizes, getSeriesForSize, searchSizes, verifiedRange } from "./tire-search";

describe("tyre size search", () => {
  it("finds sizes by partial or full input", () => {
    expect(searchSizes("315/80").map((s) => s.tireSize)).toEqual(["315/80 R 22,5"]);
    expect(searchSizes("31580")[0].tireSize).toBe("315/80 R 22,5");
    expect(searchSizes("315/80 r22.5 156/150").map((s) => s.tireSize)).toEqual(["315/80 R 22,5"]);
    const rim195 = searchSizes("19,5").map((s) => s.tireSize);
    for (const size of ["245/70 R 19,5", "265/70 R 19,5", "285/70 R 19,5", "305/70 R 19,5"]) expect(rim195).toContain(size);
    expect(searchSizes("xyz")).toEqual([]);
  });

  it("labels Vario-only sizes", () => {
    const sizes = getSearchableSizes();
    expect(sizes.find((s) => s.tireSize === "185 R 14 C")?.groups).toEqual(["vario"]);
    expect(sizes.find((s) => s.tireSize === "9,5 R 17,5")?.groups).toEqual(["truck", "vario"]);
    expect(sizes.find((s) => s.tireSize === "315/80 R 22,5")?.groups).toEqual(["truck"]);
  });

  it("lists every table row for a size", () => {
    const series = getSeriesForSize("315/80 R 22,5");
    expect(series.map((s) => `${s.mounting} ${s.loadIndex}`)).toEqual([
      "single 154",
      "single 156",
      "twin 154/150",
      "twin 156/150",
    ]);
    const s195 = getSeriesForSize("285/70 R 19,5").map((s) => `${s.axle} ${s.loadIndex}`);
    expect(s195).toEqual(["1.VA EB 144/145", "1.HA EB 144/145 · ZW 142/143", "2.HA EB 144/145 · ZW 142/143"]);
  });
});

describe("pressure ladder", () => {
  it("merges only consecutive documented columns with the same verified value", () => {
    const twin = getSeriesForSize("315/80 R 22,5").find((s) => s.loadIndex === "156/150")!;
    const ladder = buildLadder(twin.records);
    // 01F p.3/4: 4 600 … 8 700 kg all 5,0 bar (11 + 5 = 16 columns), then 9 000 kg 5,25
    expect(ladder[0]).toMatchObject({ fromKg: 4600, toKg: 8700, columns: 16, pressureBar: 5, status: "verified" });
    expect(ladder[1]).toMatchObject({ fromKg: 9000, toKg: 9000, pressureBar: 5.25 });
    expect(ladder[ladder.length - 1]).toMatchObject({ fromKg: 13400, pressureBar: 8.5 });
    // every step value equals the exact lookup at both ends
    for (const step of ladder.filter((s) => s.status === "verified")) {
      for (const kg of [step.fromKg, step.toKg]) {
        const r = lookupPressure({
          vehicleType: "truck",
          tireSize: "315/80 R 22,5",
          loadIndex: "156/150",
          axlePosition: "any",
          mounting: "twin",
          axleLoadKg: kg,
        });
        expect(r).toMatchObject({ status: "exact", pressureBar: step.pressureBar });
      }
    }
  });

  it("keeps unverified cells as separate steps without a value", () => {
    const single = getSeriesForSize("315/70 R 22,5").find((s) => s.mounting === "single" && s.loadIndex === "156")!;
    const ladder = buildLadder(single.records);
    const unverified = ladder.find((s) => s.fromKg === 4500)!;
    expect(unverified).toMatchObject({ status: "unverified", pressureBar: null, columns: 1 });
  });

  it("reports the verified pressure range", () => {
    const front = getSeriesForSize("385/65 R 22,5").find((s) => s.loadIndex === "160")!;
    const range = verifiedRange(front.records)!;
    expect(range.min).toMatchObject({ pressureBar: 5 });
    expect(range.max).toMatchObject({ pressureBar: 9, axleLoadKg: 9000 });
  });
});
