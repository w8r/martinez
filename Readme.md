# Martinez-Rueda polygon clipping algorithm [![npm version](https://badge.fury.io/js/martinez-polygon-clipping.svg)](https://badge.fury.io/js/martinez-polygon-clipping) [![CircleCI](https://circleci.com/gh/w8r/martinez.svg?style=svg)](https://circleci.com/gh/w8r/martinez)

![screenshot 2016-07-26 10 54 01](https://cloud.githubusercontent.com/assets/26884/17131796/611b3b20-531f-11e6-941c-b0f8fd385016.png)
![screenshot 2016-07-25 18 53 44](https://cloud.githubusercontent.com/assets/26884/17131805/64b74134-531f-11e6-913b-81c0cbd1a618.png)

## Details

The algorithm is specifically *fast* and *capable* of working with polygons of all types: multipolygons (without cascading),
polygons with holes, self-intersecting polygons and degenerate polygons with overlapping edges.

### Example

```js
var martinez = require('martinez-polygon-clipping');
var gj1 = { "type": "Feature", ..., "geometry": { "type": "Polygon", "coordinates": [ [ [x, y], ... ] ]};
var gj2 = { "type": "Feature", ..., "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [x, y], ...] ] ]};

var intersection = {
  "type": "Feature",
  "properties": { ... },
  "geometry": {
    "type": "Polygon",
    "coordinates": martinez.intersection(gj1.geometry.coordinates, gj2.geometry.coordinates)
  }
};
```

### API

* **`.intersection(<Geometry>, <Geometry>) => <Geometry>`**
* **`.union(<Geometry>, <Geometry>)        => <Geometry>`**
* **`.diff(<Geometry>, <Geometry>)         => <Geometry>`**
* **`.xor(<Geometry>, <Geometry>)          => <Geometry>`**
* **`.boolean(<Geometry>, <Geometry>, <Operation>) => <Geometry>`**

`<Geometry>` is [GeoJSON](http://geojson.org/geojson-spec.html) [`'Polygon'`](http://geojson.org/geojson-spec.html#id4) or [`'MultiPolygon'`](http://geojson.org/geojson-spec.html#id7) <u>**coordinates**</u> structure.
`<Operation>` is an enum of `{ INTERSECTION: 0, UNION: 1, DIFFERENCE: 2, XOR: 3 }` in case you have to decide programmatically
which operation do you need

### Authors

* [Alexander Milevski](https://github.com/w8r/)
* [Vladimir Ovsyannikov](https://github.com/sh1ng/)

### Based on

* [A new algorithm for computing Boolean operations on polygons](http://www.sciencedirect.com/science/article/pii/S0965997813000379) (2008, 2013) by Francisco Martinez, Antonio Jesus Rueda, Francisco Ramon Feito (and its C++ code)

### License

The MIT License (MIT)

Copyright (c) 2016 Alexander Milevski

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

