import { test } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import polygonClipping from 'polygon-clipping';
import * as polyclip from 'polyclip-ts';
import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader.js';
import GeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter.js';
import 'jsts/org/locationtech/jts/monkey.js'; // adds geometry.union() etc.
// Benchmark the built bundle (`npm run bench` builds it first): run from
// source, Vite's module runner wraps every internal import in a getter and
// that overhead would be measured too.
import * as martinez from '../dist/martinez.js';

// Results are listed in the README; run with `npm run bench`.

const reader = new GeoJSONReader();
const writer = new GeoJSONWriter();
// Same work as the others: GeoJSON coordinates in, GeoJSON coordinates out
const jstsUnion = (a: any, b: any) =>
  writer.write(reader.read(a.geometry ?? a).union(reader.read(b.geometry ?? b)));
const jstsDiff = (a: any, b: any) =>
  writer.write(reader.read(a.geometry ?? a).difference(reader.read(b.geometry ?? b)));

// Helper to load JSON files
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
    bench('JSTS 2.12', () => {
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
    bench('JSTS 2.12', () => {
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
    bench('JSTS 2.12', () => {
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
    bench('JSTS 2.12', () => {
      jstsUnion(asiaGeometry, asiaShifted);
    }),
    bench('polyclip-ts', () => {
      polyclip.union(asiaGeometry.coordinates, asiaShifted.coordinates);
    }),
    bench('polygon-clipping', () => {
      polygonClipping.union(asiaGeometry.coordinates, asiaShifted.coordinates);
    })
  );
}, 300_000); // polyclip-ts needs ~1 s per sample

test('Asia vs shifted Asia: difference', async ({ bench }) => {
  await bench.compare(
    bench('Martinez', () => {
      martinez.diff(asiaGeometry.coordinates, asiaShifted.coordinates);
    }),
    bench('JSTS 2.12', () => {
      jstsDiff(asiaGeometry, asiaShifted);
    }),
    bench('polyclip-ts', () => {
      polyclip.difference(asiaGeometry.coordinates, asiaShifted.coordinates);
    }),
    bench('polygon-clipping', () => {
      polygonClipping.difference(asiaGeometry.coordinates, asiaShifted.coordinates);
    })
  );
}, 300_000); // polyclip-ts needs ~1 s per sample
