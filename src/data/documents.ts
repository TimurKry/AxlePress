import type { DocumentId, SourceDocument } from "@/types/pressure";

/**
 * Manufacturer documents that were provided as photographs.
 * See docs/DATA_SOURCES.md for the photo-to-page mapping.
 *
 * Only metadata and transcribed table values are stored in this repository –
 * the photographs themselves are intentionally NOT committed.
 */
export const DOCUMENTS: Record<DocumentId, SourceDocument> = {
  "AP40.15-W-4060-01F": {
    id: "AP40.15-W-4060-01F",
    title: "Reifendrucktabelle 22,5″",
    publisher: "Daimler Truck AG",
    printed: "2026-03-05",
    revision: "P/02/26",
    rimLabel: "22,5″",
    totalPages: 5,
    pagesAvailable: [1, 2, 3, 4, 5],
    typeLines: [
      {
        page: 1,
        rim: "22,5″",
        text:
          "374.5/6, 375.3/4, 930.0/1/2/3, 932.0/1/2/3, 933.1/3, 934.0/1/2, 940.1/2/3, 942.1/3, 943.1/3, " +
          "944.0/1/2, 949, 950.0/1/2/3/5/6, 952.0/1/2/3/5/6, 953.1/3/6, 954.0/1/2/5, 956 (außer 956.264/265), " +
          "957.3/5/6, 963, 964, 969, 983 mit Felge 22,5″",
      },
      {
        page: 1,
        rim: "22,5″",
        text: "375.1, 967, 970.0/2/3, 972.0/3, 975.2, 976.0/3 mit Felge 22,5″",
      },
    ],
    notes: [
      "Den Reifendruck bei kalten Reifen messen und einstellen. Druckerhöhungen durch Erwärmung während des Betriebs sind normal und dürfen nicht abgelassen werden.",
      "Alle Angaben in dieser Tabelle sind Richtwerte und basieren auf durchschnittlichen Betriebsbedingungen.",
    ],
  },
  "AP40.15-W-4060-01C": {
    id: "AP40.15-W-4060-01C",
    title: "Reifendrucktabelle 17,5″",
    publisher: "Daimler Truck AG",
    printed: "2026-03-05",
    revision: "P/02/26",
    rimLabel: "17,5″",
    totalPages: 1,
    pagesAvailable: [1],
    typeLines: [
      { page: 1, rim: "17,5″", text: "934.2, 963 mit Felge 17,5″" },
      {
        page: 1,
        rim: "17,5″",
        text: "967, 970.0/2/3, 972.0/3, 975.0, 976.0, 979.0 mit Felge 17,5″",
      },
    ],
    notes: [
      "Der Reifendruck ist bei kaltem Reifen zu messen und einzustellen. Druckerhöhungen, infolge von Erwärmung während des Betriebes, sind normal und dürfen nicht abgelassen werden.",
      "Alle Angaben in dieser Tabelle sind Richtwerte und basieren auf durchschnittlichen Betriebsbedingungen auf Straßen, wie sie allgemein in Mitteleuropa vorliegen.",
      "EB = Einzelbereifung, ZW = Zwillingsbereifung",
    ],
  },
  "AP40.15-W-4060-01D": {
    id: "AP40.15-W-4060-01D",
    title: "Reifendrucktabelle 19,5″",
    publisher: "Daimler Truck AG",
    printed: "2026-03-05",
    revision: "P/02/26",
    rimLabel: "19,5″",
    totalPages: 2,
    pagesAvailable: [1, 2],
    typeLines: [
      {
        page: 1,
        rim: "19,5″",
        text: "375.1, 967, 970.0/2/6, 972.0, 974.2, 976.0 mit Felge 19,5″",
      },
    ],
    notes: [
      "Der Reifendruck ist bei kaltem Reifen zu messen und einzustellen. Druckerhöhungen, infolge von Erwärmung während des Betriebes, sind normal und dürfen nicht abgelassen werden.",
      "Alle Angaben in dieser Tabelle sind Richtwerte und basieren auf durchschnittlichen Betriebsbedingungen auf Straßen, wie sie allgemein in Mitteleuropa vorliegen.",
      "EB = Einzelbereifung, ZW = Zwillingsbereifung",
    ],
  },
  "AP40.15-D-4060-01C": {
    id: "AP40.15-D-4060-01C",
    title: "Reifendrucktabelle Typ 667, 668, 670",
    publisher: "Mercedes-Benz AG",
    printed: "2026-03-05",
    revision: "P/03/26",
    rimLabel: "14″–17,5″",
    totalPages: 1,
    pagesAvailable: [1],
    typeLines: [{ page: 1, rim: "14″–17,5″", text: "Typ 667, 668, 670" }],
    notes: [
      "Der Reifenluftdruck ändert sich pro 10 °C Reifenlufttemperaturwechsel um ca. 0,1 bar. Dies ist bei der Kontrolle des Reifenluftdruckes in Werkstatträumen zu beachten, besonders im Winter, wenn sich nach längerem Werkstattaufenthalt die Reifenlufttemperatur der Raumluft angeglichen hat.",
      "Beispiel: Raumlufttemperatur = 20 °C, Außenlufttemperatur = 0 °C – einzustellender Reifenluftdruck = vorgeschriebener Reifenluftdruck + 0,2 bar.",
      "Reifen-Luftdruck in bar bei kalten Reifen. Achslasten in kg (siehe Typschild).",
    ],
  },
};

export const DOCUMENT_IDS = Object.keys(DOCUMENTS) as DocumentId[];
