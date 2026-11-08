import { describe, expect, it } from "vitest";
import type { PressureLookupInput, SourceTable } from "@/types/pressure";
import { syntheticDataset, SYNTHETIC_TABLES } from "./__fixtures__/synthetic-dataset";
import { lookupPressure } from "./pressure-engine";

// ⚠️ All values in this file come from the SYNTHETIC fixture unless noted otherwise.
const ds = syntheticDataset();

const base: PressureLookupInput = {
  vehicleType: "999",
  tireSize: "111/11 R 22,5",
  loadIndex: "150",
  axlePosition: "any",
  mounting: "single",
  axleLoadKg: 6000,
};

describe("lookupPressure (synthetic fixture)", () => {
  it("returns an exact match with source reference", () => {
    const result = lookupPressure(base, ds);
    expect(result).toMatchObject({
      status: "exact",
      pressureBar: 6,
      pressureDecimals: 1,
      sourceId: "AP40.15-W-4060-01F",
      sourcePage: 99,
      matchedAxleLoadKg: 6000,
    });
  });

  it("matches a more specific Baumuster against a series pattern", () => {
    expect(lookupPressure({ ...base, vehicleType: "999.456" }, ds).status).toBe("exact");
    expect(lookupPressure({ ...base, vehicleType: "998.105" }, ds).status).toBe("exact");
  });

  it("rejects an unknown vehicle type", () => {
    expect(lookupPressure({ ...base, vehicleType: "123" }, ds)).toMatchObject({
      status: "unavailable",
      reason: "unknown_vehicle_type",
    });
  });

  it("rejects a Baumuster that is less specific than the documented pattern", () => {
    // pattern is "998.1" – "998" alone could also be 998.2, which is not documented
    expect(lookupPressure({ ...base, vehicleType: "998" }, ds)).toMatchObject({ reason: "unknown_vehicle_type" });
  });

  it("honours explicit exclusions", () => {
    expect(lookupPressure({ ...base, vehicleType: "999.123" }, ds)).toMatchObject({ reason: "unknown_vehicle_type" });
  });

  it("rejects an unknown tyre size without substituting a similar one", () => {
    expect(lookupPressure({ ...base, tireSize: "111/12 R 22,5" }, ds)).toMatchObject({ reason: "unknown_tire_size" });
  });

  it("rejects an incorrect load index", () => {
    expect(lookupPressure({ ...base, loadIndex: "152" }, ds)).toMatchObject({ reason: "unknown_load_index" });
  });

  it("does not substitute single for twin mounting", () => {
    expect(lookupPressure({ ...base, tireSize: "222/22 R 22,5", mounting: "twin" }, ds)).toMatchObject({
      reason: "unsupported_mounting",
    });
    // twin table exists for 111/11 but with a different load index → no cross-over
    expect(lookupPressure({ ...base, mounting: "twin", axleLoadKg: 9000 }, ds)).toMatchObject({
      reason: "unknown_load_index",
    });
  });

  it("rejects an unsupported axle configuration", () => {
    expect(lookupPressure({ ...base, axlePosition: "HA" }, ds)).toMatchObject({ reason: "unsupported_axle" });
    expect(
      lookupPressure(
        { ...base, vehicleType: "997", tireSize: "333/33 R 17,5", loadIndex: "EB 130", axlePosition: "HA", axleLoadKg: 3000 },
        ds,
      ),
    ).toMatchObject({ reason: "unsupported_axle" });
  });

  it("separates front and rear axle tables", () => {
    const front = lookupPressure(
      { ...base, vehicleType: "997", tireSize: "333/33 R 17,5", loadIndex: "EB 130", axlePosition: "VA", axleLoadKg: 4000 },
      ds,
    );
    const rear = lookupPressure(
      {
        ...base,
        vehicleType: "997",
        tireSize: "333/33 R 17,5",
        loadIndex: "EB 130 · ZW 128",
        axlePosition: "HA",
        mounting: "twin",
        axleLoadKg: 4000,
      },
      ds,
    );
    expect(front).toMatchObject({ status: "exact", pressureBar: 7 });
    expect(rear).toMatchObject({ status: "exact", pressureBar: 5.5 });
  });

  it("never treats dash, empty or illegible cells as values", () => {
    for (const axleLoadKg of [6000, 7000]) {
      const result = lookupPressure({ ...base, loadIndex: "151", axleLoadKg }, ds);
      expect(result.status).toBe("unavailable");
      expect(result).toMatchObject({ reason: "above_documented_range" });
    }
  });

  it("refuses unverified values", () => {
    const result = lookupPressure({ ...base, tireSize: "222/22 R 22,5", axleLoadKg: 6000 }, ds);
    expect(result).toMatchObject({ status: "unavailable", reason: "unverified_value" });
  });

  it("refuses values in a column with an unverified header", () => {
    const result = lookupPressure({ ...base, axleLoadKg: 8000 }, ds);
    expect(result).toMatchObject({ status: "unavailable", reason: "unverified_value" });
  });

  it("refuses flagged (implausible) values", () => {
    const result = lookupPressure({ ...base, tireSize: "222/22 R 22,5", axleLoadKg: 7000 }, ds);
    expect(result).toMatchObject({ status: "unavailable", reason: "flagged_value" });
  });

  it("does not interpolate between columns and reports verified neighbours", () => {
    const result = lookupPressure({ ...base, axleLoadKg: 6500 }, ds);
    expect(result).toMatchObject({
      status: "unavailable",
      reason: "no_exact_match",
      lower: { axleLoadKg: 6000, pressureBar: 6 },
      higher: { axleLoadKg: 7000, pressureBar: 7 },
      range: { minKg: 5000, maxKg: 7000 },
    });
  });

  it("does not extrapolate beyond the documented range", () => {
    expect(lookupPressure({ ...base, axleLoadKg: 7500 }, ds)).toMatchObject({
      reason: "above_documented_range",
      lower: { axleLoadKg: 7000 },
    });
    expect(lookupPressure({ ...base, axleLoadKg: 4000 }, ds)).toMatchObject({
      reason: "below_documented_range",
      higher: { axleLoadKg: 5000 },
    });
  });

  it("validates numeric input", () => {
    for (const axleLoadKg of [Number.NaN, Number.POSITIVE_INFINITY, -100, 0, 7000.5, 1_000_000]) {
      expect(lookupPressure({ ...base, axleLoadKg }, ds)).toMatchObject({ status: "unavailable", reason: "invalid_input" });
    }
    expect(lookupPressure({ ...base, vehicleType: "" }, ds)).toMatchObject({ reason: "invalid_input" });
    // @ts-expect-error – deliberately invalid mounting
    expect(lookupPressure({ ...base, mounting: "triple" }, ds)).toMatchObject({ reason: "invalid_input" });
  });

  it("refuses to answer when duplicate records conflict", () => {
    const conflicting: SourceTable = {
      ...SYNTHETIC_TABLES[0],
      id: "SYNTH-conflict",
      rows: [{ tireSizeRaw: "111/11 R 22,5", loadIndex: "150", cells: "5,0 6,25 7,0 - -" }],
      cellNotes: undefined,
    };
    const result = lookupPressure(base, syntheticDataset([...SYNTHETIC_TABLES, conflicting]));
    expect(result).toMatchObject({ status: "unavailable", reason: "conflicting_records" });
  });

  it("is deterministic", () => {
    const a = lookupPressure({ ...base, axleLoadKg: 6500 }, ds);
    const b = lookupPressure({ ...base, axleLoadKg: 6500 }, ds);
    expect(a).toEqual(b);
  });
});
