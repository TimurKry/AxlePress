import { describe, expect, it } from "vitest";
import type { VehicleConfiguration } from "@/types/pressure";
import { computeAllResults } from "./axle-results";

const config: VehicleConfiguration = {
  vehicleFamily: "actros",
  factoryType: "963",
  application: "standard",
  axles: [
    {
      id: "1",
      position: 1,
      role: "steering",
      tireSize: "385/65 R 22,5",
      mounting: "single",
      tableAxle: "any",
      loadIndex: "160",
      axleLoadKg: 8000,
    },
    {
      id: "2",
      position: 2,
      role: "driven",
      tireSize: "315/70 R 22,5",
      mounting: "twin",
      tableAxle: "any",
      loadIndex: "150",
      axleLoadKg: 11650, // not a documented column
    },
    {
      id: "3",
      position: 3,
      role: "trailing",
      tireSize: "315/70 R 22,5",
      mounting: "single",
      tableAxle: "any",
      loadIndex: "",
      axleLoadKg: null,
    },
  ],
};

describe("multi-axle results", () => {
  it("computes every axle independently", () => {
    const [front, drive, trailing] = computeAllResults(config);
    expect(front).toMatchObject({ kind: "lookup", result: { status: "exact", pressureBar: 8 } });
    expect(drive).toMatchObject({ kind: "lookup", result: { status: "unavailable", reason: "no_exact_match" } });
    expect(trailing).toMatchObject({ kind: "incomplete", missing: ["axle.loadIndex", "axle.load"] });
  });

  it("does not assume identical pressures across axles", () => {
    const sameTyres = {
      ...config,
      axles: [config.axles[0], { ...config.axles[0], id: "x", position: 2, role: "driven" as const, axleLoadKg: 7500 }],
    };
    const [a, b] = computeAllResults(sameTyres);
    expect(a).toMatchObject({ result: { pressureBar: 8 } });
    expect(b).toMatchObject({ result: { pressureBar: 7.25 } }); // 01F p3, 7 500 kg column
  });

  it("reports a missing factory type on every axle", () => {
    const results = computeAllResults({ ...config, factoryType: "" });
    for (const r of results) expect(r.kind === "incomplete" && r.missing.includes("vehicle.type")).toBe(true);
  });
});
