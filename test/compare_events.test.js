var tap = require('tap');
var sweepEventsComp = require('../src/compare_events');
var SweepEvent = require('../src/sweep_event');
var Queue = require('tinyqueue');

tap.test('queue', function(t) {

  t.test('queue should process lest(by x) sweep event first', function(t) {
    var queue = eventQueue = new Queue(null, sweepEventsComp);
    var e1 = { point: [0.0, 0.0] };
    var e2 = { point: [0.5, 0.5] };

    queue.push(e1);
    queue.push(e2);

    t.equals(e1, queue.pop());
    t.equals(e2, queue.pop());

    t.end();
  });

  t.test('queue should process lest(by y) sweep event first', function(t) {
    var queue = eventQueue = new Queue(null, sweepEventsComp);
    var e1 = { point: [0.0, 0.0] };
    var e2 = { point: [0.0, 0.5] };

    queue.push(e1);
    queue.push(e2);

    t.equals(e1, queue.pop());
    t.equals(e2, queue.pop());

    t.end();
  });


  t.test('queue should pop least(by left prop) sweep event first', function(t) {
    var queue = eventQueue = new Queue(null, sweepEventsComp);
    var e1 = { point: [0.0, 0.0], left: true };
    var e2 = { point: [0.0, 0.0], left: false };

    queue.push(e1);
    queue.push(e2);

    t.equals(e2, queue.pop());
    t.equals(e1, queue.pop());

    t.end();
  });

  t.end();
});

tap.test('sweep event comparison x coordinates', function(t) {
  var e1 = { point: [0.0, 0.0] };
  var e2 = { point: [0.5, 0.5] };

  t.equals(sweepEventsComp(e1, e2), -1);
  t.equals(sweepEventsComp(e2, e1), 1);

  t.end();
});

tap.test('sweep event comparison y coordinates', function(t) {
  var e1 = { point: [0.0, 0.0] };
  var e2 = { point: [0.0, 0.5] };

  t.equals(sweepEventsComp(e1, e2), -1);
  t.equals(sweepEventsComp(e2, e1), 1);

  t.end();
});

tap.test('sweep event comparison not left first', function(t) {
  var e1 = { point: [0.0, 0.0], left: true };
  var e2 = { point: [0.0, 0.0], left: false };

  t.equals(sweepEventsComp(e1, e2), 1);
  t.equals(sweepEventsComp(e2, e1), -1);

  t.end();
});

tap.test('sweep event comparison shared start point not collinear edges', function(t) {
  var e1 = new SweepEvent([0.0, 0.0], true, new SweepEvent([1, 1], false));
  var e2 = new SweepEvent([0.0, 0.0], true, new SweepEvent([2, 3], false));

  t.equals(sweepEventsComp(e1, e2), -1, 'lower is processed first');
  t.equals(sweepEventsComp(e2, e1), 1,  'higher is processed second');

  t.end();
});

tap.test('sweep event comparison collinear edges', function(t) {
  var e1 = new SweepEvent([0.0, 0.0], true, new SweepEvent([1, 1], false), true);
  var e2 = new SweepEvent([0.0, 0.0], true, new SweepEvent([2, 2], false), false);

  t.equals(sweepEventsComp(e1, e2), -1, 'clipping is processed first');
  t.equals(sweepEventsComp(e2, e1), 1,  'subject is processed second');

  t.end();
});