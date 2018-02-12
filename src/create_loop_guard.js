'use strict';

/** Create an object that tracks the number of times a loop is iterated and throws an error if the
 *  iteration count exceeds the specified maximum.
 *
 *  @param {Number} maxIterations Max number of loop iterations before an error is thrown.
 *  @param {String} locationDescription Optional location that will be added to message of a thrown error.
 *  @return {Object} An object with a check() member that should be called once on each loop iteration. Caller
 *                   should not share or reuse this object instance--create a fresh one each time a loop is
 *                   entered.
 */
module.exports = function createLoopGuard(maxIterations, locationDescription) {
  return {
    iterationCount: 0,
    check: function () {
      var locationConcat;
      if (++this.iterationCount > maxIterations) {
        locationConcat = locationDescription ? ' in ' + locationDescription : '';
        throw new Error('Surpassed ' + maxIterations + ' iterations' + locationConcat + '.');
      }
    }
  };
};
