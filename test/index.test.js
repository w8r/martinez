var tap = require('tap');
var martinez = require('../src/');
var data = require('./fixtures/two_triangles.json');

var subject  = data.features[0];
var clipping = data.features[1];

tap.test('fill event queue', function(t) {
  var s = subject.geometry.coordinates;
  var c = clipping.geometry.coordinates;
  var sbbox = [Infinity, Infinity, -Infinity, -Infinity];
  var cbbox = [Infinity, Infinity, -Infinity, -Infinity];
  var q = martinez.fillQueue(s, c, sbbox, cbbox);
  var currentPoint;

  t.test('bboxes', function(t) {
    t.strictSame(sbbox, [ 20, -113.5, 226.5, 74 ], 'subject bbox');
    t.strictSame(cbbox, [ 54.5, -198, 239.5, 33.5 ], 'clipping bbox');
    t.end();
  });

  t.test('point 0', function(t) {
    currentPoint = q.pop();
    t.strictSame(currentPoint.point, [20, -23.5]); /* s[0][0] */
    t.ok(currentPoint.left, 'is left');
    t.strictSame(currentPoint.otherEvent.point, [226.5, -113.5], 'other event'); /* s[0][2] */
    t.notOk(currentPoint.otherEvent.left, 'other event is right');

    t.end();
  });


  t.test('point 1', function(t) {
    currentPoint = q.pop();
    t.strictSame(currentPoint.point, [20, -23.5]); /* s[0][0] */
    t.ok(currentPoint.left, 'is left');
    t.strictSame(currentPoint.otherEvent.point, [170, 74], 'other event'); /* s[0][1] */
    t.notOk(currentPoint.otherEvent.left, 'other event is right');

    t.end();
  });


  t.test('point 2', function(t) {
    currentPoint = q.pop();
    t.strictSame(currentPoint.point, [ 54.5, -170.5]); /* c[0][0] */
    t.ok(currentPoint.left, 'is left');
    t.strictSame(currentPoint.otherEvent.point, [ 239.5, -198], 'other event'); /* c[0][2] */
    t.notOk(currentPoint.otherEvent.left, 'other event is right');

    t.end();
  });


  t.test('point 3', function(t) {
    currentPoint = q.pop();
    t.strictSame(currentPoint.point, [ 54.5, -170.5]); /* c[0][0] */
    t.ok(currentPoint.left, 'is left');
    t.strictSame(currentPoint.otherEvent.point, [ 140.5, 33.5], 'other event'); /* c[0][1] */
    t.notOk(currentPoint.otherEvent.left, 'other event is right');

    t.end();
  });


  t.test('point 4', function(t) {
    currentPoint = q.pop();
    t.strictSame(currentPoint.point, [ 140.5, 33.5]); /* c[0][0] */
    t.notOk(currentPoint.left, 'is right');
    t.strictSame(currentPoint.otherEvent.point, [ 54.5, -170.5], 'other event'); /* c[0][1] */
    t.ok(currentPoint.otherEvent.left, 'other event is left');

    t.end();
  });


  t.test('point 5', function(t) {
    currentPoint = q.pop();
    t.strictSame(currentPoint.point, [ 140.5, 33.5]); /* c[0][0] */
    t.ok(currentPoint.left, 'is left');
    t.strictSame(currentPoint.otherEvent.point, [239.5, -198], 'other event'); /* c[0][1] */
    t.notOk(currentPoint.otherEvent.left, 'other event is right');

    t.end();
  });


  t.test('point 6', function(t) {
    currentPoint = q.pop();
    t.strictSame(currentPoint.point, [ 170, 74]); /* s[0][1] */
    t.notOk(currentPoint.left, 'is right');
    t.strictSame(currentPoint.otherEvent.point, [20, -23.5], 'other event'); /* s[0][0] */
    t.ok(currentPoint.otherEvent.left, 'other event is left');

    t.end();
  });


  t.test('point 7', function(t) {
    currentPoint = q.pop();
    t.strictSame(currentPoint.point, [ 170, 74]); /* s[0][1] */
    t.ok(currentPoint.left, 'is left');
    t.strictSame(currentPoint.otherEvent.point, [226.5, -113.5], 'other event'); /* s[0][3] */
    t.notOk(currentPoint.otherEvent.left, 'other event is right');

    t.end();
  });


  t.test('point 8', function(t) {
    currentPoint = q.pop();
    t.strictSame(currentPoint.point, [ 226.5, -113.5]); /* s[0][1] */
    t.notOk(currentPoint.left, 'is right');
    t.strictSame(currentPoint.otherEvent.point, [20, -23.5], 'other event'); /* s[0][0] */
    t.ok(currentPoint.otherEvent.left, 'other event is left');

    t.end();
  });


  t.test('point 9', function(t) {
    currentPoint = q.pop();
    t.strictSame(currentPoint.point, [ 226.5, -113.5]); /* s[0][1] */
    t.notOk(currentPoint.left, 'is right');
    t.strictSame(currentPoint.otherEvent.point, [170, 74], 'other event'); /* s[0][0] */
    t.ok(currentPoint.otherEvent.left, 'other event is left');

    t.end();
  });


  t.test('point 10', function(t) {
    currentPoint = q.pop();
    t.strictSame(currentPoint.point, [ 239.5, -198]); /* c[0][2] */
    t.notOk(currentPoint.left, 'is right');
    t.strictSame(currentPoint.otherEvent.point, [54.5, -170.5], 'other event'); /* c[0][0] */
    t.ok(currentPoint.otherEvent.left, 'other event is left');

    t.end();
  });


  t.test('point 11', function(t) {
    currentPoint = q.pop();
    t.strictSame(currentPoint.point, [ 239.5, -198]); /* c[0][2] */
    t.notOk(currentPoint.left, 'is right');
    t.strictSame(currentPoint.otherEvent.point, [140.5, 33.5], 'other event'); /* s[0][1] */
    t.ok(currentPoint.otherEvent.left, 'other event is left');

    t.end();
  });

  t.end();
});

