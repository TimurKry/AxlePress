import { describe, expect, it } from "vitest";
import { DATASET_VERSION } from "@/data/pressure-tables";
import { createDefaultConfiguration, decodeConfiguration, encodeConfiguration } from "./config-codec";

describe("shareable configuration", () => {
  it("round-trips a configuration without storing pressures", () => {
    const config = createDefaultConfiguration();
    config.vehicleFamily = "actros";
    config.factoryType = "963";
    config.axles[0] = { ...config.axles[0], tireSize: "385/65 R 22,5", mounting: "single", tableAxle: "any", loadIndex: "160", axleLoadKg: 8000 };
    const encoded = encodeConfiguration(config);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    const decoded = decodeConfiguration(encoded);
    expect(decoded?.datasetVersion).toBe(DATASET_VERSION);
    expect(decoded?.datasetChanged).toBe(false);
    expect(decoded?.config.axles[0]).toMatchObject({ tireSize: "385/65 R 22,5", loadIndex: "160", axleLoadKg: 8000 });
    expect(JSON.stringify(decoded)).not.toContain("pressure");
  });

  it("detects a dataset version change", () => {
    const encoded = encodeConfiguration(createDefaultConfiguration());
    const json = JSON.parse(Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    json.ds = "1999.01.1";
    const tampered = Buffer.from(JSON.stringify(json)).toString("base64url");
    expect(decodeConfiguration(tampered)?.datasetChanged).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(decodeConfiguration("not-base64!!")).toBeNull();
    expect(decodeConfiguration(Buffer.from('{"v":1}').toString("base64url"))).toBeNull();
    const tooMany = { v: 1, ds: "x", f: "", t: "", ap: "standard", a: Array(6).fill(["driven", "", "", "", "", null]) };
    expect(decodeConfiguration(Buffer.from(JSON.stringify(tooMany)).toString("base64url"))).toBeNull();
  });
});
