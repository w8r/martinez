import { describe, it } from 'mocha';
import { assert }       from 'chai';

import intersection from '../src/intersection';
import { Point } from '../src/types';


describe ('intersection primitive', () => {
  const res:[Point,Point] = [[0, 0], [0, 0]];

  it ('two segments crossing', () => {
    const c = intersection(0,0, 1,1, 0,1, 1,0, res);
    assert.equal(c, 1);
    assert.deepEqual(res[0], [0.5, 0.5]);
  });

  it ('no intersection', () => {
    const c = intersection(0,0, 1,1, 10,1, 11,0, res);
    assert.equal(c, 0);
  });

  it ('parallel', () => {
    const c = intersection(0,0, 1,0, 0,1, 1,1, res);
    assert.equal(c, 0);
  });

  it ('touching at a', () => {
    const c = intersection(0,1, 1,0, 0,1, 1,1, res);
    assert.equal(c, 1);
    assert.deepEqual(res[0], [0,1]);
  });

  it ('touching at b', () => {
    const c = intersection(0, 1, 1,1, 0,0, 1,1, res);
    assert.equal(c, 1);
    assert.deepEqual(res[0], [1,1]);
  });

  it ('T-intersection', () => {
    const c = intersection(0, 0, 1,0, 0.5,0, 0.5,1, res);
    assert.equal(c, 1);
    assert.deepEqual(res[0], [0.5, 0]);
  });

  it ('45 degrees X', () => {
    const c = intersection(0,1, 1,0, 0,0, 1,1, res);
    assert.equal(c, 1);
    assert.deepEqual(res[0], [0.5, 0.5]);
  });

  it ('45 degrees T', () => {
    const c = intersection(0,1, 1,0, 0,0, 0.5,0.5, res);
    assert.equal(c, 1);
    assert.deepEqual(res[0], [0.5, 0.5]);
  });

  it ('overlapping', () => {
    const c = intersection(0, 0, 1,1, 0,0, 1,1, res);
    assert.equal(c, 2);
    assert.deepEqual(res, [[0,0], [1,1]]);
  });

  it ('overlapping vertical', () => {
    const c = intersection(0, 0, 0,1, 0,0, 0,1, res);
    assert.equal(c, 2);
    assert.deepEqual(res, [[0,0], [0,1]]);
  });

  it ('overlapping horizontal', () => {
    const c = intersection(0, 0, 1,0, 0,0, 1,0, res);
    assert.equal(c, 2);
    assert.deepEqual(res, [[0,0], [1,0]]);
  });

  it ('incomplete ovelap', () => {
    const c = intersection(0,0, 1,1, 0.5, 0.5, 1,1, res);
    assert.equal(c, 2);
    assert.deepEqual(res, [[0.5, 0.5], [1,1]])
  });

  it ('inclusion', () => {
    const c = intersection(0,0, 1,1, 0.25,0.25, 0.75,0.75, res);
    assert.equal(c, 2);
    assert.deepEqual(res, [[0.25,0.25], [0.75,0.75]]);
  });

  it ('precision', () => {
    const err = 1e-4;
    const c = intersection(0 + err,0, 1,1, 0,0, 1,1, res);
    assert.equal(c, 1);
    assert.deepEqual(res[0], [1,1]);
  });
});