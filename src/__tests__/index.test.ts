import { describe, it, expect } from 'vitest';
import KoppenLookup from '../index';

describe('KoppenLookup', () => {
  it('should initialize successfully', async () => {
    const lookup = await KoppenLookup.getInstance();
    expect(lookup).toBeDefined();
  });

  it('should return the same instance on multiple calls', async () => {
    const lookup1 = await KoppenLookup.getInstance();
    const lookup2 = await KoppenLookup.getInstance();
    expect(lookup1).toBe(lookup2);
  });

  it('should find a known Antarctic point', async () => {
    const lookup = await KoppenLookup.getInstance();
    const result = lookup.findNearest(-89.75, -179.75, 100);
    
    expect(result).toBeDefined();
    expect(result?.koppenClass).toBe('EF');
    expect(result?.latitude).toBe(-89.75);
    expect(result?.longitude).toBe(-179.75);
    expect(result?.distance).toBe(0);
  });

  it('should return null when no point is found within maxDistance', async () => {
    const lookup = await KoppenLookup.getInstance();
    const result = lookup.findNearest(0, 0, 1); // Using very small search radius
    expect(result).toBeNull();
  });

  it('should throw error for invalid latitude', async () => {
    const lookup = await KoppenLookup.getInstance();
    expect(() => lookup.findNearest(91, 0, 100)).toThrow('Latitude must be between -90 and 90 degrees');
  });

  it('should throw error for invalid longitude', async () => {
    const lookup = await KoppenLookup.getInstance();
    expect(() => lookup.findNearest(0, 181, 100)).toThrow('Longitude must be between -180 and 180 degrees');
  });

  it('should throw error for invalid maxDistance', async () => {
    const lookup = await KoppenLookup.getInstance();
    expect(() => lookup.findNearest(0, 0, -1)).toThrow('maxDistance must be positive');
  });

  it('should handle edge case coordinates', async () => {
    const lookup = await KoppenLookup.getInstance();
    
    // Test extreme coordinates
    const northPole = lookup.findNearest(90, 0, 100);
    expect(northPole).toBeDefined();
    
    const southPole = lookup.findNearest(-90, 0, 100);
    expect(southPole).toBeDefined();
    
    const dateLine = lookup.findNearest(0, 180, 100);
    expect(dateLine).toBeDefined();
  });

  it('should find points with reasonable distances', async () => {
    const lookup = await KoppenLookup.getInstance();
    const result = lookup.findNearest(-89, -179, 1000);
    
    expect(result).toBeDefined();
    expect(result?.distance).toBeLessThan(1000);
    expect(result?.distance).toBeGreaterThan(0);
  });
});