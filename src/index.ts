import data from './koppen.csv?raw';

export interface KoppenPoint {
  latitude: number;
  longitude: number;
  koppenClass: string;
}

export interface NearestPoint extends KoppenPoint {
  distance: number;
}

const EARTH_RADIUS_KM = 6371;
const KM_PER_DEGREE = (Math.PI / 180) * EARTH_RADIUS_KM;
const RADIANS_PER_DEGREE = Math.PI / 180;

const GRID_CELL_DEGREES = 0.5;
const GRID_ROWS = Math.round(180 / GRID_CELL_DEGREES);
const GRID_COLUMNS = Math.round(360 / GRID_CELL_DEGREES);
const COLUMN_STRIDE = 1024;

export class KoppenLookup {
  private readonly grid = new Map<number, KoppenPoint>();
  private static instance: KoppenLookup | null = null;

  private constructor() {
    this.initialize();
  }

  /**
   * Get the shared KoppenLookup instance
   */
  public static getInstance(): KoppenLookup {
    if (!KoppenLookup.instance) {
      KoppenLookup.instance = new KoppenLookup();
    }
    return KoppenLookup.instance;
  }

  /**
   * Initialize the lookup with CSV data
   * @private
   */
  private initialize(): void {
    const lines = data.split('\n');

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [lat, lon, koppenClass] = line.split(',');
      if (!lat || !lon || !koppenClass) continue;

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      if (isNaN(latitude) || isNaN(longitude)) continue;

      const point: KoppenPoint = {
        latitude,
        longitude,
        koppenClass
      };

      this.grid.set(this.gridKey(latitude, longitude), point);
    }
  }

  /**
   * Map a coordinate to its grid cell key
   * @private
   */
  private gridKey(latitude: number, longitude: number): number {
    const row = Math.floor((latitude + 90) / GRID_CELL_DEGREES);
    const column = Math.floor((longitude + 180) / GRID_CELL_DEGREES);
    return row * COLUMN_STRIDE + column;
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param lat1 - Latitude of first point
   * @param lon1 - Longitude of first point
   * @param lat2 - Latitude of second point
   * @param lon2 - Longitude of second point
   * @returns Distance in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = (lat2 - lat1) * RADIANS_PER_DEGREE;
    const dLon = (lon2 - lon1) * RADIANS_PER_DEGREE;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * RADIANS_PER_DEGREE) * Math.cos(lat2 * RADIANS_PER_DEGREE) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  /**
   * Validate coordinates
   * @param latitude - Latitude to validate
   * @param longitude - Longitude to validate
   * @throws Error if coordinates are invalid
   */
  private validateCoordinates(latitude: number, longitude: number): void {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Latitude and longitude must be numbers');
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error('Latitude and longitude must be finite numbers');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
  }

  /**
   * Find nearest Koppen classification for given coordinates
   * @param latitude - Latitude to look up
   * @param longitude - Longitude to look up
   * @param maxDistance - Maximum distance in kilometers to search (default: 100)
   * @returns Object containing nearest point and classification, or null if none found
   * @throws Error if coordinates or maxDistance are invalid
   */
  findNearest(latitude: number, longitude: number, maxDistance: number = 100): NearestPoint | null {
    this.validateCoordinates(latitude, longitude);

    if (typeof maxDistance !== 'number' || !Number.isFinite(maxDistance) || maxDistance <= 0) {
      throw new Error('maxDistance must be positive');
    }

    // Convert the search radius into a latitude/longitude bounding box. The
    // longitude span uses the highest latitude in range so it stays valid as
    // the meridians converge towards the poles.
    const latitudeDelta = maxDistance / KM_PER_DEGREE;
    const highestLatitude = Math.min(90, Math.abs(latitude) + latitudeDelta);
    const cosHighestLatitude = Math.cos(highestLatitude * RADIANS_PER_DEGREE);
    const longitudeDelta = cosHighestLatitude < 1e-12
      ? 180
      : Math.min(180, maxDistance / (KM_PER_DEGREE * cosHighestLatitude));

    // Expand by one cell so any qualifying point's cell is included.
    const margin = GRID_CELL_DEGREES;
    const minRow = Math.max(0, Math.floor((latitude - latitudeDelta - margin + 90) / GRID_CELL_DEGREES));
    const maxRow = Math.min(GRID_ROWS - 1, Math.floor((latitude + latitudeDelta + margin + 90) / GRID_CELL_DEGREES));
    const minColumn = Math.floor((longitude - longitudeDelta - margin + 180) / GRID_CELL_DEGREES);
    const maxColumn = Math.floor((longitude + longitudeDelta + margin + 180) / GRID_CELL_DEGREES);

    let nearestPoint: NearestPoint | null = null;
    let minDistance = Infinity;

    for (let row = minRow; row <= maxRow; row++) {
      for (let column = minColumn; column <= maxColumn; column++) {
        // Wrap columns across the antimeridian.
        const wrappedColumn = ((column % GRID_COLUMNS) + GRID_COLUMNS) % GRID_COLUMNS;
        const point = this.grid.get(row * COLUMN_STRIDE + wrappedColumn);
        if (!point) continue;

        const distance = this.calculateDistance(
          latitude,
          longitude,
          point.latitude,
          point.longitude
        );

        if (distance < minDistance && distance <= maxDistance) {
          minDistance = distance;
          nearestPoint = {
            ...point,
            distance
          };
        }
      }
    }

    return nearestPoint;
  }
}

export default KoppenLookup;
