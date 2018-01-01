'use strict';

var tap               = require('tap');
var path              = require('path');
var Queue             = require('tinyqueue');
var load              = require('load-json-file');
var martinez          = require('../src/');
var SweepEvent        = require('../src/sweep_event');
var compareEvents     = require('../src/compare_events');
var intersection      = require('../src/segment_intersection');
var equals            = require('../src/equals');
var fillQueue         = require('../src/fill_queue');
var divideSegment     = require('../src/divide_segment');
var subdivideSegments = require('../src/subdivide_segments');
var possibleIntersection = require('../src/possible_intersection');

// GeoJSON Data
var shapes = load.sync(path.join(__dirname, 'fixtures', 'two_shapes.geojson'));

var Tree = require('avl');
var compareSegments = require('../src/compare_segments');

var subject = shapes.features[0];
var clipping = shapes.features[1];

tap.test('divide segments', function (main) {

  main.test('divide 2 segments', function (t) {
    var se1 = new SweepEvent([0, 0], true, new SweepEvent([5, 5], false), true);
    var se2 = new SweepEvent([0, 5], true, new SweepEvent([5, 0], false), false);
    var q = new Queue(null, compareEvents);

    q.push(se1);
    q.push(se2);

    var iter = intersection(
      se1.point, se1.otherEvent.point,
      se2.point, se2.otherEvent.point
    );


    divideSegment(se1, iter[0], q);
    divideSegment(se2, iter[0], q);

    t.equals(q.length, 6, 'subdivided in 4 segments by intersection point');

    t.end();
  });

  main.test('possible intersections', function (t) {

    var s = subject.geometry.coordinates;
    var c = clipping.geometry.coordinates;

    var q = new Queue(null, compareEvents);

    var se1 = new SweepEvent(s[0][3], true, new SweepEvent(s[0][2], false), true);
    var se2 = new SweepEvent(c[0][0], true, new SweepEvent(c[0][1], false), false);

    // console.log(se1.point, se1.left, se1.otherEvent.point, se1.otherEvent.left);
    // console.log(se2.point, se2.left, se2.otherEvent.point, se2.otherEvent.left);

    t.equals(possibleIntersection(se1, se2, q), 1);
    t.equals(q.length, 4);


    e = q.pop();
    t.strictSame(e.point, [100.79403384562251, 233.41363754101192]);
    t.strictSame(e.otherEvent.point, [56, 181], '1');

    e = q.pop();
    t.strictSame(e.point, [100.79403384562251, 233.41363754101192]);
    t.strictSame(e.otherEvent.point, [16, 282], '2');

    var e = q.pop();
    t.strictSame(e.point, [100.79403384562251, 233.41363754101192]);
    t.strictSame(e.otherEvent.point, [153, 203.5], '3');

    e = q.pop();
    t.strictSame(e.point, [100.79403384562251, 233.41363754101192]);
    t.strictSame(e.otherEvent.point, [153, 294.5], '4');

    t.end();
  });

  main.test('possible intersections on 2 polygons', function(t) {
    var s = [subject.geometry.coordinates];
    var c = [clipping.geometry.coordinates];

    var bbox = [Infinity, Infinity, -Infinity, -Infinity];
    var q = fillQueue(s, c, bbox, bbox);
    var p0 = [16, 282];
    var p1 = [298, 359];
    var p2 = [156, 203.5];

    var te  = new SweepEvent(p0, true, null, true);
    var te2 = new SweepEvent(p1, false, te, false);
    te.otherEvent = te2;

    var te3 = new SweepEvent(p0, true, null, true);
    var te4 = new SweepEvent(p2, true, te3, false);
    te3.otherEvent = te4;

    var tr = new Tree(compareSegments);

    t.ok(tr.insert(te), 'insert');
    t.ok(tr.insert(te3), 'insert');

    t.equals(tr.find(te).key, te);
    t.equals(tr.find(te3).key, te3);

    t.equals(compareSegments(te, te3), 1);
    t.equals(compareSegments(te3, te), -1);

    var segments = subdivideSegments(q, s, c, bbox, bbox, 0);
    var leftSegments = [];
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].left) {
        leftSegments.push(segments[i]);
      }
    }

    t.equals(leftSegments.length, 11);

    var E = [16, 282];
    var I = [100.79403384562252, 233.41363754101192];
    var G = [298, 359];
    var C = [153, 294.5];
    var J = [203.36313843035356, 257.5101243166895];
    var F = [153, 203.5];
    var D = [56, 181];
    var A = [108.5, 120];
    var B = [241.5, 229.5];

    var intervals = {
      'EI': {
        l: E, r: I,
        inOut: false,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      'IF': {
        l: I, r: F,
        inOut: false,
        otherInOut: false,
        inResult: true,
        prevInResult: null
      },
      'FJ': {
        l: F, r: J,
        inOut: false,
        otherInOut: false,
        inResult: true,
        prevInResult: null
      },
      'JG': {
        l: J, r: G,
        inOut: false,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      'EG': {
        l: E, r: G,
        inOut: true,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      'DA': {
        l: D, r: A,
        inOut: false,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      'AB': {
        l: A, r: B,
        inOut: false,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      'JB': {
        l: J, r: B,
        inOut: true,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },

      'CJ': {
        l: C, r: J,
        inOut: true,
        otherInOut: false,
        inResult: true,
        prevInResult: {
          l: F, r: J,
          prevInResult: null
        }
      },
      'IC': {
        l: I, r: C,
        inOut: true,
        otherInOut: false,
        inResult: true,
        prevInResult: {
          l: I, r: F,
          prevInResult: null
        }},

      'DI': {
        l: D, r: I,
        inOut: true,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      }
    };

    function checkContain(interval) {
      var data = intervals[interval];
      for (var x = 0; x < leftSegments.length; x++) {
        var seg = leftSegments[x];
        if (equals(seg.point, data.l) &&
           equals(seg.otherEvent.point, data.r) &&
           seg.inOut      === data.inOut &&
           seg.otherInOut === data.otherInOut &&
           seg.inResult   === data.inResult &&
           ((seg.prevInResult === null && data.prevInResult === null) ||
            (equals(seg.prevInResult.point, data.prevInResult.l) &&
            equals(seg.prevInResult.otherEvent.point, data.prevInResult.r)))) {
          t.pass(interval);
          return;
        }
      }
      t.fail(interval);
    }

    Object.keys(intervals).forEach(function (key) { checkContain(key); });

    t.end();
  });

  main.end();
});
