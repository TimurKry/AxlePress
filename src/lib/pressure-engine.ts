import { z } from "zod";
import type {
  NeighborEntry,
  PressureLookupInput,
  PressureLookupResult,
  PressureRecord,
} from "@/types/pressure";
import { getDataset, type Dataset } from "./dataset";
import { getApplicableDocumentIds } from "./vehicle-types";

/**
 * Deterministic, exact-match-only tyre pressure lookup.
 *
 * Rules (see docs/LIMITATIONS.md):
 *  - every attribute must match a documented record exactly;
 *  - no interpolation, no extrapolation, no substitution of size / load index / axle / mounting;
 *  - only records with verification "verified" may produce a result;
 *  - empty cells and dashes are absent from the dataset and therefore never match.
 */

export const MIN_AXLE_LOAD_KG = 1;
export const MAX_AXLE_LOAD_KG = 50_000;

export const lookupInputSchema = z.object({
  vehicleType: z.string().trim().min(3),
  tireSize: z.string().trim().min(1),
  loadIndex: z.string().trim().min(1),
  axlePosition: z.enum(["any", "VA", "HA", "1.VA", "2.VA", "1.HA", "2.HA"]),
  mounting: z.enum(["single", "twin", "unspecified"]),
  axleLoadKg: z.number().finite().int().min(MIN_AXLE_LOAD_KG).max(MAX_AXLE_LOAD_KG),
  application: z.enum(["standard", "ambulance"]).optional(),
});

function toNeighbor(r: PressureRecord): NeighborEntry {
  return {
    axleLoadKg: r.axleLoadKg,
    pressureBar: r.pressureBar,
    pressureDecimals: r.pressureDecimals,
    documentId: r.documentId,
    page: r.page,
  };
}

function unavailable(
  reason: Extract<PressureLookupResult, { status: "unavailable" }>["reason"],
  detail: string,
  extra: Partial<Extract<PressureLookupResult, { status: "unavailable" }>> = {},
): PressureLookupResult {
  return { status: "unavailable", reason, detail, ...extra };
}

/** All records (any verification status) for the exact series described by the input. */
export function findSeries(
  input: Omit<PressureLookupInput, "axleLoadKg">,
  dataset: Dataset = getDataset(),
): PressureRecord[] {
  const docs = getApplicableDocumentIds(input.vehicleType, dataset.applicability);
  const application = input.application ?? "standard";
  return dataset.records.filter(
    (r) =>
      docs.has(r.documentId) &&
      r.application === application &&
      r.tireSize === input.tireSize &&
      r.mounting === input.mounting &&
      r.axle === input.axlePosition &&
      r.loadIndex === input.loadIndex,
  );
}

export function lookupPressure(
  rawInput: PressureLookupInput,
  dataset: Dataset = getDataset(),
): PressureLookupResult {
  const parsed = lookupInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return unavailable(
      "invalid_input",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    );
  }
  const input = parsed.data;
  const application = input.application ?? "standard";

  const docs = getApplicableDocumentIds(input.vehicleType, dataset.applicability);
  if (docs.size === 0) {
    return unavailable("unknown_vehicle_type", `No document lists factory type "${input.vehicleType}"`);
  }

  let candidates = dataset.records.filter((r) => docs.has(r.documentId) && r.application === application);
  if (candidates.length === 0) {
    return unavailable("unknown_vehicle_type", `No tables for "${input.vehicleType}" (${application})`);
  }

  candidates = candidates.filter((r) => r.tireSize === input.tireSize);
  if (candidates.length === 0) {
    return unavailable("unknown_tire_size", `Tyre size "${input.tireSize}" is not documented for this type`);
  }

  candidates = candidates.filter((r) => r.mounting === input.mounting);
  if (candidates.length === 0) {
    return unavailable("unsupported_mounting", `Mounting "${input.mounting}" is not documented for this tyre`);
  }

  candidates = candidates.filter((r) => r.axle === input.axlePosition);
  if (candidates.length === 0) {
    return unavailable("unsupported_axle", `Axle "${input.axlePosition}" is not documented for this tyre/mounting`);
  }

  candidates = candidates.filter((r) => r.loadIndex === input.loadIndex);
  if (candidates.length === 0) {
    return unavailable("unknown_load_index", `Load index "${input.loadIndex}" is not documented for this combination`);
  }

  const verified = candidates.filter((r) => r.verification === "verified");
  const range =
    verified.length > 0
      ? {
          minKg: Math.min(...verified.map((r) => r.axleLoadKg)),
          maxKg: Math.max(...verified.map((r) => r.axleLoadKg)),
        }
      : undefined;

  const atLoad = candidates.filter((r) => r.axleLoadKg === input.axleLoadKg);
  const verifiedAtLoad = atLoad.filter((r) => r.verification === "verified");

  if (verifiedAtLoad.length > 0) {
    const distinct = new Set(verifiedAtLoad.map((r) => r.pressureBar));
    if (distinct.size > 1) {
      return unavailable("conflicting_records", `Conflicting records: ${verifiedAtLoad.map((r) => r.id).join(", ")}`, {
        range,
      });
    }
    const record = verifiedAtLoad[0];
    return {
      status: "exact",
      pressureBar: record.pressureBar,
      pressureDecimals: record.pressureDecimals,
      sourceId: record.documentId,
      sourcePage: record.page,
      matchedAxleLoadKg: record.axleLoadKg,
      record,
    };
  }

  const lowerRecord = verified
    .filter((r) => r.axleLoadKg < input.axleLoadKg)
    .sort((a, b) => b.axleLoadKg - a.axleLoadKg)[0];
  const higherRecord = verified
    .filter((r) => r.axleLoadKg > input.axleLoadKg)
    .sort((a, b) => a.axleLoadKg - b.axleLoadKg)[0];
  const neighbors = {
    lower: lowerRecord ? toNeighbor(lowerRecord) : undefined,
    higher: higherRecord ? toNeighbor(higherRecord) : undefined,
    range,
  };

  if (atLoad.length > 0) {
    const record = atLoad[0];
    return record.verification === "flagged"
      ? unavailable("flagged_value", `Record ${record.id} is flagged as implausible`, { ...neighbors, record })
      : unavailable("unverified_value", `Record ${record.id} could not be verified`, { ...neighbors, record });
  }

  if (range && input.axleLoadKg > range.maxKg) {
    return unavailable(
      "above_documented_range",
      `Axle load ${input.axleLoadKg} kg exceeds the highest documented load (${range.maxKg} kg)`,
      neighbors,
    );
  }
  if (range && input.axleLoadKg < range.minKg) {
    return unavailable(
      "below_documented_range",
      `Axle load ${input.axleLoadKg} kg is below the lowest documented load (${range.minKg} kg)`,
      neighbors,
    );
  }
  return unavailable(
    "no_exact_match",
    `No documented value for exactly ${input.axleLoadKg} kg – interpolation is not permitted`,
    neighbors,
  );
}
