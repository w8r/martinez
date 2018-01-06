'use strict';

var martinez = require('./src/index');

var boolean = {
  union: martinez.union,
  diff: martinez.diff,
  xor: martinez.xor,
  intersection: martinez.intersection
};
boolean.default = boolean;

module.exports = boolean;
