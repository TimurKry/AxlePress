# Data verification

Dataset version **2026.11.1** (2026-11-08).

## Method

1. Every photograph was inspected and each table region was cropped and enlarged
   (1.3×–3×) so that each cell could be read individually. OCR was **not** used.
2. Values were typed into `src/data/pressure-tables/*.ts` as literal table rows
   (same column order, same row order, one token per cell).
3. Any cell (or column header) touched by glare, smudges or reflections was marked as
   **unverified**, even when the remaining visible strokes suggested a value.
4. Legible values that are implausible were preserved as printed but marked **flagged**.
5. Automated checks (`npm run validate:data`, part of `npm test`) enforce:
   - one token per column in every row, valid token syntax;
   - Zod schema validation of every record (tyre size format, axle load 1 000–20 000 kg,
     pressure 1–10 bar, precision 1–2 decimals, document/page exist);
   - **no duplicate or conflicting lookup keys** (same document, application, tyre size, load index,
     axle, mounting and axle load) – conflicting pressures fail the build;
   - **monotonicity**: within one series, verified pressures never decrease with increasing axle load
     (this caught/confirms the flagged anomalies below);
   - every non-verified cell carries an explanatory note;
   - a snapshot of record counts, so accidental edits are visible in review.

### Token grammar

| Token | Meaning | Used for lookup |
|---|---|---|
| `5,0` | value, clearly legible | ✅ yes |
| `5,0?` | value partially obscured – best-guess reading | ❌ unverified |
| `?` | cell illegible | ❌ (no record) |
| `8,25!` | value legible but implausible | ❌ flagged |
| `-` | dash printed in the source | ❌ (no record) |
| `_` | empty cell in the source | ❌ (no record) |
| header `4500?` | column header partially obscured | ❌ whole column unverified |
| header `?` | column header illegible | ❌ whole column ignored |

## Statistics

| Document | Verified | Unverified | Flagged |
|---|---:|---:|---:|
| AP40.15-W-4060-01F (22,5″) | 1 545 | 59 | 1 |
| AP40.15-W-4060-01C (17,5″) | 108 | 0 | 0 |
| AP40.15-W-4060-01D (19,5″) | 143 | 3 | 6 |
| AP40.15-D-4060-01C (667/668/670) | 98 | 1 | 0 |
| **Total** | **1 894** | **63** | **7** |

In addition, 8 single cells and one full column (37 cells, illegible header) produce no record.

## Unverified cells (glare / smudge)

| Document, page | Table | Cells | Reason |
|---|---|---|---|
| 01F p.2 | Single 2 900–… kg | Column 11 header `?500` (read as 4 500) → all 30 legible values of that column; 6 cells in that column illegible (`10 R`…`275/70 148`) | Reflection over the first digit of the header and the upper cells |
| 01F p.2 | Single 2 900–… kg | Column 12 – header illegible (probably 4 600) → **entire column ignored** | Reflection |
| 01F p.3 | Single 4 900–6 300 kg | `315/60 154` @ 6 100, 6 200 · `315/70 152` @ 6 100, 6 200, 6 300 · `315/70 154` @ 6 100, 6 200, 6 300 · `315/70 156` @ 6 300 · `355/50 156` @ 6 200 · `365/70 162` @ 6 200 (illegible) | Reflection, upper right |
| 01F p.4 | Twin 4 600–7 100 kg | Rows `11 R 145` … `295/60 147`, columns 7 000 and 7 100 (`12 R 148` @ 7 000 illegible) | Reflection, upper right |
| 01D p.1 | 1. VA 2 900–4 400 kg | Column 4 400 – last digit of header obscured → 4 cells | Reflection |
| D-01C p.1 | Front axle | `8 R 17,5` @ 2 100 kg (reads 4,5) | Smudge on the sleeve |

## Flagged cells (legible but implausible)

| Document, page | Row | Axle load | Printed | Why it is blocked |
|---|---|---:|---:|---|
| 01F p.3 | `355/50 R 22,5` LI 156, single | 5 000 kg | 8,25 | Neighbours are 5,0 (4 900 kg) and 5,25 (5 100 kg) – almost certainly a print error for 5,25 |
| 01D p.1 | `305/70 R 19,5` 1. VA, EB 147/148 | 4 400 kg | 7,0 | 4 500 kg = 6,4 bar in the next table; also unverified header |
| 01D p.1 | `265/70 R 19,5` 1. VA, EB 140 | 5 300 kg | 7,8 | 5 000 kg = 8,0 bar; above the single-tyre capacity of LI 140 (2 × 2 500 kg) |
| 01D p.1 | `305/70 R 19,5` 2. HA, EB 147/148 / ZW 145 | 5 100 / 6 000 / 6 100 / 6 300 kg | 7,3 / 8,6 / 8,7 / 9,0 | Identical to the single-tyre 1. VA curve although the row lists a twin load index, while 8 000 kg+ follows the twin curve (6,2 … 8,1). Mounting is ambiguous |

## Interpretations (documented, not guessed values)

- **Mounting in 17,5″ / 19,5″ tables**: rows that list a ZW (Zwillingsbereifung) load index are treated
  as twin-mounted, rows without one as single-mounted. Cross-check: the resulting loads per tyre are
  within the load-index capacity in every verified row (e.g. `9,5 R 17,5` HA 7 000 kg = 4 × 1 750 kg = LI 127 twin).
- **22,5″ tables** do not distinguish axles – the lookup uses axle designation `any`.
- **Type 667/668/670** tables do not state single/twin – mounting `unspecified`.
- `245/70 R 19,5` 1. HA appears twice: once with EB 136 only (single, 3 200/3 800 kg) and once with
  EB 136 / ZW 136 (8 100 kg). Both rows are kept as printed; the identical EB/ZW index is unusual
  and listed below for confirmation.
- Both "Typ" lines on page 1 of 01F (and of 01C) precede a single table heading, so both lines are
  applied to all tables of that document.

## Remaining verification tasks

1. Re-photograph **01F page 2** (right edge, columns 4 500 / 4 600 kg) without reflections and
   verify the 37 + 37 affected cells.
2. Re-photograph **01F page 3** (upper right, 6 100–6 300 kg) and **01F page 4** (upper right,
   twin 7 000 / 7 100 kg) and verify the 31 affected cells.
3. Verify the **01D page 1** column header "4 400" and its 4 cells.
4. Verify `8 R 17,5` VA 2 100 kg on the type 667/668/670 sheet (smudge).
5. Ask the manufacturer to confirm the **7 flagged cells** and the semantics of the
   `305/70 R 19,5` **2. HA** row (single or twin?).
6. Confirm the EB/ZW → single/twin interpretation and the `245/70 R 19,5` "136 / 136" row.
7. Independent second-person check of **all** transcribed values against the originals
   (four-eyes principle) and record the sign-off below.

| Date | Reviewer | Scope | Result |
|---|---|---|---|
| 2026-11-08 | Transcription (initial) | all tables | 1 894 verified, 63 unverified, 7 flagged |
| _pending_ | _second reviewer_ | all tables | |

## Updating the dataset

1. Edit the table tokens in `src/data/pressure-tables/*.ts` (never remove the `?`/`!` markers
   without having re-verified the cell in a better photograph).
2. Bump `DATASET_VERSION` / `DATASET_DATE` in `src/data/pressure-tables/index.ts` and
   `CACHE_VERSION` in `public/sw.js`.
3. Run `npm run validate:data` and update the statistics snapshot in
   `src/lib/data-validation.test.ts` if counts changed intentionally.
4. Update this file.
