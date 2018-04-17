'use strict';

/**
 * Martinez polygon clipping algorithm, does boolean operation on polygons
 * (multipolygons, polygons with holes etc): intersection, union, difference, xor
 *
 * @license MIT
 * @author Alexander Milevski
 * @preserve
 */
var martinez = require('./src/index');

var boolean = {
  union: martinez.union,
  diff: martinez.diff,
  xor: martinez.xor,
  intersection: martinez.intersection
};
boolean.default = boolean;

module.exports = boolean;
