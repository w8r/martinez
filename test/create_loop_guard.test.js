'use strict';

var tap             = require('tap');
var createLoopGuard = require('../src/create_loop_guard');

tap.test('create loop guard', (main) => {

  main.test('creates a loop guard object', (t) => {
    t.type(createLoopGuard(10), 'object');
    t.end();
  });

  main.test('does not throw if iterated less than max iterations', (t) => {
    var loopGuard = createLoopGuard(10);
    loopGuard.check();
    t.end();
  });

  main.test('does not throw if iterated exactly max iterations', (t) => {
    var i, loopGuard = createLoopGuard(10);
    for (i = 0; i < 10; ++i) { loopGuard.check(); }
    t.end();
  });

  main.test('throws if iterated one past max iterations', (t) => {
    var i, loopGuard = createLoopGuard(10);
    for (i = 0; i < 10; ++i) { loopGuard.check(); }
    t.throws(function () { loopGuard.check(); });
    t.end();
  });

  main.test('throws with a location description', (t) => {
    var didItThrow = false;
    var loopGuard = createLoopGuard(0, 'my location');
    try {
      loopGuard.check();
    } catch (err) {
      didItThrow = true;
      t.ok(err.message.includes('my location'));
    }
    t.ok(didItThrow);
    t.end();
  });

  main.end();
});
