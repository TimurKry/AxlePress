import type { DocumentId, VehicleFamily } from "@/types/pressure";

/**
 * Factory-type (Baumuster) applicability exactly as printed in the "Typ" lines
 * of each document, expanded into individual patterns.
 *
 * Notation in the source: "930.0/1/2/3" = 930.0, 930.1, 930.2, 930.3.
 * A pattern matches a Baumuster when the Baumuster equals the pattern or starts with it
 * (e.g. pattern "963" matches "963.403"; pattern "934.2" matches "934.215").
 */
export interface TypeApplicability {
  documentId: DocumentId;
  page: number;
  /** Index of the "Typ" line on the page (1-based), for traceability. */
  line: number;
  patterns: string[];
  /** Explicit exclusions printed in the document. */
  exclusions: string[];
}

function expand(spec: string): string[] {
  // "930.0/1/2/3" → ["930.0","930.1","930.2","930.3"]; "963" → ["963"]
  const [series, variants] = spec.split(".");
  if (!variants) return [series];
  return variants.split("/").map((v) => `${series}.${v}`);
}

function expandAll(specs: string[]): string[] {
  return specs.flatMap(expand);
}

export const TYPE_APPLICABILITY: TypeApplicability[] = [
  {
    documentId: "AP40.15-W-4060-01F",
    page: 1,
    line: 1,
    patterns: expandAll([
      "374.5/6",
      "375.3/4",
      "930.0/1/2/3",
      "932.0/1/2/3",
      "933.1/3",
      "934.0/1/2",
      "940.1/2/3",
      "942.1/3",
      "943.1/3",
      "944.0/1/2",
      "949",
      "950.0/1/2/3/5/6",
      "952.0/1/2/3/5/6",
      "953.1/3/6",
      "954.0/1/2/5",
      "956",
      "957.3/5/6",
      "963",
      "964",
      "969",
      "983",
    ]),
    exclusions: ["956.264", "956.265"],
  },
  {
    documentId: "AP40.15-W-4060-01F",
    page: 1,
    line: 2,
    patterns: expandAll(["375.1", "967", "970.0/2/3", "972.0/3", "975.2", "976.0/3"]),
    exclusions: [],
  },
  {
    documentId: "AP40.15-W-4060-01C",
    page: 1,
    line: 1,
    patterns: expandAll(["934.2", "963"]),
    exclusions: [],
  },
  {
    documentId: "AP40.15-W-4060-01C",
    page: 1,
    line: 2,
    patterns: expandAll(["967", "970.0/2/3", "972.0/3", "975.0", "976.0", "979.0"]),
    exclusions: [],
  },
  {
    documentId: "AP40.15-W-4060-01D",
    page: 1,
    line: 1,
    patterns: expandAll(["375.1", "967", "970.0/2/6", "972.0", "974.2", "976.0"]),
    exclusions: [],
  },
  {
    documentId: "AP40.15-D-4060-01C",
    page: 1,
    line: 1,
    patterns: ["667", "668", "670"],
    exclusions: [],
  },
];

/**
 * Mapping of factory-type series to commercial model families.
 *
 * IMPORTANT: this mapping is NOT contained in the manufacturer tables. It is based on
 * public secondary references (see docs/VEHICLE_MAPPING.md) and is only used as a
 * convenience filter. The authoritative identifier is always the Baumuster printed on the
 * vehicle's type plate / data card. Series that could not be confirmed are only reachable
 * via the advanced "Baumuster direkt" selection.
 */
export interface FamilyMapping {
  family: Exclude<VehicleFamily, "advanced">;
  series: string;
  label: string;
  status: "public-reference";
  references: string[];
}

export const FAMILY_MAPPINGS: FamilyMapping[] = [
  {
    family: "actros",
    series: "963",
    label: "Actros (2011+, Actros 4/5) · Antos",
    status: "public-reference",
    references: [
      "https://www.transportengineer.org.uk/content/dsva-recalls/mercedes-benz-actros-963-actros-ii-iii-antos-963-arocs-964-atego-ii-atego-967-axor-ii-2013-2017-builds",
      "https://manualmachine.com/mercedesbenz/arocs964/4535715-service-manual",
    ],
  },
  ...(["930", "932", "933", "934"] as const).map((series) => ({
    family: "actros" as const,
    series,
    label: "Actros MP2/MP3 (2002–2013)",
    status: "public-reference" as const,
    references: ["https://trucks.autodoc.co.uk/truck/mercedes-benz/actros"],
  })),
  {
    family: "arocs",
    series: "964",
    label: "Arocs (2013+)",
    status: "public-reference",
    references: [
      "https://www.transportengineer.org.uk/content/dsva-recalls/mercedes-benz-actros-963-actros-ii-iii-antos-963-arocs-964-atego-ii-atego-967-axor-ii-2013-2017-builds",
      "https://manualmachine.com/mercedesbenz/arocs964/4535715-service-manual",
    ],
  },
  {
    family: "atego",
    series: "967",
    label: "Atego (2013+)",
    status: "public-reference",
    references: [
      "https://www.transportengineer.org.uk/content/dsva-recalls/mercedes-benz-actros-963-actros-ii-iii-antos-963-arocs-964-atego-ii-atego-967-axor-ii-2013-2017-builds",
      "https://assets.palfinger.com/paldrive-images/attachments/CTM_NB7866_Fahrzeugkonfiguration_W1T96700910785698_datasheet-de.pdf",
    ],
  },
  {
    family: "atego",
    series: "970",
    label: "Atego (1998–2013)",
    status: "public-reference",
    references: ["https://suchen.mobile.de/lkw/mercedes-benz-atego-970.html"],
  },
  {
    family: "atego",
    series: "976",
    label: "Atego (1998–2013)",
    status: "public-reference",
    references: [
      "https://www.mascus.es/transportation/fire-trucks/mercedes-benz-atego-976-05-brandweer-materiaalwagen-just-26-791/9wekbyey.html",
    ],
  },
];

export const FAMILIES: Exclude<VehicleFamily, "advanced">[] = ["actros", "arocs", "atego"];
