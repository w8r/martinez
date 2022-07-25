import { test, assert } from 'vitest';
import path from 'path';
import load from 'load-json-file';
import * as martinez from '../src';

const rootPath = path.join(process.cwd(), 'test', 'featureTypes');

const clipping = load.sync(path.join(rootPath, 'clippingPoly.geojson'));
const outDir = path.join(rootPath, 'out');

const testScenarios = [
  {
    testName: 'polyToClipping',
    subjectPoly: 'poly'
  },
  {
    testName: 'polyWithHoleToClipping',
    subjectPoly: 'polyWithHole'
  },
  {
    testName: 'multiPolyToClipping',
    subjectPoly: 'multiPoly'
  },
  {
    testName: 'multiPolyWithHoleToClipping',
    subjectPoly: 'multiPolyWithHole'
  }
];

testScenarios.forEach((ts) => {
  const subject = load.sync(path.join(rootPath, ts.subjectPoly + '.geojson'));
  const name = ts.testName;
  test(ts.testName, () => {
    const expectedIntResult = load.sync(
      path.join(outDir, 'intersection', name + '.geojson')
    );
    if (expectedIntResult.geometry.type === 'Polygon')
      expectedIntResult.geometry.coordinates = [
        expectedIntResult.geometry.coordinates
      ];
    const intResult = martinez.intersection(
      subject.geometry.coordinates,
      clipping.geometry.coordinates
    );
    assert.deepEqual(
      intResult,
      expectedIntResult.geometry.coordinates,
      ts.testName + ' - Intersect'
    );

    const expectedXorResult = load.sync(
      path.join(outDir, 'xor', name + '.geojson')
    );
    if (expectedXorResult.geometry.type === 'Polygon')
      expectedXorResult.geometry.coordinates = [
        expectedXorResult.geometry.coordinates
      ];
    const xorResult = martinez.xor(
      subject.geometry.coordinates,
      clipping.geometry.coordinates
    );
    assert.deepEqual(
      xorResult,
      expectedXorResult.geometry.coordinates,
      ts.testName + ' - XOR'
    );

    const expectedDiffResult = load.sync(
      path.join(outDir, 'difference', name + '.geojson')
    );
    if (expectedDiffResult.geometry.type === 'Polygon')
      expectedDiffResult.geometry.coordinates = [
        expectedDiffResult.geometry.coordinates
      ];
    const diffResult = martinez.diff(
      subject.geometry.coordinates,
      clipping.geometry.coordinates
    );
    assert.deepEqual(
      diffResult,
      expectedDiffResult.geometry.coordinates,
      ts.testName + ' - Difference'
    );

    const expectedUnionResult = load.sync(
      path.join(outDir, 'union', name + '.geojson')
    );
    if (expectedUnionResult.geometry.type === 'Polygon')
      expectedUnionResult.geometry.coordinates = [
        expectedUnionResult.geometry.coordinates
      ];
    const unionResult = martinez.union(
      subject.geometry.coordinates,
      clipping.geometry.coordinates
    );
    assert.deepEqual(
      unionResult,
      expectedUnionResult.geometry.coordinates,
      ts.testName + ' - Union'
    );
  });
});
