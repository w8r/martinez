import tap from 'tape';
import path from 'path';
import load from 'load-json-file';
import * as martinez from '../src';

const clipping = load.sync(
  path.join(__dirname, 'featureTypes', 'clippingPoly.geojson')
);
const outDir = path.join(__dirname, 'featureTypes', 'out');

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
  const subject = load.sync(
    path.join(__dirname, 'featureTypes', ts.subjectPoly + '.geojson')
  );
  tap.test(ts.testName, (t) => {
    const expectedIntResult = load.sync(
      path.join(outDir, 'intersection', t.name + '.geojson')
    );
    if (expectedIntResult.geometry.type === 'Polygon')
      expectedIntResult.geometry.coordinates = [
        expectedIntResult.geometry.coordinates
      ];
    const intResult = martinez.intersection(
      subject.geometry.coordinates,
      clipping.geometry.coordinates
    );
    t.same(
      intResult,
      expectedIntResult.geometry.coordinates,
      ts.testName + ' - Intersect'
    );

    const expectedXorResult = load.sync(
      path.join(outDir, 'xor', t.name + '.geojson')
    );
    if (expectedXorResult.geometry.type === 'Polygon')
      expectedXorResult.geometry.coordinates = [
        expectedXorResult.geometry.coordinates
      ];
    const xorResult = martinez.xor(
      subject.geometry.coordinates,
      clipping.geometry.coordinates
    );
    t.same(
      xorResult,
      expectedXorResult.geometry.coordinates,
      ts.testName + ' - XOR'
    );

    const expectedDiffResult = load.sync(
      path.join(outDir, 'difference', t.name + '.geojson')
    );
    if (expectedDiffResult.geometry.type === 'Polygon')
      expectedDiffResult.geometry.coordinates = [
        expectedDiffResult.geometry.coordinates
      ];
    const diffResult = martinez.diff(
      subject.geometry.coordinates,
      clipping.geometry.coordinates
    );
    t.same(
      diffResult,
      expectedDiffResult.geometry.coordinates,
      ts.testName + ' - Difference'
    );

    const expectedUnionResult = load.sync(
      path.join(outDir, 'union', t.name + '.geojson')
    );
    if (expectedUnionResult.geometry.type === 'Polygon')
      expectedUnionResult.geometry.coordinates = [
        expectedUnionResult.geometry.coordinates
      ];
    const unionResult = martinez.union(
      subject.geometry.coordinates,
      clipping.geometry.coordinates
    );
    t.same(
      unionResult,
      expectedUnionResult.geometry.coordinates,
      ts.testName + ' - Union'
    );

    t.end();
  });
});
