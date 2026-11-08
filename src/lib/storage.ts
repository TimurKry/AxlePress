import { DATASET_VERSION } from "@/data/pressure-tables";
import type { VehicleConfiguration } from "@/types/pressure";
import { savedVehicleSchema, storedConfigurationSchema, type SavedVehicle } from "./config-codec";

/**
 * localStorage helpers. Every access is wrapped in try/catch – storage can be unavailable
 * (private mode, blocked site data) and the app must keep working without it.
 * No personal data is stored: only vehicle/tyre configurations and UI preferences.
 */

const KEY_LAST = "truckpressure:last-config";
const KEY_SAVED = "truckpressure:saved-vehicles";
const KEY_LANG = "truckpressure:lang";
const KEY_THEME = "truckpressure:theme";
const MAX_SAVED = 20;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable – ignore */
  }
}

export function loadLastConfiguration(): { config: VehicleConfiguration; datasetVersion: string } | null {
  const raw = read(KEY_LAST);
  if (!raw) return null;
  try {
    const parsed = storedConfigurationSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    return { config: parsed.data.config, datasetVersion: parsed.data.datasetVersion };
  } catch {
    return null;
  }
}

export function saveLastConfiguration(config: VehicleConfiguration): void {
  write(KEY_LAST, JSON.stringify({ datasetVersion: DATASET_VERSION, config }));
}

export function loadSavedVehicles(): SavedVehicle[] {
  const raw = read(KEY_SAVED);
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.flatMap((v) => {
      const parsed = savedVehicleSchema.safeParse(v);
      return parsed.success ? [parsed.data] : [];
    });
  } catch {
    return [];
  }
}

export function storeSavedVehicles(list: SavedVehicle[]): void {
  write(KEY_SAVED, JSON.stringify(list.slice(0, MAX_SAVED)));
}

export function loadPreference(kind: "lang" | "theme"): string | null {
  return read(kind === "lang" ? KEY_LANG : KEY_THEME);
}

export function storePreference(kind: "lang" | "theme", value: string): void {
  write(kind === "lang" ? KEY_LANG : KEY_THEME, value);
}
