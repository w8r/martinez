import { describe, it, expect } from 'vitest';
import path from 'path';
import load from 'load-json-file';
import fillQueue from '../src/fill_queue';
import { INTERSECTION } from '../src/operation';

// GeoJSON Data
const data = load.sync(path.join(__dirname, 'fixtures', 'two_triangles.geojson')) as any;

const subject = data.features[0];
const clipping = data.features[1];

describe('fill event queue', () => {
  const s = [subject.geometry.coordinates];
  const c = [clipping.geometry.coordinates];

  const sbbox: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  const cbbox: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  const q = fillQueue(s, c, sbbox, cbbox, INTERSECTION);
  let currentPoint: any;

  describe('bboxes', () => {
    it('should have correct subject bbox', () => {
      expect(sbbox).toEqual([20, -113.5, 226.5, 74]);
    });

    it('should have correct clipping bbox', () => {
      expect(cbbox).toEqual([54.5, -198, 239.5, 33.5]);
    });
  });

  describe('point 0', () => {
    it('should have correct properties', () => {
      currentPoint = q.pop();
      expect(currentPoint.point).toEqual([20, -23.5]); /* s[0][0] */
      expect(currentPoint.left).toBeTruthy();
      expect(currentPoint.otherEvent.point).toEqual([226.5, -113.5]); /* s[0][2] */
      expect(currentPoint.otherEvent.left).toBeFalsy();
    });
  });

  describe('point 1', () => {
    it('should have correct properties', () => {
      currentPoint = q.pop();
      expect(currentPoint.point).toEqual([20, -23.5]); /* s[0][0] */
      expect(currentPoint.left).toBeTruthy();
      expect(currentPoint.otherEvent.point).toEqual([170, 74]); /* s[0][1] */
      expect(currentPoint.otherEvent.left).toBeFalsy();
    });
  });

  describe('point 2', () => {
    it('should have correct properties', () => {
      currentPoint = q.pop();
      expect(currentPoint.point).toEqual([54.5, -170.5]); /* c[0][0] */
      expect(currentPoint.left).toBeTruthy();
      expect(currentPoint.otherEvent.point).toEqual([239.5, -198]); /* c[0][2] */
      expect(currentPoint.otherEvent.left).toBeFalsy();
    });
  });

  describe('point 3', () => {
    it('should have correct properties', () => {
      currentPoint = q.pop();
      expect(currentPoint.point).toEqual([54.5, -170.5]); /* c[0][0] */
      expect(currentPoint.left).toBeTruthy();
      expect(currentPoint.otherEvent.point).toEqual([140.5, 33.5]); /* c[0][1] */
      expect(currentPoint.otherEvent.left).toBeFalsy();
    });
  });

  describe('point 4', () => {
    it('should have correct properties', () => {
      currentPoint = q.pop();
      expect(currentPoint.point).toEqual([140.5, 33.5]); /* c[0][0] */
      expect(currentPoint.left).toBeFalsy();
      expect(currentPoint.otherEvent.point).toEqual([54.5, -170.5]); /* c[0][1] */
      expect(currentPoint.otherEvent.left).toBeTruthy();
    });
  });

  describe('point 5', () => {
    it('should have correct properties', () => {
      currentPoint = q.pop();
      expect(currentPoint.point).toEqual([140.5, 33.5]); /* c[0][0] */
      expect(currentPoint.left).toBeTruthy();
      expect(currentPoint.otherEvent.point).toEqual([239.5, -198]); /* c[0][1] */
      expect(currentPoint.otherEvent.left).toBeFalsy();
    });
  });

  describe('point 6', () => {
    it('should have correct properties', () => {
      currentPoint = q.pop();
      expect(currentPoint.point).toEqual([170, 74]); /* s[0][1] */
      expect(currentPoint.left).toBeFalsy();
      expect(currentPoint.otherEvent.point).toEqual([20, -23.5]); /* s[0][0] */
      expect(currentPoint.otherEvent.left).toBeTruthy();
    });
  });

  describe('point 7', () => {
    it('should have correct properties', () => {
      currentPoint = q.pop();
      expect(currentPoint.point).toEqual([170, 74]); /* s[0][1] */
      expect(currentPoint.left).toBeTruthy();
      expect(currentPoint.otherEvent.point).toEqual([226.5, -113.5]); /* s[0][3] */
      expect(currentPoint.otherEvent.left).toBeFalsy();
    });
  });

  describe('point 8', () => {
    it('should have correct properties', () => {
      currentPoint = q.pop();
      expect(currentPoint.point).toEqual([226.5, -113.5]); /* s[0][1] */
      expect(currentPoint.left).toBeFalsy();
      expect(currentPoint.otherEvent.point).toEqual([20, -23.5]); /* s[0][0] */
      expect(currentPoint.otherEvent.left).toBeTruthy();
    });
  });

  describe('point 9', () => {
    it('should have correct properties', () => {
      currentPoint = q.pop();
      expect(currentPoint.point).toEqual([226.5, -113.5]); /* s[0][1] */
      expect(currentPoint.left).toBeFalsy();
      expect(currentPoint.otherEvent.point).toEqual([170, 74]); /* s[0][0] */
      expect(currentPoint.otherEvent.left).toBeTruthy();
    });
  });

  describe('point 10', () => {
    it('should have correct properties', () => {
      currentPoint = q.pop();
      expect(currentPoint.point).toEqual([239.5, -198]); /* c[0][2] */
      expect(currentPoint.left).toBeFalsy();
      expect(currentPoint.otherEvent.point).toEqual([54.5, -170.5]); /* c[0][0] */
      expect(currentPoint.otherEvent.left).toBeTruthy();
    });
  });

  describe('point 11', () => {
    it('should have correct properties', () => {
      currentPoint = q.pop();
      expect(currentPoint.point).toEqual([239.5, -198]); /* c[0][2] */
      expect(currentPoint.left).toBeFalsy();
      expect(currentPoint.otherEvent.point).toEqual([140.5, 33.5]); /* s[0][1] */
      expect(currentPoint.otherEvent.left).toBeTruthy();
    });
  });
});