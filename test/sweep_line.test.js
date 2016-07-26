var tap = require('tap');
var martinez = require('../src/');
var data = require('./fixtures/two_triangles.json');
var Tree = require('bintrees').RBTree;
var compareSegments = require('../src/compare_segments');
var SweepEvent = require('../src/sweep_event');

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
  tree.insert(EF);
  tree.insert(EG);


  t.equals(tree.findIter(EF).data(), EF, 'able to retrieve node');
  t.equals(tree.min(), EF, 'EF is at the begin');
  t.equals(tree.max(), EG, 'EG is at the end');

  var it = tree.findIter(EF);
  it.next();

  t.equals(it.data(), EG);

  it = tree.findIter(EG);
  it.prev();

  t.equals(it.data(), EF);

  var DA = new SweepEvent(c[0][0], true, new SweepEvent(c[0][2], false), true);
  var DC = new SweepEvent(c[0][0], true, new SweepEvent(c[0][1], false), true);

  tree.insert(DA);
  tree.insert(DC);

  var begin = tree.iterator();
  begin.next();
  var item;

  t.equals(begin.data(), DA, 'DA');
  begin.next();
  t.equals(begin.data(), DC, 'DC');
  begin.next();
  t.equals(begin.data(), EF, 'EF');
  begin.next();
  t.equals(begin.data(), EG, 'EG');

  t.end();
});