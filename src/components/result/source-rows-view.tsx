"use client";

import { useI18n } from "@/i18n";
import type { SeriesRow } from "@/lib/source-rows";
import { cn } from "@/lib/utils";
import { DOCUMENTS } from "@/data/documents";

interface Props {
  rows: SeriesRow[];
  /** Highlight this axle load (the requested or matched column). */
  highlightKg: number | null;
  /** Record id of the exact match, if any. */
  matchedRecordId?: string;
}

/** Literal view of the original table row(s) the lookup is based on. */
export function SourceRowsView({ rows, highlightKg, matchedRecordId }: Props) {
  const { t, formatKg } = useI18n();
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col gap-4" data-testid="source-rows">
      {rows.map(({ table, rowIndex, columns, cells }) => {
        const row = table.rows[rowIndex];
        const li = row.loadIndex ?? [row.loadIndexSingle && `EB ${row.loadIndexSingle}`, row.loadIndexTwin && `ZW ${row.loadIndexTwin}`].filter(Boolean).join(" · ");
        return (
          <div key={`${table.id}-${rowIndex}`} className="flex flex-col gap-1.5">
            <p className="text-xs text-subtle">
              {t("results.originalCaption", { doc: DOCUMENTS[table.documentId].id, page: table.page, title: table.title })}
            </p>
            <p className="text-xs text-muted">
              <span className="font-medium text-text">{row.tireSizeRaw}</span>
              {row.axle ? ` · ${row.axle.replace(".", ". ")}` : ""} · LI {li}
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-max min-w-full border-collapse text-center text-sm tabular">
                <caption className="sr-only">
                  {row.tireSizeRaw} – {table.title}
                </caption>
                <thead>
                  <tr className="bg-surface-3 text-xs text-muted">
                    <th scope="row" className="sticky left-0 bg-surface-3 px-2 py-1.5 text-left font-medium">
                      kg
                    </th>
                    {columns.map((c, i) => (
                      <th
                        key={i}
                        scope="col"
                        title={c.note}
                        className={cn(
                          "px-2 py-1.5 font-semibold",
                          c.kg !== null && c.kg === highlightKg && "bg-accent/20 text-text",
                          c.status !== "verified" && "text-subtle",
                        )}
                      >
                        {c.kg === null ? "?" : formatKg(c.kg)}
                        {c.kg !== null && c.status !== "verified" ? "?" : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row" className="sticky left-0 bg-surface px-2 py-1.5 text-left text-xs font-medium text-muted">
                      bar
                    </th>
                    {cells.map((cell, i) => {
                      const recordId = `${table.id}:r${rowIndex}:c${i}`;
                      const highlighted = columns[i].kg !== null && columns[i].kg === highlightKg;
                      let text: string;
                      if (cell.kind === "dash") text = "–";
                      else if (cell.kind === "empty") text = "";
                      else if (cell.kind === "illegible" || cell.status === "unverified") text = "?";
                      else text = cell.raw.replace(/[!?]$/, "");
                      return (
                        <td
                          key={i}
                          title={cell.note}
                          data-status={cell.kind === "value" ? cell.status : cell.kind}
                          className={cn(
                            "border-t border-border px-2 py-1.5",
                            highlighted && "bg-accent/12",
                            recordId === matchedRecordId && "font-bold text-ok ring-2 ring-inset ring-ok",
                            cell.status === "unverified" && "text-subtle",
                            cell.status === "flagged" && "text-danger line-through",
                          )}
                        >
                          {text}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      <p className="text-xs leading-relaxed text-subtle">{t("results.originalLegend")}</p>
    </div>
  );
}
