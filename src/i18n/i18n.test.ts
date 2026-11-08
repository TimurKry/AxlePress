import { describe, expect, it } from "vitest";
import { de } from "./de";
import { en } from "./en";
import { ru } from "./ru";
import { interpolate } from "./index";

describe("i18n", () => {
  it.each([
    ["en", en],
    ["ru", ru],
  ])("%s has the same keys and placeholders as German", (_, dict) => {
    expect(Object.keys(dict).sort()).toEqual(Object.keys(de).sort());
    for (const key of Object.keys(de) as (keyof typeof de)[]) {
      const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
      expect(placeholders(dict[key]), key).toEqual(placeholders(de[key]));
      expect(dict[key].trim().length, key).toBeGreaterThan(0);
    }
  });

  it("contains the mandatory German safety texts verbatim", () => {
    expect(de["results.coldReminder"]).toBe("Reifendruck bei kalten Reifen prüfen.");
    expect(de["results.noValue"]).toBe("Für diese Kombination liegt kein verifizierter Tabellenwert vor.");
    expect(de["results.showOriginal"]).toBe("Originaltabellenwerte anzeigen");
  });

  it("interpolates parameters", () => {
    expect(interpolate("Achse {n} von {total}", { n: 2, total: 3 })).toBe("Achse 2 von 3");
    expect(interpolate("{missing}", {})).toBe("{missing}");
  });
});
