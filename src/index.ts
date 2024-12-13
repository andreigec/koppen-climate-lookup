import { promises as fs } from 'fs';
import path from 'path';

interface KoppenPoint {
  latitude: number;
  longitude: number;
  koppenClass: string;
}

interface NearestPoint extends KoppenPoint {
  distance: number;
}

export class KoppenLookup {
  private data: KoppenPoint[] = [];
  private static instance: KoppenLookup | null = null;

  private constructor() {}

  /**
   * Get or create an initialized KoppenLookup instance
   * @returns Promise that resolves to the initialized KoppenLookup instance
   */
  public static async getInstance(): Promise<KoppenLookup> {
    if (!KoppenLookup.instance) {
      KoppenLookup.instance = new KoppenLookup();
      await KoppenLookup.instance.initialize();
    }
    return KoppenLookup.instance;
  }

  /**
   * Initialize the lookup with bundled CSV data
   * @private
   * @throws Error if file cannot be read or parsed
   */
  private async initialize(): Promise<void> {
    try {
      const csvPath = path.join(__dirname, 'koppen.csv');
      const fileContent = await fs.readFile(csvPath, 'utf-8');
      const lines = fileContent.split('\n');
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [lat, lon, koppenClass] = line.split(',');
        if (!lat || !lon || !koppenClass) continue;

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        if (isNaN(latitude) || isNaN(longitude)) continue;

        this.data.push({
          latitude,
          longitude,
          koppenClass
        });
      }
    } catch (error) {
      throw new Error(`Failed to initialize KoppenLookup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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
   * @throws Error if coordinates are invalid
   */
  findNearest(latitude: number, longitude: number, maxDistance: number = 100): NearestPoint | null {
    this.validateCoordinates(latitude, longitude);

    if (maxDistance <= 0) {
      throw new Error('maxDistance must be positive');
    }

    let nearestPoint: NearestPoint | null = null;
    let minDistance = Infinity;

    for (const point of this.data) {
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

    return nearestPoint;
  }
}

export default KoppenLookup;