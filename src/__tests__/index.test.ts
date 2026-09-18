import { describe, it, expect } from 'vitest';
import KoppenLookup from '../index';
import raw from '../koppen.csv?raw';

interface TestPoint {
  latitude: number;
  longitude: number;
  koppenClass: string;
}

const points: TestPoint[] = [];
for (const line of raw.split('\n').slice(1)) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  const [lat, lon, koppenClass] = trimmed.split(',');
  points.push({ latitude: parseFloat(lat), longitude: parseFloat(lon), koppenClass });
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bruteForce(latitude: number, longitude: number, maxDistance: number) {
  let nearest: (TestPoint & { distance: number }) | null = null;
  let minDistance = Infinity;
  for (const point of points) {
    const distance = haversine(latitude, longitude, point.latitude, point.longitude);
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      nearest = { ...point, distance };
    }
  }
  return nearest;
}

describe('KoppenLookup', () => {
  it('should initialize successfully', () => {
    const lookup = KoppenLookup.getInstance();
    expect(lookup).toBeDefined();
  });

  it('should return the same instance on multiple calls', () => {
    const lookup1 = KoppenLookup.getInstance();
    const lookup2 = KoppenLookup.getInstance();
    expect(lookup1).toBe(lookup2);
  });

  it('should find a known Antarctic point', () => {
    const lookup = KoppenLookup.getInstance();
    const result = lookup.findNearest(-89.75, -179.75, 100);

    expect(result).toBeDefined();
    expect(result?.koppenClass).toBe('EF');
    expect(result?.latitude).toBe(-89.75);
    expect(result?.longitude).toBe(-179.75);
    expect(result?.distance).toBe(0);
  });

  it('should return null when no point is found within maxDistance', () => {
    const lookup = KoppenLookup.getInstance();
    const result = lookup.findNearest(0, 0, 1); // Using very small search radius
    expect(result).toBeNull();
  });

  it('should throw error for invalid latitude', () => {
    const lookup = KoppenLookup.getInstance();
    expect(() => lookup.findNearest(91, 0, 100)).toThrow('Latitude must be between -90 and 90 degrees');
  });

  it('should throw error for invalid longitude', () => {
    const lookup = KoppenLookup.getInstance();
    expect(() => lookup.findNearest(0, 181, 100)).toThrow('Longitude must be between -180 and 180 degrees');
  });

  it('should throw error for invalid maxDistance', () => {
    const lookup = KoppenLookup.getInstance();
    expect(() => lookup.findNearest(0, 0, -1)).toThrow('maxDistance must be positive');
  });

  it('should throw for non-finite coordinates and maxDistance', () => {
    const lookup = KoppenLookup.getInstance();
    expect(() => lookup.findNearest(NaN, 0, 100)).toThrow('Latitude and longitude must be finite numbers');
    expect(() => lookup.findNearest(0, NaN, 100)).toThrow('Latitude and longitude must be finite numbers');
    expect(() => lookup.findNearest(0, 0, NaN)).toThrow('maxDistance must be positive');
    expect(() => lookup.findNearest(Infinity, 0, 100)).toThrow('Latitude and longitude must be finite numbers');
  });

  it('should handle edge case coordinates', () => {
    const lookup = KoppenLookup.getInstance();

    // Test extreme coordinates
    const northPole = lookup.findNearest(90, 0, 100);
    expect(northPole).toBeDefined();

    const southPole = lookup.findNearest(-90, 0, 100);
    expect(southPole).toBeDefined();

    const dateLine = lookup.findNearest(0, 180, 100);
    expect(dateLine).toBeDefined();
  });

  it('should find points with reasonable distances', () => {
    const lookup = KoppenLookup.getInstance();
    const result = lookup.findNearest(-89, -179, 1000);

    expect(result).toBeDefined();
    expect(result?.distance).toBeLessThan(1000);
    expect(result?.distance).toBeGreaterThan(0);
  });

  it('should match a brute-force search across the globe', () => {
    const lookup = KoppenLookup.getInstance();
    const radii = [1, 25, 100, 500, 2500];

    // Deterministic pseudo-random queries covering poles, the antimeridian and
    // everything in between.
    let seed = 123456789;
    const random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    const queries: Array<[number, number, number]> = [
      [0, 179.9, 100],
      [0, -179.9, 100],
      [65.75, 179.9, 100],
      [65.75, -179.9, 100],
      [89.9, 0, 500],
      [-89.9, 120, 500],
    ];
    for (let i = 0; i < 60; i++) {
      const latitude = random() * 178 - 89;
      const longitude = random() * 360 - 180;
      const maxDistance = radii[Math.floor(random() * radii.length)];
      queries.push([latitude, longitude, maxDistance]);
    }

    for (const [latitude, longitude, maxDistance] of queries) {
      const expected = bruteForce(latitude, longitude, maxDistance);
      const actual = lookup.findNearest(latitude, longitude, maxDistance);

      if (expected === null) {
        expect(actual).toBeNull();
      } else {
        expect(actual).not.toBeNull();
        expect(actual?.koppenClass).toBe(expected.koppenClass);
        expect(actual?.distance).toBeCloseTo(expected.distance, 6);
      }
    }
  });
});
