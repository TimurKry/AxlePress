# TruckPressure

**Kaltreifendruck für Mercedes-Benz Lkw – direkt aus verifizierten Herstellertabellen.**
Cold tyre pressure lookup for Mercedes-Benz trucks (Actros, Arocs, Atego and further factory types),
per axle, with full source traceability.

> ⚠️ **Independent project.** Not an official application of Daimler Truck AG or Mercedes-Benz AG and
> not endorsed by them. Brand and product names are used for identification only. The type plate,
> vehicle data card, applicable manufacturer documentation and tyre manufacturer specifications are
> always authoritative.

## Features

- **Exact, deterministic lookup** from transcribed manufacturer tables – no interpolation, no
  extrapolation, no substitution, no AI at runtime. Unsupported combinations show
  *„Für diese Kombination liegt kein verifizierter Tabellenwert vor.“*
- **Multi-axle vehicles (2–5 axles)**: independent tyre size, mounting, load index and axle load per
  axle; roles steering / drive / trailing / lift; copy tyre data between axles; per-axle result cards
  plus a schematic overview of the whole truck.
- **Dependent selections**: factory type → tyre size → mounting → table axle → load index; only
  documented combinations can be selected. Documented axle loads can be tapped as quick picks.
- **Traceability**: every result shows document ID, page, verification status and – on demand – the
  original table row(s) (*„Originaltabellenwerte anzeigen“*).
- **Verification states**: glare-obscured cells are *unverified*, implausible printed values are
  *flagged*; neither is ever used for a recommendation.
- German (default) / English, dark graphite and high-contrast daylight themes.
- Last configuration and saved vehicles in `localStorage`; shareable links (configuration only,
  dataset version checked on open).
- Installable PWA with offline support (dataset is part of the app bundle).

## Coverage

| Document | Rim | Factory types |
|---|---|---|
| AP40.15-W-4060-01F | 22,5″ | 374.5/6, 375.1/3/4, 930–934, 940–944, 949, 950–957, 963, 964, 967, 969, 970, 972, 975.2, 976, 983 (see docs) |
| AP40.15-W-4060-01C | 17,5″ | 934.2, 963, 967, 970.0/2/3, 972.0/3, 975.0, 976.0, 979.0 |
| AP40.15-W-4060-01D | 19,5″ | 375.1, 967, 970.0/2/6, 972.0, 974.2, 976.0 |
| AP40.15-D-4060-01C | 14″–17,5″ | 667, 668, 670 (incl. rescue/ambulance tables) |

1 964 table cells transcribed: **1 894 verified**, 63 unverified, 7 flagged.
Details: [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md), [`docs/DATA_VERIFICATION.md`](docs/DATA_VERIFICATION.md),
[`docs/VEHICLE_MAPPING.md`](docs/VEHICLE_MAPPING.md), [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md).

## Tech stack

Next.js 16 (App Router, static prerender / static export) · React 19 · TypeScript (strict) ·
Tailwind CSS 4 · shadcn/ui-style components (`components.json`, `src/components/ui`) · Lucide icons ·
Zod · Vitest · Playwright · GitHub Pages (or Vercel).

## Getting started

Requirements: Node.js ≥ 20.9 (22 LTS recommended), npm.

```bash
npm install          # .npmrc sets legacy-peer-deps (works around an npm peer-resolution bug)
npm run dev          # http://localhost:3000
```

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run build:pages` | Static export to `./out` for GitHub Pages (set `NEXT_PUBLIC_BASE_PATH`) |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm test` | Unit tests (engine, parser, data validation, i18n, codecs) |
| `npm run validate:data` | Validate the production dataset only |
| `npm run test:e2e` | Playwright E2E (mobile + desktop) against the production build – run `npm run build` first; first time: `npx playwright install chromium` |
| `npm run check` | typecheck + lint + unit tests + build |

## Project structure

