import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import Tree from 'splaytree';
import compareSegments from '../src/compare_segments';
import SweepEvent from '../src/sweep_event';

// GeoJSON Data
const data = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'two_triangles.geojson'), 'utf-8'));

const subject = data.features[0];
const clipping = data.features[1];

describe('sweep line', () => {
  it('should manage sweep events in correct order using splay tree', () => {
    const s = subject.geometry.coordinates;
    const c = clipping.geometry.coordinates;

    const EF = new SweepEvent(s[0][0], true, new SweepEvent(s[0][2], false), true);
    (EF as any).name = 'EF';
    const EG = new SweepEvent(s[0][0], true, new SweepEvent(s[0][1], false), true);
    (EG as any).name = 'EG';

    const tree = new Tree(compareSegments);
    tree.insert(EF);
    tree.insert(EG);

    expect(tree.find(EF).key).toBe(EF);
    expect(tree.minNode().key).toBe(EF);
    expect(tree.maxNode().key).toBe(EG);

    let it = tree.find(EF);
    expect(tree.next(it).key).toBe(EG);

    it = tree.find(EG);
    expect(tree.prev(it).key).toBe(EF);

    const DA = new SweepEvent(c[0][0], true, new SweepEvent(c[0][2], false), true);
    const DC = new SweepEvent(c[0][0], true, new SweepEvent(c[0][1], false), true);

    tree.insert(DA);
    tree.insert(DC);

    let begin = tree.minNode();
    expect(begin.key).toBe(DA);
    
    begin = tree.next(begin);
    expect(begin.key).toBe(DC);
    
    begin = tree.next(begin);
    expect(begin.key).toBe(EF);
    
    begin = tree.next(begin);
    expect(begin.key).toBe(EG);
  });
});