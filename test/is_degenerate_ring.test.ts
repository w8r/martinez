import { describe, it, expect } from 'vitest';
import isDegenerateRing from '../src/is_degenerate_ring';

describe('is degenerate ring', () => {
  it('should detect rings with fewer than three distinct points', () => {
    expect(isDegenerateRing([[0, 0], [0, 0]])).toBe(true);
    expect(isDegenerateRing([[0, 0], [1, 1], [0, 0]])).toBe(true);
    expect(isDegenerateRing([[0, 0], [0, 0], [1, 1], [0, 0]])).toBe(true);
  });

  it('should detect collinear rings', () => {
    expect(isDegenerateRing([[0, 0], [1, 1], [2, 2], [0, 0]])).toBe(true);
    expect(isDegenerateRing([[0, 0], [2, 2], [1, 1], [0, 0]])).toBe(true);
  });

  it('should accept rings with area', () => {
    expect(isDegenerateRing([[0, 0], [1, 0], [1, 1], [0, 0]])).toBe(false);
    expect(isDegenerateRing([[0, 0], [1, 1], [2, 2], [2, 3], [0, 0]])).toBe(false);
  });
});
