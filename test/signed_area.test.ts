import { assert, describe, expect, it } from 'vitest';
import signedArea from '../src/signed_area';

describe('Signed area', () => {
  it('analytical signed area', () => {
    expect(signedArea([0, 0], [0, 1], [1, 1])).toEqual(-1);
    expect(signedArea([0, 1], [0, 0], [1, 0]), 'positive area').toEqual(1);

    expect(signedArea([0, 0], [1, 1], [2, 2]), 'collinear, 0 area').toEqual(0);
    expect(signedArea([-1, 0], [2, 3], [0, 1]), 'point on segment').toEqual(0);
    expect(signedArea([2, 3], [-1, 0], [0, 1]), 'point on segment').toEqual(0);
  });
});
