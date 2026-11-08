import { describe, expect, it } from "vitest";
import { getTireSizes } from "./options";
import { loadIndexMatches, parseTireCode } from "./tire-code";

describe("tyre sidewall quick code", () => {
  it("parses common markings into the dataset notation", () => {
    expect(parseTireCode("315/80 R22.5 156/150 L")).toEqual({ tireSize: "315/80 R 22,5", single: 156, twin: 150 });
    expect(parseTireCode("385/65R22,5 160K")).toEqual({ tireSize: "385/65 R 22,5", single: 160, twin: null });
    expect(parseTireCode("13 R 22.5 154/150")).toEqual({ tireSize: "13 R 22,5", single: 154, twin: 150 });
    expect(parseTireCode("9.5 R 17.5 129/127 L")).toEqual({ tireSize: "9,5 R 17,5", single: 129, twin: 127 });
    expect(parseTireCode("10.00 R 17.5 134/132")).toEqual({ tireSize: "10,00 R 17,5", single: 134, twin: 132 });
    expect(parseTireCode("205/75 R 16 C 110/108 N")).toEqual({ tireSize: "205/75 R 16 C", single: 110, twin: 108 });
    expect(parseTireCode("295/80 r 22,5")).toEqual({ tireSize: "295/80 R 22,5", single: null, twin: null });
    expect(parseTireCode("hello")).toBeNull();
    expect(parseTireCode("")).toBeNull();
  });

  it("produces sizes that exist in the dataset", () => {
    const sizes = getTireSizes({ vehicleType: "967", application: "standard" });
    for (const code of ["315/80 R22.5", "9.5 R17.5", "10.00 R 17.5", "285/70 R19.5", "245/70 R 17.5"]) {
      expect(sizes, code).toContain(parseTireCode(code)?.tireSize);
    }
  });

  it("matches load-index keys without guessing", () => {
    const c = (s: string) => parseTireCode(`315/80 R22.5 ${s}`)!;
    // 22,5″ single / twin
    expect(loadIndexMatches("156", "single", c("156/150"))).toBe(true);
    expect(loadIndexMatches("154", "single", c("156/150"))).toBe(false);
    expect(loadIndexMatches("156/150", "twin", c("156/150"))).toBe(true);
    expect(loadIndexMatches("154/150", "twin", c("156/150"))).toBe(false);
    expect(loadIndexMatches("145", "twin", c("148/145"))).toBe(true);
    expect(loadIndexMatches("148", "twin", c("148/145"))).toBe(false);
    // 17,5″ / 19,5″ EB / ZW
    expect(loadIndexMatches("EB 128/129 · ZW 126/127", "twin", c("129/127"))).toBe(true);
    expect(loadIndexMatches("EB 128/129 · ZW 126/127", "twin", c("129/125"))).toBe(false);
    expect(loadIndexMatches("EB 136", "single", c("136/134"))).toBe(true);
    // no load index in the table / none typed
    expect(loadIndexMatches("-", "unspecified", c("110/108"))).toBe(false);
    expect(loadIndexMatches("156", "single", parseTireCode("315/80 R22.5")!)).toBe(false);
  });
});
