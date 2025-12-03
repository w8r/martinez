import { describe, bench } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import jstsUnion from '@turf/union';
import * as martinez from '../index';

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

describe('Hole_Hole union', () => {
  bench('Martinez', () => {
    martinez.union(
      hole_hole.features[0].geometry.coordinates,
      hole_hole.features[1].geometry.coordinates
    );
  });

  bench('JSTS', () => {
    jstsUnion(hole_hole.features[0], hole_hole.features[1]);
  });
});

describe('Asia union', () => {
  bench('Martinez', () => {
    martinez.union(
      asia.features[0].geometry.coordinates,
      unionPoly.geometry.coordinates
    );
  });

  bench('JSTS', () => {
    jstsUnion(asia.features[0], unionPoly);
  });
});

describe('States clip', () => {
  bench('Martinez', () => {
    martinez.union(
      states.features[0].geometry.coordinates,
      states.features[1].geometry.coordinates
    );
  });

  bench('JSTS', () => {
    jstsUnion(states.features[0], states.features[1]);
  });
});
