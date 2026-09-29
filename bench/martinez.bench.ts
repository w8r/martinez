import { test } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import jstsUnion from '@turf/union';
import polygonClipping from 'polygon-clipping';
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
const loadJSON = (filePath: string) => JSON.parse(readFileSync(filePath, 'utf-8'));

// Load test fixtures
const hole_hole = loadJSON(join(__dirname, '../test/fixtures/hole_hole.geojson'));
const asia = loadJSON(join(__dirname, '../test/fixtures/asia.geojson'));
const unionPoly = loadJSON(join(__dirname, '../test/fixtures/asia_unionPoly.geojson'));
const states = loadJSON(join(__dirname, '../test/fixtures/states_source.geojson'));

test('Hole_Hole union', async ({ bench }) => {
  await bench.compare(
    bench('Martinez', () => {
      martinez.union(
        hole_hole.features[0].geometry.coordinates,
        hole_hole.features[1].geometry.coordinates
      );
    }),
    bench('JSTS', () => {
      jstsUnion(hole_hole.features[0], hole_hole.features[1]);
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
    bench('JSTS', () => {
      jstsUnion(asia.features[0], unionPoly);
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
    bench('JSTS', () => {
      jstsUnion(states.features[0], states.features[1]);
    }),
    bench('polygon-clipping', () => {
      polygonClipping.union(
        states.features[0].geometry.coordinates,
        states.features[1].geometry.coordinates
      );
    })
  );
});
