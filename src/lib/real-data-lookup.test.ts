import { describe, expect, it } from "vitest";
import { lookupPressure } from "./pressure-engine";

/**
 * Spot checks against the PRODUCTION dataset. Each expectation was read directly from the
 * photographed manufacturer page referenced in the comment.
 */
describe("lookupPressure (production data spot checks)", () => {
  it("01F p4 – 315/80 R 22,5 156/150 twin, 10 300 kg → 6,25 bar", () => {
    expect(
      lookupPressure({
        vehicleType: "963.403",
        tireSize: "315/80 R 22,5",
        loadIndex: "156/150",
        axlePosition: "any",
        mounting: "twin",
        axleLoadKg: 10300,
      }),
    ).toMatchObject({ status: "exact", pressureBar: 6.25, sourceId: "AP40.15-W-4060-01F", sourcePage: 4 });
  });

  it("01F p3 – 385/65 R 22,5 160 single, 8 000 kg → 8,0 bar", () => {
    expect(
      lookupPressure({
        vehicleType: "964",
        tireSize: "385/65 R 22,5",
        loadIndex: "160",
        axlePosition: "any",
        mounting: "single",
        axleLoadKg: 8000,
      }),
    ).toMatchObject({ status: "exact", pressureBar: 8, pressureDecimals: 1, sourcePage: 3 });
  });

  it("01F p2 – 315/70 R 22,5 156 single 4 500 kg column header is unverified", () => {
    expect(
      lookupPressure({
        vehicleType: "963",
        tireSize: "315/70 R 22,5",
        loadIndex: "156",
        axlePosition: "any",
        mounting: "single",
        axleLoadKg: 4500,
      }),
    ).toMatchObject({ status: "unavailable", reason: "unverified_value" });
  });

  it("01F p3 – 355/50 R 22,5 156 at 5 000 kg is a flagged print anomaly", () => {
    expect(
      lookupPressure({
        vehicleType: "963",
        tireSize: "355/50 R 22,5",
        loadIndex: "156",
        axlePosition: "any",
        mounting: "single",
        axleLoadKg: 5000,
      }),
    ).toMatchObject({ status: "unavailable", reason: "flagged_value" });
  });

  it("01C – 245/70 R 17,5 VA 136, 4 400 kg → 8,3 bar (Atego 967)", () => {
    expect(
      lookupPressure({
        vehicleType: "967.009",
        tireSize: "245/70 R 17,5",
        loadIndex: "EB 136",
        axlePosition: "VA",
        mounting: "single",
        axleLoadKg: 4400,
      }),
    ).toMatchObject({ status: "exact", pressureBar: 8.3, sourceId: "AP40.15-W-4060-01C" });
  });

  it("01C – 17,5″ tables do not apply to Actros 934.0 (only 934.2)", () => {
    expect(
      lookupPressure({
        vehicleType: "934.0",
        tireSize: "245/70 R 17,5",
        loadIndex: "EB 136",
        axlePosition: "VA",
        mounting: "single",
        axleLoadKg: 4400,
      }),
    ).toMatchObject({ status: "unavailable", reason: "unknown_tire_size" });
  });

  it("01D – 285/70 R 19,5 1.HA twin, 11 200 kg → 9,0 bar", () => {
    expect(
      lookupPressure({
        vehicleType: "967",
        tireSize: "285/70 R 19,5",
        loadIndex: "EB 144/145 · ZW 142/143",
        axlePosition: "1.HA",
        mounting: "twin",
        axleLoadKg: 11200,
      }),
    ).toMatchObject({ status: "exact", pressureBar: 9, sourceId: "AP40.15-W-4060-01D", sourcePage: 1 });
  });

  it("01D – 305/70 R 19,5 2.HA twin at 6 000 kg is flagged (mounting ambiguous)", () => {
    expect(
      lookupPressure({
        vehicleType: "967",
        tireSize: "305/70 R 19,5",
        loadIndex: "EB 147/148 · ZW 145",
        axlePosition: "2.HA",
        mounting: "twin",
        axleLoadKg: 6000,
      }),
    ).toMatchObject({ status: "unavailable", reason: "flagged_value" });
  });

  it("D-01C – type 670 ambulance rear axle 215/75 R 16 C, 2 800 kg → 3,0 bar", () => {
    expect(
      lookupPressure({
        vehicleType: "670",
        tireSize: "215/75 R 16 C",
        loadIndex: "113/111 N",
        axlePosition: "HA",
        mounting: "unspecified",
        axleLoadKg: 2800,
        application: "ambulance",
      }),
    ).toMatchObject({ status: "exact", pressureBar: 3, pressureDecimals: 1 });
  });

  it("956.264 is explicitly excluded from the 22,5″ document", () => {
    expect(
      lookupPressure({
        vehicleType: "956.264",
        tireSize: "315/80 R 22,5",
        loadIndex: "156",
        axlePosition: "any",
        mounting: "single",
        axleLoadKg: 7500,
      }),
    ).toMatchObject({ status: "unavailable", reason: "unknown_vehicle_type" });
  });
});
