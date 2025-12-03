import { describe, it, expect } from 'vitest';
import signedArea from '../src/signed_area';

describe('analytical signed area', () => {
  it('should calculate negative area', () => {
    expect(signedArea([0, 0], [0, 1], [1, 1])).toBe(-1);
  });

  it('should calculate positive area', () => {
    expect(signedArea([0, 1], [0, 0], [1, 0])).toBe(1);
  });

  it('should calculate collinear 0 area', () => {
    expect(signedArea([0, 0], [1, 1], [2, 2])).toBe(0);
  });

  it('should handle point on segment', () => {
    expect(signedArea([-1, 0], [2, 3], [0, 1])).toBe(0);
    expect(signedArea([2, 3], [-1, 0], [0, 1])).toBe(0);
  });
});