import tap      from 'tape';
import * as martinez from '../index';
import load     from 'load-json-file';
import path     from 'path';

tap.test('Edge cases', (main) => {

  main.test('touching boxes', (t) => {
    const shapes   = load.sync(path.join(__dirname, 'fixtures', 'touching_boxes.geojson'));
    const subject  = shapes.features[0];
    const clipping = shapes.features[1];

    t.test('intersection', (t) => {
      const result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, []);

      t.end();
    });

    t.test('union', (t) => {
      const result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[3,0],[3,1],[4,1],[4,2],[3,2],[3,3],[0,3],[0,0]]]]);

      t.end();
    });

    t.test('difference', (t) => {
      const result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[3,0],[3,1],[3,2],[3,3],[0,3],[0,0]]]]);

      t.end();
    });

    t.end();
  });

  main.test('disjoint union nesting', (t) => { // issue #47
    const p1 = [[[12.91,6.09],[12.91,6.91],[12.09,6.91],[12.09,6.09],[12.91,6.09]]
    ];
    const p2 = [
      [[12.75,6.25],[12.75,6.75],[11.75,6.75],[11.75,8.25],[12.75,8.25],[12.75,8.75],[11.75,8.75],[11.75,9.75],[11.25,9.75],[11.25,8.75],[10.25,8.75],[10.25,8.25],[11.25,8.25],[11.25,6.75],[10.25,6.75],[10.25,6.25],[12.75,6.25]],
      [[4.75,2.25],[4.75,2.75],[4.25,2.75],[4.25,2.25],[4.75,2.25]]
    ];
    t.deepEqual(martinez.union(p1, p2), [[[[[[4.25,2.25],[4.75,2.25],[4.75,2.75],[4.25,2.75],[4.25,2.25]]]]],[[[10.25,6.25],[12.09,6.25],[12.09,6.09],[12.91,6.09],[12.91,6.91],[12.09,6.91],[12.09,6.75],[11.75,6.75],[11.75,8.25],[12.75,8.25],[12.75,8.75],[11.75,8.75],[11.75,9.75],[11.25,9.75],[11.25,8.75],[10.25,8.75],[10.25,8.25],[11.25,8.25],[11.25,6.75],[10.25,6.75],[10.25,6.25]]]]);
    t.end();
  });

  main.test('collapsed edges removed', (t) => {
    const p1 = [[
      [355,139],
      [420,202],
      [384,237],
      [353,205],
      [330,230],
      [330,230],
      [291,197]
    ]];
    const p2 =[[
      [355,139],
      [420,202],
      [384,237],
      [353,205],

      [330,230],
      [330,230],
      [291,197]
    ]];

    t.deepEqual(martinez.intersection(p1, p2), [[[[291,197],[330,230],[353,205],[384,237],[420,202],[355,139]]]]);
    t.end();
  });


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
