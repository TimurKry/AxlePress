import { describe, expect, it } from "vitest";
import { normalizeBasePath } from "./base-path";

describe("base path", () => {
  it("normalises GitHub Pages style base paths", () => {
    expect(normalizeBasePath(undefined)).toBe("");
    expect(normalizeBasePath("")).toBe("");
    expect(normalizeBasePath("/")).toBe("");
    expect(normalizeBasePath("/AxlePress")).toBe("/AxlePress");
    expect(normalizeBasePath("AxlePress/")).toBe("/AxlePress");
  });
});
