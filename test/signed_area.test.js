var tap = require('tap');
var signedArea = require('../src/signed_area');

tap.test('analytical signed area', function(t) {

  t.equals(signedArea([0, 0], [0, 1], [1, 1]), -1, 'negative area');
  t.equals(signedArea([0, 1], [0, 0], [1, 0]),  1, 'positive area');
  t.equals(signedArea([0, 0], [1, 1], [2, 2]),  0, 'collinear, 0 area');

  t.equals(signedArea([-1, 0], [2, 3], [0, 1]), 0, 'point on segment');
  t.equals(signedArea([2, 3], [-1, 0], [0, 1]), 0, 'point on segment');

  t.end();
});