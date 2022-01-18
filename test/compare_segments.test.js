import tap from 'tape';
import Tree from 'splaytree';
import compareSegments from '../dist/compare_segments';
import compareEvents from '../dist/compare_events';
import SweepEvent from '../dist/sweep_event';

tap.test('compare segments', (main) => {
  main.test('not collinear', (secondary) => {
    secondary.test('shared left point - right point first', (t) => {
      const tree = new Tree(compareSegments);
      const pt = [0.0, 0.0];
      const se1 = new SweepEvent(pt, true, new SweepEvent([1, 1], false));
      const se2 = new SweepEvent(pt, true, new SweepEvent([2, 3], false));

      tree.insert(se1);
      tree.insert(se2);

      t.deepEqual(tree.maxNode().key.otherEvent.point, [2, 3]);
      t.deepEqual(tree.minNode().key.otherEvent.point, [1, 1]);

      t.end();
    });

    secondary.test(
      'different left point - right point y coord to sort',
      (t) => {
        const tree = new Tree(compareSegments);
        const se1 = new SweepEvent([0, 1], true, new SweepEvent([1, 1], false));
        const se2 = new SweepEvent([0, 2], true, new SweepEvent([2, 3], false));

        tree.insert(se1);
        tree.insert(se2);

        t.deepEqual(tree.minNode().key.otherEvent.point, [1, 1]);
        t.deepEqual(tree.maxNode().key.otherEvent.point, [2, 3]);

        t.end();
      }
    );

    secondary.test('events order in sweep line', (t) => {
      const se1 = new SweepEvent([0, 1], true, new SweepEvent([2, 1], false));
      const se2 = new SweepEvent([-1, 0], true, new SweepEvent([2, 3], false));

      const se3 = new SweepEvent([0, 1], true, new SweepEvent([3, 4], false));
      const se4 = new SweepEvent([-1, 0], true, new SweepEvent([3, 1], false));

      t.equal(compareEvents(se1, se2), 1);
      t.notOk(se2.isBelow(se1.point));
      t.ok(se2.isAbove(se1.point));

      t.equal(compareSegments(se1, se2), -1, 'compare segments');
      t.equal(compareSegments(se2, se1), 1, 'compare segments inverted');

      t.equal(compareEvents(se3, se4), 1);
      t.notOk(se4.isAbove(se3.point));

      t.end();
    });

    secondary.test('first point is below', (t) => {
      const se2 = new SweepEvent([0, 1], true, new SweepEvent([2, 1], false));
      const se1 = new SweepEvent([-1, 0], true, new SweepEvent([2, 3], false));

      t.notOk(se1.isBelow(se2.point));
      t.equal(compareSegments(se1, se2), 1, 'compare segments');

      t.end();
    });

    secondary.end();
  });

  main.test('collinear segments', (t) => {
    const se1 = new SweepEvent(
      [1, 1],
      true,
      new SweepEvent([5, 1], false),
      true
    );
    const se2 = new SweepEvent(
      [2, 1],
      true,
      new SweepEvent([3, 1], false),
      false
    );

    t.notEqual(se1.isSubject, se2.isSubject);
    t.equal(compareSegments(se1, se2), -1);

    t.end();
  });

  main.test('collinear shared left point', (t) => {
    const pt = [0, 1];

    const se1 = new SweepEvent(pt, true, new SweepEvent([5, 1], false), false);
    const se2 = new SweepEvent(pt, true, new SweepEvent([3, 1], false), false);

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

  main.test('collinear same polygon different left points', (t) => {
    const se1 = new SweepEvent(
      [1, 1],
      true,
      new SweepEvent([5, 1], false),
      true
    );
    const se2 = new SweepEvent(
      [2, 1],
      true,
      new SweepEvent([3, 1], false),
      true
    );

    t.equal(se1.isSubject, se2.isSubject);
    t.notEqual(se1.point, se2.point);
    t.equal(compareSegments(se1, se2), -1);
    t.equal(compareSegments(se2, se1), 1);

    t.end();
  });

  main.end();
});
