import { describe, it } from 'mocha';
import { assert }       from 'chai';

import signedArea from '../src/signed_area';

describe('analytical signed area', () => {
  it ('negative area', () => {
    assert.equal(signedArea([0, 0], [0, 1], [1, 1]), -1);
  });

  it ('positive area', () => {
    assert.equal(signedArea([0, 1], [0, 0], [1, 0]),  1);
  });

  it ('collinear, 0 area', () => {
    assert.equal(signedArea([0, 0], [1, 1], [2, 2]),  0);
  });

  it ('point on segment', () => {
    assert.equal(signedArea([-1, 0], [2, 3], [0, 1]), 0);
    assert.equal(signedArea([2, 3], [-1, 0], [0, 1]), 0);
  });
});
