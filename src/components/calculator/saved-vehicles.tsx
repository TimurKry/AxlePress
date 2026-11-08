"use client";

import { FolderOpen, Save, Share2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DATASET_VERSION } from "@/data/pressure-tables";
import { useI18n } from "@/i18n";
import { encodeConfiguration, SHARE_PARAM, type SavedVehicle } from "@/lib/config-codec";
import { loadSavedVehicles, storeSavedVehicles } from "@/lib/storage";
import type { VehicleConfiguration } from "@/types/pressure";
import { SectionHeading } from "./section-heading";

interface Props {
  config: VehicleConfiguration;
  onLoad: (config: VehicleConfiguration, datasetVersion: string) => void;
}

export function SavedVehicles({ config, onLoad }: Props) {
  const { t, lang } = useI18n();
  const [saved, setSaved] = useState<SavedVehicle[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // Browser-only storage is read after hydration on purpose.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(loadSavedVehicles());
  }, []);

  function flash(message: string) {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 4000);
  }

  function save() {
    const entry: SavedVehicle = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || t("actions.saveDefault", { n: saved.length + 1 }),
      savedAt: new Date().toISOString(),
      datasetVersion: DATASET_VERSION,
      config,
    };
    const next = [entry, ...saved];
    setSaved(next);
    storeSavedVehicles(next);
    setName("");
    flash(t("actions.saved"));
  }

  function remove(id: string) {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    storeSavedVehicles(next);
  }

  async function share() {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set(SHARE_PARAM, encodeConfiguration(config));
    if (lang !== "de") url.searchParams.set("lang", lang);
    const href = url.toString();
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: t("actions.shareTitle"), url: href });
        return;
      }
      await navigator.clipboard.writeText(href);
      flash(t("actions.copied"));
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      flash(t("actions.copyFailed", { url: href }));
    }
  }

  return (
    <section aria-labelledby="saved-heading">
      <Card>
        <CardHeader>
          <SectionHeading id="saved-heading" icon={<FolderOpen />} title={t("actions.savedTitle")} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field id="save-name" label={t("actions.saveName")} className="flex-1">
              <Input id="save-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            </Field>
            <Button onClick={save} data-testid="save-vehicle">
              <Save />
              {t("actions.save")}
            </Button>
            <Button variant="secondary" onClick={share} data-testid="share-link">
              <Share2 />
              {t("actions.share")}
            </Button>
          </div>
          {status && (
            <p role="status" className="break-all text-sm text-ok" data-testid="action-status">
              {status}
            </p>
          )}
          {saved.length === 0 ? (
            <p className="text-sm text-subtle">{t("actions.savedEmpty")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border" data-testid="saved-list">
              {saved.map((s) => (
                <li key={s.id} className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="text-xs text-subtle tabular">
                      {s.config.factoryType || "–"} · {s.config.axles.length} × · {new Date(s.savedAt).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB")}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => onLoad(s.config, s.datasetVersion)}>
                    {t("actions.load")}
                  </Button>
                  <Button size="icon" variant="ghost" aria-label={`${t("actions.delete")}: ${s.name}`} onClick={() => remove(s.id)}>
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-subtle">{t("actions.storageNote")}</p>
        </CardContent>
      </Card>
    </section>
  );
}
