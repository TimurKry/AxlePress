"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { DATASET_VERSION } from "@/data/pressure-tables";
import { computeAllResults } from "@/lib/axle-results";
import {
  createAxle,
  createDefaultConfiguration,
  decodeConfiguration,
  MAX_AXLES,
  MIN_AXLES,
  renumberAxles,
  SHARE_PARAM,
} from "@/lib/config-codec";
import { hasAmbulanceTables, normalizeAxle } from "@/lib/options";
import { loadLastConfiguration, saveLastConfiguration } from "@/lib/storage";
import { familyForType, getTypeOptionsForFamily, matchesPattern } from "@/lib/vehicle-types";
import type { Application, AxleConfiguration, AxleRole, VehicleConfiguration, VehicleFamily } from "@/types/pressure";

interface State {
  config: VehicleConfiguration;
  /** Axles whose table axle was chosen explicitly by the user (not suggested). */
  userTableAxle: Record<string, boolean>;
  datasetNotice: { old: string } | null;
  hydrated: boolean;
}

type AxlePatch = Partial<Pick<AxleConfiguration, "role" | "tireSize" | "mounting" | "tableAxle" | "loadIndex" | "axleLoadKg">>;

type Action =
  | { type: "hydrate"; config: VehicleConfiguration | null; datasetChangedFrom: string | null }
  | { type: "setFamily"; family: VehicleFamily }
  | { type: "setFactoryType"; factoryType: string; family?: VehicleFamily }
  | { type: "setApplication"; application: Application }
  | { type: "updateAxle"; id: string; patch: AxlePatch }
  | { type: "addAxle" }
  | { type: "removeAxle"; id: string }
  | { type: "copyAxle"; fromId: string; toIds: string[] }
  | { type: "load"; config: VehicleConfiguration; datasetChangedFrom: string | null }
  | { type: "dismissNotice" }
  | { type: "reset" };

/** Re-validate every axle against the documented options for the current vehicle. */
function normalizeConfig(config: VehicleConfiguration): VehicleConfiguration {
  const application: Application =
    config.application === "ambulance" && config.factoryType && hasAmbulanceTables(config.factoryType)
      ? "ambulance"
      : "standard";
  const scope = { vehicleType: config.factoryType, application };
  const axles = renumberAxles(config.axles);
  return {
    ...config,
    application,
    axles: axles.map((a) => {
      if (!config.factoryType) return { ...a, tireSize: "", mounting: "", tableAxle: "", loadIndex: "" };
      return normalizeAxle(a, axles, scope);
    }),
  };
}

function withConfig(state: State, config: VehicleConfiguration, userTableAxle = state.userTableAxle): State {
  return { ...state, userTableAxle, config: normalizeConfig(config) };
}

