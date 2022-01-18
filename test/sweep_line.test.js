import tap from 'tape';
import path from 'path';
import Tree from 'splaytree';
import load from 'load-json-file';
import compareSegments from '../dist/compare_segments';
import SweepEvent from '../dist/sweep_event';

// GeoJSON Data
const data = load.sync(
  path.join(__dirname, 'fixtures', 'two_triangles.geojson')
);

const subject = data.features[0];
const clipping = data.features[1];

tap.test('sweep line', (t) => {
  const s = subject.geometry.coordinates;
  const c = clipping.geometry.coordinates;

  const EF = new SweepEvent(
    s[0][0],
    true,
    new SweepEvent(s[0][2], false),
    true
  );
  EF.name = 'EF';
  const EG = new SweepEvent(
    s[0][0],
    true,
    new SweepEvent(s[0][1], false),
    true
  );
  EG.name = 'EG';

  const tree = new Tree(compareSegments);
  tree.insert(EF);
  tree.insert(EG);

  t.equals(tree.find(EF).key, EF, 'able to retrieve node');
  t.equals(tree.minNode().key, EF, 'EF is at the begin');
  t.equals(tree.maxNode().key, EG, 'EG is at the end');

  let it = tree.find(EF);

  t.equals(tree.next(it).key, EG);

  it = tree.find(EG);

  t.equals(tree.prev(it).key, EF);

  const DA = new SweepEvent(
    c[0][0],
    true,
    new SweepEvent(c[0][2], false),
    true
  );
  const DC = new SweepEvent(
    c[0][0],
    true,
    new SweepEvent(c[0][1], false),
    true
  );

  tree.insert(DA);
  tree.insert(DC);

  let begin = tree.minNode();

  t.equals(begin.key, DA, 'DA');
  begin = tree.next(begin);
  t.equals(begin.key, DC, 'DC');
  begin = tree.next(begin);
  t.equals(begin.key, EF, 'EF');
  begin = tree.next(begin);
  t.equals(begin.key, EG, 'EG');

  t.end();
});
