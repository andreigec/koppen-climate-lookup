# koppen-climate-lookup

A TypeScript package for looking up Köppen climate classifications by latitude and longitude coordinates. Includes a comprehensive global dataset of Köppen climate classifications at 0.5° (30 arc minute) resolution.

## Installation

```bash
pnpm add koppen-climate-lookup
```

## Usage

```typescript
import KoppenLookup from 'koppen-climate-lookup';

// getInstance() is synchronous; the dataset is inlined at build time.
const lookup = KoppenLookup.getInstance();

// Look up a location
const result = lookup.findNearest(51.5074, -0.1278, 100);
console.log(result);
// Output:
// {
//   latitude: 51.75,
//   longitude: -0.25,
//   koppenClass: 'Cfb',
//   distance: 28.3
// }
```

## API

### `KoppenLookup`

Main class for performing Köppen climate classification lookups. Uses a singleton pattern.

#### `static getInstance(): KoppenLookup`
Returns the shared `KoppenLookup` instance, initializing it on first call. This is synchronous because the dataset is bundled into the package.

#### `findNearest(latitude: number, longitude: number, maxDistance: number = 100): NearestPoint | null`
- `latitude`: Latitude to look up (-90 to 90)
- `longitude`: Longitude to look up (-180 to 180)
- `maxDistance`: Maximum search radius in kilometers (default: 100)
- Returns: `NearestPoint` object or `null` if none found
- Throws: Error if coordinates or `maxDistance` are not finite valid numbers

Returns the nearest Köppen classification within the specified radius, or `null` if none found. Longitude wraps across the antimeridian, so points near ±180° are handled correctly.

#### Types

```typescript
interface KoppenPoint {
  latitude: number;    // Latitude of the matched point
  longitude: number;   // Longitude of the matched point
  koppenClass: string; // Köppen classification code
}

interface NearestPoint extends KoppenPoint {
  distance: number;    // Distance in kilometers from input coordinates
}
```

## Dataset

- **Source**: [World Maps of Köppen-Geiger climate classification](https://koeppen-geiger.vu-wien.ac.at/present.htm)
- **Period**: 1986–2010 (re-analyzed March 2017 dataset, downscaled after Rubel et al. 2017)
- **Resolution**: 0.5° (30 arc minutes), 92,416 land grid cells
- **Coverage**: Land only; ocean cells are omitted, so `findNearest` returns `null` when no land is within `maxDistance`

The 0.5° grid is derived from the source's 5 arc minute raster by assigning each cell the majority class of its constituent high-resolution cells. Cells the source raster marks as ocean but that the original 0.5° product classified as land (small islands, ice shelves) retain their original classification.

If you use this data, please cite:

> Kottek, M., J. Grieser, C. Beck, B. Rudolf, and F. Rubel, 2006: World Map of the Köppen-Geiger climate classification updated. *Meteorol. Z.*, **15**, 259-263. DOI: 10.1127/0941-2948/2006/0130.
>
> Rubel, F., K. Brugger, K. Haslinger, and I. Auer, 2017: The climate of the European Alps: Shift of very high resolution Köppen-Geiger climate zones 1800-2100. *Meteorol. Z.*, DOI: 10.1127/metz/2016/0816.

## Köppen Classification Codes

The package uses standard Köppen climate classification codes. The dataset contains all of the following classes:

- `Af`: Tropical rainforest
- `Am`: Tropical monsoon
- `As`: Tropical savanna (dry summer)
- `Aw`: Tropical savanna (dry winter)
- `BSh`: Hot semi-arid
- `BSk`: Cold semi-arid
- `BWh`: Hot desert
- `BWk`: Cold desert
- `Cfa`: Humid subtropical
- `Cfb`: Oceanic
- `Cfc`: Subpolar oceanic
- `Csa`: Mediterranean hot summer
- `Csb`: Mediterranean warm summer
- `Csc`: Mediterranean cold summer
- `Cwa`: Monsoon-influenced humid subtropical
- `Cwb`: Subtropical highland
- `Cwc`: Cold subtropical highland
- `Dfa`: Hot summer continental
- `Dfb`: Warm summer continental
- `Dfc`: Subarctic
- `Dfd`: Extremely cold subarctic
- `Dsa`: Mediterranean-influenced hot summer continental
- `Dsb`: Mediterranean-influenced warm summer continental
- `Dsc`: Mediterranean-influenced subarctic
- `Dsd`: Mediterranean-influenced extremely cold subarctic
- `Dwa`: Monsoon-influenced hot summer continental
- `Dwb`: Monsoon-influenced warm summer continental
- `Dwc`: Monsoon-influenced subarctic
- `Dwd`: Monsoon-influenced extremely cold subarctic
- `EF`: Ice cap
- `ET`: Tundra

## Development

```bash
# Install dependencies
pnpm install

# Type-check, test and build
pnpm run type-check
pnpm test
pnpm run build
```

## License

ISC
