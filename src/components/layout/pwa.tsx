"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { DATASET_VERSION } from "@/data/pressure-tables";
import { useI18n } from "@/i18n";

/** Registers the service worker (production only) and shows an offline badge. */
export function PwaSupport() {
  const { t } = useI18n();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is optional */
      });
    }
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" className="mx-auto mt-3 flex max-w-5xl items-center gap-2 px-4 text-sm text-warn">
      <WifiOff aria-hidden className="size-4" />
      {t("offline.badge", { version: DATASET_VERSION })}
    </div>
  );
}
