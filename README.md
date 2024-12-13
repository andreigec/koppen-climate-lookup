# koppen-climate-lookup

A TypeScript package for looking up Köppen climate classifications by latitude and longitude coordinates. Includes a comprehensive global dataset of Köppen climate classifications.

From https://koeppen-geiger.vu-wien.ac.at/present.htm

## Installation

```bash
pnpm add koppen-climate-lookup
```

## Usage

```typescript
import KoppenLookup from 'koppen-climate-lookup';

async function main() {
  // Get the initialized instance
  const lookup = await KoppenLookup.getInstance();

  // Look up a location
  const result = lookup.findNearest(51.5074, -0.1278, 100);
  console.log(result);
  // Output:
  // {
  //   latitude: 51.5,
  //   longitude: -0.125,
  //   koppenClass: 'Cfb',
  //   distance: 2.3
  // }
}

main().catch(console.error);
```

## API

### `KoppenLookup`

Main class for performing Köppen climate classification lookups. Uses a singleton pattern with async initialization.

#### `static async getInstance(): Promise<KoppenLookup>`
Returns a promise that resolves to the initialized KoppenLookup instance. The instance is shared across all calls to getInstance().

#### `findNearest(latitude: number, longitude: number, maxDistance: number = 100): NearestPoint | null`
- `latitude`: Latitude to look up (-90 to 90)
- `longitude`: Longitude to look up (-180 to 180)
- `maxDistance`: Maximum search radius in kilometers (default: 100)
- Returns: NearestPoint object or null if none found
- Throws: Error if coordinates are invalid

Returns the nearest Köppen classification within the specified radius, or null if none found.

#### Types

```typescript
interface NearestPoint {
  latitude: number;    // Latitude of the matched point
  longitude: number;   // Longitude of the matched point
  koppenClass: string; // Köppen classification code
  distance: number;    // Distance in kilometers from input coordinates
}
```

## Köppen Classification Codes

The package uses standard Köppen climate classification codes:

- `Af`: Tropical rainforest
- `Am`: Tropical monsoon
- `Aw`: Tropical savanna
- `BWh`: Hot desert
- `BWk`: Cold desert
- `BSh`: Hot steppe
- `BSk`: Cold steppe
- `Csa`: Mediterranean hot summer
- `Csb`: Mediterranean warm summer
- `Cwa`: Humid subtropical
- `Cwb`: Subtropical highland
- `Cfa`: Humid subtropical
- `Cfb`: Oceanic
- `Dfa`: Hot summer continental
- `Dfb`: Warm summer continental
- `Dfc`: Subarctic
- `ET`: Tundra
- `EF`: Ice cap

## Development

To build the package locally:

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build
```

## License

MIT