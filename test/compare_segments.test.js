var tap             = require('tap');
var compareSegments = require('../src/compare_segments');
var compareEvents   = require('../src/compare_events');
var Tree            = require('bintrees').RBTree;
var SweepEvent      = require('../src/sweep_event');

tap.test('compare segments', function(t) {

  t.test('not collinear', function(t) {

    t.test('shared left point - right point first', function(t) {
      var tree = new Tree(compareSegments);
      var pt = [0.0, 0.0];
      var se1 = new SweepEvent(pt, true, new SweepEvent([1, 1], false));
      var se2 = new SweepEvent(pt, true, new SweepEvent([2, 3], false));

      tree.insert(se1);
      tree.insert(se2);

      t.strictSame(tree.max().otherEvent.point, [2, 3]);
      t.strictSame(tree.min().otherEvent.point, [1, 1]);

      t.end();
    });

    t.test('different left point - right point y coord to sort', function(t) {
      var tree = new Tree(compareSegments);
      var se1 = new SweepEvent([0, 1], true, new SweepEvent([1, 1], false));
      var se2 = new SweepEvent([0, 2], true, new SweepEvent([2, 3], false));

      tree.insert(se1);
      tree.insert(se2);

      t.strictSame(tree.min().otherEvent.point, [1, 1]);
      t.strictSame(tree.max().otherEvent.point, [2, 3]);

      t.end();
    });

    t.test('events order in sweep line', function(t) {
      var tree = new Tree(compareSegments);
      var se1 = new SweepEvent([0, 1],  true, new SweepEvent([2, 1], false));
      var se2 = new SweepEvent([-1, 0], true, new SweepEvent([2, 3], false));

      var se3 = new SweepEvent([0, 1], true, new SweepEvent([3, 4], false));
      var se4 = new SweepEvent([-1, 0], true, new SweepEvent([3, 1], false));

      t.equal(compareEvents(se1, se2), 1);
      t.notOk(se2.isBelow(se1.point));
      t.ok(se2.isAbove(se1.point));

      t.equal(compareSegments(se1, se2), -1, 'compare segments');
      t.equal(compareSegments(se2, se1), 1,  'compare segments inverted');

      t.equal(compareEvents(se3, se4), 1);
      t.notOk(se4.isAbove(se3.point));

      t.end();
    });

    t.test('first point is below', function(t) {
      var se2 = new SweepEvent([0, 1],  true, new SweepEvent([2, 1], false));
      var se1 = new SweepEvent([-1, 0], true, new SweepEvent([2, 3], false));

      t.notOk(se1.isBelow(se2.point));
      t.equal(compareSegments(se1, se2), 1, 'compare segments');

      t.end();
    });

    t.end();
  });

  t.test('collinear segments', function(t) {
    var se1 = new SweepEvent([1, 1], true, new SweepEvent([5, 1], false), true);
    var se2 = new SweepEvent([2, 1], true, new SweepEvent([3, 1], false), false);

    t.notEqual(se1.isSubject, se2.isSubject);
    t.equal(compareSegments(se1, se2), -1);

    t.end();
  });

  t.test('collinear shared left point', function(t) {
    var pt = [0, 1];

    var se1 = new SweepEvent(pt, true, new SweepEvent([5, 1], false), false);
    var se2 = new SweepEvent(pt, true, new SweepEvent([3, 1], false), false);

    se1.contourId = 1;
    se2.contourId = 2;

    t.equal(se1.isSubject, se2.isSubject);
    t.equal(se1.point, se2.point);

    t.equal(compareSegments(se1, se2), -1);

    se1.contourId = 2;
    se2.contourId = 1;

    t.equal(compareSegments(se1, se2), +1);

    t.end();
  });


  t.test('collinear same polygon different left points', function(t) {
    var se1 = new SweepEvent([1, 1], true, new SweepEvent([5, 1], false), true);
    var se2 = new SweepEvent([2, 1], true, new SweepEvent([3, 1], false), true);

    t.equal(se1.isSubject, se2.isSubject);
    t.notEqual(se1.point, se2.point);
    t.equal(compareSegments(se1, se2), -1);
    t.equal(compareSegments(se2, se1), 1);

    t.end();
  });

  t.end();
});
