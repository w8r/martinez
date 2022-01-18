import tap from 'tape';
import Queue from 'tinyqueue';
import sweepEventsComp from '../dist/compare_events';
import SweepEvent from '../dist/sweep_event';

tap.test('queue', (main) => {
  main.test('queue should process lest(by x) sweep event first', (t) => {
    const queue = new Queue(null, sweepEventsComp);
    const e1 = { point: [0.0, 0.0] };
    const e2 = { point: [0.5, 0.5] };

    queue.push(e1);
    queue.push(e2);

    t.equals(e1, queue.pop());
    t.equals(e2, queue.pop());

    t.end();
  });

  main.test('queue should process lest(by y) sweep event first', (t) => {
    const queue = new Queue(null, sweepEventsComp);
    const e1 = { point: [0.0, 0.0] };
    const e2 = { point: [0.0, 0.5] };

    queue.push(e1);
    queue.push(e2);

    t.equals(e1, queue.pop());
    t.equals(e2, queue.pop());

    t.end();
  });

  main.test('queue should pop least(by left prop) sweep event first', (t) => {
    const queue = new Queue(null, sweepEventsComp);
    const e1 = { point: [0.0, 0.0], left: true };
    const e2 = { point: [0.0, 0.0], left: false };

    queue.push(e1);
    queue.push(e2);

    t.equals(e2, queue.pop());
    t.equals(e1, queue.pop());

    t.end();
  });

  main.end();
});

tap.test('sweep event comparison x coordinates', (t) => {
  const e1 = { point: [0.0, 0.0] };
  const e2 = { point: [0.5, 0.5] };

  t.equals(sweepEventsComp(e1, e2), -1);
  t.equals(sweepEventsComp(e2, e1), 1);

  t.end();
});

tap.test('sweep event comparison y coordinates', (t) => {
  const e1 = { point: [0.0, 0.0] };
  const e2 = { point: [0.0, 0.5] };

  t.equals(sweepEventsComp(e1, e2), -1);
  t.equals(sweepEventsComp(e2, e1), 1);

  t.end();
});

tap.test('sweep event comparison not left first', (t) => {
  const e1 = { point: [0.0, 0.0], left: true };
  const e2 = { point: [0.0, 0.0], left: false };

  t.equals(sweepEventsComp(e1, e2), 1);
  t.equals(sweepEventsComp(e2, e1), -1);

  t.end();
});

tap.test(
  'sweep event comparison shared start point not collinear edges',
  (t) => {
    const e1 = new SweepEvent([0.0, 0.0], true, new SweepEvent([1, 1], false));
    const e2 = new SweepEvent([0.0, 0.0], true, new SweepEvent([2, 3], false));

    t.equals(sweepEventsComp(e1, e2), -1, 'lower is processed first');
    t.equals(sweepEventsComp(e2, e1), 1, 'higher is processed second');

    t.end();
  }
);

tap.test('sweep event comparison collinear edges', (t) => {
  const e1 = new SweepEvent(
    [0.0, 0.0],
    true,
    new SweepEvent([1, 1], false),
    true
  );
  const e2 = new SweepEvent(
    [0.0, 0.0],
    true,
    new SweepEvent([2, 2], false),
    false
  );

  t.equals(sweepEventsComp(e1, e2), -1, 'clipping is processed first');
  t.equals(sweepEventsComp(e2, e1), 1, 'subject is processed second');

  t.end();
});
