import { describe, it, expect } from 'vitest';
import path from 'path';
import load from 'load-json-file';
import * as martinez from '../index';

const clipping = load.sync(path.join(__dirname, 'featureTypes', 'clippingPoly.geojson')) as any;
const outDir = path.join(__dirname, 'featureTypes', 'out');

const testScenarios = [
  {
    testName: 'polyToClipping',
    subjectPoly: 'poly',
  },
  {
    testName: 'polyWithHoleToClipping',
    subjectPoly: 'polyWithHole',
  },
  {
    testName: 'multiPolyToClipping',
    subjectPoly: 'multiPoly',
  },
  {
    testName: 'multiPolyWithHoleToClipping',
    subjectPoly: 'multiPolyWithHole',
  }
];

describe('Feature Types Tests', () => {
  testScenarios.forEach((ts) => {
    const subject = load.sync(path.join(__dirname, 'featureTypes', ts.subjectPoly + '.geojson')) as any;
    
    describe(ts.testName, () => {
      it('should perform intersection operation correctly', () => {
        const expectedIntResult = load.sync(path.join(outDir, 'intersection', ts.testName + '.geojson')) as any;
        if (expectedIntResult.geometry.type === 'Polygon') expectedIntResult.geometry.coordinates = [expectedIntResult.geometry.coordinates];
        const intResult = martinez.intersection(subject.geometry.coordinates, clipping.geometry.coordinates);
        expect(intResult).toEqual(expectedIntResult.geometry.coordinates);
      });

      it('should perform XOR operation correctly', () => {
        const expectedXorResult = load.sync(path.join(outDir, 'xor', ts.testName + '.geojson')) as any;
        if (expectedXorResult.geometry.type === 'Polygon') expectedXorResult.geometry.coordinates = [expectedXorResult.geometry.coordinates];
        const xorResult = martinez.xor(subject.geometry.coordinates, clipping.geometry.coordinates);
        expect(xorResult).toEqual(expectedXorResult.geometry.coordinates);
      });

      it('should perform difference operation correctly', () => {
        const expectedDiffResult = load.sync(path.join(outDir, 'difference', ts.testName + '.geojson')) as any;
        if (expectedDiffResult.geometry.type === 'Polygon') expectedDiffResult.geometry.coordinates = [expectedDiffResult.geometry.coordinates];
        const diffResult = martinez.diff(subject.geometry.coordinates, clipping.geometry.coordinates);
        expect(diffResult).toEqual(expectedDiffResult.geometry.coordinates);
      });

      it('should perform union operation correctly', () => {
        const expectedUnionResult = load.sync(path.join(outDir, 'union', ts.testName + '.geojson')) as any;
        if (expectedUnionResult.geometry.type === 'Polygon') expectedUnionResult.geometry.coordinates = [expectedUnionResult.geometry.coordinates];
        const unionResult = martinez.union(subject.geometry.coordinates, clipping.geometry.coordinates);
        expect(unionResult).toEqual(expectedUnionResult.geometry.coordinates);
      });
    });
  });
});