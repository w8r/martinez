import { test, assert } from 'vitest';
import path from 'path';
import Tree from 'splaytree';
import load from 'load-json-file';
import compareSegments from '../src/compare_segments';
import SweepEvent from '../src/sweep_event';

// GeoJSON Data
const data = load.sync(
  path.join(process.cwd(), 'test', 'fixtures', 'two_triangles.geojson')
);

const subject = data.features[0];
const clipping = data.features[1];

test('sweep line', () => {
  const s = subject.geometry.coordinates;
  const c = clipping.geometry.coordinates;

  const EF = new SweepEvent(
    s[0][0],
    true,
    new SweepEvent(s[0][2], false, null, false),
    true
  );
  // @ts-ignore
  EF.name = 'EF';
  const EG = new SweepEvent(
    s[0][0],
    true,
    new SweepEvent(s[0][1], false, null, false),
    true
  );
  // @ts-ignore
  EG.name = 'EG';

  const tree = new Tree(compareSegments);
  tree.insert(EF);
  tree.insert(EG);

  assert.equal(tree.find(EF).key, EF, 'able to retrieve node');
  assert.equal(tree.minNode().key, EF, 'EF is at the begin');
  assert.equal(tree.maxNode().key, EG, 'EG is at the end');

  let iter = tree.find(EF);

  assert.equal(tree.next(iter).key, EG);

  iter = tree.find(EG);

  assert.equal(tree.prev(iter).key, EF);

  const DA = new SweepEvent(
    c[0][0],
    true,
    new SweepEvent(c[0][2], false, null, false),
    true
  );
  const DC = new SweepEvent(
    c[0][0],
    true,
    new SweepEvent(c[0][1], false, null, false),
    true
  );

  tree.insert(DA);
  tree.insert(DC);

  let begin = tree.minNode();

  assert.equal(begin.key, DA, 'DA');
  begin = tree.next(begin);
  assert.equal(begin.key, DC, 'DC');
  begin = tree.next(begin);
  assert.equal(begin.key, EF, 'EF');
  begin = tree.next(begin);
  assert.equal(begin.key, EG, 'EG');
});
