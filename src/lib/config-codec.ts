import { z } from "zod";
import { DATASET_VERSION } from "@/data/pressure-tables";
import type { AxleConfiguration, VehicleConfiguration } from "@/types/pressure";

/**
 * Serialisation of vehicle configurations for localStorage and shareable URLs.
 * Only the configuration is stored – never a calculated pressure. Pressures are always
 * recomputed from the current dataset when a configuration is loaded.
 */

export const MIN_AXLES = 2;
export const MAX_AXLES = 5;

const axleSchema = z.object({
  id: z.string().min(1).max(40),
  position: z.number().int().min(1).max(MAX_AXLES),
  role: z.enum(["steering", "driven", "trailing", "lift"]),
  tireSize: z.string().max(40),
  tableAxle: z.enum(["", "any", "VA", "HA", "1.VA", "2.VA", "1.HA", "2.HA"]),
  loadIndex: z.string().max(60),
  mounting: z.enum(["", "single", "twin", "unspecified"]),
  axleLoadKg: z.number().int().min(0).max(100_000).nullable(),
  tireCode: z.string().max(60).optional(),
});

export const vehicleConfigurationSchema = z.object({
  vehicleFamily: z.enum(["", "actros", "arocs", "atego", "advanced"]),
  factoryType: z.string().max(20),
  application: z.enum(["standard", "ambulance"]),
  axles: z.array(axleSchema).min(MIN_AXLES).max(MAX_AXLES),
});

export const storedConfigurationSchema = z.object({
  datasetVersion: z.string(),
  config: vehicleConfigurationSchema,
});

export const savedVehicleSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  savedAt: z.string(),
  datasetVersion: z.string(),
  config: vehicleConfigurationSchema,
});
export type SavedVehicle = z.infer<typeof savedVehicleSchema>;

let idCounter = 0;
export function newAxleId(): string {
  idCounter += 1;
  return `axle-${Date.now().toString(36)}-${idCounter}`;
}

export function createAxle(position: number, role: AxleConfiguration["role"]): AxleConfiguration {
  return { id: newAxleId(), position, role, tireSize: "", tableAxle: "", loadIndex: "", mounting: "", axleLoadKg: null };
}

export function createDefaultConfiguration(): VehicleConfiguration {
  return {
    vehicleFamily: "",
    factoryType: "",
    application: "standard",
    axles: [createAxle(1, "steering"), createAxle(2, "driven")],
  };
}

/** Re-number positions after insert/remove. */
export function renumberAxles(axles: AxleConfiguration[]): AxleConfiguration[] {
  return axles.map((a, i) => ({ ...a, position: i + 1 }));
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export const SHARE_PARAM = "cfg";

export function encodeConfiguration(config: VehicleConfiguration): string {
  // Compact tuple form to keep URLs short.
  const payload = {
    v: 1,
    ds: DATASET_VERSION,
    f: config.vehicleFamily,
    t: config.factoryType,
    ap: config.application,
    a: config.axles.map((a) => [a.role, a.tireSize, a.mounting, a.tableAxle, a.loadIndex, a.axleLoadKg]),
  };
  return toBase64Url(JSON.stringify(payload));
}

const sharePayloadSchema = z.object({
  v: z.literal(1),
  ds: z.string(),
  f: vehicleConfigurationSchema.shape.vehicleFamily,
  t: z.string().max(20),
  ap: vehicleConfigurationSchema.shape.application,
  a: z
    .array(
      z.tuple([
        axleSchema.shape.role,
        axleSchema.shape.tireSize,
        axleSchema.shape.mounting,
        axleSchema.shape.tableAxle,
        axleSchema.shape.loadIndex,
        axleSchema.shape.axleLoadKg,
      ]),
    )
    .min(MIN_AXLES)
    .max(MAX_AXLES),
});

export interface DecodedShare {
  config: VehicleConfiguration;
  datasetVersion: string;
  datasetChanged: boolean;
}

export function decodeConfiguration(encoded: string): DecodedShare | null {
  try {
    const parsed = sharePayloadSchema.safeParse(JSON.parse(fromBase64Url(encoded)));
    if (!parsed.success) return null;
    const p = parsed.data;
    const config: VehicleConfiguration = {
      vehicleFamily: p.f,
      factoryType: p.t,
      application: p.ap,
      axles: p.a.map(([role, tireSize, mounting, tableAxle, loadIndex, axleLoadKg], i) => ({
        id: newAxleId(),
        position: i + 1,
        role,
        tireSize,
        mounting,
        tableAxle,
        loadIndex,
        axleLoadKg,
      })),
    };
    return { config, datasetVersion: p.ds, datasetChanged: p.ds !== DATASET_VERSION };
  } catch {
    return null;
  }
}
