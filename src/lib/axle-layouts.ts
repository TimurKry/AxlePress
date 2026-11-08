import type { AxleRole } from "@/types/pressure";

/**
 * One-tap axle layouts. They only set the number of axles and their functions –
 * tyres and loads are never assumed.
 */
export interface AxleLayout {
  id: "4x2" | "6x2-trailing" | "6x2-lift" | "6x4" | "8x4";
  label: string;
  roles: AxleRole[];
}

export const AXLE_LAYOUTS: AxleLayout[] = [
  { id: "4x2", label: "4×2", roles: ["steering", "driven"] },
  { id: "6x2-trailing", label: "6×2", roles: ["steering", "driven", "trailing"] },
  { id: "6x2-lift", label: "6×2", roles: ["steering", "lift", "driven"] },
  { id: "6x4", label: "6×4", roles: ["steering", "driven", "driven"] },
  { id: "8x4", label: "8×4", roles: ["steering", "steering", "driven", "driven"] },
];

export function matchesLayout(roles: AxleRole[], layout: AxleLayout): boolean {
  return roles.length === layout.roles.length && roles.every((r, i) => r === layout.roles[i]);
}
