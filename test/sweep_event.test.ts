import { describe, it, expect } from 'vitest';
import SweepEvent from '../src/sweep_event';

describe('sweep event', () => {
  describe('isBelow', () => {
    it('should correctly determine if point is below for left sweep event', () => {
      const s1 = new SweepEvent([0, 0], true, new SweepEvent([1, 1], false));
      
      expect(s1.isBelow([0, 1])).toBeTruthy();
      expect(s1.isBelow([1, 2])).toBeTruthy();
      expect(s1.isBelow([0, 0])).toBeFalsy();
      expect(s1.isBelow([5, -1])).toBeFalsy();
    });

    it('should correctly determine if point is below for right sweep event', () => {
      const s2 = new SweepEvent([0, 1], false, new SweepEvent([0, 0], false));
      
      expect(s2.isBelow([0, 1])).toBeFalsy();
      expect(s2.isBelow([1, 2])).toBeFalsy();
      expect(s2.isBelow([0, 0])).toBeFalsy();
      expect(s2.isBelow([5, -1])).toBeFalsy();
    });
  });

  describe('isAbove', () => {
    it('should correctly determine if point is above for left sweep event', () => {
      const s1 = new SweepEvent([0, 0], true, new SweepEvent([1, 1], false));
      
      expect(s1.isAbove([0, 1])).toBeFalsy();
      expect(s1.isAbove([1, 2])).toBeFalsy();
      expect(s1.isAbove([0, 0])).toBeTruthy();
      expect(s1.isAbove([5, -1])).toBeTruthy();
    });

    it('should correctly determine if point is above for right sweep event', () => {
      const s2 = new SweepEvent([0, 1], false, new SweepEvent([0, 0], false));
      
      expect(s2.isAbove([0, 1])).toBeTruthy();
      expect(s2.isAbove([1, 2])).toBeTruthy();
      expect(s2.isAbove([0, 0])).toBeTruthy();
      expect(s2.isAbove([5, -1])).toBeTruthy();
    });
  });

  describe('isVertical', () => {
    it('should detect vertical segments', () => {
      expect(new SweepEvent([0, 0], true, new SweepEvent([0, 1], false)).isVertical()).toBeTruthy();
    });

    it('should detect non-vertical segments', () => {
      expect(new SweepEvent([0, 0], true, new SweepEvent([0.0001, 1], false)).isVertical()).toBeFalsy();
    });
  });
});