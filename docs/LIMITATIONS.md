# Limitations and safety boundaries

TruckPressure is a **lookup tool for transcribed manufacturer tables**. It is not an official
Mercedes-Benz / Daimler Truck product and does not replace the manufacturer documentation, the
vehicle's type plate / data card or the tyre manufacturer's specifications.

## What the engine does

- Matches **all** attributes exactly: factory type (via document applicability), application
  (standard / rescue vehicle), tyre size, mounting, table axle, load index and axle load.
- Returns a pressure **only** for a table cell that exists, contains a number, and is **verified**.
- Is deterministic and runs entirely in the browser; no language model or network call is involved.

## What the engine deliberately does not do

| Not done | Why |
|---|---|
| Interpolation between axle-load columns | Not defined by the manufacturer tables |
| Extrapolation beyond the documented range | Could exceed tyre / axle capacity |
| "Round up to the next column" | A conservative policy may be added later **only** after confirming it is appropriate for the specific documentation. Today the app shows the nearest verified values for information |
| Substituting a similar tyre size or load index | Different tyres have different capacities |
| Substituting single for twin mounting, or front for rear axle | Tables differ substantially |
| Treating dashes or empty cells as values | They mean "no value" |
| Using unverified or flagged cells | See [DATA_VERIFICATION.md](./DATA_VERIFICATION.md) |
| Deriving axle loads from cargo or gross weight | Axle loads must be measured / weighed |
| Assuming identical pressures on different axles | Each axle is looked up independently |
| Temperature correction | The type 667/668/670 sheet contains a note (≈0,1 bar per 10 °C); it is shown as text only |

## Data-specific limitations

- **22,5″ tables (01F)** do not distinguish axles – the same value applies to any axle with the given
  tyre, load index, mounting and axle load.
- **17,5″ / 19,5″ tables**: single vs. twin is derived from whether the row lists a ZW load index
  (documented interpretation).
- **Table axle suggestion**: for 17,5″/19,5″ the app *suggests* VA/HA (or 1./2. VA/HA) from the axle
  function and order (steering axles → VA, other axles → HA). The suggestion is shown as such and can
  be changed by the user.
- **Type 667/668/670** tables do not state the mounting; the separate rescue/ambulance tables are
  only used when that application is selected.
- 63 cells are unverified and 7 are flagged as implausible; they never produce a recommendation.
- The family filter (Actros/Arocs/Atego) is based on public references, not on the manufacturer
  documents ([VEHICLE_MAPPING.md](./VEHICLE_MAPPING.md)).
- Table values are guide values for average operating conditions on roads in Central Europe
  (as stated in the documents). Special operating conditions may require different values.

## Shared links and saved vehicles

Only the configuration (vehicle, tyres, axle loads) is stored or shared – never a calculated
pressure. When a configuration from a different dataset version is opened, the app shows a notice
and recalculates everything from the current dataset.
