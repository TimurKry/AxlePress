# Vehicle mapping

## 1. Factory types per document (authoritative – from the manufacturer documents)

| Document | "Typ" line as printed | Expanded patterns |
|---|---|---|
| 01F (22,5″) line 1 | 374.5/6, 375.3/4, 930.0/1/2/3, 932.0/1/2/3, 933.1/3, 934.0/1/2, 940.1/2/3, 942.1/3, 943.1/3, 944.0/1/2, 949, 950.0/1/2/3/5/6, 952.0/1/2/3/5/6, 953.1/3/6, 954.0/1/2/5, 956 (außer 956.264/265), 957.3/5/6, 963, 964, 969, 983 | 374.5, 374.6, 375.3, 375.4, 930.0 … 983 – exclusions 956.264, 956.265 |
| 01F (22,5″) line 2 | 375.1, 967, 970.0/2/3, 972.0/3, 975.2, 976.0/3 | 375.1, 967, 970.0, 970.2, 970.3, 972.0, 972.3, 975.2, 976.0, 976.3 |
| 01C (17,5″) line 1 | 934.2, 963 | 934.2, 963 |
| 01C (17,5″) line 2 | 967, 970.0/2/3, 972.0/3, 975.0, 976.0, 979.0 | 967, 970.0, 970.2, 970.3, 972.0, 972.3, 975.0, 976.0, 979.0 |
| 01D (19,5″) | 375.1, 967, 970.0/2/6, 972.0, 974.2, 976.0 | 375.1, 967, 970.0, 970.2, 970.6, 972.0, 974.2, 976.0 |
| D-01C | Typ 667, 668, 670 | 667, 668, 670 |

### Matching rules (`src/lib/vehicle-types.ts`)

- A Baumuster matches a pattern when it **equals** the pattern or **starts with** it
  (`963.403` → `963`; `934.215` → `934.2`).
- A Baumuster that is **less specific** than every pattern does not match
  (`934` matches nothing, because only `934.0/1/2` are listed) – the app asks for the exact Baumuster.
- Exclusions are honoured (`956.264`, `956.265` are excluded from 01F). When the user only selects
  the series `956`, the app shows a warning that 956.264/265 are excluded.
- The rim size is implied by the tyre size: a Baumuster can be listed in several documents
  (e.g. 967 → 17,5″, 19,5″ and 22,5″); the tyre-size list combines all applicable documents.

### FIN / VIN helper

For Mercedes-Benz trucks, characters 4–9 of the 17-character FIN typically encode the Baumuster
(example from a public body-builder data sheet: `W1T967009…` → `967.009`). The app offers this as a
helper only and asks the user to confirm against the type plate. This convention is **not** part of
the manufacturer tables.

## 2. Series → model family (convenience filter – NOT from the manufacturer documents)

The documents list factory types only. The family filter (Actros / Arocs / Atego) is based on public
secondary references and is labelled as such in the UI. All factory types – mapped or not – are
always available via **"Baumuster direkt"** (advanced mode).

| Series | Family shown | Status | Reference |
|---|---|---|---|
| 963 | Actros (from 2011, Actros 4/5) – also Antos | public reference | DSVA recall listing "Actros 963 … Antos 963 … Arocs 964 … Atego 967"; Arocs 964 service manual |
| 930, 932, 933, 934 | Actros MP2/MP3 (2002–2013) | public reference | Parts catalogue "Actros MP2/MP3 BM 930–934" |
| 964 | Arocs (from 2013) | public reference | DSVA recall listing; Arocs 964 service manual |
| 967 | Atego (from 2013) | public reference | DSVA recall listing; body-builder data sheet FIN `W1T967009…` |
| 970 | Atego (1998–2013) | public reference | Dealer listings "Atego 970" / "BM 970/2/4/6" |
| 976 | Atego (1998–2013) | public reference | Listing "Atego 976.05" |

URLs are stored with each mapping in `src/data/vehicles.ts`.

### Not mapped (available only under "Baumuster direkt")

374, 375, 940, 942, 943, 944, 949, 950, 952, 953, 954, 956, 957, 969, 972, 974, 975, 979, 983,
667, 668, 670.

Some of these are commonly associated with Axor, Actros MP1, Econic or Vario, and 972/974/975/979
with Atego variants, but this could not be confirmed from a reliable source during this work, so
they are deliberately **not** shown under a family.

## 3. Remaining mapping tasks

- Confirm the family mapping against official Mercedes-Benz Trucks / Daimler Truck documentation
  (e.g. WIS/XENTRY or the body-builder portal) and record the source.
- Decide whether to map 972/974/975/979 (Atego variants?) and the remaining series.
- Confirm the FIN characters 4–9 convention for all model years covered.
