import { describe, it, expect } from 'vitest';
import intersection from '../src/segment_intersection';

describe('segment intersection', () => {
  it('should return null when no intersections exist', () => {
    expect(intersection([0, 0], [1, 1], [1, 0], [2, 2])).toBe(null);
    expect(intersection([0, 0], [1, 1], [1, 0], [10, 2])).toBe(null);
    expect(intersection([2, 2], [3, 3], [0, 6], [2, 4])).toBe(null);
  });

  it('should find single intersections', () => {
    expect(intersection([0, 0], [1, 1], [1, 0], [0, 1])).toEqual([[0.5, 0.5]]);
  });

  it('should handle shared points', () => {
    expect(intersection([0, 0], [1, 1], [0, 1], [0, 0])).toEqual([[0, 0]]);
    expect(intersection([0, 0], [1, 1], [0, 1], [1, 1])).toEqual([[1, 1]]);
  });

  it('should handle T-crossings', () => {
    expect(intersection([0, 0], [1, 1], [0.5, 0.5], [1, 0])).toEqual([[0.5, 0.5]]);
  });

  it('should handle overlapping segments', () => {
    expect(intersection([0, 0], [10, 10], [1, 1], [5, 5])).toEqual([[1, 1], [5, 5]]);
    expect(intersection([1, 1], [10, 10], [1, 1], [5, 5])).toEqual([[1, 1], [5, 5]]);
    expect(intersection([3, 3], [10, 10], [0, 0], [5, 5])).toEqual([[3, 3], [5, 5]]);
    expect(intersection([0, 0], [1, 1], [0, 0], [1, 1])).toEqual([[0, 0], [1, 1]]);
    expect(intersection([1, 1], [0, 0], [0, 0], [1, 1])).toEqual([[1, 1], [0, 0]]);
  });

  it('should handle collinear segments', () => {
    expect(intersection([0, 0], [1, 1], [1, 1], [2, 2])).toEqual([[1, 1]]);
    expect(intersection([1, 1], [0, 0], [1, 1], [2, 2])).toEqual([[1, 1]]);
    expect(intersection([0, 0], [1, 1], [2, 2], [4, 4])).toBe(null);
  });

  it('should handle parallel segments', () => {
    expect(intersection([0, 0], [1, 1], [0, -1], [1, 0])).toBe(null);
    expect(intersection([1, 1], [0, 0], [0, -1], [1, 0])).toBe(null);
    expect(intersection([0, -1], [1, 0], [0, 0], [1, 1])).toBe(null);
  });

  it('should handle skip touches option for shared points', () => {
    expect(intersection([0, 0], [1, 1], [0, 1], [0, 0], true)).toBe(null);
    expect(intersection([0, 0], [1, 1], [0, 1], [1, 1], true)).toBe(null);
  });

  it('should handle skip touches option for collinear segments', () => {
    expect(intersection([0, 0], [1, 1], [1, 1], [2, 2], true)).toBe(null);
    expect(intersection([1, 1], [0, 0], [1, 1], [2, 2], true)).toBe(null);
  });

  it('should handle skip touches option for overlapping segments', () => {
    expect(intersection([0, 0], [1, 1], [0, 0], [1, 1], true)).toBe(null);
    expect(intersection([1, 1], [0, 0], [0, 0], [1, 1], true)).toBe(null);
  });

  it('should find intersections with skip touches option when not touching', () => {
    expect(intersection([0, 0], [1, 1], [1, 0], [0, 1], true)).toEqual([[0.5, 0.5]]);
  });
});