var path = require('path');
var tap = require('tap');
var Tree = require('functional-red-black-tree');
var compareSegments = require('../src/compare_segments');
var SweepEvent = require('../src/sweep_event');
var load = require('load-json-file');

// GeoJSON Data
var data = load.sync(path.join(__dirname, 'fixtures', 'two_triangles.geojson'));

var subject  = data.features[0];
var clipping = data.features[1];

tap.test('sweep line', function(t) {

  var s = subject.geometry.coordinates;
  var c = clipping.geometry.coordinates;

  var EF = new SweepEvent(s[0][0], true, new SweepEvent(s[0][2], false), true);
  EF.name = 'EF';
  var EG = new SweepEvent(s[0][0], true, new SweepEvent(s[0][1], false), true);
  EG.name = 'EG';

  var tree = new Tree(compareSegments);
  tree = tree.insert(EF);
  tree = tree.insert(EG);


  t.equals(tree.find(EF).key, EF, 'able to retrieve node');
  t.equals(tree.begin.key, EF, 'EF is at the begin');
  t.equals(tree.end.key, EG, 'EG is at the end');

  var it = tree.find(EF);
  it.next();

  t.equals(it.key, EG);

  it = tree.find(EG);
  it.prev();

  t.equals(it.key, EF);

  var DA = new SweepEvent(c[0][0], true, new SweepEvent(c[0][2], false), true);
  var DC = new SweepEvent(c[0][0], true, new SweepEvent(c[0][1], false), true);

  tree = tree.insert(DA);
  tree = tree.insert(DC);

  var begin = tree.begin;

  t.equals(begin.key, DA, 'DA');
  begin.next();
  t.equals(begin.key, DC, 'DC');
  begin.next();
  t.equals(begin.key, EF, 'EF');
  begin.next();
  t.equals(begin.key, EG, 'EG');

  t.end();
});