function reducer(state: State, action: Action): State {
  const { config } = state;
  switch (action.type) {
    case "hydrate": {
      const base = action.config ?? config;
      return {
        ...withConfig(state, base, {}),
        hydrated: true,
        datasetNotice: action.datasetChangedFrom ? { old: action.datasetChangedFrom } : null,
      };
    }
    case "load":
      return {
        ...withConfig(state, action.config, {}),
        datasetNotice: action.datasetChangedFrom ? { old: action.datasetChangedFrom } : null,
      };
    case "setFamily": {
      const stillValid =
        action.family === "advanced" ||
        getTypeOptionsForFamily(action.family).some((o) => matchesPattern(config.factoryType, o.value));
      return withConfig(state, {
        ...config,
        vehicleFamily: action.family,
        factoryType: stillValid ? config.factoryType : "",
      });
    }
    case "setFactoryType":
      return withConfig(state, {
        ...config,
        vehicleFamily: action.family ?? config.vehicleFamily,
        factoryType: action.factoryType,
      });
    case "setApplication":
      return withConfig(state, { ...config, application: action.application });
    case "updateAxle": {
      const userTableAxle = { ...state.userTableAxle };
      const axles = config.axles.map((a) => {
        if (a.id !== action.id) return a;
        const next = { ...a, ...action.patch };
        if (action.patch.role && action.patch.role !== a.role && !userTableAxle[a.id]) next.tableAxle = "";
        if (action.patch.tableAxle !== undefined) userTableAxle[a.id] = action.patch.tableAxle !== "";
        return next;
      });
      return withConfig(state, { ...config, axles }, userTableAxle);
    }
    case "addAxle": {
      if (config.axles.length >= MAX_AXLES) return state;
      const role: AxleRole = config.axles.length >= 2 ? "trailing" : "driven";
      return withConfig(state, { ...config, axles: [...config.axles, createAxle(config.axles.length + 1, role)] });
    }
    case "removeAxle": {
      if (config.axles.length <= MIN_AXLES) return state;
      const userTableAxle = { ...state.userTableAxle };
      delete userTableAxle[action.id];
      return withConfig(state, { ...config, axles: config.axles.filter((a) => a.id !== action.id) }, userTableAxle);
    }
    case "copyAxle": {
      const source = config.axles.find((a) => a.id === action.fromId);
      if (!source) return state;
      const userTableAxle = { ...state.userTableAxle };
      const axles = config.axles.map((a) => {
        if (!action.toIds.includes(a.id) || a.id === source.id) return a;
        // Tyre data only – role and axle load of the target stay untouched. The table axle is
        // re-derived for the target unless the user chose it explicitly.
        return {
          ...a,
          tireSize: source.tireSize,
          mounting: source.mounting,
          loadIndex: source.loadIndex,
          tableAxle: userTableAxle[a.id] ? a.tableAxle : "",
        };
      });
      return withConfig(state, { ...config, axles }, userTableAxle);
    }
    case "dismissNotice":
      return { ...state, datasetNotice: null };
    case "reset":
      return { ...withConfig(state, createDefaultConfiguration(), {}), datasetNotice: null };
  }
}

export function useCalculator() {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    config: createDefaultConfiguration(),
    userTableAxle: {},
    datasetNotice: null,
    hydrated: false,
  }));

  // Restore from share link or last session (client only).
  useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get(SHARE_PARAM);
    if (encoded) {
      const decoded = decodeConfiguration(encoded);
      if (decoded) {
        dispatch({
          type: "hydrate",
          config: decoded.config,
          datasetChangedFrom: decoded.datasetChanged ? decoded.datasetVersion : null,
        });
        return;
      }
    }
    const last = loadLastConfiguration();
    dispatch({
      type: "hydrate",
      config: last?.config ?? null,
      datasetChangedFrom: last && last.datasetVersion !== DATASET_VERSION ? last.datasetVersion : null,
    });
  }, []);

  useEffect(() => {
    if (state.hydrated) saveLastConfiguration(state.config);
  }, [state.config, state.hydrated]);

  const results = useMemo(() => computeAllResults(state.config), [state.config]);

  const actions = useMemo(
    () => ({
      setFamily: (family: VehicleFamily) => dispatch({ type: "setFamily", family }),
      setFactoryType: (factoryType: string, family?: VehicleFamily) =>
        dispatch({ type: "setFactoryType", factoryType, family }),
      setApplication: (application: Application) => dispatch({ type: "setApplication", application }),
      updateAxle: (id: string, patch: AxlePatch) => dispatch({ type: "updateAxle", id, patch }),
      addAxle: () => dispatch({ type: "addAxle" }),
      removeAxle: (id: string) => dispatch({ type: "removeAxle", id }),
      copyAxle: (fromId: string, toIds: string[]) => dispatch({ type: "copyAxle", fromId, toIds }),
      load: (config: VehicleConfiguration, savedDatasetVersion: string) =>
        dispatch({
          type: "load",
          config,
          datasetChangedFrom: savedDatasetVersion !== DATASET_VERSION ? savedDatasetVersion : null,
        }),
      dismissNotice: () => dispatch({ type: "dismissNotice" }),
      reset: () => dispatch({ type: "reset" }),
    }),
    [],
  );

  const isUserTableAxle = useCallback((id: string) => !!state.userTableAxle[id], [state.userTableAxle]);

  return { ...state, results, actions, isUserTableAxle, familyForType };
}

export type CalculatorApi = ReturnType<typeof useCalculator>;
