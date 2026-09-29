import { describe, it, expect } from 'vitest';
import removeSpikes from '../src/remove_spikes';
import { Position } from '../src/types';

const ring = (points: number[][]) => points as Position[];

describe('remove spikes', () => {
  it('should keep rings without spikes unchanged', () => {
    const square = ring([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]);
    expect(removeSpikes(square)).toEqual(square);
  });

  it('should remove a spike in the middle of the ring', () => {
    expect(removeSpikes(ring([[0, 0], [1, 0], [2, 0], [1, 0], [1, 1], [0, 1], [0, 0]])))
      .toEqual([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]);
  });

  it('should remove nested spikes', () => {
    expect(removeSpikes(ring([[0, 0], [1, 0], [2, 0], [3, 0], [2, 0], [1, 0], [1, 1], [0, 1], [0, 0]])))
      .toEqual([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]);
  });

  it('should remove spikes across the start of the ring', () => {
    // spike tip at the last point
    expect(removeSpikes(ring([[0, 0], [1, 0], [1, 1], [0, 1], [-1, 1], [0, 1], [0, 0]])))
      .toEqual([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]);
    // spike tip at the first point
    expect(removeSpikes(ring([[-1, 0], [0, 0], [1, 0], [1, 1], [0, 1], [0, 0], [-1, 0]])))
      .toEqual([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]);
  });

  it('should remove repeated points', () => {
    expect(removeSpikes(ring([[0, 0], [1, 0], [1, 0], [1, 1], [0, 1], [0, 0]])))
      .toEqual([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]);
  });

  it('should close unclosed rings', () => {
    expect(removeSpikes(ring([[0, 0], [1, 0], [1, 1]]))).toEqual([[0, 0], [1, 0], [1, 1], [0, 0]]);
  });

  it('should reduce a pure spike to a degenerate ring', () => {
    expect(removeSpikes(ring([[0, 0], [1, 0], [0, 0]])).length).toBeLessThan(4);
  });
});
