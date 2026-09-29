import { test } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import jstsUnion from '@turf/union';
import polygonClipping from 'polygon-clipping';
import * as polyclip from 'polyclip-ts';
import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader.js';
import GeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter.js';
import 'jsts/org/locationtech/jts/monkey.js'; // adds geometry.union()
// Benchmark the built bundle (`npm run bench` builds it first): run from
// source, Vite's module runner wraps every internal import in a getter and
// that overhead would be measured too.
import * as martinez from '../dist/martinez.js';

/**
 * Benchmark Results
 *
 * Previous results with Benchmark.js:
 * Hole_Hole x 13,345 ops/sec ±2.13% (91 runs sampled)
 * Hole_Hole - JSTS x 1,724 ops/sec ±4.80% (87 runs sampled)
 * Asia x 6.32 ops/sec ±3.16% (20 runs sampled)
 * Asia - JSTS x 6.62 ops/sec ±2.74% (21 runs sampled)
 */

// Helper to load JSON files
const reader = new GeoJSONReader();
const writer = new GeoJSONWriter();
// Same work as the others: GeoJSON coordinates in, GeoJSON coordinates out
const jstsUnion2 = (a: any, b: any) =>
  writer.write(reader.read(a.geometry ?? a).union(reader.read(b.geometry ?? b)));
const jstsDiff = (a: any, b: any) =>
  writer.write(reader.read(a.geometry ?? a).difference(reader.read(b.geometry ?? b)));

const loadJSON = (filePath: string) => JSON.parse(readFileSync(filePath, 'utf-8'));

// Load test fixtures
const hole_hole = loadJSON(join(__dirname, '../test/fixtures/hole_hole.geojson'));
const asia = loadJSON(join(__dirname, '../test/fixtures/asia.geojson'));
const unionPoly = loadJSON(join(__dirname, '../test/fixtures/asia_unionPoly.geojson'));
const states = loadJSON(join(__dirname, '../test/fixtures/states_source.geojson'));

// Stress test: Asia against itself shifted 0.05° east. Every coastline
// crosses its shifted copy many times, so almost every edge is subdivided.
const SHIFT = 0.05;
const asiaGeometry = asia.features[0].geometry;
const asiaShifted = {
  type: asiaGeometry.type,
  coordinates: asiaGeometry.coordinates.map((polygon: number[][][]) =>
    polygon.map((ring) => ring.map(([x, y]) => [x + SHIFT, y]))
  ),
};

test('Hole_Hole union', async ({ bench }) => {
  await bench.compare(
    bench('Martinez', () => {
      martinez.union(
        hole_hole.features[0].geometry.coordinates,
        hole_hole.features[1].geometry.coordinates
      );
    }),
    bench('JSTS 2.12 (direct)', () => {
      jstsUnion2(hole_hole.features[0], hole_hole.features[1]);
    }),
    bench('JSTS 1.3 (@turf/union 4)', () => {
      jstsUnion(hole_hole.features[0], hole_hole.features[1]);
    }),
    bench('polyclip-ts', () => {
      polyclip.union(hole_hole.features[0].geometry.coordinates, hole_hole.features[1].geometry.coordinates);
    }),
    bench('polygon-clipping', () => {
      polygonClipping.union(
        hole_hole.features[0].geometry.coordinates,
        hole_hole.features[1].geometry.coordinates
      );
    })
  );
});

test('Asia union', async ({ bench }) => {
  await bench.compare(
    bench('Martinez', () => {
      martinez.union(
        asia.features[0].geometry.coordinates,
        unionPoly.geometry.coordinates
      );
    }),
    bench('JSTS 2.12 (direct)', () => {
      jstsUnion2(asia.features[0], unionPoly);
    }),
    bench('JSTS 1.3 (@turf/union 4)', () => {
      jstsUnion(asia.features[0], unionPoly);
    }),
    bench('polyclip-ts', () => {
      polyclip.union(asia.features[0].geometry.coordinates, unionPoly.geometry.coordinates);
    }),
    bench('polygon-clipping', () => {
      polygonClipping.union(
        asia.features[0].geometry.coordinates,
        unionPoly.geometry.coordinates
      );
    })
  );
});

test('States clip', async ({ bench }) => {
  await bench.compare(
    bench('Martinez', () => {
      martinez.union(
        states.features[0].geometry.coordinates,
        states.features[1].geometry.coordinates
      );
    }),
    bench('JSTS 2.12 (direct)', () => {
      jstsUnion2(states.features[0], states.features[1]);
    }),
    bench('JSTS 1.3 (@turf/union 4)', () => {
      jstsUnion(states.features[0], states.features[1]);
    }),
    bench('polyclip-ts', () => {
      polyclip.union(states.features[0].geometry.coordinates, states.features[1].geometry.coordinates);
    }),
    bench('polygon-clipping', () => {
      polygonClipping.union(
        states.features[0].geometry.coordinates,
        states.features[1].geometry.coordinates
      );
    })
  );
});

test('Asia vs shifted Asia: union', async ({ bench }) => {
  await bench.compare(
    bench('Martinez', () => {
      martinez.union(asiaGeometry.coordinates, asiaShifted.coordinates);
    }),
    bench('JSTS 2.12 (direct)', () => {
      jstsUnion2(asiaGeometry, asiaShifted);
    }),
    bench('polyclip-ts', () => {
      polyclip.union(asiaGeometry.coordinates, asiaShifted.coordinates);
    }),
    bench('polygon-clipping', () => {
      polygonClipping.union(asiaGeometry.coordinates, asiaShifted.coordinates);
    })
  );
});

test('Asia vs shifted Asia: difference', async ({ bench }) => {
  await bench.compare(
    bench('Martinez', () => {
      martinez.diff(asiaGeometry.coordinates, asiaShifted.coordinates);
    }),
    bench('JSTS 2.12 (direct)', () => {
      jstsDiff(asiaGeometry, asiaShifted);
    }),
    bench('polyclip-ts', () => {
      polyclip.difference(asiaGeometry.coordinates, asiaShifted.coordinates);
    }),
    bench('polygon-clipping', () => {
      polygonClipping.difference(asiaGeometry.coordinates, asiaShifted.coordinates);
    })
  );
});
