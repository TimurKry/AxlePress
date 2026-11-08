"use client";

import { useCallback, useEffect, useState } from "react";
import type { SavedVehicle } from "@/lib/config-codec";
import { loadSavedVehicles, storeSavedVehicles } from "@/lib/storage";

/** Saved vehicles in localStorage, shared by the quick-load bar and the saved-vehicles panel. */
export function useSavedVehicles() {
  const [saved, setSaved] = useState<SavedVehicle[]>([]);

  useEffect(() => {
    // Browser-only storage is read after hydration on purpose.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(loadSavedVehicles());
  }, []);

  const add = useCallback((entry: SavedVehicle) => {
    setSaved((prev) => {
      const next = [entry, ...prev];
      storeSavedVehicles(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.filter((s) => s.id !== id);
      storeSavedVehicles(next);
      return next;
    });
  }, []);

  return { saved, add, remove };
}

export type SavedVehiclesStore = ReturnType<typeof useSavedVehicles>;