```
src/
  app/                    layout, page, manifest, global styles
  components/
    calculator/           vehicle selection, axle cards, state (use-calculator), saved vehicles
    result/               result cards, truck overview, original-table view
    layout/               header, footer, safety notes, sources panel, PWA
    ui/                   shadcn-style primitives (button, card, native-select, …)
  data/
    documents.ts          document metadata (IDs, pages, notes)
    vehicles.ts           factory-type applicability + family mapping
    pressure-tables/      literal table transcriptions (one file per document)
  lib/
    table-parser.ts       token parsing → PressureRecord[]
    pressure-engine.ts    exact-match lookup
    pressure-validation.ts Zod schema, duplicate/conflict/monotonicity checks
    options.ts            dependent dropdown options, axle normalisation
    vehicle-types.ts      Baumuster/FIN parsing and pattern matching
    axle-results.ts       per-axle result computation
    config-codec.ts       share links / storage schemas
    __fixtures__/         SYNTHETIC test data (never imported by app code)
  i18n/                   de.ts (default), en.ts, provider
  types/pressure.ts       domain types
docs/                     data sources, verification, mapping, limitations
e2e/                      Playwright tests
public/                   icons, service worker
```

### Lookup API

```ts
import { lookupPressure } from "@/lib/pressure-engine";

lookupPressure({
  vehicleType: "963.403",
  tireSize: "315/80 R 22,5",
  loadIndex: "156/150",
  axlePosition: "any",      // 22,5″ tables do not distinguish axles
  mounting: "twin",
  axleLoadKg: 10300,
});
// → { status: "exact", pressureBar: 6.25, sourceId: "AP40.15-W-4060-01F", sourcePage: 4, matchedAxleLoadKg: 10300, … }
```

Unavailable results carry a `reason` (`unknown_tire_size`, `no_exact_match`, `unverified_value`,
`flagged_value`, `above_documented_range`, …) and, where applicable, the nearest verified neighbours
for information.

## Deployment

### GitHub Pages (recommended – free, no extra account)

The workflow `.github/workflows/pages.yml` builds a fully static version of the app
(`output: "export"`) and publishes it on every push to the repository's **default branch**.

One-time setup on GitHub:

1. **Settings → General → Danger Zone → Change visibility → Public**
   (GitHub Pages is free for public repositories).
2. **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
3. **Actions → "Deploy to GitHub Pages" → Run workflow** (or push a commit).

The site is then available at **https://timurkry.github.io/AxlePress/** (the URL is also shown in
the workflow run and under Settings → Pages). The base path is taken automatically from
`actions/configure-pages`, so forks and custom domains work without code changes.

Local check of the static build (Linux/macOS):

```bash
NEXT_PUBLIC_BASE_PATH=/AxlePress npm run build:pages   # → ./out
mkdir -p /tmp/site && cp -r out /tmp/site/AxlePress && python3 -m http.server -d /tmp/site 8080
# open http://localhost:8080/AxlePress/
```

Static hosting cannot send the security headers defined in `next.config.ts`; they only apply to
server deployments.

### Vercel / Node server (alternative)

`npm run build && npm start`, or import the repository in Vercel (`vercel.json` pins `npm ci` /
`npm run build`). No environment variables or secrets are required.

CI (`.github/workflows/ci.yml`) runs typecheck, lint, unit tests, build and the Playwright suite on
every push and pull request.

## Updating data

See [`docs/DATA_VERIFICATION.md#updating-the-dataset`](docs/DATA_VERIFICATION.md#updating-the-dataset).
Never add values that were not read from a manufacturer document; mark anything uncertain with `?`.

## Remaining verification tasks

1. Re-photograph 01F pages 2, 3 and 4 (glare areas) and verify the 63 unverified + 45 illegible cells.
2. Confirm the 7 flagged cells and the `305/70 R 19,5` 2. HA row with the manufacturer.
3. Confirm the EB/ZW → single/twin interpretation of the 17,5″/19,5″ tables.
4. Independent second-person review of all values (four-eyes principle).
5. Confirm the series → model-family mapping with official documentation; map remaining series.
6. Legal review: permission to publish transcribed values, trademark usage, choice of licence
   (the repository is currently **unlicensed** – all rights reserved by the author).
7. Decide whether a conservative lookup policy (e.g. next higher documented axle load) is
   acceptable for these documents.

## Licence

No licence has been chosen yet (`UNLICENSED`). Table values are © Daimler Truck AG / Mercedes-Benz AG;
see the legal review task above before public distribution.
