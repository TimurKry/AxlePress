import type { MessageKey } from "@/i18n/de";
import type {
  AxleConfiguration,
  PressureLookupInput,
  PressureLookupResult,
  VehicleConfiguration,
} from "@/types/pressure";
import { getDataset, type Dataset } from "./dataset";
import { lookupPressure } from "./pressure-engine";
import { getApplicableDocumentIds } from "./vehicle-types";

export type AxleResult =
  | { kind: "incomplete"; missing: MessageKey[] }
  | { kind: "lookup"; input: PressureLookupInput; result: PressureLookupResult };

/**
 * Compute the result for one axle independently of all other axles.
 * An unavailable or incomplete axle never blocks the other axles.
 */
export function computeAxleResult(
  config: VehicleConfiguration,
  axle: AxleConfiguration,
  dataset: Dataset = getDataset(),
): AxleResult {
  const missing: MessageKey[] = [];
  const typeOk = config.factoryType !== "" && getApplicableDocumentIds(config.factoryType, dataset.applicability).size > 0;
  if (!typeOk) missing.push("vehicle.type");
  if (!axle.tireSize) missing.push("axle.tireSize");
  if (!axle.mounting) missing.push("axle.mounting");
  if (!axle.tableAxle) missing.push("axle.tableAxle");
  if (!axle.loadIndex) missing.push("axle.loadIndex");
  if (axle.axleLoadKg === null || !Number.isFinite(axle.axleLoadKg) || axle.axleLoadKg <= 0) missing.push("axle.load");
  if (missing.length > 0 || !axle.mounting || !axle.tableAxle || axle.axleLoadKg === null) {
    return { kind: "incomplete", missing };
  }
  const input: PressureLookupInput = {
    vehicleType: config.factoryType,
    tireSize: axle.tireSize,
    loadIndex: axle.loadIndex,
    axlePosition: axle.tableAxle,
    mounting: axle.mounting,
    axleLoadKg: axle.axleLoadKg,
    application: config.application,
  };
  return { kind: "lookup", input, result: lookupPressure(input, dataset) };
}

export function computeAllResults(config: VehicleConfiguration, dataset: Dataset = getDataset()): AxleResult[] {
  return config.axles.map((axle) => computeAxleResult(config, axle, dataset));
}
