"use client";

import { useI18n } from "@/i18n";
import type { AxleResult } from "@/lib/axle-results";
import type { AxleConfiguration } from "@/types/pressure";

interface Props {
  axles: AxleConfiguration[];
  results: AxleResult[];
}

/**
 * Schematic top view of the truck (front on the left). Each axle shows its mounting and
 * its own result – nothing is shared or assumed between axles.
 */
export function TruckDiagram({ axles, results }: Props) {
  const { t, formatPressure } = useI18n();
  const width = 360;
  const height = 150;
  const startX = 70;
  const endX = width - 30;
  const step = axles.length > 1 ? (endX - startX) / (axles.length - 1) : 0;

  return (
    <figure className="mx-auto w-full max-w-xl">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={t("results.overview")}
        data-testid="truck-diagram"
      >
        {/* chassis */}
        <rect x={40} y={height / 2 - 6} width={width - 60} height={12} rx={4} fill="var(--surface-3)" stroke="var(--border-strong)" />
        {/* cab */}
        <rect x={10} y={height / 2 - 34} width={44} height={68} rx={10} fill="var(--surface-2)" stroke="var(--silver)" strokeOpacity={0.5} />
        <rect x={14} y={height / 2 - 26} width={8} height={52} rx={3} fill="var(--accent)" opacity={0.35} />
        {axles.map((axle, i) => {
          const x = startX + i * step;
          const result = results[i];
          const exact = result?.kind === "lookup" && result.result.status === "exact";
          const unavailable = result?.kind === "lookup" && result.result.status === "unavailable";
          const color = exact ? "var(--ok)" : unavailable ? "var(--warn)" : "var(--subtle)";
          const twin = axle.mounting === "twin";
          const wheel = (dy: number, dx: number) => (
            <rect key={`${dy}-${dx}`} x={x - 7 + dx} y={dy} width={14} height={24} rx={4} fill="var(--surface)" stroke={color} strokeWidth={2} />
          );
          const label = exact && result.kind === "lookup" && result.result.status === "exact"
            ? formatPressure(result.result.pressureBar, result.result.pressureDecimals)
            : unavailable
              ? "—"
              : "…";
          return (
            <g key={axle.id}>
              <line x1={x} x2={x} y1={28} y2={height - 28} stroke="var(--border-strong)" strokeWidth={3} />
              {twin ? [wheel(18, -8), wheel(18, 8), wheel(height - 42, -8), wheel(height - 42, 8)] : [wheel(18, 0), wheel(height - 42, 0)]}
              <circle cx={x} cy={height / 2} r={12} fill="var(--bg)" stroke={color} strokeWidth={2} />
              <text x={x} y={height / 2 + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)">
                {axle.position}
              </text>
              <text x={x} y={12} textAnchor="middle" fontSize={12} fontWeight={700} fill={color} className="tabular">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
