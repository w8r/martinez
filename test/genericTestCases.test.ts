import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { globSync } from 'glob';
import stringify from 'json-stringify-pretty-compact';
import * as martinez from '../index';

function extractExpectedResults(features: any[]) {
  return features.map(feature => {
    let mode = feature.properties.operation;
    let op: any;
    switch (mode) {
      case "union":
        op = martinez.union;
        break;
      case "intersection":
        op = martinez.intersection;
        break;
      case "xor":
        op = martinez.xor;
        break;
      case "diff":
        op = martinez.diff;
        break;
      case "diff_ba":
        op = (a: any, b: any) => martinez.diff(b, a);
        break;
    }
    if (op == null) {
      throw `Invalid mode: ${mode}`;
    }
    return {
      op: op,
      coordinates: feature.geometry.coordinates,
    };
  });
}

const caseDir = join(__dirname, 'genericTestCases');
const testCases = globSync(join(caseDir, '*.geojson'));
if (testCases.length === 0) {
  throw new Error('No test cases found, this must not happen');
}

describe('Generic Test Cases', () => {
  testCases.forEach((testCaseFile) => {
    let testName = 'Generic test case: ' + basename(testCaseFile);

    describe(testName, () => {
      it('should execute test case operations correctly', () => {
        const data = JSON.parse(readFileSync(testCaseFile, 'utf-8'));
        if (data.features.length < 2) {
          throw `Test case file must contain at least two features, but ${testCaseFile} doesn't.`;
        }

        let p1Geometry = data.features[0].geometry;
        let p2Geometry = data.features[1].geometry;

        let p1 = p1Geometry.type === 'Polygon' ? [p1Geometry.coordinates] : p1Geometry.coordinates;
        let p2 = p2Geometry.type === 'Polygon' ? [p2Geometry.coordinates] : p2Geometry.coordinates;

        let expectedResults = extractExpectedResults(data.features.slice(2));

        let featureIndex = 2;
        for (const expectedResult of expectedResults) {
          const result = expectedResult.op(p1, p2);
          expect(result).toEqual(expectedResult.coordinates);

          // Update output data for re-generation mode
          data.features[featureIndex].geometry.type = 'MultiPolygon';
          data.features[featureIndex].geometry.coordinates = result;
          featureIndex += 1;
        }

        if (process.env.REGEN) {
          writeFileSync(testCaseFile, stringify(data));
        }
      });
    });
  });
});