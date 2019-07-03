import { describe, it } from 'mocha';
import { assert }       from 'chai';

import path            from 'path';
import fs              from 'fs';
import Tree            from 'splaytree';
import compareSegments from '../src/compare_segments';
import SweepEvent      from '../src/sweep_event';

// GeoJSON Data
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'two_triangles.geojson'), 'utf8'));

const subject  = data.features[0];
const clipping = data.features[1];

describe('sweep line', () => {

  it ('insert and retrieve', () => {
    const s = subject.geometry.coordinates;
    const c = clipping.geometry.coordinates;

    const EF = new SweepEvent(s[0][0], true, new SweepEvent(s[0][2], false, null, false), true);
    //EF.name = 'EF';
    const EG = new SweepEvent(s[0][0], true, new SweepEvent(s[0][1], false, null, false), true);
    //EG.name = 'EG';

    const tree = new Tree<SweepEvent>(compareSegments);
    tree.insert(EF);
    tree.insert(EG);


    assert.strictEqual(tree.find(EF).key, EF, 'able to retrieve node');
    assert.strictEqual(tree.minNode().key, EF, 'EF is at the begin');
    assert.strictEqual(tree.maxNode().key, EG, 'EG is at the end');

    let it = tree.find(EF);

    assert.strictEqual(tree.next(it).key, EG);

    it = tree.find(EG);

    assert.strictEqual(tree.prev(it).key, EF);

    const DA = new SweepEvent(c[0][0], true, new SweepEvent(c[0][2], false, null, false), true);
    const DC = new SweepEvent(c[0][0], true, new SweepEvent(c[0][1], false, null, false), true);

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
});
