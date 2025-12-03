import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as martinez from '../index';

const clipping = JSON.parse(readFileSync(join(__dirname, 'featureTypes', 'clippingPoly.geojson'), 'utf-8'));
const outDir = join(__dirname, 'featureTypes', 'out');

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
    const subject = JSON.parse(readFileSync(join(__dirname, 'featureTypes', ts.subjectPoly + '.geojson'), 'utf-8'));

    describe(ts.testName, () => {
      it('should perform intersection operation correctly', () => {
        const expectedIntResult = JSON.parse(readFileSync(join(outDir, 'intersection', ts.testName + '.geojson'), 'utf-8'));
        if (expectedIntResult.geometry.type === 'Polygon') expectedIntResult.geometry.coordinates = [expectedIntResult.geometry.coordinates];
        const intResult = martinez.intersection(subject.geometry.coordinates, clipping.geometry.coordinates);
        expect(intResult).toEqual(expectedIntResult.geometry.coordinates);
      });

      it('should perform XOR operation correctly', () => {
        const expectedXorResult = JSON.parse(readFileSync(join(outDir, 'xor', ts.testName + '.geojson'), 'utf-8'));
        if (expectedXorResult.geometry.type === 'Polygon') expectedXorResult.geometry.coordinates = [expectedXorResult.geometry.coordinates];
        const xorResult = martinez.xor(subject.geometry.coordinates, clipping.geometry.coordinates);
        expect(xorResult).toEqual(expectedXorResult.geometry.coordinates);
      });

      it('should perform difference operation correctly', () => {
        const expectedDiffResult = JSON.parse(readFileSync(join(outDir, 'difference', ts.testName + '.geojson'), 'utf-8'));
        if (expectedDiffResult.geometry.type === 'Polygon') expectedDiffResult.geometry.coordinates = [expectedDiffResult.geometry.coordinates];
        const diffResult = martinez.diff(subject.geometry.coordinates, clipping.geometry.coordinates);
        expect(diffResult).toEqual(expectedDiffResult.geometry.coordinates);
      });

      it('should perform union operation correctly', () => {
        const expectedUnionResult = JSON.parse(readFileSync(join(outDir, 'union', ts.testName + '.geojson'), 'utf-8'));
        if (expectedUnionResult.geometry.type === 'Polygon') expectedUnionResult.geometry.coordinates = [expectedUnionResult.geometry.coordinates];
        const unionResult = martinez.union(subject.geometry.coordinates, clipping.geometry.coordinates);
        expect(unionResult).toEqual(expectedUnionResult.geometry.coordinates);
      });
    });
  });
});