var tap = require('tap');
var SweepEvent = require('../src/sweep_event');

tap.test('sweep event', function(t) {

  t.test('isBelow', function(t) {
    var s1 = new SweepEvent([0, 0], true, new SweepEvent([1, 1], false));
    var s2 = new SweepEvent([0, 1], false, new SweepEvent([0, 0], false));

    t.ok(s1.isBelow([0, 1]));
    t.ok(s1.isBelow([1, 2]));
    t.notOk(s1.isBelow([0, 0]));
    t.notOk(s1.isBelow([5, -1]));

    t.notOk(s2.isBelow([0, 1]));
    t.notOk(s2.isBelow([1, 2]));
    t.notOk(s2.isBelow([0, 0]));
    t.notOk(s2.isBelow([5, -1]));

    t.end();
  });


  t.test('isAbove', function(t) {

    var s1 = new SweepEvent([0, 0], true, new SweepEvent([1, 1], false));
    var s2 = new SweepEvent([0, 1], false, new SweepEvent([0, 0], false));

    t.notOk(s1.isAbove([0, 1]));
    t.notOk(s1.isAbove([1, 2]));
    t.ok(s1.isAbove([0, 0]));
    t.ok(s1.isAbove([5, -1]));

    t.ok(s2.isAbove([0, 1]));
    t.ok(s2.isAbove([1, 2]));
    t.ok(s2.isAbove([0, 0]));
    t.ok(s2.isAbove([5, -1]));

    t.end();
  });


  t.test('isVertical', function(t) {
    t.ok(new SweepEvent([0, 0], true, new SweepEvent([0, 1], false)).isVertical());
    t.notOk(new SweepEvent([0, 0], true, new SweepEvent([0.0001, 1], false)).isVertical());

    t.end();
  });


  t.end();
});
