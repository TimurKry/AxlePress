# Data sources

TruckPressure only uses values transcribed from manufacturer tyre-pressure documents that were
provided as **nine photographs** of a printed binder (printed 2026-03-05). No value comes from any
other source, and no value is generated at runtime.

> The photographs are reference material and are **not** committed to this repository
> (`.gitignore` excludes `*.jpg`, `*.jpeg`, `*.heic` and `/source-photos/`). Do not publish
> the scans without permission from the rights holder.

## Documents

| Document ID | Title | Publisher | Footer | Rim | Pages | Photos provided |
|---|---|---|---|---|---|---|
| `AP40.15-W-4060-01F` | Reifendrucktabelle 22,5″ | Daimler Truck AG | printed 2026-03-05, P/02/26 | 22,5″ | 5 | 1/5, 2/5, 3/5, 4/5, 5/5 – **complete** |
| `AP40.15-W-4060-01C` | Reifendrucktabelle 17,5″ | Daimler Truck AG | printed 2026-03-05, P/02/26 | 17,5″ | 1 | 1/1 – **complete** |
| `AP40.15-W-4060-01D` | Reifendrucktabelle 19,5″ | Daimler Truck AG | printed 2026-03-05, P/02/26 | 19,5″ | 2 | 1/2, 2/2 – **complete** |
| `AP40.15-D-4060-01C` | Reifendrucktabelle Typ 667, 668, 670 | Mercedes-Benz AG | printed 2026-03-05, P/03/26 | 14″–17,5″ | 1 | 1/1 – **complete** |

No missing pages were identified: every document's page counter ("n / total") is covered.

## Photo → page mapping

Photos are numbered in the order they were supplied.

| Photo | Document | Page | Content |
|---|---|---|---|
| 1 | 01F | 4/5 | Twin table 4 600–7 100 kg (continued, rows `11 R 22,5`…`315/80 R 22,5 156/150`); twin table 7 200–10 300 kg; twin table 10 400–13 400 kg (rows `9 R`…`295/55`) |
| 2 | 01F | 5/5 | Twin table 10 400–13 400 kg (continued, rows `295/60`…`315/80 156/150`) |
| 3 | D-01C | 1/1 | Type 667/668/670: front axle, rear axle, rescue/ambulance vehicle tables |
| 4 | 01C | 1/1 | 17,5″: VA 2 900–4 400 kg, HA 3 800–6 200 kg, HA 6 700–8 300 kg |
| 5 | 01F | 2/5 | Single table 2 900–4 5xx kg; single table 4 900–6 300 kg (rows `9 R`…`315/60 152`) |
| 6 | 01F | 1/5 | Applicable factory types ("Typ" lines), general notes – no table |
| 7 | 01F | 3/5 | Single table 4 900–6 300 kg (continued, rows `315/60 154`…); single table 6 700–11 500 kg; twin table 4 600–7 100 kg (rows `9 R`, `10 R`) |
| 8 | 01D | 1/2 | 19,5″ tables (1. VA, 2. VA, 1. HA, 2. HA) |
| 9 | 01D | 2/2 | 19,5″ tables for `305/70 R 19,5` above 8 300 kg, notes |

## Where the data lives

| Path | Content |
|---|---|
| `src/data/documents.ts` | Document metadata, "Typ" lines and notes (quoted verbatim) |
| `src/data/vehicles.ts` | Factory-type applicability (expanded) and the model-family mapping |
| `src/data/pressure-tables/w-4060-01f.ts` | 22,5″ tables (pages 2–5) |
| `src/data/pressure-tables/w-4060-01c.ts` | 17,5″ tables |
| `src/data/pressure-tables/w-4060-01d.ts` | 19,5″ tables (pages 1–2) |
| `src/data/pressure-tables/d-4060-01c.ts` | Type 667/668/670 tables |
| `src/data/pressure-tables/index.ts` | `DATASET_VERSION` / `DATASET_DATE` |

Every table is stored as a **literal transcription**: the same columns, the same rows in the same
order, one token per printed cell. See [DATA_VERIFICATION.md](./DATA_VERIFICATION.md) for the token
grammar and the verification status of every cell.
