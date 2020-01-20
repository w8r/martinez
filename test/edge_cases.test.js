import tap      from 'tape';
import * as martinez from '../index';
import load     from 'load-json-file';
import path     from 'path';

tap.test('Edge cases', (main) => {

  main.test('issue #76', (t) => {
    const shapes   = load.sync(path.join(__dirname, 'fixtures', 'rectangles.geojson'));
    const subject  = shapes.features[0];
    const clipping = shapes.features[1];

    t.test('intersection', (t) => {
      const result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [ [ [
        [ -19.3046867422006, -126.63400219275148 ],
        [ -19.3046867422006, -107.63400219275148 ],
        [ 10.695313257799395, -107.63400219275148 ],
        [ 10.695313257799395, -126.63400219275148 ],
        [ -19.3046867422006, -126.63400219275148 ]
      ] ] ]);

      t.end();
    });

    t.test('union', (t) => {
      const result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[
        [[-96.66033269728321,-126.63400219275148],
        [-19.3046867422006,-126.63400219275148],
        [-19.304686742200587,-357.48241878255635],
        [10.695313257799413,-357.48241878255635],
        [10.695313257799395,-126.63400219275148],
        [13.370917302716792,-126.63400219275148],
        [13.370917302716792,-107.63400219275148],
        [10.695313257799395,-107.63400219275148],
        [10.695313257799384,126.92383121744365],
        [-19.304686742200616,126.92383121744365],
        [-19.3046867422006,-107.63400219275148]]]]);

      t.end();
    });

    t.test('difference', (t) => {
      const result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[
        [-19.304686742200616,126.92383121744365],
        [-19.3046867422006,-107.63400219275148],
        [10.695313257799395,-107.63400219275148],
        [10.695313257799384,126.92383121744365],
        [10.695313257799413,-357.48241878255635],
        [10.695313257799395,-126.63400219275148],
        [-19.3046867422006,-126.63400219275148],
        [-19.304686742200587,-357.48241878255635]
      ]]]);

      t.end();
    });

    t.end();
  });

  main.end();
});
