(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
L.BooleanControl = L.Control.extend({
  options: {
    position: 'topright'
  },

  onAdd: function(map) {
    var container = this._container = L.DomUtil.create('div', 'leaflet-bar');
    this._container.style.background = '#ffffff';
    this._container.style.padding = '10px';
    container.innerHTML = [
      '<form>',
        '<ul style="list-style:none; padding-left: 0">',
          '<li>','<label>', '<input type="radio" name="op" value="0" checked />',  ' Intersection', '</label>', '</li>',
          '<li>','<label>', '<input type="radio" name="op" value="1" />',  ' Union', '</label>', '</li>',
          '<li>','<label>', '<input type="radio" name="op" value="2" />',  ' Difference A - B', '</label>', '</li>',
          '<li>','<label>', '<input type="radio" name="op" value="5" />',  ' Difference B - A', '</label>', '</li>',
          '<li>','<label>', '<input type="radio" name="op" value="3" />',  ' Xor', '</label>', '</li>',
        '</ul>',
        '<input type="submit" value="Run">', '<input name="clear" type="button" value="Clear layers">',
      '</form>'].join('');
    var form = container.querySelector('form');
    L.DomEvent
      .on(form, 'submit', function (evt) {
        L.DomEvent.stop(evt);
        var radios = Array.prototype.slice.call(
          form.querySelectorAll('input[type=radio]'));
        for (var i = 0, len = radios.length; i < len; i++) {
          if (radios[i].checked) {
            this.options.callback(parseInt(radios[i].value));
            break;
          }
        }
      }, this)
      .on(form['clear'], 'click', function(evt) {
        L.DomEvent.stop(evt);
        this.options.clear();
      }, this);

    L.DomEvent
      .disableClickPropagation(this._container)
      .disableScrollPropagation(this._container);
    return this._container;
  }

});

},{}],2:[function(require,module,exports){
L.Coordinates = L.Control.extend({
  options: {
    position: 'bottomright'
  },

  onAdd: function(map) {
    this._container = L.DomUtil.create('div', 'leaflet-bar');
    this._container.style.background = '#ffffff';
    map.on('mousemove', this._onMouseMove, this);
    return this._container;
  },

  _onMouseMove: function(e) {
    this._container.innerHTML = '<span style="padding: 5px">' +
      e.latlng.lng.toFixed(3) + ', ' + e.latlng.lat.toFixed(3) + '</span>';
  }

});
},{}],3:[function(require,module,exports){
require('./coordinates');
require('./polygoncontrol');
require('./booleanopcontrol');
var martinez = window.martinez = require('../../src/index');
//var martinez = require('../../dist/martinez.min');
var xhr  = require('superagent');
var mode = window.location.hash.substring(1);
var path = '../test/fixtures/';
var ext  = '.geojson';
var file;

var files = [
  'asia', 'trapezoid-box', 'canada', 'horseshoe', 'hourglasses', 'overlap_y',
  'polygon_trapezoid_edge_overlap', 'touching_boxes', 'two_pointed_triangles',
  'hole_cut', 'overlapping_segments', 'overlap_loop', 'disjoint_boxes'
];

switch (mode) {
  case 'geo':
    file = 'asia.geojson';
    break;
  case 'states':
    file = 'states_source.geojson';
    break;
  case 'trapezoid':
    file = 'trapezoid-box.geojson';
    break;
  case 'canada':
    file = 'canada.geojson';
    break;
  case 'horseshoe':
    file = 'horseshoe.geojson';
    break;
  case 'hourglasses':
    file = 'hourglasses.geojson';
    break;
  case 'edge_overlap':
    file = 'polygon_trapezoid_edge_overlap.geojson';
    break;
  case 'touching_boxes':
    file = 'touching_boxes.geojson';
    break;
  case 'triangles':
    file = 'two_pointed_triangles.geojson';
    break;
  case 'holecut':
    file = 'hole_cut.geojson';
    break;
  case 'overlapping_segments':
    file = 'overlapping_segments.geojson';
    break;
  case 'overlap_loop':
    file = 'overlap_loop.geojson';
    break;
  case 'overlap_y':
    file = 'overlap_y.geojson';
    break;
  case 'overlap_two':
    file = 'overlap_two.geojson';
    break;
  case 'disjoint_boxes':
    file = 'disjoint_boxes.geojson';
    break;
  case 'polygons_edge_overlap':
    file = 'polygons_edge_overlap.geojson';
    break;
  case 'vertical_boxes':
    file = 'vertical_boxes.geojson';
    break;
  case 'collapsed':
    file = 'collapsed.geojson';
    break;
  case 'fatal1':
    file = 'fatal1.geojson';
    break;
  case 'fatal2':
    file = 'fatal2.geojson';
    break;
  default:
    file = 'hole_hole.geojson';
    break;
}

console.log(mode);


var OPERATIONS = {
  INTERSECTION: 0,
  UNION:        1,
  DIFFERENCE:   2,
  XOR:          3
};

var div = document.createElement('div');
div.id = 'image-map';
div.style.width = div.style.height = '100%';
document.body.appendChild(div);

// create the slippy map
var map = window.map = L.map('image-map', {
  minZoom: 1,
  maxZoom: 20,
  center: [0, 0],
  zoom: 2,
  crs: mode === 'geo' ? L.CRS.EPSG4326 : L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(1/8, 0, -1/8, 0)
  }),
  editable: true
});

map.addControl(new L.NewPolygonControl({
  callback: map.editTools.startPolygon
}));
map.addControl(new L.Coordinates());
map.addControl(new L.BooleanControl({
  callback: run,
  clear: clear
}));

var drawnItems = window.drawnItems = L.geoJson().addTo(map);

function loadData(path) {
  console.log(path);
  xhr
    .get(path)
    .accept('json')
    .end(function(e, r) {
      if (!e) {
        drawnItems.addData(JSON.parse(r.text));
        map.fitBounds(drawnItems.getBounds().pad(0.05), { animate: false });
      }
    });
}

function clear() {
  drawnItems.clearLayers();
  results.clearLayers();
}

var reader = new jsts.io.GeoJSONReader();
var writer = new jsts.io.GeoJSONWriter();

function run (op) {
  var layers = drawnItems.getLayers();
  if (layers.length < 2) return;
  var subject = layers[0].toGeoJSON();
  var clipping = layers[1].toGeoJSON();

  //console.log('input', subject, clipping, op);

  subject  = JSON.parse(JSON.stringify(subject));
  clipping = JSON.parse(JSON.stringify(clipping));

  var operation;
  if (op === OPERATIONS.INTERSECTION) {
    operation = martinez.intersection;
  } else if (op === OPERATIONS.UNION) {
    operation = martinez.union;
  } else if (op === OPERATIONS.DIFFERENCE) {
    operation = martinez.diff;
  } else if (op === 5) { // B - A
    operation = martinez.diff;

    var temp = subject;
    subject  = clipping;
    clipping = temp;
  } else {
    operation = martinez.xor;
  }

  console.time('martinez');
  var result = operation(subject.geometry.coordinates, clipping.geometry.coordinates);
  console.timeEnd('martinez');

  //if (op === OPERATIONS.UNION) result = result[0];
  console.log('result', result);
  // console.log(JSON.stringify(result))
  results.clearLayers();

  if (result !== null) {
    results.addData({
      'type': 'Feature',
      'geometry': {
        'type': 'MultiPolygon',
        'coordinates': result
      }
    });

    setTimeout(function() {
      console.time('jsts');
      var s = reader.read(subject);
      var c = reader.read(clipping);
      var res;
      if (op === OPERATIONS.INTERSECTION) {
        res = s.geometry.intersection(c.geometry);
      } else if (op === OPERATIONS.UNION) {
        res = s.geometry.union(c.geometry);
      } else if (op === OPERATIONS.DIFFERENCE) {
        res = s.geometry.difference(c.geometry);
      } else {
        res = s.geometry.symDifference(c.geometry);
      }
      res = writer.write(res);
      console.timeEnd('jsts');
      console.log(res);
    }, 500);
  }
}

//drawnItems.addData(oneInside);
//drawnItems.addData(twoPointedTriangles);
//drawnItems.addData(selfIntersecting);
//drawnItems.addData(holes);
//drawnItems.addData(data);

map.on('editable:created', function(evt) {
  drawnItems.addLayer(evt.layer);
  evt.layer.on('click', function(e) {
    if ((e.originalEvent.ctrlKey || e.originalEvent.metaKey) && this.editEnabled()) {
      this.editor.newHole(e.latlng);
    }
  });
});

var results = window.results = L.geoJson(null, {
  style: function(feature) {
    return {
      color: 'red',
      weight: 1
    };
  }
}).addTo(map);

loadData(path + file);

},{"../../src/index":20,"./booleanopcontrol":1,"./coordinates":2,"./polygoncontrol":4,"superagent":7}],4:[function(require,module,exports){
L.EditControl = L.Control.extend({

  options: {
    position: 'topleft',
    callback: null,
    kind: '',
    html: ''
  },

  onAdd: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-control leaflet-bar'),
        link = L.DomUtil.create('a', '', container);

    link.href = '#';
    link.title = 'Create a new ' + this.options.kind;
    link.innerHTML = this.options.html;
    L.DomEvent.on(link, 'click', L.DomEvent.stop)
              .on(link, 'click', function () {
                window.LAYER = this.options.callback.call(map.editTools);
              }, this);

    return container;
  }

});

L.NewPolygonControl = L.EditControl.extend({
  options: {
    position: 'topleft',
    kind: 'polygon',
    html: '▰'
  }
});
},{}],5:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],6:[function(require,module,exports){
/**
 * splaytree v0.1.4
 * Fast Splay tree for Node and browser
 *
 * @author Alexander Milevski <info@w8r.name>
 * @license MIT
 * @preserve
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.SplayTree = factory());
}(this, (function () { 'use strict';

function DEFAULT_COMPARE (a, b) { return a > b ? 1 : a < b ? -1 : 0; }

var SplayTree = function SplayTree(compare, noDuplicates) {
  if ( compare === void 0 ) compare = DEFAULT_COMPARE;
  if ( noDuplicates === void 0 ) noDuplicates = false;

  this._compare = compare;
  this._root = null;
  this._size = 0;
  this._noDuplicates = !!noDuplicates;
};

var prototypeAccessors = { size: {} };


SplayTree.prototype.rotateLeft = function rotateLeft (x) {
  var y = x.right;
  if (y) {
    x.right = y.left;
    if (y.left) { y.left.parent = x; }
    y.parent = x.parent;
  }

  if (!x.parent)              { this._root = y; }
  else if (x === x.parent.left) { x.parent.left = y; }
  else                        { x.parent.right = y; }
  if (y) { y.left = x; }
  x.parent = y;
};


SplayTree.prototype.rotateRight = function rotateRight (x) {
  var y = x.left;
  if (y) {
    x.left = y.right;
    if (y.right) { y.right.parent = x; }
    y.parent = x.parent;
  }

  if (!x.parent)             { this._root = y; }
  else if(x === x.parent.left) { x.parent.left = y; }
  else                       { x.parent.right = y; }
  if (y) { y.right = x; }
  x.parent = y;
};


SplayTree.prototype._splay = function _splay (x) {
    var this$1 = this;

  while (x.parent) {
    var p = x.parent;
    if (!p.parent) {
      if (p.left === x) { this$1.rotateRight(p); }
      else            { this$1.rotateLeft(p); }
    } else if (p.left === x && p.parent.left === p) {
      this$1.rotateRight(p.parent);
      this$1.rotateRight(p);
    } else if (p.right === x && p.parent.right === p) {
      this$1.rotateLeft(p.parent);
      this$1.rotateLeft(p);
    } else if (p.left === x && p.parent.right === p) {
      this$1.rotateRight(p);
      this$1.rotateLeft(p);
    } else {
      this$1.rotateLeft(p);
      this$1.rotateRight(p);
    }
  }
};


SplayTree.prototype.splay = function splay (x) {
    var this$1 = this;

  var p, gp, ggp, l, r;

  while (x.parent) {
    p = x.parent;
    gp = p.parent;

    if (gp && gp.parent) {
      ggp = gp.parent;
      if (ggp.left === gp) { ggp.left= x; }
      else               { ggp.right = x; }
      x.parent = ggp;
    } else {
      x.parent = null;
      this$1._root = x;
    }

    l = x.left; r = x.right;

    if (x === p.left) { // left
      if (gp) {
        if (gp.left === p) {
          /* zig-zig */
          if (p.right) {
            gp.left = p.right;
            gp.left.parent = gp;
          } else { gp.left = null; }

          p.right = gp;
          gp.parent = p;
        } else {
          /* zig-zag */
          if (l) {
            gp.right = l;
            l.parent = gp;
          } else { gp.right = null; }

          x.left  = gp;
          gp.parent = x;
        }
      }
      if (r) {
        p.left = r;
        r.parent = p;
      } else { p.left = null; }

      x.right= p;
      p.parent = x;
    } else { // right
      if (gp) {
        if (gp.right === p) {
          /* zig-zig */
          if (p.left) {
            gp.right = p.left;
            gp.right.parent = gp;
          } else { gp.right = null; }

          p.left = gp;
          gp.parent = p;
        } else {
          /* zig-zag */
          if (r) {
            gp.left = r;
            r.parent = gp;
          } else { gp.left = null; }

          x.right = gp;
          gp.parent = x;
        }
      }
      if (l) {
        p.right = l;
        l.parent = p;
      } else { p.right = null; }

      x.left = p;
      p.parent = x;
    }
  }
};


SplayTree.prototype.replace = function replace (u, v) {
  if (!u.parent) { this._root = v; }
  else if (u === u.parent.left) { u.parent.left = v; }
  else { u.parent.right = v; }
  if (v) { v.parent = u.parent; }
};


SplayTree.prototype.minNode = function minNode (u) {
    if ( u === void 0 ) u = this._root;

  if (u) { while (u.left) { u = u.left; } }
  return u;
};


SplayTree.prototype.maxNode = function maxNode (u) {
    if ( u === void 0 ) u = this._root;

  if (u) { while (u.right) { u = u.right; } }
  return u;
};


SplayTree.prototype.insert = function insert (key, data) {
  var z = this._root;
  var p = null;
  var comp = this._compare;
  var cmp;

  if (this._noDuplicates) {
    while (z) {
      p = z;
      cmp = comp(z.key, key);
      if (cmp === 0) { return; }
      else if (comp(z.key, key) < 0) { z = z.right; }
      else { z = z.left; }
    }
  } else {
    while (z) {
      p = z;
      if (comp(z.key, key) < 0) { z = z.right; }
      else { z = z.left; }
    }
  }

  z = { key: key, data: data, left: null, right: null, parent: p };

  if (!p)                        { this._root = z; }
  else if (comp(p.key, z.key) < 0) { p.right = z; }
  else                           { p.left= z; }

  this.splay(z);
  this._size++;
  return z;
};


SplayTree.prototype.find = function find (key) {
  var z  = this._root;
  var comp = this._compare;
  while (z) {
    var cmp = comp(z.key, key);
    if    (cmp < 0) { z = z.right; }
    else if (cmp > 0) { z = z.left; }
    else            { return z; }
  }
  return null;
};

/**
 * Whether the tree contains a node with the given key
 * @param{Key} key
 * @return {boolean} true/false
 */
SplayTree.prototype.contains = function contains (key) {
  var node     = this._root;
  var comparator = this._compare;
  while (node){
    var cmp = comparator(key, node.key);
    if    (cmp === 0) { return true; }
    else if (cmp < 0) { node = node.left; }
    else              { node = node.right; }
  }

  return false;
};


SplayTree.prototype.remove = function remove (key) {
  var z = this.find(key);

  if (!z) { return false; }

  this.splay(z);

  if (!z.left) { this.replace(z, z.right); }
  else if (!z.right) { this.replace(z, z.left); }
  else {
    var y = this.minNode(z.right);
    if (y.parent !== z) {
      this.replace(y, y.right);
      y.right = z.right;
      y.right.parent = y;
    }
    this.replace(z, y);
    y.left = z.left;
    y.left.parent = y;
  }

  this._size--;
  return true;
};


SplayTree.prototype.removeNode = function removeNode (z) {
  if (!z) { return false; }

  this.splay(z);

  if (!z.left) { this.replace(z, z.right); }
  else if (!z.right) { this.replace(z, z.left); }
  else {
    var y = this.minNode(z.right);
    if (y.parent !== z) {
      this.replace(y, y.right);
      y.right = z.right;
      y.right.parent = y;
    }
    this.replace(z, y);
    y.left = z.left;
    y.left.parent = y;
  }

  this._size--;
  return true;
};


SplayTree.prototype.erase = function erase (key) {
  var z = this.find(key);
  if (!z) { return; }

  this.splay(z);

  var s = z.left;
  var t = z.right;

  var sMax = null;
  if (s) {
    s.parent = null;
    sMax = this.maxNode(s);
    this.splay(sMax);
    this._root = sMax;
  }
  if (t) {
    if (s) { sMax.right = t; }
    else { this._root = t; }
    t.parent = sMax;
  }

  this._size--;
};

/**
 * Removes and returns the node with smallest key
 * @return {?Node}
 */
SplayTree.prototype.pop = function pop () {
  var node = this._root, returnValue = null;
  if (node) {
    while (node.left) { node = node.left; }
    returnValue = { key: node.key, data: node.data };
    this.remove(node.key);
  }
  return returnValue;
};


/* eslint-disable class-methods-use-this */

/**
 * Successor node
 * @param{Node} node
 * @return {?Node}
 */
SplayTree.prototype.next = function next (node) {
  var successor = node;
  if (successor) {
    if (successor.right) {
      successor = successor.right;
      while (successor && successor.left) { successor = successor.left; }
    } else {
      successor = node.parent;
      while (successor && successor.right === node) {
        node = successor; successor = successor.parent;
      }
    }
  }
  return successor;
};


/**
 * Predecessor node
 * @param{Node} node
 * @return {?Node}
 */
SplayTree.prototype.prev = function prev (node) {
  var predecessor = node;
  if (predecessor) {
    if (predecessor.left) {
      predecessor = predecessor.left;
      while (predecessor && predecessor.right) { predecessor = predecessor.right; }
    } else {
      predecessor = node.parent;
      while (predecessor && predecessor.left === node) {
        node = predecessor;
        predecessor = predecessor.parent;
      }
    }
  }
  return predecessor;
};
/* eslint-enable class-methods-use-this */


/**
 * @param{forEachCallback} callback
 * @return {SplayTree}
 */
SplayTree.prototype.forEach = function forEach (callback) {
  var current = this._root;
  var s = [], done = false, i = 0;

  while (!done) {
    // Reach the left most Node of the current Node
    if (current) {
      // Place pointer to a tree node on the stack
      // before traversing the node's left subtree
      s.push(current);
      current = current.left;
    } else {
      // BackTrack from the empty subtree and visit the Node
      // at the top of the stack; however, if the stack is
      // empty you are done
      if (s.length > 0) {
        current = s.pop();
        callback(current, i++);

        // We have visited the node and its left
        // subtree. Now, it's right subtree's turn
        current = current.right;
      } else { done = true; }
    }
  }
  return this;
};


/**
 * Walk key range from `low` to `high`. Stops if `fn` returns a value.
 * @param{Key}    low
 * @param{Key}    high
 * @param{Function} fn
 * @param{*?}     ctx
 * @return {SplayTree}
 */
SplayTree.prototype.range = function range (low, high, fn, ctx) {
    var this$1 = this;

  var Q = [];
  var compare = this._compare;
  var node = this._root, cmp;

  while (Q.length !== 0 || node) {
    if (node) {
      Q.push(node);
      node = node.left;
    } else {
      node = Q.pop();
      cmp = compare(node.key, high);
      if (cmp > 0) {
        break;
      } else if (compare(node.key, low) >= 0) {
        if (fn.call(ctx, node)) { return this$1; } // stop if smth is returned
      }
      node = node.right;
    }
  }
  return this;
};

/**
 * Returns all keys in order
 * @return {Array<Key>}
 */
SplayTree.prototype.keys = function keys () {
  var current = this._root;
  var s = [], r = [], done = false;

  while (!done) {
    if (current) {
      s.push(current);
      current = current.left;
    } else {
      if (s.length > 0) {
        current = s.pop();
        r.push(current.key);
        current = current.right;
      } else { done = true; }
    }
  }
  return r;
};


/**
 * Returns `data` fields of all nodes in order.
 * @return {Array<Value>}
 */
SplayTree.prototype.values = function values () {
  var current = this._root;
  var s = [], r = [], done = false;

  while (!done) {
    if (current) {
      s.push(current);
      current = current.left;
    } else {
      if (s.length > 0) {
        current = s.pop();
        r.push(current.data);
        current = current.right;
      } else { done = true; }
    }
  }
  return r;
};


/**
 * Returns node at given index
 * @param{number} index
 * @return {?Node}
 */
SplayTree.prototype.at = function at (index) {
  // removed after a consideration, more misleading than useful
  // index = index % this.size;
  // if (index < 0) index = this.size - index;

  var current = this._root;
  var s = [], done = false, i = 0;

  while (!done) {
    if (current) {
      s.push(current);
      current = current.left;
    } else {
      if (s.length > 0) {
        current = s.pop();
        if (i === index) { return current; }
        i++;
        current = current.right;
      } else { done = true; }
    }
  }
  return null;
};

/**
 * Bulk-load items. Both array have to be same size
 * @param{Array<Key>}  keys
 * @param{Array<Value>}[values]
 * @param{Boolean}     [presort=false] Pre-sort keys and values, using
 *                                       tree's comparator. Sorting is done
 *                                       in-place
 * @return {AVLTree}
 */
SplayTree.prototype.load = function load (keys, values, presort) {
    if ( keys === void 0 ) keys = [];
    if ( values === void 0 ) values = [];
    if ( presort === void 0 ) presort = false;

  if (this._size !== 0) { throw new Error('bulk-load: tree is not empty'); }
  var size = keys.length;
  if (presort) { sort(keys, values, 0, size - 1, this._compare); }
  this._root = loadRecursive(null, keys, values, 0, size);
  this._size = size;
  return this;
};


SplayTree.prototype.min = function min () {
  var node = this.minNode(this._root);
  if (node) { return node.key; }
  else    { return null; }
};


SplayTree.prototype.max = function max () {
  var node = this.maxNode(this._root);
  if (node) { return node.key; }
  else    { return null; }
};

SplayTree.prototype.isEmpty = function isEmpty () { return this._root === null; };
prototypeAccessors.size.get = function () { return this._size; };


/**
 * Create a tree and load it with items
 * @param{Array<Key>}        keys
 * @param{Array<Value>?}      [values]

 * @param{Function?}          [comparator]
 * @param{Boolean?}           [presort=false] Pre-sort keys and values, using
 *                                             tree's comparator. Sorting is done
 *                                             in-place
 * @param{Boolean?}           [noDuplicates=false] Allow duplicates
 * @return {SplayTree}
 */
SplayTree.createTree = function createTree (keys, values, comparator, presort, noDuplicates) {
  return new SplayTree(comparator, noDuplicates).load(keys, values, presort);
};

Object.defineProperties( SplayTree.prototype, prototypeAccessors );

function loadRecursive (parent, keys, values, start, end) {
  var size = end - start;
  if (size > 0) {
    var middle = start + Math.floor(size / 2);
    var key    = keys[middle];
    var data   = values[middle];
    var node   = { key: key, data: data, parent: parent };
    node.left    = loadRecursive(node, keys, values, start, middle);
    node.right   = loadRecursive(node, keys, values, middle + 1, end);
    return node;
  }
  return null;
}


function sort(keys, values, left, right, compare) {
  if (left >= right) { return; }

  var pivot = keys[(left + right) >> 1];
  var i = left - 1;
  var j = right + 1;

  while (true) {
    do { i++; } while (compare(keys[i], pivot) < 0);
    do { j--; } while (compare(keys[j], pivot) > 0);
    if (i >= j) { break; }

    var tmp = keys[i];
    keys[i] = keys[j];
    keys[j] = tmp;

    tmp = values[i];
    values[i] = values[j];
    values[j] = tmp;
  }

  sort(keys, values,  left,     j, compare);
  sort(keys, values, j + 1, right, compare);
}

return SplayTree;

})));


},{}],7:[function(require,module,exports){
/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  console.warn("Using browser-only version of superagent in non-browser environment");
  root = this;
}

var Emitter = require('emitter');
var requestBase = require('./request-base');
var isObject = require('./is-object');

/**
 * Noop.
 */

function noop(){};

/**
 * Expose `request`.
 */

var request = module.exports = require('./request').bind(null, Request);

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  throw Error("Browser-only verison of superagent could not find XHR");
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    pushEncodedKeyValuePair(pairs, key, obj[key]);
  }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (val != null) {
    if (Array.isArray(val)) {
      val.forEach(function(v) {
        pushEncodedKeyValuePair(pairs, key, v);
      });
    } else if (isObject(val)) {
      for(var subkey in val) {
        pushEncodedKeyValuePair(pairs, key + '[' + subkey + ']', val[subkey]);
      }
    } else {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(val));
    }
  } else if (val === null) {
    pairs.push(encodeURIComponent(key));
  }
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var pair;
  var pos;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    pos = pair.indexOf('=');
    if (pos == -1) {
      obj[decodeURIComponent(pair)] = '';
    } else {
      obj[decodeURIComponent(pair.slice(0, pos))] =
        decodeURIComponent(pair.slice(pos + 1));
    }
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  return /[\/+]json\b/.test(mime);
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return str.split(/ *; */).reduce(function(obj, str){
    var parts = str.split(/ *= */),
        key = parts.shift(),
        val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  this._setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this._setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this._parseBody(this.text ? this.text : this.xhr.response)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype._setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype._parseBody = function(str){
  var parse = request.parse[this.type];
  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype._setStatusProperties = function(status){
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }

  var type = status / 100 | 0;

  // status / class
  this.status = this.statusCode = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case
  this._header = {}; // coerces header names to lowercase
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      // issue #675: return the raw response if the response parsing fails
      err.rawResponse = self.xhr && self.xhr.responseText ? self.xhr.responseText : null;
      // issue #876: return the http status code if the response parsing fails
      err.statusCode = self.xhr && self.xhr.status ? self.xhr.status : null;
      return self.callback(err);
    }

    self.emit('response', res);

    var new_err;
    try {
      if (res.status < 200 || res.status >= 300) {
        new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
        new_err.original = err;
        new_err.response = res;
        new_err.status = res.status;
      }
    } catch(e) {
      new_err = e; // #985 touching res may cause INVALID_STATE_ERR on old Android
    }

    // #1000 don't catch errors from the callback to avoid double calling it
    if (new_err) {
      self.callback(new_err, res);
    } else {
      self.callback(null, res);
    }
  });
}

/**
 * Mixin `Emitter` and `requestBase`.
 */

Emitter(Request.prototype);
for (var key in requestBase) {
  Request.prototype[key] = requestBase[key];
}

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set responseType to `val`. Presently valid responseTypes are 'blob' and
 * 'arraybuffer'.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.responseType = function(val){
  this._responseType = val;
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @param {Object} options with 'type' property 'auto' or 'basic' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass, options){
  if (!options) {
    options = {
      type: 'basic'
    }
  }

  switch (options.type) {
    case 'basic':
      var str = btoa(user + ':' + pass);
      this.set('Authorization', 'Basic ' + str);
    break;

    case 'auto':
      this.username = user;
      this.password = pass;
    break;
  }
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  this._getFormData().append(field, file, filename || file.name);
  return this;
};

Request.prototype._getFormData = function(){
  if (!this._formData) {
    this._formData = new root.FormData();
  }
  return this._formData;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;

  err.status = this.status;
  err.method = this.method;
  err.url = this.url;

  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype._timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Compose querystring to append to req.url
 *
 * @api private
 */

Request.prototype._appendQueryString = function(){
  var query = this._query.join('&');
  if (query) {
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (0 == status) {
      if (self.timedout) return self._timeoutError();
      if (self._aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(direction, e) {
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    e.direction = direction;
    self.emit('progress', e);
  }
  if (this.hasListeners('progress')) {
    try {
      xhr.onprogress = handleProgress.bind(null, 'download');
      if (xhr.upload) {
        xhr.upload.onprogress = handleProgress.bind(null, 'upload');
      }
    } catch(e) {
      // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
      // Reported here:
      // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
    }
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.timedout = true;
      self.abort();
    }, timeout);
  }

  // querystring
  this._appendQueryString();

  // initiate request
  if (this.username && this.password) {
    xhr.open(this.method, this.url, true, this.username, this.password);
  } else {
    xhr.open(this.method, this.url, true);
  }

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];
    var serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (!serialize && isJSON(contentType)) serialize = request.serialize['application/json'];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};


/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * OPTIONS query to `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.options = function(url, data, fn){
  var req = request('OPTIONS', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

function del(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

request['del'] = del;
request['delete'] = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

},{"./is-object":8,"./request":10,"./request-base":9,"emitter":5}],8:[function(require,module,exports){
/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return null !== obj && 'object' === typeof obj;
}

module.exports = isObject;

},{}],9:[function(require,module,exports){
/**
 * Module of mixed-in functions shared between node and client code
 */
var isObject = require('./is-object');

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

exports.clearTimeout = function _clearTimeout(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Override default response body parser
 *
 * This function will be called to convert incoming data into request.body
 *
 * @param {Function}
 * @api public
 */

exports.parse = function parse(fn){
  this._parser = fn;
  return this;
};

/**
 * Override default request body serializer
 *
 * This function will be called to convert data set via .send or .attach into payload to send
 *
 * @param {Function}
 * @api public
 */

exports.serialize = function serialize(fn){
  this._serializer = fn;
  return this;
};

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

exports.timeout = function timeout(ms){
  this._timeout = ms;
  return this;
};

/**
 * Promise support
 *
 * @param {Function} resolve
 * @param {Function} reject
 * @return {Request}
 */

exports.then = function then(resolve, reject) {
  if (!this._fullfilledPromise) {
    var self = this;
    this._fullfilledPromise = new Promise(function(innerResolve, innerReject){
      self.end(function(err, res){
        if (err) innerReject(err); else innerResolve(res);
      });
    });
  }
  return this._fullfilledPromise.then(resolve, reject);
}

exports.catch = function(cb) {
  return this.then(undefined, cb);
};

/**
 * Allow for extension
 */

exports.use = function use(fn) {
  fn(this);
  return this;
}


/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

exports.get = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */

exports.getHeader = exports.get;

/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

exports.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 */
exports.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Write the field `name` and `val`, or multiple fields with one object
 * for "multipart/form-data" request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 *
 * request.post('/upload')
 *   .field({ foo: 'bar', baz: 'qux' })
 *   .end(callback);
 * ```
 *
 * @param {String|Object} name
 * @param {String|Blob|File|Buffer|fs.ReadStream} val
 * @return {Request} for chaining
 * @api public
 */
exports.field = function(name, val) {

  // name should be either a string or an object.
  if (null === name ||  undefined === name) {
    throw new Error('.field(name, val) name can not be empty');
  }

  if (isObject(name)) {
    for (var key in name) {
      this.field(key, name[key]);
    }
    return this;
  }

  // val should be defined now
  if (null === val || undefined === val) {
    throw new Error('.field(name, val) val can not be empty');
  }
  this._getFormData().append(name, val);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */
exports.abort = function(){
  if (this._aborted) {
    return this;
  }
  this._aborted = true;
  this.xhr && this.xhr.abort(); // browser
  this.req && this.req.abort(); // node
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

exports.withCredentials = function(){
  // This is browser-only functionality. Node side is no-op.
  this._withCredentials = true;
  return this;
};

/**
 * Set the max redirects to `n`. Does noting in browser XHR implementation.
 *
 * @param {Number} n
 * @return {Request} for chaining
 * @api public
 */

exports.redirects = function(n){
  this._maxRedirects = n;
  return this;
};

/**
 * Convert to a plain javascript object (not JSON string) of scalar properties.
 * Note as this method is designed to return a useful non-this value,
 * it cannot be chained.
 *
 * @return {Object} describing method, url, and data of this request
 * @api public
 */

exports.toJSON = function(){
  return {
    method: this.method,
    url: this.url,
    data: this._data,
    headers: this._header
  };
};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

exports._isHost = function _isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
 *      request.post('/user')
 *        .send('name=tobi')
 *        .send('species=ferret')
 *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

exports.send = function(data){
  var obj = isObject(data);
  var type = this._header['content-type'];

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    // default to x-www-form-urlencoded
    if (!type) this.type('form');
    type = this._header['content-type'];
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj || this._isHost(data)) return this;

  // default to json
  if (!type) this.type('json');
  return this;
};

},{"./is-object":8}],10:[function(require,module,exports){
// The node and browser modules expose versions of this with the
// appropriate constructor function bound as first argument
/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(RequestConstructor, method, url) {
  // callback
  if ('function' == typeof url) {
    return new RequestConstructor('GET', method).end(url);
  }

  // url first
  if (2 == arguments.length) {
    return new RequestConstructor('GET', method);
  }

  return new RequestConstructor(method, url);
}

module.exports = request;

},{}],11:[function(require,module,exports){
'use strict';

module.exports = TinyQueue;
module.exports.default = TinyQueue;

function TinyQueue(data, compare) {
    if (!(this instanceof TinyQueue)) return new TinyQueue(data, compare);

    this.data = data || [];
    this.length = this.data.length;
    this.compare = compare || defaultCompare;

    if (this.length > 0) {
        for (var i = (this.length >> 1) - 1; i >= 0; i--) this._down(i);
    }
}

function defaultCompare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

TinyQueue.prototype = {

    push: function (item) {
        this.data.push(item);
        this.length++;
        this._up(this.length - 1);
    },

    pop: function () {
        if (this.length === 0) return undefined;

        var top = this.data[0];
        this.length--;

        if (this.length > 0) {
            this.data[0] = this.data[this.length];
            this._down(0);
        }
        this.data.pop();

        return top;
    },

    peek: function () {
        return this.data[0];
    },

    _up: function (pos) {
        var data = this.data;
        var compare = this.compare;
        var item = data[pos];

        while (pos > 0) {
            var parent = (pos - 1) >> 1;
            var current = data[parent];
            if (compare(item, current) >= 0) break;
            data[pos] = current;
            pos = parent;
        }

        data[pos] = item;
    },

    _down: function (pos) {
        var data = this.data;
        var compare = this.compare;
        var halfLength = this.length >> 1;
        var item = data[pos];

        while (pos < halfLength) {
            var left = (pos << 1) + 1;
            var right = left + 1;
            var best = data[left];

            if (right < this.length && compare(data[right], best) < 0) {
                left = right;
                best = data[right];
            }
            if (compare(best, item) >= 0) break;

            data[pos] = best;
            pos = left;
        }

        data[pos] = item;
    }
};

},{}],12:[function(require,module,exports){
'use strict';

var signedArea = require('./signed_area');
// var equals = require('./equals');

/**
 * @param  {SweepEvent} e1
 * @param  {SweepEvent} e2
 * @return {Number}
 */
module.exports = function compareEvents(e1, e2) {
  var p1 = e1.point;
  var p2 = e2.point;

  // Different x-coordinate
  if (p1[0] > p2[0]) return 1;
  if (p1[0] < p2[0]) return -1;

  // Different points, but same x-coordinate
  // Event with lower y-coordinate is processed first
  if (p1[1] !== p2[1]) return p1[1] > p2[1] ? 1 : -1;

  return specialCases(e1, e2, p1, p2);
};


/* eslint-disable no-unused-vars */
function specialCases(e1, e2, p1, p2) {
  // Same coordinates, but one is a left endpoint and the other is
  // a right endpoint. The right endpoint is processed first
  if (e1.left !== e2.left)
    return e1.left ? 1 : -1;

  // var p2 = e1.otherEvent.point, p3 = e2.otherEvent.point;
  // var sa = (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])
  // Same coordinates, both events
  // are left endpoints or right endpoints.
  // not collinear
  if (signedArea(p1, e1.otherEvent.point, e2.otherEvent.point) !== 0) {
    // the event associate to the bottom segment is processed first
    return (!e1.isBelow(e2.otherEvent.point)) ? 1 : -1;
  }

  return (!e1.isSubject && e2.isSubject) ? 1 : -1;
}
/* eslint-enable no-unused-vars */

},{"./signed_area":24}],13:[function(require,module,exports){
'use strict';

var signedArea    = require('./signed_area');
var compareEvents = require('./compare_events');
var equals        = require('./equals');


/**
 * @param  {SweepEvent} le1
 * @param  {SweepEvent} le2
 * @return {Number}
 */
module.exports = function compareSegments(le1, le2) {
  if (le1 === le2) return 0;

  // Segments are not collinear
  if (signedArea(le1.point, le1.otherEvent.point, le2.point) !== 0 ||
    signedArea(le1.point, le1.otherEvent.point, le2.otherEvent.point) !== 0) {

    // If they share their left endpoint use the right endpoint to sort
    if (equals(le1.point, le2.point)) return le1.isBelow(le2.otherEvent.point) ? -1 : 1;

    // Different left endpoint: use the left endpoint to sort
    if (le1.point[0] === le2.point[0]) return le1.point[1] < le2.point[1] ? -1 : 1;

    // has the line segment associated to e1 been inserted
    // into S after the line segment associated to e2 ?
    if (compareEvents(le1, le2) === 1) return le2.isAbove(le1.point) ? -1 : 1;

    // The line segment associated to e2 has been inserted
    // into S after the line segment associated to e1
    return le1.isBelow(le2.point) ? -1 : 1;
  }

  if (le1.isSubject === le2.isSubject) { // same polygon
    var p1 = le1.point, p2 = le2.point;
    if (p1[0] === p2[0] && p1[1] === p2[1]/*equals(le1.point, le2.point)*/) {
      p1 = le1.otherEvent.point; p2 = le2.otherEvent.point;
      if (p1[0] === p2[0] && p1[1] === p2[1]) return 0;
      else return le1.contourId > le2.contourId ? 1 : -1;
    }
  } else { // Segments are collinear, but belong to separate polygons
    return le1.isSubject ? -1 : 1;
  }

  return compareEvents(le1, le2) === 1 ? 1 : -1;
};

},{"./compare_events":12,"./equals":18,"./signed_area":24}],14:[function(require,module,exports){
'use strict';

var edgeType = require('./edge_type');
var operationType = require('./operation');

var INTERSECTION = operationType.INTERSECTION;
var UNION        = operationType.UNION;
var DIFFERENCE   = operationType.DIFFERENCE;
var XOR          = operationType.XOR;

/**
 * @param  {SweepEvent} event
 * @param  {SweepEvent} prev
 * @param  {Operation} operation
 */
module.exports = function computeFields(event, prev, operation) {
  // compute inOut and otherInOut fields
  if (prev === null) {
    event.inOut      = false;
    event.otherInOut = true;

  // previous line segment in sweepline belongs to the same polygon
  } else {
    if (event.isSubject === prev.isSubject) {
      event.inOut      = !prev.inOut;
      event.otherInOut = prev.otherInOut;

    // previous line segment in sweepline belongs to the clipping polygon
    } else {
      event.inOut      = !prev.otherInOut;
      event.otherInOut = prev.isVertical() ? !prev.inOut : prev.inOut;
    }

    // compute prevInResult field
    if (prev) {
      event.prevInResult = (!inResult(prev, operation) || prev.isVertical()) ?
         prev.prevInResult : prev;
    }
  }

  // check if the line segment belongs to the Boolean operation
  event.inResult = inResult(event, operation);
};


/* eslint-disable indent */
function inResult(event, operation) {
  switch (event.type) {
    case edgeType.NORMAL:
      switch (operation) {
        case INTERSECTION:
          return !event.otherInOut;
        case UNION:
          return event.otherInOut;
        case DIFFERENCE:
          // return (event.isSubject && !event.otherInOut) ||
          //         (!event.isSubject && event.otherInOut);
          return (event.isSubject && event.otherInOut) ||
                  (!event.isSubject && !event.otherInOut);
        case XOR:
          return true;
      }
      break;
    case edgeType.SAME_TRANSITION:
      return operation === INTERSECTION || operation === UNION;
    case edgeType.DIFFERENT_TRANSITION:
      return operation === DIFFERENCE;
    case edgeType.NON_CONTRIBUTING:
      return false;
  }
  return false;
}
/* eslint-enable indent */

},{"./edge_type":17,"./operation":21}],15:[function(require,module,exports){
'use strict';

// var equals = require('./equals');
var compareEvents = require('./compare_events');
var operationType = require('./operation');

/**
 * @param  {Array.<SweepEvent>} sortedEvents
 * @return {Array.<SweepEvent>}
 */
function orderEvents(sortedEvents) {
  var event, i, len, tmp;
  var resultEvents = [];
  for (i = 0, len = sortedEvents.length; i < len; i++) {
    event = sortedEvents[i];
    if ((event.left && event.inResult) ||
      (!event.left && event.otherEvent.inResult)) {
      resultEvents.push(event);
    }
  }
  // Due to overlapping edges the resultEvents array can be not wholly sorted
  var sorted = false;
  while (!sorted) {
    sorted = true;
    for (i = 0, len = resultEvents.length; i < len; i++) {
      if ((i + 1) < len &&
        compareEvents(resultEvents[i], resultEvents[i + 1]) === 1) {
        tmp = resultEvents[i];
        resultEvents[i] = resultEvents[i + 1];
        resultEvents[i + 1] = tmp;
        sorted = false;
      }
    }
  }

  for (i = 0, len = resultEvents.length; i < len; i++) {
    event = resultEvents[i];
    event.pos = i;

    if (!event.left) {
      tmp = event.pos;
      event.pos = event.otherEvent.pos;
      event.otherEvent.pos = tmp;
    }
  }

  return resultEvents;
}


/**
 * @param  {Number} pos
 * @param  {Array.<SweepEvent>} resultEvents
 * @param  {Object>}    processed
 * @return {Number}
 */
function nextPos(pos, resultEvents, processed, origIndex) {
  var newPos = pos + 1;
  var length = resultEvents.length;
  if (newPos > length - 1) return pos - 1;
  var p  = resultEvents[pos].point;
  var p1 = resultEvents[newPos].point;


  // while in range and not the current one by value
  while (newPos < length && p1[0] === p[0] && p1[1] === p[1]) {
    if (!processed[newPos]) {
      return newPos;
    } else   {
      newPos++;
    }
    p1 = resultEvents[newPos].point;
  }

  newPos = pos - 1;

  while (processed[newPos] && newPos >= origIndex) {
    newPos--;
  }
  return newPos;
}


/**
 * @param  {Array.<SweepEvent>} sortedEvents
 * @return {Array.<*>} polygons
 */
module.exports = function connectEdges(sortedEvents, operation) {
  var i, len;
  var resultEvents = orderEvents(sortedEvents);

  // "false"-filled array
  var processed = {};
  var result = [];
  var event;

  for (i = 0, len = resultEvents.length; i < len; i++) {
    if (processed[i]) continue;
    var contour = [[]];

    if (!resultEvents[i].isExteriorRing) {
      if (operation === operationType.DIFFERENCE && !resultEvents[i].isSubject && result.length === 0) {
        result.push(contour);
      } else if (result.length === 0) {
        result.push([[contour]]);
      } else {
        result[result.length - 1].push(contour[0]);
      }
    } else if (operation === operationType.DIFFERENCE && !resultEvents[i].isSubject && result.length > 1) {
      result[result.length - 1].push(contour[0]);
    } else {
      result.push(contour);
    }

    var ringId = result.length - 1;
    var pos = i;

    var initial = resultEvents[i].point;
    contour[0].push(initial);

    while (pos >= i) {
      event = resultEvents[pos];
      processed[pos] = true;

      if (event.left) {
        event.resultInOut = false;
        event.contourId   = ringId;
      } else {
        event.otherEvent.resultInOut = true;
        event.otherEvent.contourId   = ringId;
      }

      pos = event.pos;
      processed[pos] = true;
      contour[0].push(resultEvents[pos].point);
      pos = nextPos(pos, resultEvents, processed, i);
    }

    pos = pos === -1 ? i : pos;

    event = resultEvents[pos];
    processed[pos] = processed[event.pos] = true;
    event.otherEvent.resultInOut = true;
    event.otherEvent.contourId   = ringId;
  }

  // for (i = 0, len = result.length; i < len; i++) {
  //   var polygon = result[i];
  //   for (var j = 0, jj = polygon.length; j < jj; j++) {
  //     var polygonContour = polygon[j];
  //     for (var k = 0, kk = polygonContour.length; k < kk; k++) {
  //       var coords = polygonContour[k];
  //       if (typeof coords[0] !== 'number') {
  //         polygon.splice(j, 1);
  //         polygon.push(coords);
  //       }
  //     }
  //   }
  // }

  // Handle if the result is a polygon (eg not multipoly)
  // Commented it again, let's see what do we mean by that
  // if (result.length === 1) result = result[0];
  return result;
};

},{"./compare_events":12,"./operation":21}],16:[function(require,module,exports){
'use strict';

var SweepEvent    = require('./sweep_event');
var equals        = require('./equals');
var compareEvents = require('./compare_events');

/**
 * @param  {SweepEvent} se
 * @param  {Array.<Number>} p
 * @param  {Queue} queue
 * @return {Queue}
 */
module.exports = function divideSegment(se, p, queue)  {
  var r = new SweepEvent(p, false, se,            se.isSubject);
  var l = new SweepEvent(p, true,  se.otherEvent, se.isSubject);

  if (equals(se.point, se.otherEvent.point)) {
    console.warn('what is that, a collapsed segment?', se);
  }

  r.contourId = l.contourId = se.contourId;

  // avoid a rounding error. The left event would be processed after the right event
  if (compareEvents(l, se.otherEvent) > 0) {
    se.otherEvent.left = true;
    l.left = false;
  }

  // avoid a rounding error. The left event would be processed after the right event
  // if (compareEvents(se, r) > 0) {}

  se.otherEvent.otherEvent = l;
  se.otherEvent = r;

  queue.push(l);
  queue.push(r);

  return queue;
};

},{"./compare_events":12,"./equals":18,"./sweep_event":26}],17:[function(require,module,exports){
'use strict';

module.exports = {
  NORMAL:               0,
  NON_CONTRIBUTING:     1,
  SAME_TRANSITION:      2,
  DIFFERENT_TRANSITION: 3
};

},{}],18:[function(require,module,exports){
'use strict';

// var EPSILON = 1e-9;
// var abs = Math.abs;

module.exports = function equals(p1, p2) {
  if (p1[0] === p2[0]) {
    if (p1[1] === p2[1]) {
      return true;
    } else {
      return false;
    }
  }
  return false;
};

// TODO https://github.com/w8r/martinez/issues/6#issuecomment-262847164
// Precision problem.
//
// module.exports = function equals(p1, p2) {
//   return abs(p1[0] - p2[0]) <= EPSILON && abs(p1[1] - p2[1]) <= EPSILON;
// };

},{}],19:[function(require,module,exports){
'use strict';

var Queue           = require('tinyqueue');
var SweepEvent      = require('./sweep_event');
var compareEvents   = require('./compare_events');
var operations      = require('./operation');

var max = Math.max;
var min = Math.min;

var contourId = 0;


function processPolygon(contourOrHole, isSubject, depth, Q, bbox, isExteriorRing) {
  var i, len, s1, s2, e1, e2;
  for (i = 0, len = contourOrHole.length - 1; i < len; i++) {
    s1 = contourOrHole[i];
    s2 = contourOrHole[i + 1];
    e1 = new SweepEvent(s1, false, undefined, isSubject);
    e2 = new SweepEvent(s2, false, e1,        isSubject);
    e1.otherEvent = e2;

    if (s1[0] === s2[0] && s1[1] === s2[1]) {
      continue; // skip collapsed edges, or it breaks
    }

    e1.contourId = e2.contourId = depth;
    if (!isExteriorRing) {
      e1.isExteriorRing = false;
      e2.isExteriorRing = false;
    }
    if (compareEvents(e1, e2) > 0) {
      e2.left = true;
    } else {
      e1.left = true;
    }

    var x = s1[0], y = s1[1];
    bbox[0] = min(bbox[0], x);
    bbox[1] = min(bbox[1], y);
    bbox[2] = max(bbox[2], x);
    bbox[3] = max(bbox[3], y);

    // Pushing it so the queue is sorted from left to right,
    // with object on the left having the highest priority.
    Q.push(e1);
    Q.push(e2);
  }
}


module.exports = function fillQueue(subject, clipping, sbbox, cbbox, operation) {
  var eventQueue = new Queue(null, compareEvents);
  var polygonSet, isExteriorRing, i, ii, j, jj; //, k, kk;

  for (i = 0, ii = subject.length; i < ii; i++) {
    polygonSet = subject[i];
    for (j = 0, jj = polygonSet.length; j < jj; j++) {
      isExteriorRing = j === 0;
      if (isExteriorRing) contourId++;
      processPolygon(polygonSet[j], true, contourId, eventQueue, sbbox, isExteriorRing);
    }
  }

  for (i = 0, ii = clipping.length; i < ii; i++) {
    polygonSet = clipping[i];
    for (j = 0, jj = polygonSet.length; j < jj; j++) {
      isExteriorRing = j === 0;
      if (operation === operations.DIFFERENCE) isExteriorRing = false;
      if (isExteriorRing) contourId++;
      processPolygon(polygonSet[j], false, contourId, eventQueue, cbbox, isExteriorRing);
    }
  }

  return eventQueue;
};

},{"./compare_events":12,"./operation":21,"./sweep_event":26,"tinyqueue":11}],20:[function(require,module,exports){
'use strict';

var subdivideSegments = require('./subdivide_segments');
var connectEdges      = require('./connect_edges');
var fillQueue         = require('./fill_queue');
var operations        = require('./operation');

var EMPTY = [];


function trivialOperation(subject, clipping, operation) {
  var result = null;
  if (subject.length * clipping.length === 0) {
    if        (operation === operations.INTERSECTION) {
      result = EMPTY;
    } else if (operation === operations.DIFFERENCE) {
      result = subject;
    } else if (operation === operations.UNION ||
               operation === operations.XOR) {
      result = (subject.length === 0) ? clipping : subject;
    }
  }
  return result;
}


function compareBBoxes(subject, clipping, sbbox, cbbox, operation) {
  var result = null;
  if (sbbox[0] > cbbox[2] ||
      cbbox[0] > sbbox[2] ||
      sbbox[1] > cbbox[3] ||
      cbbox[1] > sbbox[3]) {
    if        (operation === operations.INTERSECTION) {
      result = EMPTY;
    } else if (operation === operations.DIFFERENCE) {
      result = subject;
    } else if (operation === operations.UNION ||
               operation === operations.XOR) {
      result = subject.concat(clipping);
    }
  }
  return result;
}


function boolean(subject, clipping, operation) {
  if (typeof subject[0][0][0] === 'number') {
    subject = [subject];
  }
  if (typeof clipping[0][0][0] === 'number') {
    clipping = [clipping];
  }
  var trivial = trivialOperation(subject, clipping, operation);
  if (trivial) {
    return trivial === EMPTY ? null : trivial;
  }
  var sbbox = [Infinity, Infinity, -Infinity, -Infinity];
  var cbbox = [Infinity, Infinity, -Infinity, -Infinity];

  //console.time('fill queue');
  var eventQueue = fillQueue(subject, clipping, sbbox, cbbox, operation);
  //console.timeEnd('fill queue');

  trivial = compareBBoxes(subject, clipping, sbbox, cbbox, operation);
  if (trivial) {
    return trivial === EMPTY ? null : trivial;
  }
  //console.time('subdivide edges');
  var sortedEvents = subdivideSegments(eventQueue, subject, clipping, sbbox, cbbox, operation);
  //console.timeEnd('subdivide edges');

  //console.time('connect vertices');
  var result = connectEdges(sortedEvents, operation);
  //console.timeEnd('connect vertices');
  return result;
}

boolean.union = function (subject, clipping) {
  return boolean(subject, clipping, operations.UNION);
};


boolean.diff = function (subject, clipping) {
  return boolean(subject, clipping, operations.DIFFERENCE);
};


boolean.xor = function (subject, clipping) {
  return boolean(subject, clipping, operations.XOR);
};


boolean.intersection = function (subject, clipping) {
  return boolean(subject, clipping, operations.INTERSECTION);
};


/**
 * @enum {Number}
 */
boolean.operations = operations;


module.exports = boolean;
module.exports.default = boolean;

},{"./connect_edges":15,"./fill_queue":19,"./operation":21,"./subdivide_segments":25}],21:[function(require,module,exports){
'use strict';

module.exports = {
  INTERSECTION: 0,
  UNION:        1,
  DIFFERENCE:   2,
  XOR:          3
};

},{}],22:[function(require,module,exports){
'use strict';

var divideSegment = require('./divide_segment');
var intersection  = require('./segment_intersection');
var equals        = require('./equals');
var compareEvents = require('./compare_events');
var edgeType      = require('./edge_type');

/**
 * @param  {SweepEvent} se1
 * @param  {SweepEvent} se2
 * @param  {Queue}      queue
 * @return {Number}
 */
module.exports = function possibleIntersection(se1, se2, queue) {
  // that disallows self-intersecting polygons,
  // did cost us half a day, so I'll leave it
  // out of respect
  // if (se1.isSubject === se2.isSubject) return;
  var inter = intersection(
    se1.point, se1.otherEvent.point,
    se2.point, se2.otherEvent.point
  );

  var nintersections = inter ? inter.length : 0;
  if (nintersections === 0) return 0; // no intersection

  // the line segments intersect at an endpoint of both line segments
  if ((nintersections === 1) &&
      (equals(se1.point, se2.point) ||
       equals(se1.otherEvent.point, se2.otherEvent.point))) {
    return 0;
  }

  if (nintersections === 2 && se1.isSubject === se2.isSubject) {
    // if(se1.contourId === se2.contourId){
    // console.warn('Edges of the same polygon overlap',
    //   se1.point, se1.otherEvent.point, se2.point, se2.otherEvent.point);
    // }
    //throw new Error('Edges of the same polygon overlap');
    return 0;
  }

  // The line segments associated to se1 and se2 intersect
  if (nintersections === 1) {

    // if the intersection point is not an endpoint of se1
    if (!equals(se1.point, inter[0]) && !equals(se1.otherEvent.point, inter[0])) {
      divideSegment(se1, inter[0], queue);
    }

    // if the intersection point is not an endpoint of se2
    if (!equals(se2.point, inter[0]) && !equals(se2.otherEvent.point, inter[0])) {
      divideSegment(se2, inter[0], queue);
    }
    return 1;
  }

  // The line segments associated to se1 and se2 overlap
  var events        = [];
  var leftCoincide  = false;
  var rightCoincide = false;

  if (equals(se1.point, se2.point)) {
    leftCoincide = true; // linked
  } else if (compareEvents(se1, se2) === 1) {
    events.push(se2, se1);
  } else {
    events.push(se1, se2);
  }

  if (equals(se1.otherEvent.point, se2.otherEvent.point)) {
    rightCoincide = true;
  } else if (compareEvents(se1.otherEvent, se2.otherEvent) === 1) {
    events.push(se2.otherEvent, se1.otherEvent);
  } else {
    events.push(se1.otherEvent, se2.otherEvent);
  }

  if ((leftCoincide && rightCoincide) || leftCoincide) {
    // both line segments are equal or share the left endpoint
    se2.type = edgeType.NON_CONTRIBUTING;
    se1.type = (se2.inOut === se1.inOut) ?
      edgeType.SAME_TRANSITION :
      edgeType.DIFFERENT_TRANSITION;

    if (leftCoincide && !rightCoincide) {
      // honestly no idea, but changing events selection from [2, 1]
      // to [0, 1] fixes the overlapping self-intersecting polygons issue
      divideSegment(events[1].otherEvent, events[0].point, queue);
    }
    return 2;
  }

  // the line segments share the right endpoint
  if (rightCoincide) {
    divideSegment(events[0], events[1].point, queue);
    return 3;
  }

  // no line segment includes totally the other one
  if (events[0] !== events[3].otherEvent) {
    divideSegment(events[0], events[1].point, queue);
    divideSegment(events[1], events[2].point, queue);
    return 3;
  }

  // one line segment includes the other one
  divideSegment(events[0], events[1].point, queue);
  divideSegment(events[3].otherEvent, events[2].point, queue);

  return 3;
};

},{"./compare_events":12,"./divide_segment":16,"./edge_type":17,"./equals":18,"./segment_intersection":23}],23:[function(require,module,exports){
'use strict';

//var EPS = 1e-9;

/**
 * Finds the magnitude of the cross product of two vectors (if we pretend
 * they're in three dimensions)
 *
 * @param {Object} a First vector
 * @param {Object} b Second vector
 * @private
 * @returns {Number} The magnitude of the cross product
 */
function crossProduct(a, b) {
  return (a[0] * b[1]) - (a[1] * b[0]);
}

/**
 * Finds the dot product of two vectors.
 *
 * @param {Object} a First vector
 * @param {Object} b Second vector
 * @private
 * @returns {Number} The dot product
 */
function dotProduct(a, b) {
  return (a[0] * b[0]) + (a[1] * b[1]);
}

/**
 * Finds the intersection (if any) between two line segments a and b, given the
 * line segments' end points a1, a2 and b1, b2.
 *
 * This algorithm is based on Schneider and Eberly.
 * http://www.cimec.org.ar/~ncalvo/Schneider_Eberly.pdf
 * Page 244.
 *
 * @param {Array.<Number>} a1 point of first line
 * @param {Array.<Number>} a2 point of first line
 * @param {Array.<Number>} b1 point of second line
 * @param {Array.<Number>} b2 point of second line
 * @param {Boolean=}       noEndpointTouch whether to skip single touchpoints
 *                                         (meaning connected segments) as
 *                                         intersections
 * @returns {Array.<Array.<Number>>|Null} If the lines intersect, the point of
 * intersection. If they overlap, the two end points of the overlapping segment.
 * Otherwise, null.
 */
module.exports = function (a1, a2, b1, b2, noEndpointTouch) {
  // The algorithm expects our lines in the form P + sd, where P is a point,
  // s is on the interval [0, 1], and d is a vector.
  // We are passed two points. P can be the first point of each pair. The
  // vector, then, could be thought of as the distance (in x and y components)
  // from the first point to the second point.
  // So first, let's make our vectors:
  var va = [a2[0] - a1[0], a2[1] - a1[1]];
  var vb = [b2[0] - b1[0], b2[1] - b1[1]];
  // We also define a function to convert back to regular point form:

  /* eslint-disable arrow-body-style */

  function toPoint(p, s, d) {
    return [
      p[0] + s * d[0],
      p[1] + s * d[1]
    ];
  }

  /* eslint-enable arrow-body-style */

  // The rest is pretty much a straight port of the algorithm.
  var e = [b1[0] - a1[0], b1[1] - a1[1]];
  var kross    = crossProduct(va, vb);
  var sqrKross = kross * kross;
  var sqrLenA  = dotProduct(va, va);
  //var sqrLenB  = dotProduct(vb, vb);

  // Check for line intersection. This works because of the properties of the
  // cross product -- specifically, two vectors are parallel if and only if the
  // cross product is the 0 vector. The full calculation involves relative error
  // to account for possible very small line segments. See Schneider & Eberly
  // for details.
  if (sqrKross > 0/* EPS * sqrLenB * sqLenA */) {
    // If they're not parallel, then (because these are line segments) they
    // still might not actually intersect. This code checks that the
    // intersection point of the lines is actually on both line segments.
    var s = crossProduct(e, vb) / kross;
    if (s < 0 || s > 1) {
      // not on line segment a
      return null;
    }
    var t = crossProduct(e, va) / kross;
    if (t < 0 || t > 1) {
      // not on line segment b
      return null;
    }
    if (s === 0 || s === 1) {
      // on an endpoint of line segment a
      return noEndpointTouch ? null : [toPoint(a1, s, va)];
    }
    if (t === 0 || t === 1) {
      // on an endpoint of line segment b
      return noEndpointTouch ? null : [toPoint(b1, t, vb)];
    }
    return [toPoint(a1, s, va)];
  }

  // If we've reached this point, then the lines are either parallel or the
  // same, but the segments could overlap partially or fully, or not at all.
  // So we need to find the overlap, if any. To do that, we can use e, which is
  // the (vector) difference between the two initial points. If this is parallel
  // with the line itself, then the two lines are the same line, and there will
  // be overlap.
  //var sqrLenE = dotProduct(e, e);
  kross = crossProduct(e, va);
  sqrKross = kross * kross;

  if (sqrKross > 0 /* EPS * sqLenB * sqLenE */) {
  // Lines are just parallel, not the same. No overlap.
    return null;
  }

  var sa = dotProduct(va, e) / sqrLenA;
  var sb = sa + dotProduct(va, vb) / sqrLenA;
  var smin = Math.min(sa, sb);
  var smax = Math.max(sa, sb);

  // this is, essentially, the FindIntersection acting on floats from
  // Schneider & Eberly, just inlined into this function.
  if (smin <= 1 && smax >= 0) {

    // overlap on an end point
    if (smin === 1) {
      return noEndpointTouch ? null : [toPoint(a1, smin > 0 ? smin : 0, va)];
    }

    if (smax === 0) {
      return noEndpointTouch ? null : [toPoint(a1, smax < 1 ? smax : 1, va)];
    }

    if (noEndpointTouch && smin === 0 && smax === 1) return null;

    // There's overlap on a segment -- two points of intersection. Return both.
    return [
      toPoint(a1, smin > 0 ? smin : 0, va),
      toPoint(a1, smax < 1 ? smax : 1, va),
    ];
  }

  return null;
};

},{}],24:[function(require,module,exports){
'use strict';

/**
 * Signed area of the triangle (p0, p1, p2)
 * @param  {Array.<Number>} p0
 * @param  {Array.<Number>} p1
 * @param  {Array.<Number>} p2
 * @return {Number}
 */
module.exports = function signedArea(p0, p1, p2) {
  return (p0[0] - p2[0]) * (p1[1] - p2[1]) - (p1[0] - p2[0]) * (p0[1] - p2[1]);
};

},{}],25:[function(require,module,exports){
'use strict';

var Tree                 = require('splaytree');
var computeFields        = require('./compute_fields');
var possibleIntersection = require('./possible_intersection');
var compareSegments      = require('./compare_segments');
var operations           = require('./operation');


module.exports = function subdivide(eventQueue, subject, clipping, sbbox, cbbox, operation) {
  var sweepLine = new Tree(compareSegments);
  var sortedEvents = [];

  var rightbound = Math.min(sbbox[2], cbbox[2]);

  var prev, next, begin;

  var INTERSECTION = operations.INTERSECTION;
  var DIFFERENCE   = operations.DIFFERENCE;

  while (eventQueue.length !== 0) {
    var event = eventQueue.pop();
    sortedEvents.push(event);

    // optimization by bboxes for intersection and difference goes here
    if ((operation === INTERSECTION && event.point[0] > rightbound) ||
        (operation === DIFFERENCE   && event.point[0] > sbbox[2])) {
      break;
    }

    if (event.left) {
      next  = prev = sweepLine.insert(event);
      begin = sweepLine.minNode();

      if (prev !== begin) prev = sweepLine.prev(prev);
      else                prev = null;

      next = sweepLine.next(next);

      var prevEvent = prev ? prev.key : null;
      var prevprevEvent;
      computeFields(event, prevEvent, operation);
      if (next) {
        if (possibleIntersection(event, next.key, eventQueue) === 2) {
          computeFields(event, prevEvent, operation);
          computeFields(event, next.key, operation);
        }
      }

      if (prev) {
        if (possibleIntersection(prev.key, event, eventQueue) === 2) {
          var prevprev = prev;
          if (prevprev !== begin) prevprev = sweepLine.prev(prevprev);
          else                    prevprev = null;

          prevprevEvent = prevprev ? prevprev.key : null;
          computeFields(prevEvent, prevprevEvent, operation);
          computeFields(event,     prevEvent,     operation);
        }
      }
    } else {
      event = event.otherEvent;
      next = prev = sweepLine.find(event);

      if (prev && next) {

        if (prev !== begin) prev = sweepLine.prev(prev);
        else                prev = null;

        next = sweepLine.next(next);
        sweepLine.remove(event);

        if (next && prev) {
          possibleIntersection(prev.key, next.key, eventQueue);
        }
      }
    }
  }
  return sortedEvents;
};

},{"./compare_segments":13,"./compute_fields":14,"./operation":21,"./possible_intersection":22,"splaytree":6}],26:[function(require,module,exports){
'use strict';

//var signedArea = require('./signed_area');
var EdgeType   = require('./edge_type');

/**
 * Sweepline event
 *
 * @class {SweepEvent}
 * @param {Array.<Number>}  point
 * @param {Boolean}         left
 * @param {SweepEvent=}     otherEvent
 * @param {Boolean}         isSubject
 * @param {Number}          edgeType
 */
function SweepEvent(point, left, otherEvent, isSubject, edgeType) {

  /**
   * Is left endpoint?
   * @type {Boolean}
   */
  this.left = left;

  /**
   * @type {Array.<Number>}
   */
  this.point = point;

  /**
   * Other edge reference
   * @type {SweepEvent}
   */
  this.otherEvent = otherEvent;

  /**
   * Belongs to source or clipping polygon
   * @type {Boolean}
   */
  this.isSubject = isSubject;

  /**
   * Edge contribution type
   * @type {Number}
   */
  this.type = edgeType || EdgeType.NORMAL;


  /**
   * In-out transition for the sweepline crossing polygon
   * @type {Boolean}
   */
  this.inOut = false;


  /**
   * @type {Boolean}
   */
  this.otherInOut = false;

  /**
   * Previous event in result?
   * @type {SweepEvent}
   */
  this.prevInResult = null;

  /**
   * Does event belong to result?
   * @type {Boolean}
   */
  this.inResult = false;


  // connection step

  /**
   * @type {Boolean}
   */
  this.resultInOut = false;

  this.isExteriorRing = true;
}


SweepEvent.prototype = {

  /**
   * @param  {Array.<Number>}  p
   * @return {Boolean}
   */
  isBelow: function (p) {
    var p0 = this.point, p1 = this.otherEvent.point;
    return this.left ?
      (p0[0] - p[0]) * (p1[1] - p[1]) - (p1[0] - p[0]) * (p0[1] - p[1]) > 0 :
      // signedArea(this.point, this.otherEvent.point, p) > 0 :
      (p1[0] - p[0]) * (p0[1] - p[1]) - (p0[0] - p[0]) * (p1[1] - p[1]) > 0;
      //signedArea(this.otherEvent.point, this.point, p) > 0;
  },


  /**
   * @param  {Array.<Number>}  p
   * @return {Boolean}
   */
  isAbove: function (p) {
    return !this.isBelow(p);
  },


  /**
   * @return {Boolean}
   */
  isVertical: function () {
    return this.point[0] === this.otherEvent.point[0];
  },


  clone: function () {
    var copy = new SweepEvent(
      this.point, this.left, this.otherEvent, this.isSubject, this.type);

    copy.inResult       = this.inResult;
    copy.prevInResult   = this.prevInResult;
    copy.isExteriorRing = this.isExteriorRing;
    copy.inOut          = this.inOut;
    copy.otherInOut     = this.otherInOut;

    return copy;
  }
};

module.exports = SweepEvent;

},{"./edge_type":17}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZW1vL2pzL2Jvb2xlYW5vcGNvbnRyb2wuanMiLCJkZW1vL2pzL2Nvb3JkaW5hdGVzLmpzIiwiZGVtby9qcy9pbmRleC5qcyIsImRlbW8vanMvcG9seWdvbmNvbnRyb2wuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWVtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3BsYXl0cmVlL2Rpc3Qvc3BsYXkuanMiLCJub2RlX21vZHVsZXMvc3VwZXJhZ2VudC9saWIvY2xpZW50LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVyYWdlbnQvbGliL2lzLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcmFnZW50L2xpYi9yZXF1ZXN0LWJhc2UuanMiLCJub2RlX21vZHVsZXMvc3VwZXJhZ2VudC9saWIvcmVxdWVzdC5qcyIsIm5vZGVfbW9kdWxlcy90aW55cXVldWUvaW5kZXguanMiLCJzcmMvY29tcGFyZV9ldmVudHMuanMiLCJzcmMvY29tcGFyZV9zZWdtZW50cy5qcyIsInNyYy9jb21wdXRlX2ZpZWxkcy5qcyIsInNyYy9jb25uZWN0X2VkZ2VzLmpzIiwic3JjL2RpdmlkZV9zZWdtZW50LmpzIiwic3JjL2VkZ2VfdHlwZS5qcyIsInNyYy9lcXVhbHMuanMiLCJzcmMvZmlsbF9xdWV1ZS5qcyIsInNyYy9pbmRleC5qcyIsInNyYy9vcGVyYXRpb24uanMiLCJzcmMvcG9zc2libGVfaW50ZXJzZWN0aW9uLmpzIiwic3JjL3NlZ21lbnRfaW50ZXJzZWN0aW9uLmpzIiwic3JjL3NpZ25lZF9hcmVhLmpzIiwic3JjL3N1YmRpdmlkZV9zZWdtZW50cy5qcyIsInNyYy9zd2VlcF9ldmVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbm9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2g5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIkwuQm9vbGVhbkNvbnRyb2wgPSBMLkNvbnRyb2wuZXh0ZW5kKHtcbiAgb3B0aW9uczoge1xuICAgIHBvc2l0aW9uOiAndG9wcmlnaHQnXG4gIH0sXG5cbiAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgIHZhciBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbGVhZmxldC1iYXInKTtcbiAgICB0aGlzLl9jb250YWluZXIuc3R5bGUuYmFja2dyb3VuZCA9ICcjZmZmZmZmJztcbiAgICB0aGlzLl9jb250YWluZXIuc3R5bGUucGFkZGluZyA9ICcxMHB4JztcbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gW1xuICAgICAgJzxmb3JtPicsXG4gICAgICAgICc8dWwgc3R5bGU9XCJsaXN0LXN0eWxlOm5vbmU7IHBhZGRpbmctbGVmdDogMFwiPicsXG4gICAgICAgICAgJzxsaT4nLCc8bGFiZWw+JywgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwib3BcIiB2YWx1ZT1cIjBcIiBjaGVja2VkIC8+JywgICcgSW50ZXJzZWN0aW9uJywgJzwvbGFiZWw+JywgJzwvbGk+JyxcbiAgICAgICAgICAnPGxpPicsJzxsYWJlbD4nLCAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJvcFwiIHZhbHVlPVwiMVwiIC8+JywgICcgVW5pb24nLCAnPC9sYWJlbD4nLCAnPC9saT4nLFxuICAgICAgICAgICc8bGk+JywnPGxhYmVsPicsICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIm9wXCIgdmFsdWU9XCIyXCIgLz4nLCAgJyBEaWZmZXJlbmNlIEEgLSBCJywgJzwvbGFiZWw+JywgJzwvbGk+JyxcbiAgICAgICAgICAnPGxpPicsJzxsYWJlbD4nLCAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJvcFwiIHZhbHVlPVwiNVwiIC8+JywgICcgRGlmZmVyZW5jZSBCIC0gQScsICc8L2xhYmVsPicsICc8L2xpPicsXG4gICAgICAgICAgJzxsaT4nLCc8bGFiZWw+JywgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwib3BcIiB2YWx1ZT1cIjNcIiAvPicsICAnIFhvcicsICc8L2xhYmVsPicsICc8L2xpPicsXG4gICAgICAgICc8L3VsPicsXG4gICAgICAgICc8aW5wdXQgdHlwZT1cInN1Ym1pdFwiIHZhbHVlPVwiUnVuXCI+JywgJzxpbnB1dCBuYW1lPVwiY2xlYXJcIiB0eXBlPVwiYnV0dG9uXCIgdmFsdWU9XCJDbGVhciBsYXllcnNcIj4nLFxuICAgICAgJzwvZm9ybT4nXS5qb2luKCcnKTtcbiAgICB2YXIgZm9ybSA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XG4gICAgTC5Eb21FdmVudFxuICAgICAgLm9uKGZvcm0sICdzdWJtaXQnLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIEwuRG9tRXZlbnQuc3RvcChldnQpO1xuICAgICAgICB2YXIgcmFkaW9zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoXG4gICAgICAgICAgZm9ybS5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dFt0eXBlPXJhZGlvXScpKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHJhZGlvcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIGlmIChyYWRpb3NbaV0uY2hlY2tlZCkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmNhbGxiYWNrKHBhcnNlSW50KHJhZGlvc1tpXS52YWx1ZSkpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LCB0aGlzKVxuICAgICAgLm9uKGZvcm1bJ2NsZWFyJ10sICdjbGljaycsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICBMLkRvbUV2ZW50LnN0b3AoZXZ0KTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNsZWFyKCk7XG4gICAgICB9LCB0aGlzKTtcblxuICAgIEwuRG9tRXZlbnRcbiAgICAgIC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbih0aGlzLl9jb250YWluZXIpXG4gICAgICAuZGlzYWJsZVNjcm9sbFByb3BhZ2F0aW9uKHRoaXMuX2NvbnRhaW5lcik7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lcjtcbiAgfVxuXG59KTtcbiIsIkwuQ29vcmRpbmF0ZXMgPSBMLkNvbnRyb2wuZXh0ZW5kKHtcbiAgb3B0aW9uczoge1xuICAgIHBvc2l0aW9uOiAnYm90dG9tcmlnaHQnXG4gIH0sXG5cbiAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgIHRoaXMuX2NvbnRhaW5lciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LWJhcicpO1xuICAgIHRoaXMuX2NvbnRhaW5lci5zdHlsZS5iYWNrZ3JvdW5kID0gJyNmZmZmZmYnO1xuICAgIG1hcC5vbignbW91c2Vtb3ZlJywgdGhpcy5fb25Nb3VzZU1vdmUsIHRoaXMpO1xuICAgIHJldHVybiB0aGlzLl9jb250YWluZXI7XG4gIH0sXG5cbiAgX29uTW91c2VNb3ZlOiBmdW5jdGlvbihlKSB7XG4gICAgdGhpcy5fY29udGFpbmVyLmlubmVySFRNTCA9ICc8c3BhbiBzdHlsZT1cInBhZGRpbmc6IDVweFwiPicgK1xuICAgICAgZS5sYXRsbmcubG5nLnRvRml4ZWQoMykgKyAnLCAnICsgZS5sYXRsbmcubGF0LnRvRml4ZWQoMykgKyAnPC9zcGFuPic7XG4gIH1cblxufSk7IiwicmVxdWlyZSgnLi9jb29yZGluYXRlcycpO1xucmVxdWlyZSgnLi9wb2x5Z29uY29udHJvbCcpO1xucmVxdWlyZSgnLi9ib29sZWFub3Bjb250cm9sJyk7XG52YXIgbWFydGluZXogPSB3aW5kb3cubWFydGluZXogPSByZXF1aXJlKCcuLi8uLi9zcmMvaW5kZXgnKTtcbi8vdmFyIG1hcnRpbmV6ID0gcmVxdWlyZSgnLi4vLi4vZGlzdC9tYXJ0aW5lei5taW4nKTtcbnZhciB4aHIgID0gcmVxdWlyZSgnc3VwZXJhZ2VudCcpO1xudmFyIG1vZGUgPSB3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoMSk7XG52YXIgcGF0aCA9ICcuLi90ZXN0L2ZpeHR1cmVzLyc7XG52YXIgZXh0ICA9ICcuZ2VvanNvbic7XG52YXIgZmlsZTtcblxudmFyIGZpbGVzID0gW1xuICAnYXNpYScsICd0cmFwZXpvaWQtYm94JywgJ2NhbmFkYScsICdob3JzZXNob2UnLCAnaG91cmdsYXNzZXMnLCAnb3ZlcmxhcF95JyxcbiAgJ3BvbHlnb25fdHJhcGV6b2lkX2VkZ2Vfb3ZlcmxhcCcsICd0b3VjaGluZ19ib3hlcycsICd0d29fcG9pbnRlZF90cmlhbmdsZXMnLFxuICAnaG9sZV9jdXQnLCAnb3ZlcmxhcHBpbmdfc2VnbWVudHMnLCAnb3ZlcmxhcF9sb29wJywgJ2Rpc2pvaW50X2JveGVzJ1xuXTtcblxuc3dpdGNoIChtb2RlKSB7XG4gIGNhc2UgJ2dlbyc6XG4gICAgZmlsZSA9ICdhc2lhLmdlb2pzb24nO1xuICAgIGJyZWFrO1xuICBjYXNlICdzdGF0ZXMnOlxuICAgIGZpbGUgPSAnc3RhdGVzX3NvdXJjZS5nZW9qc29uJztcbiAgICBicmVhaztcbiAgY2FzZSAndHJhcGV6b2lkJzpcbiAgICBmaWxlID0gJ3RyYXBlem9pZC1ib3guZ2VvanNvbic7XG4gICAgYnJlYWs7XG4gIGNhc2UgJ2NhbmFkYSc6XG4gICAgZmlsZSA9ICdjYW5hZGEuZ2VvanNvbic7XG4gICAgYnJlYWs7XG4gIGNhc2UgJ2hvcnNlc2hvZSc6XG4gICAgZmlsZSA9ICdob3JzZXNob2UuZ2VvanNvbic7XG4gICAgYnJlYWs7XG4gIGNhc2UgJ2hvdXJnbGFzc2VzJzpcbiAgICBmaWxlID0gJ2hvdXJnbGFzc2VzLmdlb2pzb24nO1xuICAgIGJyZWFrO1xuICBjYXNlICdlZGdlX292ZXJsYXAnOlxuICAgIGZpbGUgPSAncG9seWdvbl90cmFwZXpvaWRfZWRnZV9vdmVybGFwLmdlb2pzb24nO1xuICAgIGJyZWFrO1xuICBjYXNlICd0b3VjaGluZ19ib3hlcyc6XG4gICAgZmlsZSA9ICd0b3VjaGluZ19ib3hlcy5nZW9qc29uJztcbiAgICBicmVhaztcbiAgY2FzZSAndHJpYW5nbGVzJzpcbiAgICBmaWxlID0gJ3R3b19wb2ludGVkX3RyaWFuZ2xlcy5nZW9qc29uJztcbiAgICBicmVhaztcbiAgY2FzZSAnaG9sZWN1dCc6XG4gICAgZmlsZSA9ICdob2xlX2N1dC5nZW9qc29uJztcbiAgICBicmVhaztcbiAgY2FzZSAnb3ZlcmxhcHBpbmdfc2VnbWVudHMnOlxuICAgIGZpbGUgPSAnb3ZlcmxhcHBpbmdfc2VnbWVudHMuZ2VvanNvbic7XG4gICAgYnJlYWs7XG4gIGNhc2UgJ292ZXJsYXBfbG9vcCc6XG4gICAgZmlsZSA9ICdvdmVybGFwX2xvb3AuZ2VvanNvbic7XG4gICAgYnJlYWs7XG4gIGNhc2UgJ292ZXJsYXBfeSc6XG4gICAgZmlsZSA9ICdvdmVybGFwX3kuZ2VvanNvbic7XG4gICAgYnJlYWs7XG4gIGNhc2UgJ292ZXJsYXBfdHdvJzpcbiAgICBmaWxlID0gJ292ZXJsYXBfdHdvLmdlb2pzb24nO1xuICAgIGJyZWFrO1xuICBjYXNlICdkaXNqb2ludF9ib3hlcyc6XG4gICAgZmlsZSA9ICdkaXNqb2ludF9ib3hlcy5nZW9qc29uJztcbiAgICBicmVhaztcbiAgY2FzZSAncG9seWdvbnNfZWRnZV9vdmVybGFwJzpcbiAgICBmaWxlID0gJ3BvbHlnb25zX2VkZ2Vfb3ZlcmxhcC5nZW9qc29uJztcbiAgICBicmVhaztcbiAgY2FzZSAndmVydGljYWxfYm94ZXMnOlxuICAgIGZpbGUgPSAndmVydGljYWxfYm94ZXMuZ2VvanNvbic7XG4gICAgYnJlYWs7XG4gIGNhc2UgJ2NvbGxhcHNlZCc6XG4gICAgZmlsZSA9ICdjb2xsYXBzZWQuZ2VvanNvbic7XG4gICAgYnJlYWs7XG4gIGNhc2UgJ2ZhdGFsMSc6XG4gICAgZmlsZSA9ICdmYXRhbDEuZ2VvanNvbic7XG4gICAgYnJlYWs7XG4gIGNhc2UgJ2ZhdGFsMic6XG4gICAgZmlsZSA9ICdmYXRhbDIuZ2VvanNvbic7XG4gICAgYnJlYWs7XG4gIGRlZmF1bHQ6XG4gICAgZmlsZSA9ICdob2xlX2hvbGUuZ2VvanNvbic7XG4gICAgYnJlYWs7XG59XG5cbmNvbnNvbGUubG9nKG1vZGUpO1xuXG5cbnZhciBPUEVSQVRJT05TID0ge1xuICBJTlRFUlNFQ1RJT046IDAsXG4gIFVOSU9OOiAgICAgICAgMSxcbiAgRElGRkVSRU5DRTogICAyLFxuICBYT1I6ICAgICAgICAgIDNcbn07XG5cbnZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbmRpdi5pZCA9ICdpbWFnZS1tYXAnO1xuZGl2LnN0eWxlLndpZHRoID0gZGl2LnN0eWxlLmhlaWdodCA9ICcxMDAlJztcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZGl2KTtcblxuLy8gY3JlYXRlIHRoZSBzbGlwcHkgbWFwXG52YXIgbWFwID0gd2luZG93Lm1hcCA9IEwubWFwKCdpbWFnZS1tYXAnLCB7XG4gIG1pblpvb206IDEsXG4gIG1heFpvb206IDIwLFxuICBjZW50ZXI6IFswLCAwXSxcbiAgem9vbTogMixcbiAgY3JzOiBtb2RlID09PSAnZ2VvJyA/IEwuQ1JTLkVQU0c0MzI2IDogTC5leHRlbmQoe30sIEwuQ1JTLlNpbXBsZSwge1xuICAgIHRyYW5zZm9ybWF0aW9uOiBuZXcgTC5UcmFuc2Zvcm1hdGlvbigxLzgsIDAsIC0xLzgsIDApXG4gIH0pLFxuICBlZGl0YWJsZTogdHJ1ZVxufSk7XG5cbm1hcC5hZGRDb250cm9sKG5ldyBMLk5ld1BvbHlnb25Db250cm9sKHtcbiAgY2FsbGJhY2s6IG1hcC5lZGl0VG9vbHMuc3RhcnRQb2x5Z29uXG59KSk7XG5tYXAuYWRkQ29udHJvbChuZXcgTC5Db29yZGluYXRlcygpKTtcbm1hcC5hZGRDb250cm9sKG5ldyBMLkJvb2xlYW5Db250cm9sKHtcbiAgY2FsbGJhY2s6IHJ1bixcbiAgY2xlYXI6IGNsZWFyXG59KSk7XG5cbnZhciBkcmF3bkl0ZW1zID0gd2luZG93LmRyYXduSXRlbXMgPSBMLmdlb0pzb24oKS5hZGRUbyhtYXApO1xuXG5mdW5jdGlvbiBsb2FkRGF0YShwYXRoKSB7XG4gIGNvbnNvbGUubG9nKHBhdGgpO1xuICB4aHJcbiAgICAuZ2V0KHBhdGgpXG4gICAgLmFjY2VwdCgnanNvbicpXG4gICAgLmVuZChmdW5jdGlvbihlLCByKSB7XG4gICAgICBpZiAoIWUpIHtcbiAgICAgICAgZHJhd25JdGVtcy5hZGREYXRhKEpTT04ucGFyc2Uoci50ZXh0KSk7XG4gICAgICAgIG1hcC5maXRCb3VuZHMoZHJhd25JdGVtcy5nZXRCb3VuZHMoKS5wYWQoMC4wNSksIHsgYW5pbWF0ZTogZmFsc2UgfSk7XG4gICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNsZWFyKCkge1xuICBkcmF3bkl0ZW1zLmNsZWFyTGF5ZXJzKCk7XG4gIHJlc3VsdHMuY2xlYXJMYXllcnMoKTtcbn1cblxudmFyIHJlYWRlciA9IG5ldyBqc3RzLmlvLkdlb0pTT05SZWFkZXIoKTtcbnZhciB3cml0ZXIgPSBuZXcganN0cy5pby5HZW9KU09OV3JpdGVyKCk7XG5cbmZ1bmN0aW9uIHJ1biAob3ApIHtcbiAgdmFyIGxheWVycyA9IGRyYXduSXRlbXMuZ2V0TGF5ZXJzKCk7XG4gIGlmIChsYXllcnMubGVuZ3RoIDwgMikgcmV0dXJuO1xuICB2YXIgc3ViamVjdCA9IGxheWVyc1swXS50b0dlb0pTT04oKTtcbiAgdmFyIGNsaXBwaW5nID0gbGF5ZXJzWzFdLnRvR2VvSlNPTigpO1xuXG4gIC8vY29uc29sZS5sb2coJ2lucHV0Jywgc3ViamVjdCwgY2xpcHBpbmcsIG9wKTtcblxuICBzdWJqZWN0ICA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc3ViamVjdCkpO1xuICBjbGlwcGluZyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoY2xpcHBpbmcpKTtcblxuICB2YXIgb3BlcmF0aW9uO1xuICBpZiAob3AgPT09IE9QRVJBVElPTlMuSU5URVJTRUNUSU9OKSB7XG4gICAgb3BlcmF0aW9uID0gbWFydGluZXouaW50ZXJzZWN0aW9uO1xuICB9IGVsc2UgaWYgKG9wID09PSBPUEVSQVRJT05TLlVOSU9OKSB7XG4gICAgb3BlcmF0aW9uID0gbWFydGluZXoudW5pb247XG4gIH0gZWxzZSBpZiAob3AgPT09IE9QRVJBVElPTlMuRElGRkVSRU5DRSkge1xuICAgIG9wZXJhdGlvbiA9IG1hcnRpbmV6LmRpZmY7XG4gIH0gZWxzZSBpZiAob3AgPT09IDUpIHsgLy8gQiAtIEFcbiAgICBvcGVyYXRpb24gPSBtYXJ0aW5lei5kaWZmO1xuXG4gICAgdmFyIHRlbXAgPSBzdWJqZWN0O1xuICAgIHN1YmplY3QgID0gY2xpcHBpbmc7XG4gICAgY2xpcHBpbmcgPSB0ZW1wO1xuICB9IGVsc2Uge1xuICAgIG9wZXJhdGlvbiA9IG1hcnRpbmV6LnhvcjtcbiAgfVxuXG4gIGNvbnNvbGUudGltZSgnbWFydGluZXonKTtcbiAgdmFyIHJlc3VsdCA9IG9wZXJhdGlvbihzdWJqZWN0Lmdlb21ldHJ5LmNvb3JkaW5hdGVzLCBjbGlwcGluZy5nZW9tZXRyeS5jb29yZGluYXRlcyk7XG4gIGNvbnNvbGUudGltZUVuZCgnbWFydGluZXonKTtcblxuICAvL2lmIChvcCA9PT0gT1BFUkFUSU9OUy5VTklPTikgcmVzdWx0ID0gcmVzdWx0WzBdO1xuICBjb25zb2xlLmxvZygncmVzdWx0JywgcmVzdWx0KTtcbiAgLy8gY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0KSlcbiAgcmVzdWx0cy5jbGVhckxheWVycygpO1xuXG4gIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICByZXN1bHRzLmFkZERhdGEoe1xuICAgICAgJ3R5cGUnOiAnRmVhdHVyZScsXG4gICAgICAnZ2VvbWV0cnknOiB7XG4gICAgICAgICd0eXBlJzogJ011bHRpUG9seWdvbicsXG4gICAgICAgICdjb29yZGluYXRlcyc6IHJlc3VsdFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUudGltZSgnanN0cycpO1xuICAgICAgdmFyIHMgPSByZWFkZXIucmVhZChzdWJqZWN0KTtcbiAgICAgIHZhciBjID0gcmVhZGVyLnJlYWQoY2xpcHBpbmcpO1xuICAgICAgdmFyIHJlcztcbiAgICAgIGlmIChvcCA9PT0gT1BFUkFUSU9OUy5JTlRFUlNFQ1RJT04pIHtcbiAgICAgICAgcmVzID0gcy5nZW9tZXRyeS5pbnRlcnNlY3Rpb24oYy5nZW9tZXRyeSk7XG4gICAgICB9IGVsc2UgaWYgKG9wID09PSBPUEVSQVRJT05TLlVOSU9OKSB7XG4gICAgICAgIHJlcyA9IHMuZ2VvbWV0cnkudW5pb24oYy5nZW9tZXRyeSk7XG4gICAgICB9IGVsc2UgaWYgKG9wID09PSBPUEVSQVRJT05TLkRJRkZFUkVOQ0UpIHtcbiAgICAgICAgcmVzID0gcy5nZW9tZXRyeS5kaWZmZXJlbmNlKGMuZ2VvbWV0cnkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzID0gcy5nZW9tZXRyeS5zeW1EaWZmZXJlbmNlKGMuZ2VvbWV0cnkpO1xuICAgICAgfVxuICAgICAgcmVzID0gd3JpdGVyLndyaXRlKHJlcyk7XG4gICAgICBjb25zb2xlLnRpbWVFbmQoJ2pzdHMnKTtcbiAgICAgIGNvbnNvbGUubG9nKHJlcyk7XG4gICAgfSwgNTAwKTtcbiAgfVxufVxuXG4vL2RyYXduSXRlbXMuYWRkRGF0YShvbmVJbnNpZGUpO1xuLy9kcmF3bkl0ZW1zLmFkZERhdGEodHdvUG9pbnRlZFRyaWFuZ2xlcyk7XG4vL2RyYXduSXRlbXMuYWRkRGF0YShzZWxmSW50ZXJzZWN0aW5nKTtcbi8vZHJhd25JdGVtcy5hZGREYXRhKGhvbGVzKTtcbi8vZHJhd25JdGVtcy5hZGREYXRhKGRhdGEpO1xuXG5tYXAub24oJ2VkaXRhYmxlOmNyZWF0ZWQnLCBmdW5jdGlvbihldnQpIHtcbiAgZHJhd25JdGVtcy5hZGRMYXllcihldnQubGF5ZXIpO1xuICBldnQubGF5ZXIub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgIGlmICgoZS5vcmlnaW5hbEV2ZW50LmN0cmxLZXkgfHwgZS5vcmlnaW5hbEV2ZW50Lm1ldGFLZXkpICYmIHRoaXMuZWRpdEVuYWJsZWQoKSkge1xuICAgICAgdGhpcy5lZGl0b3IubmV3SG9sZShlLmxhdGxuZyk7XG4gICAgfVxuICB9KTtcbn0pO1xuXG52YXIgcmVzdWx0cyA9IHdpbmRvdy5yZXN1bHRzID0gTC5nZW9Kc29uKG51bGwsIHtcbiAgc3R5bGU6IGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29sb3I6ICdyZWQnLFxuICAgICAgd2VpZ2h0OiAxXG4gICAgfTtcbiAgfVxufSkuYWRkVG8obWFwKTtcblxubG9hZERhdGEocGF0aCArIGZpbGUpO1xuIiwiTC5FZGl0Q29udHJvbCA9IEwuQ29udHJvbC5leHRlbmQoe1xuXG4gIG9wdGlvbnM6IHtcbiAgICBwb3NpdGlvbjogJ3RvcGxlZnQnLFxuICAgIGNhbGxiYWNrOiBudWxsLFxuICAgIGtpbmQ6ICcnLFxuICAgIGh0bWw6ICcnXG4gIH0sXG5cbiAgb25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcbiAgICB2YXIgY29udGFpbmVyID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgJ2xlYWZsZXQtY29udHJvbCBsZWFmbGV0LWJhcicpLFxuICAgICAgICBsaW5rID0gTC5Eb21VdGlsLmNyZWF0ZSgnYScsICcnLCBjb250YWluZXIpO1xuXG4gICAgbGluay5ocmVmID0gJyMnO1xuICAgIGxpbmsudGl0bGUgPSAnQ3JlYXRlIGEgbmV3ICcgKyB0aGlzLm9wdGlvbnMua2luZDtcbiAgICBsaW5rLmlubmVySFRNTCA9IHRoaXMub3B0aW9ucy5odG1sO1xuICAgIEwuRG9tRXZlbnQub24obGluaywgJ2NsaWNrJywgTC5Eb21FdmVudC5zdG9wKVxuICAgICAgICAgICAgICAub24obGluaywgJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5MQVlFUiA9IHRoaXMub3B0aW9ucy5jYWxsYmFjay5jYWxsKG1hcC5lZGl0VG9vbHMpO1xuICAgICAgICAgICAgICB9LCB0aGlzKTtcblxuICAgIHJldHVybiBjb250YWluZXI7XG4gIH1cblxufSk7XG5cbkwuTmV3UG9seWdvbkNvbnRyb2wgPSBMLkVkaXRDb250cm9sLmV4dGVuZCh7XG4gIG9wdGlvbnM6IHtcbiAgICBwb3NpdGlvbjogJ3RvcGxlZnQnLFxuICAgIGtpbmQ6ICdwb2x5Z29uJyxcbiAgICBodG1sOiAn4pawJ1xuICB9XG59KTsiLCJcclxuLyoqXHJcbiAqIEV4cG9zZSBgRW1pdHRlcmAuXHJcbiAqL1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyO1xyXG59XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBhIG5ldyBgRW1pdHRlcmAuXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gRW1pdHRlcihvYmopIHtcclxuICBpZiAob2JqKSByZXR1cm4gbWl4aW4ob2JqKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNaXhpbiB0aGUgZW1pdHRlciBwcm9wZXJ0aWVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXHJcbiAqIEByZXR1cm4ge09iamVjdH1cclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gbWl4aW4ob2JqKSB7XHJcbiAgZm9yICh2YXIga2V5IGluIEVtaXR0ZXIucHJvdG90eXBlKSB7XHJcbiAgICBvYmpba2V5XSA9IEVtaXR0ZXIucHJvdG90eXBlW2tleV07XHJcbiAgfVxyXG4gIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBMaXN0ZW4gb24gdGhlIGdpdmVuIGBldmVudGAgd2l0aCBgZm5gLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cclxuICogQHJldHVybiB7RW1pdHRlcn1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5FbWl0dGVyLnByb3RvdHlwZS5vbiA9XHJcbkVtaXR0ZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCwgZm4pe1xyXG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcclxuICAodGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XSA9IHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF0gfHwgW10pXHJcbiAgICAucHVzaChmbik7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbiBgZXZlbnRgIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIGEgc2luZ2xlXHJcbiAqIHRpbWUgdGhlbiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxyXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbkVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgZm4pe1xyXG4gIGZ1bmN0aW9uIG9uKCkge1xyXG4gICAgdGhpcy5vZmYoZXZlbnQsIG9uKTtcclxuICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgfVxyXG5cclxuICBvbi5mbiA9IGZuO1xyXG4gIHRoaXMub24oZXZlbnQsIG9uKTtcclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmUgdGhlIGdpdmVuIGNhbGxiYWNrIGZvciBgZXZlbnRgIG9yIGFsbFxyXG4gKiByZWdpc3RlcmVkIGNhbGxiYWNrcy5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXHJcbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuRW1pdHRlci5wcm90b3R5cGUub2ZmID1cclxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPVxyXG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxyXG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcclxuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XHJcblxyXG4gIC8vIGFsbFxyXG4gIGlmICgwID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgIHRoaXMuX2NhbGxiYWNrcyA9IHt9O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvLyBzcGVjaWZpYyBldmVudFxyXG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xyXG4gIGlmICghY2FsbGJhY2tzKSByZXR1cm4gdGhpcztcclxuXHJcbiAgLy8gcmVtb3ZlIGFsbCBoYW5kbGVyc1xyXG4gIGlmICgxID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvLyByZW1vdmUgc3BlY2lmaWMgaGFuZGxlclxyXG4gIHZhciBjYjtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xyXG4gICAgY2IgPSBjYWxsYmFja3NbaV07XHJcbiAgICBpZiAoY2IgPT09IGZuIHx8IGNiLmZuID09PSBmbikge1xyXG4gICAgICBjYWxsYmFja3Muc3BsaWNlKGksIDEpO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogRW1pdCBgZXZlbnRgIHdpdGggdGhlIGdpdmVuIGFyZ3MuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxyXG4gKiBAcGFyYW0ge01peGVkfSAuLi5cclxuICogQHJldHVybiB7RW1pdHRlcn1cclxuICovXHJcblxyXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcclxuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxyXG4gICAgLCBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xyXG5cclxuICBpZiAoY2FsbGJhY2tzKSB7XHJcbiAgICBjYWxsYmFja3MgPSBjYWxsYmFja3Muc2xpY2UoMCk7XHJcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gY2FsbGJhY2tzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XHJcbiAgICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybiBhcnJheSBvZiBjYWxsYmFja3MgZm9yIGBldmVudGAuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxyXG4gKiBAcmV0dXJuIHtBcnJheX1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5FbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XHJcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xyXG4gIHJldHVybiB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdIHx8IFtdO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrIGlmIHRoaXMgZW1pdHRlciBoYXMgYGV2ZW50YCBoYW5kbGVycy5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuRW1pdHRlci5wcm90b3R5cGUuaGFzTGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gIHJldHVybiAhISB0aGlzLmxpc3RlbmVycyhldmVudCkubGVuZ3RoO1xyXG59O1xyXG4iLCIvKipcbiAqIHNwbGF5dHJlZSB2MC4xLjRcbiAqIEZhc3QgU3BsYXkgdHJlZSBmb3IgTm9kZSBhbmQgYnJvd3NlclxuICpcbiAqIEBhdXRob3IgQWxleGFuZGVyIE1pbGV2c2tpIDxpbmZvQHc4ci5uYW1lPlxuICogQGxpY2Vuc2UgTUlUXG4gKiBAcHJlc2VydmVcbiAqL1xuXG4oZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuXHR0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKSA6XG5cdHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShmYWN0b3J5KSA6XG5cdChnbG9iYWwuU3BsYXlUcmVlID0gZmFjdG9yeSgpKTtcbn0odGhpcywgKGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBERUZBVUxUX0NPTVBBUkUgKGEsIGIpIHsgcmV0dXJuIGEgPiBiID8gMSA6IGEgPCBiID8gLTEgOiAwOyB9XG5cbnZhciBTcGxheVRyZWUgPSBmdW5jdGlvbiBTcGxheVRyZWUoY29tcGFyZSwgbm9EdXBsaWNhdGVzKSB7XG4gIGlmICggY29tcGFyZSA9PT0gdm9pZCAwICkgY29tcGFyZSA9IERFRkFVTFRfQ09NUEFSRTtcbiAgaWYgKCBub0R1cGxpY2F0ZXMgPT09IHZvaWQgMCApIG5vRHVwbGljYXRlcyA9IGZhbHNlO1xuXG4gIHRoaXMuX2NvbXBhcmUgPSBjb21wYXJlO1xuICB0aGlzLl9yb290ID0gbnVsbDtcbiAgdGhpcy5fc2l6ZSA9IDA7XG4gIHRoaXMuX25vRHVwbGljYXRlcyA9ICEhbm9EdXBsaWNhdGVzO1xufTtcblxudmFyIHByb3RvdHlwZUFjY2Vzc29ycyA9IHsgc2l6ZToge30gfTtcblxuXG5TcGxheVRyZWUucHJvdG90eXBlLnJvdGF0ZUxlZnQgPSBmdW5jdGlvbiByb3RhdGVMZWZ0ICh4KSB7XG4gIHZhciB5ID0geC5yaWdodDtcbiAgaWYgKHkpIHtcbiAgICB4LnJpZ2h0ID0geS5sZWZ0O1xuICAgIGlmICh5LmxlZnQpIHsgeS5sZWZ0LnBhcmVudCA9IHg7IH1cbiAgICB5LnBhcmVudCA9IHgucGFyZW50O1xuICB9XG5cbiAgaWYgKCF4LnBhcmVudCkgICAgICAgICAgICAgIHsgdGhpcy5fcm9vdCA9IHk7IH1cbiAgZWxzZSBpZiAoeCA9PT0geC5wYXJlbnQubGVmdCkgeyB4LnBhcmVudC5sZWZ0ID0geTsgfVxuICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgeyB4LnBhcmVudC5yaWdodCA9IHk7IH1cbiAgaWYgKHkpIHsgeS5sZWZ0ID0geDsgfVxuICB4LnBhcmVudCA9IHk7XG59O1xuXG5cblNwbGF5VHJlZS5wcm90b3R5cGUucm90YXRlUmlnaHQgPSBmdW5jdGlvbiByb3RhdGVSaWdodCAoeCkge1xuICB2YXIgeSA9IHgubGVmdDtcbiAgaWYgKHkpIHtcbiAgICB4LmxlZnQgPSB5LnJpZ2h0O1xuICAgIGlmICh5LnJpZ2h0KSB7IHkucmlnaHQucGFyZW50ID0geDsgfVxuICAgIHkucGFyZW50ID0geC5wYXJlbnQ7XG4gIH1cblxuICBpZiAoIXgucGFyZW50KSAgICAgICAgICAgICB7IHRoaXMuX3Jvb3QgPSB5OyB9XG4gIGVsc2UgaWYoeCA9PT0geC5wYXJlbnQubGVmdCkgeyB4LnBhcmVudC5sZWZ0ID0geTsgfVxuICBlbHNlICAgICAgICAgICAgICAgICAgICAgICB7IHgucGFyZW50LnJpZ2h0ID0geTsgfVxuICBpZiAoeSkgeyB5LnJpZ2h0ID0geDsgfVxuICB4LnBhcmVudCA9IHk7XG59O1xuXG5cblNwbGF5VHJlZS5wcm90b3R5cGUuX3NwbGF5ID0gZnVuY3Rpb24gX3NwbGF5ICh4KSB7XG4gICAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgd2hpbGUgKHgucGFyZW50KSB7XG4gICAgdmFyIHAgPSB4LnBhcmVudDtcbiAgICBpZiAoIXAucGFyZW50KSB7XG4gICAgICBpZiAocC5sZWZ0ID09PSB4KSB7IHRoaXMkMS5yb3RhdGVSaWdodChwKTsgfVxuICAgICAgZWxzZSAgICAgICAgICAgIHsgdGhpcyQxLnJvdGF0ZUxlZnQocCk7IH1cbiAgICB9IGVsc2UgaWYgKHAubGVmdCA9PT0geCAmJiBwLnBhcmVudC5sZWZ0ID09PSBwKSB7XG4gICAgICB0aGlzJDEucm90YXRlUmlnaHQocC5wYXJlbnQpO1xuICAgICAgdGhpcyQxLnJvdGF0ZVJpZ2h0KHApO1xuICAgIH0gZWxzZSBpZiAocC5yaWdodCA9PT0geCAmJiBwLnBhcmVudC5yaWdodCA9PT0gcCkge1xuICAgICAgdGhpcyQxLnJvdGF0ZUxlZnQocC5wYXJlbnQpO1xuICAgICAgdGhpcyQxLnJvdGF0ZUxlZnQocCk7XG4gICAgfSBlbHNlIGlmIChwLmxlZnQgPT09IHggJiYgcC5wYXJlbnQucmlnaHQgPT09IHApIHtcbiAgICAgIHRoaXMkMS5yb3RhdGVSaWdodChwKTtcbiAgICAgIHRoaXMkMS5yb3RhdGVMZWZ0KHApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzJDEucm90YXRlTGVmdChwKTtcbiAgICAgIHRoaXMkMS5yb3RhdGVSaWdodChwKTtcbiAgICB9XG4gIH1cbn07XG5cblxuU3BsYXlUcmVlLnByb3RvdHlwZS5zcGxheSA9IGZ1bmN0aW9uIHNwbGF5ICh4KSB7XG4gICAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgdmFyIHAsIGdwLCBnZ3AsIGwsIHI7XG5cbiAgd2hpbGUgKHgucGFyZW50KSB7XG4gICAgcCA9IHgucGFyZW50O1xuICAgIGdwID0gcC5wYXJlbnQ7XG5cbiAgICBpZiAoZ3AgJiYgZ3AucGFyZW50KSB7XG4gICAgICBnZ3AgPSBncC5wYXJlbnQ7XG4gICAgICBpZiAoZ2dwLmxlZnQgPT09IGdwKSB7IGdncC5sZWZ0PSB4OyB9XG4gICAgICBlbHNlICAgICAgICAgICAgICAgeyBnZ3AucmlnaHQgPSB4OyB9XG4gICAgICB4LnBhcmVudCA9IGdncDtcbiAgICB9IGVsc2Uge1xuICAgICAgeC5wYXJlbnQgPSBudWxsO1xuICAgICAgdGhpcyQxLl9yb290ID0geDtcbiAgICB9XG5cbiAgICBsID0geC5sZWZ0OyByID0geC5yaWdodDtcblxuICAgIGlmICh4ID09PSBwLmxlZnQpIHsgLy8gbGVmdFxuICAgICAgaWYgKGdwKSB7XG4gICAgICAgIGlmIChncC5sZWZ0ID09PSBwKSB7XG4gICAgICAgICAgLyogemlnLXppZyAqL1xuICAgICAgICAgIGlmIChwLnJpZ2h0KSB7XG4gICAgICAgICAgICBncC5sZWZ0ID0gcC5yaWdodDtcbiAgICAgICAgICAgIGdwLmxlZnQucGFyZW50ID0gZ3A7XG4gICAgICAgICAgfSBlbHNlIHsgZ3AubGVmdCA9IG51bGw7IH1cblxuICAgICAgICAgIHAucmlnaHQgPSBncDtcbiAgICAgICAgICBncC5wYXJlbnQgPSBwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8qIHppZy16YWcgKi9cbiAgICAgICAgICBpZiAobCkge1xuICAgICAgICAgICAgZ3AucmlnaHQgPSBsO1xuICAgICAgICAgICAgbC5wYXJlbnQgPSBncDtcbiAgICAgICAgICB9IGVsc2UgeyBncC5yaWdodCA9IG51bGw7IH1cblxuICAgICAgICAgIHgubGVmdCAgPSBncDtcbiAgICAgICAgICBncC5wYXJlbnQgPSB4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocikge1xuICAgICAgICBwLmxlZnQgPSByO1xuICAgICAgICByLnBhcmVudCA9IHA7XG4gICAgICB9IGVsc2UgeyBwLmxlZnQgPSBudWxsOyB9XG5cbiAgICAgIHgucmlnaHQ9IHA7XG4gICAgICBwLnBhcmVudCA9IHg7XG4gICAgfSBlbHNlIHsgLy8gcmlnaHRcbiAgICAgIGlmIChncCkge1xuICAgICAgICBpZiAoZ3AucmlnaHQgPT09IHApIHtcbiAgICAgICAgICAvKiB6aWctemlnICovXG4gICAgICAgICAgaWYgKHAubGVmdCkge1xuICAgICAgICAgICAgZ3AucmlnaHQgPSBwLmxlZnQ7XG4gICAgICAgICAgICBncC5yaWdodC5wYXJlbnQgPSBncDtcbiAgICAgICAgICB9IGVsc2UgeyBncC5yaWdodCA9IG51bGw7IH1cblxuICAgICAgICAgIHAubGVmdCA9IGdwO1xuICAgICAgICAgIGdwLnBhcmVudCA9IHA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLyogemlnLXphZyAqL1xuICAgICAgICAgIGlmIChyKSB7XG4gICAgICAgICAgICBncC5sZWZ0ID0gcjtcbiAgICAgICAgICAgIHIucGFyZW50ID0gZ3A7XG4gICAgICAgICAgfSBlbHNlIHsgZ3AubGVmdCA9IG51bGw7IH1cblxuICAgICAgICAgIHgucmlnaHQgPSBncDtcbiAgICAgICAgICBncC5wYXJlbnQgPSB4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAobCkge1xuICAgICAgICBwLnJpZ2h0ID0gbDtcbiAgICAgICAgbC5wYXJlbnQgPSBwO1xuICAgICAgfSBlbHNlIHsgcC5yaWdodCA9IG51bGw7IH1cblxuICAgICAgeC5sZWZ0ID0gcDtcbiAgICAgIHAucGFyZW50ID0geDtcbiAgICB9XG4gIH1cbn07XG5cblxuU3BsYXlUcmVlLnByb3RvdHlwZS5yZXBsYWNlID0gZnVuY3Rpb24gcmVwbGFjZSAodSwgdikge1xuICBpZiAoIXUucGFyZW50KSB7IHRoaXMuX3Jvb3QgPSB2OyB9XG4gIGVsc2UgaWYgKHUgPT09IHUucGFyZW50LmxlZnQpIHsgdS5wYXJlbnQubGVmdCA9IHY7IH1cbiAgZWxzZSB7IHUucGFyZW50LnJpZ2h0ID0gdjsgfVxuICBpZiAodikgeyB2LnBhcmVudCA9IHUucGFyZW50OyB9XG59O1xuXG5cblNwbGF5VHJlZS5wcm90b3R5cGUubWluTm9kZSA9IGZ1bmN0aW9uIG1pbk5vZGUgKHUpIHtcbiAgICBpZiAoIHUgPT09IHZvaWQgMCApIHUgPSB0aGlzLl9yb290O1xuXG4gIGlmICh1KSB7IHdoaWxlICh1LmxlZnQpIHsgdSA9IHUubGVmdDsgfSB9XG4gIHJldHVybiB1O1xufTtcblxuXG5TcGxheVRyZWUucHJvdG90eXBlLm1heE5vZGUgPSBmdW5jdGlvbiBtYXhOb2RlICh1KSB7XG4gICAgaWYgKCB1ID09PSB2b2lkIDAgKSB1ID0gdGhpcy5fcm9vdDtcblxuICBpZiAodSkgeyB3aGlsZSAodS5yaWdodCkgeyB1ID0gdS5yaWdodDsgfSB9XG4gIHJldHVybiB1O1xufTtcblxuXG5TcGxheVRyZWUucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uIGluc2VydCAoa2V5LCBkYXRhKSB7XG4gIHZhciB6ID0gdGhpcy5fcm9vdDtcbiAgdmFyIHAgPSBudWxsO1xuICB2YXIgY29tcCA9IHRoaXMuX2NvbXBhcmU7XG4gIHZhciBjbXA7XG5cbiAgaWYgKHRoaXMuX25vRHVwbGljYXRlcykge1xuICAgIHdoaWxlICh6KSB7XG4gICAgICBwID0gejtcbiAgICAgIGNtcCA9IGNvbXAoei5rZXksIGtleSk7XG4gICAgICBpZiAoY21wID09PSAwKSB7IHJldHVybjsgfVxuICAgICAgZWxzZSBpZiAoY29tcCh6LmtleSwga2V5KSA8IDApIHsgeiA9IHoucmlnaHQ7IH1cbiAgICAgIGVsc2UgeyB6ID0gei5sZWZ0OyB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHdoaWxlICh6KSB7XG4gICAgICBwID0gejtcbiAgICAgIGlmIChjb21wKHoua2V5LCBrZXkpIDwgMCkgeyB6ID0gei5yaWdodDsgfVxuICAgICAgZWxzZSB7IHogPSB6LmxlZnQ7IH1cbiAgICB9XG4gIH1cblxuICB6ID0geyBrZXk6IGtleSwgZGF0YTogZGF0YSwgbGVmdDogbnVsbCwgcmlnaHQ6IG51bGwsIHBhcmVudDogcCB9O1xuXG4gIGlmICghcCkgICAgICAgICAgICAgICAgICAgICAgICB7IHRoaXMuX3Jvb3QgPSB6OyB9XG4gIGVsc2UgaWYgKGNvbXAocC5rZXksIHoua2V5KSA8IDApIHsgcC5yaWdodCA9IHo7IH1cbiAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgcC5sZWZ0PSB6OyB9XG5cbiAgdGhpcy5zcGxheSh6KTtcbiAgdGhpcy5fc2l6ZSsrO1xuICByZXR1cm4gejtcbn07XG5cblxuU3BsYXlUcmVlLnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24gZmluZCAoa2V5KSB7XG4gIHZhciB6ICA9IHRoaXMuX3Jvb3Q7XG4gIHZhciBjb21wID0gdGhpcy5fY29tcGFyZTtcbiAgd2hpbGUgKHopIHtcbiAgICB2YXIgY21wID0gY29tcCh6LmtleSwga2V5KTtcbiAgICBpZiAgICAoY21wIDwgMCkgeyB6ID0gei5yaWdodDsgfVxuICAgIGVsc2UgaWYgKGNtcCA+IDApIHsgeiA9IHoubGVmdDsgfVxuICAgIGVsc2UgICAgICAgICAgICB7IHJldHVybiB6OyB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG4vKipcbiAqIFdoZXRoZXIgdGhlIHRyZWUgY29udGFpbnMgYSBub2RlIHdpdGggdGhlIGdpdmVuIGtleVxuICogQHBhcmFte0tleX0ga2V5XG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlL2ZhbHNlXG4gKi9cblNwbGF5VHJlZS5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiBjb250YWlucyAoa2V5KSB7XG4gIHZhciBub2RlICAgICA9IHRoaXMuX3Jvb3Q7XG4gIHZhciBjb21wYXJhdG9yID0gdGhpcy5fY29tcGFyZTtcbiAgd2hpbGUgKG5vZGUpe1xuICAgIHZhciBjbXAgPSBjb21wYXJhdG9yKGtleSwgbm9kZS5rZXkpO1xuICAgIGlmICAgIChjbXAgPT09IDApIHsgcmV0dXJuIHRydWU7IH1cbiAgICBlbHNlIGlmIChjbXAgPCAwKSB7IG5vZGUgPSBub2RlLmxlZnQ7IH1cbiAgICBlbHNlICAgICAgICAgICAgICB7IG5vZGUgPSBub2RlLnJpZ2h0OyB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5cblNwbGF5VHJlZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlIChrZXkpIHtcbiAgdmFyIHogPSB0aGlzLmZpbmQoa2V5KTtcblxuICBpZiAoIXopIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgdGhpcy5zcGxheSh6KTtcblxuICBpZiAoIXoubGVmdCkgeyB0aGlzLnJlcGxhY2Uoeiwgei5yaWdodCk7IH1cbiAgZWxzZSBpZiAoIXoucmlnaHQpIHsgdGhpcy5yZXBsYWNlKHosIHoubGVmdCk7IH1cbiAgZWxzZSB7XG4gICAgdmFyIHkgPSB0aGlzLm1pbk5vZGUoei5yaWdodCk7XG4gICAgaWYgKHkucGFyZW50ICE9PSB6KSB7XG4gICAgICB0aGlzLnJlcGxhY2UoeSwgeS5yaWdodCk7XG4gICAgICB5LnJpZ2h0ID0gei5yaWdodDtcbiAgICAgIHkucmlnaHQucGFyZW50ID0geTtcbiAgICB9XG4gICAgdGhpcy5yZXBsYWNlKHosIHkpO1xuICAgIHkubGVmdCA9IHoubGVmdDtcbiAgICB5LmxlZnQucGFyZW50ID0geTtcbiAgfVxuXG4gIHRoaXMuX3NpemUtLTtcbiAgcmV0dXJuIHRydWU7XG59O1xuXG5cblNwbGF5VHJlZS5wcm90b3R5cGUucmVtb3ZlTm9kZSA9IGZ1bmN0aW9uIHJlbW92ZU5vZGUgKHopIHtcbiAgaWYgKCF6KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHRoaXMuc3BsYXkoeik7XG5cbiAgaWYgKCF6LmxlZnQpIHsgdGhpcy5yZXBsYWNlKHosIHoucmlnaHQpOyB9XG4gIGVsc2UgaWYgKCF6LnJpZ2h0KSB7IHRoaXMucmVwbGFjZSh6LCB6LmxlZnQpOyB9XG4gIGVsc2Uge1xuICAgIHZhciB5ID0gdGhpcy5taW5Ob2RlKHoucmlnaHQpO1xuICAgIGlmICh5LnBhcmVudCAhPT0geikge1xuICAgICAgdGhpcy5yZXBsYWNlKHksIHkucmlnaHQpO1xuICAgICAgeS5yaWdodCA9IHoucmlnaHQ7XG4gICAgICB5LnJpZ2h0LnBhcmVudCA9IHk7XG4gICAgfVxuICAgIHRoaXMucmVwbGFjZSh6LCB5KTtcbiAgICB5LmxlZnQgPSB6LmxlZnQ7XG4gICAgeS5sZWZ0LnBhcmVudCA9IHk7XG4gIH1cblxuICB0aGlzLl9zaXplLS07XG4gIHJldHVybiB0cnVlO1xufTtcblxuXG5TcGxheVRyZWUucHJvdG90eXBlLmVyYXNlID0gZnVuY3Rpb24gZXJhc2UgKGtleSkge1xuICB2YXIgeiA9IHRoaXMuZmluZChrZXkpO1xuICBpZiAoIXopIHsgcmV0dXJuOyB9XG5cbiAgdGhpcy5zcGxheSh6KTtcblxuICB2YXIgcyA9IHoubGVmdDtcbiAgdmFyIHQgPSB6LnJpZ2h0O1xuXG4gIHZhciBzTWF4ID0gbnVsbDtcbiAgaWYgKHMpIHtcbiAgICBzLnBhcmVudCA9IG51bGw7XG4gICAgc01heCA9IHRoaXMubWF4Tm9kZShzKTtcbiAgICB0aGlzLnNwbGF5KHNNYXgpO1xuICAgIHRoaXMuX3Jvb3QgPSBzTWF4O1xuICB9XG4gIGlmICh0KSB7XG4gICAgaWYgKHMpIHsgc01heC5yaWdodCA9IHQ7IH1cbiAgICBlbHNlIHsgdGhpcy5fcm9vdCA9IHQ7IH1cbiAgICB0LnBhcmVudCA9IHNNYXg7XG4gIH1cblxuICB0aGlzLl9zaXplLS07XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgYW5kIHJldHVybnMgdGhlIG5vZGUgd2l0aCBzbWFsbGVzdCBrZXlcbiAqIEByZXR1cm4gez9Ob2RlfVxuICovXG5TcGxheVRyZWUucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uIHBvcCAoKSB7XG4gIHZhciBub2RlID0gdGhpcy5fcm9vdCwgcmV0dXJuVmFsdWUgPSBudWxsO1xuICBpZiAobm9kZSkge1xuICAgIHdoaWxlIChub2RlLmxlZnQpIHsgbm9kZSA9IG5vZGUubGVmdDsgfVxuICAgIHJldHVyblZhbHVlID0geyBrZXk6IG5vZGUua2V5LCBkYXRhOiBub2RlLmRhdGEgfTtcbiAgICB0aGlzLnJlbW92ZShub2RlLmtleSk7XG4gIH1cbiAgcmV0dXJuIHJldHVyblZhbHVlO1xufTtcblxuXG4vKiBlc2xpbnQtZGlzYWJsZSBjbGFzcy1tZXRob2RzLXVzZS10aGlzICovXG5cbi8qKlxuICogU3VjY2Vzc29yIG5vZGVcbiAqIEBwYXJhbXtOb2RlfSBub2RlXG4gKiBAcmV0dXJuIHs/Tm9kZX1cbiAqL1xuU3BsYXlUcmVlLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gbmV4dCAobm9kZSkge1xuICB2YXIgc3VjY2Vzc29yID0gbm9kZTtcbiAgaWYgKHN1Y2Nlc3Nvcikge1xuICAgIGlmIChzdWNjZXNzb3IucmlnaHQpIHtcbiAgICAgIHN1Y2Nlc3NvciA9IHN1Y2Nlc3Nvci5yaWdodDtcbiAgICAgIHdoaWxlIChzdWNjZXNzb3IgJiYgc3VjY2Vzc29yLmxlZnQpIHsgc3VjY2Vzc29yID0gc3VjY2Vzc29yLmxlZnQ7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3VjY2Vzc29yID0gbm9kZS5wYXJlbnQ7XG4gICAgICB3aGlsZSAoc3VjY2Vzc29yICYmIHN1Y2Nlc3Nvci5yaWdodCA9PT0gbm9kZSkge1xuICAgICAgICBub2RlID0gc3VjY2Vzc29yOyBzdWNjZXNzb3IgPSBzdWNjZXNzb3IucGFyZW50O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gc3VjY2Vzc29yO1xufTtcblxuXG4vKipcbiAqIFByZWRlY2Vzc29yIG5vZGVcbiAqIEBwYXJhbXtOb2RlfSBub2RlXG4gKiBAcmV0dXJuIHs/Tm9kZX1cbiAqL1xuU3BsYXlUcmVlLnByb3RvdHlwZS5wcmV2ID0gZnVuY3Rpb24gcHJldiAobm9kZSkge1xuICB2YXIgcHJlZGVjZXNzb3IgPSBub2RlO1xuICBpZiAocHJlZGVjZXNzb3IpIHtcbiAgICBpZiAocHJlZGVjZXNzb3IubGVmdCkge1xuICAgICAgcHJlZGVjZXNzb3IgPSBwcmVkZWNlc3Nvci5sZWZ0O1xuICAgICAgd2hpbGUgKHByZWRlY2Vzc29yICYmIHByZWRlY2Vzc29yLnJpZ2h0KSB7IHByZWRlY2Vzc29yID0gcHJlZGVjZXNzb3IucmlnaHQ7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJlZGVjZXNzb3IgPSBub2RlLnBhcmVudDtcbiAgICAgIHdoaWxlIChwcmVkZWNlc3NvciAmJiBwcmVkZWNlc3Nvci5sZWZ0ID09PSBub2RlKSB7XG4gICAgICAgIG5vZGUgPSBwcmVkZWNlc3NvcjtcbiAgICAgICAgcHJlZGVjZXNzb3IgPSBwcmVkZWNlc3Nvci5wYXJlbnQ7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcmVkZWNlc3Nvcjtcbn07XG4vKiBlc2xpbnQtZW5hYmxlIGNsYXNzLW1ldGhvZHMtdXNlLXRoaXMgKi9cblxuXG4vKipcbiAqIEBwYXJhbXtmb3JFYWNoQ2FsbGJhY2t9IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtTcGxheVRyZWV9XG4gKi9cblNwbGF5VHJlZS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIGZvckVhY2ggKGNhbGxiYWNrKSB7XG4gIHZhciBjdXJyZW50ID0gdGhpcy5fcm9vdDtcbiAgdmFyIHMgPSBbXSwgZG9uZSA9IGZhbHNlLCBpID0gMDtcblxuICB3aGlsZSAoIWRvbmUpIHtcbiAgICAvLyBSZWFjaCB0aGUgbGVmdCBtb3N0IE5vZGUgb2YgdGhlIGN1cnJlbnQgTm9kZVxuICAgIGlmIChjdXJyZW50KSB7XG4gICAgICAvLyBQbGFjZSBwb2ludGVyIHRvIGEgdHJlZSBub2RlIG9uIHRoZSBzdGFja1xuICAgICAgLy8gYmVmb3JlIHRyYXZlcnNpbmcgdGhlIG5vZGUncyBsZWZ0IHN1YnRyZWVcbiAgICAgIHMucHVzaChjdXJyZW50KTtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50LmxlZnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEJhY2tUcmFjayBmcm9tIHRoZSBlbXB0eSBzdWJ0cmVlIGFuZCB2aXNpdCB0aGUgTm9kZVxuICAgICAgLy8gYXQgdGhlIHRvcCBvZiB0aGUgc3RhY2s7IGhvd2V2ZXIsIGlmIHRoZSBzdGFjayBpc1xuICAgICAgLy8gZW1wdHkgeW91IGFyZSBkb25lXG4gICAgICBpZiAocy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGN1cnJlbnQgPSBzLnBvcCgpO1xuICAgICAgICBjYWxsYmFjayhjdXJyZW50LCBpKyspO1xuXG4gICAgICAgIC8vIFdlIGhhdmUgdmlzaXRlZCB0aGUgbm9kZSBhbmQgaXRzIGxlZnRcbiAgICAgICAgLy8gc3VidHJlZS4gTm93LCBpdCdzIHJpZ2h0IHN1YnRyZWUncyB0dXJuXG4gICAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnJpZ2h0O1xuICAgICAgfSBlbHNlIHsgZG9uZSA9IHRydWU7IH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogV2FsayBrZXkgcmFuZ2UgZnJvbSBgbG93YCB0byBgaGlnaGAuIFN0b3BzIGlmIGBmbmAgcmV0dXJucyBhIHZhbHVlLlxuICogQHBhcmFte0tleX0gICAgbG93XG4gKiBAcGFyYW17S2V5fSAgICBoaWdoXG4gKiBAcGFyYW17RnVuY3Rpb259IGZuXG4gKiBAcGFyYW17Kj99ICAgICBjdHhcbiAqIEByZXR1cm4ge1NwbGF5VHJlZX1cbiAqL1xuU3BsYXlUcmVlLnByb3RvdHlwZS5yYW5nZSA9IGZ1bmN0aW9uIHJhbmdlIChsb3csIGhpZ2gsIGZuLCBjdHgpIHtcbiAgICB2YXIgdGhpcyQxID0gdGhpcztcblxuICB2YXIgUSA9IFtdO1xuICB2YXIgY29tcGFyZSA9IHRoaXMuX2NvbXBhcmU7XG4gIHZhciBub2RlID0gdGhpcy5fcm9vdCwgY21wO1xuXG4gIHdoaWxlIChRLmxlbmd0aCAhPT0gMCB8fCBub2RlKSB7XG4gICAgaWYgKG5vZGUpIHtcbiAgICAgIFEucHVzaChub2RlKTtcbiAgICAgIG5vZGUgPSBub2RlLmxlZnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUgPSBRLnBvcCgpO1xuICAgICAgY21wID0gY29tcGFyZShub2RlLmtleSwgaGlnaCk7XG4gICAgICBpZiAoY21wID4gMCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH0gZWxzZSBpZiAoY29tcGFyZShub2RlLmtleSwgbG93KSA+PSAwKSB7XG4gICAgICAgIGlmIChmbi5jYWxsKGN0eCwgbm9kZSkpIHsgcmV0dXJuIHRoaXMkMTsgfSAvLyBzdG9wIGlmIHNtdGggaXMgcmV0dXJuZWRcbiAgICAgIH1cbiAgICAgIG5vZGUgPSBub2RlLnJpZ2h0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmV0dXJucyBhbGwga2V5cyBpbiBvcmRlclxuICogQHJldHVybiB7QXJyYXk8S2V5Pn1cbiAqL1xuU3BsYXlUcmVlLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24ga2V5cyAoKSB7XG4gIHZhciBjdXJyZW50ID0gdGhpcy5fcm9vdDtcbiAgdmFyIHMgPSBbXSwgciA9IFtdLCBkb25lID0gZmFsc2U7XG5cbiAgd2hpbGUgKCFkb25lKSB7XG4gICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgIHMucHVzaChjdXJyZW50KTtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50LmxlZnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY3VycmVudCA9IHMucG9wKCk7XG4gICAgICAgIHIucHVzaChjdXJyZW50LmtleSk7XG4gICAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnJpZ2h0O1xuICAgICAgfSBlbHNlIHsgZG9uZSA9IHRydWU7IH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHI7XG59O1xuXG5cbi8qKlxuICogUmV0dXJucyBgZGF0YWAgZmllbGRzIG9mIGFsbCBub2RlcyBpbiBvcmRlci5cbiAqIEByZXR1cm4ge0FycmF5PFZhbHVlPn1cbiAqL1xuU3BsYXlUcmVlLnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbiB2YWx1ZXMgKCkge1xuICB2YXIgY3VycmVudCA9IHRoaXMuX3Jvb3Q7XG4gIHZhciBzID0gW10sIHIgPSBbXSwgZG9uZSA9IGZhbHNlO1xuXG4gIHdoaWxlICghZG9uZSkge1xuICAgIGlmIChjdXJyZW50KSB7XG4gICAgICBzLnB1c2goY3VycmVudCk7XG4gICAgICBjdXJyZW50ID0gY3VycmVudC5sZWZ0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGN1cnJlbnQgPSBzLnBvcCgpO1xuICAgICAgICByLnB1c2goY3VycmVudC5kYXRhKTtcbiAgICAgICAgY3VycmVudCA9IGN1cnJlbnQucmlnaHQ7XG4gICAgICB9IGVsc2UgeyBkb25lID0gdHJ1ZTsgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcjtcbn07XG5cblxuLyoqXG4gKiBSZXR1cm5zIG5vZGUgYXQgZ2l2ZW4gaW5kZXhcbiAqIEBwYXJhbXtudW1iZXJ9IGluZGV4XG4gKiBAcmV0dXJuIHs/Tm9kZX1cbiAqL1xuU3BsYXlUcmVlLnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIGF0IChpbmRleCkge1xuICAvLyByZW1vdmVkIGFmdGVyIGEgY29uc2lkZXJhdGlvbiwgbW9yZSBtaXNsZWFkaW5nIHRoYW4gdXNlZnVsXG4gIC8vIGluZGV4ID0gaW5kZXggJSB0aGlzLnNpemU7XG4gIC8vIGlmIChpbmRleCA8IDApIGluZGV4ID0gdGhpcy5zaXplIC0gaW5kZXg7XG5cbiAgdmFyIGN1cnJlbnQgPSB0aGlzLl9yb290O1xuICB2YXIgcyA9IFtdLCBkb25lID0gZmFsc2UsIGkgPSAwO1xuXG4gIHdoaWxlICghZG9uZSkge1xuICAgIGlmIChjdXJyZW50KSB7XG4gICAgICBzLnB1c2goY3VycmVudCk7XG4gICAgICBjdXJyZW50ID0gY3VycmVudC5sZWZ0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGN1cnJlbnQgPSBzLnBvcCgpO1xuICAgICAgICBpZiAoaSA9PT0gaW5kZXgpIHsgcmV0dXJuIGN1cnJlbnQ7IH1cbiAgICAgICAgaSsrO1xuICAgICAgICBjdXJyZW50ID0gY3VycmVudC5yaWdodDtcbiAgICAgIH0gZWxzZSB7IGRvbmUgPSB0cnVlOyB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufTtcblxuLyoqXG4gKiBCdWxrLWxvYWQgaXRlbXMuIEJvdGggYXJyYXkgaGF2ZSB0byBiZSBzYW1lIHNpemVcbiAqIEBwYXJhbXtBcnJheTxLZXk+fSAga2V5c1xuICogQHBhcmFte0FycmF5PFZhbHVlPn1bdmFsdWVzXVxuICogQHBhcmFte0Jvb2xlYW59ICAgICBbcHJlc29ydD1mYWxzZV0gUHJlLXNvcnQga2V5cyBhbmQgdmFsdWVzLCB1c2luZ1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmVlJ3MgY29tcGFyYXRvci4gU29ydGluZyBpcyBkb25lXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluLXBsYWNlXG4gKiBAcmV0dXJuIHtBVkxUcmVlfVxuICovXG5TcGxheVRyZWUucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiBsb2FkIChrZXlzLCB2YWx1ZXMsIHByZXNvcnQpIHtcbiAgICBpZiAoIGtleXMgPT09IHZvaWQgMCApIGtleXMgPSBbXTtcbiAgICBpZiAoIHZhbHVlcyA9PT0gdm9pZCAwICkgdmFsdWVzID0gW107XG4gICAgaWYgKCBwcmVzb3J0ID09PSB2b2lkIDAgKSBwcmVzb3J0ID0gZmFsc2U7XG5cbiAgaWYgKHRoaXMuX3NpemUgIT09IDApIHsgdGhyb3cgbmV3IEVycm9yKCdidWxrLWxvYWQ6IHRyZWUgaXMgbm90IGVtcHR5Jyk7IH1cbiAgdmFyIHNpemUgPSBrZXlzLmxlbmd0aDtcbiAgaWYgKHByZXNvcnQpIHsgc29ydChrZXlzLCB2YWx1ZXMsIDAsIHNpemUgLSAxLCB0aGlzLl9jb21wYXJlKTsgfVxuICB0aGlzLl9yb290ID0gbG9hZFJlY3Vyc2l2ZShudWxsLCBrZXlzLCB2YWx1ZXMsIDAsIHNpemUpO1xuICB0aGlzLl9zaXplID0gc2l6ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cblNwbGF5VHJlZS5wcm90b3R5cGUubWluID0gZnVuY3Rpb24gbWluICgpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLm1pbk5vZGUodGhpcy5fcm9vdCk7XG4gIGlmIChub2RlKSB7IHJldHVybiBub2RlLmtleTsgfVxuICBlbHNlICAgIHsgcmV0dXJuIG51bGw7IH1cbn07XG5cblxuU3BsYXlUcmVlLnByb3RvdHlwZS5tYXggPSBmdW5jdGlvbiBtYXggKCkge1xuICB2YXIgbm9kZSA9IHRoaXMubWF4Tm9kZSh0aGlzLl9yb290KTtcbiAgaWYgKG5vZGUpIHsgcmV0dXJuIG5vZGUua2V5OyB9XG4gIGVsc2UgICAgeyByZXR1cm4gbnVsbDsgfVxufTtcblxuU3BsYXlUcmVlLnByb3RvdHlwZS5pc0VtcHR5ID0gZnVuY3Rpb24gaXNFbXB0eSAoKSB7IHJldHVybiB0aGlzLl9yb290ID09PSBudWxsOyB9O1xucHJvdG90eXBlQWNjZXNzb3JzLnNpemUuZ2V0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fc2l6ZTsgfTtcblxuXG4vKipcbiAqIENyZWF0ZSBhIHRyZWUgYW5kIGxvYWQgaXQgd2l0aCBpdGVtc1xuICogQHBhcmFte0FycmF5PEtleT59ICAgICAgICBrZXlzXG4gKiBAcGFyYW17QXJyYXk8VmFsdWU+P30gICAgICBbdmFsdWVzXVxuXG4gKiBAcGFyYW17RnVuY3Rpb24/fSAgICAgICAgICBbY29tcGFyYXRvcl1cbiAqIEBwYXJhbXtCb29sZWFuP30gICAgICAgICAgIFtwcmVzb3J0PWZhbHNlXSBQcmUtc29ydCBrZXlzIGFuZCB2YWx1ZXMsIHVzaW5nXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyZWUncyBjb21wYXJhdG9yLiBTb3J0aW5nIGlzIGRvbmVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW4tcGxhY2VcbiAqIEBwYXJhbXtCb29sZWFuP30gICAgICAgICAgIFtub0R1cGxpY2F0ZXM9ZmFsc2VdIEFsbG93IGR1cGxpY2F0ZXNcbiAqIEByZXR1cm4ge1NwbGF5VHJlZX1cbiAqL1xuU3BsYXlUcmVlLmNyZWF0ZVRyZWUgPSBmdW5jdGlvbiBjcmVhdGVUcmVlIChrZXlzLCB2YWx1ZXMsIGNvbXBhcmF0b3IsIHByZXNvcnQsIG5vRHVwbGljYXRlcykge1xuICByZXR1cm4gbmV3IFNwbGF5VHJlZShjb21wYXJhdG9yLCBub0R1cGxpY2F0ZXMpLmxvYWQoa2V5cywgdmFsdWVzLCBwcmVzb3J0KTtcbn07XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKCBTcGxheVRyZWUucHJvdG90eXBlLCBwcm90b3R5cGVBY2Nlc3NvcnMgKTtcblxuZnVuY3Rpb24gbG9hZFJlY3Vyc2l2ZSAocGFyZW50LCBrZXlzLCB2YWx1ZXMsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNpemUgPSBlbmQgLSBzdGFydDtcbiAgaWYgKHNpemUgPiAwKSB7XG4gICAgdmFyIG1pZGRsZSA9IHN0YXJ0ICsgTWF0aC5mbG9vcihzaXplIC8gMik7XG4gICAgdmFyIGtleSAgICA9IGtleXNbbWlkZGxlXTtcbiAgICB2YXIgZGF0YSAgID0gdmFsdWVzW21pZGRsZV07XG4gICAgdmFyIG5vZGUgICA9IHsga2V5OiBrZXksIGRhdGE6IGRhdGEsIHBhcmVudDogcGFyZW50IH07XG4gICAgbm9kZS5sZWZ0ICAgID0gbG9hZFJlY3Vyc2l2ZShub2RlLCBrZXlzLCB2YWx1ZXMsIHN0YXJ0LCBtaWRkbGUpO1xuICAgIG5vZGUucmlnaHQgICA9IGxvYWRSZWN1cnNpdmUobm9kZSwga2V5cywgdmFsdWVzLCBtaWRkbGUgKyAxLCBlbmQpO1xuICAgIHJldHVybiBub2RlO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbmZ1bmN0aW9uIHNvcnQoa2V5cywgdmFsdWVzLCBsZWZ0LCByaWdodCwgY29tcGFyZSkge1xuICBpZiAobGVmdCA+PSByaWdodCkgeyByZXR1cm47IH1cblxuICB2YXIgcGl2b3QgPSBrZXlzWyhsZWZ0ICsgcmlnaHQpID4+IDFdO1xuICB2YXIgaSA9IGxlZnQgLSAxO1xuICB2YXIgaiA9IHJpZ2h0ICsgMTtcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIGRvIHsgaSsrOyB9IHdoaWxlIChjb21wYXJlKGtleXNbaV0sIHBpdm90KSA8IDApO1xuICAgIGRvIHsgai0tOyB9IHdoaWxlIChjb21wYXJlKGtleXNbal0sIHBpdm90KSA+IDApO1xuICAgIGlmIChpID49IGopIHsgYnJlYWs7IH1cblxuICAgIHZhciB0bXAgPSBrZXlzW2ldO1xuICAgIGtleXNbaV0gPSBrZXlzW2pdO1xuICAgIGtleXNbal0gPSB0bXA7XG5cbiAgICB0bXAgPSB2YWx1ZXNbaV07XG4gICAgdmFsdWVzW2ldID0gdmFsdWVzW2pdO1xuICAgIHZhbHVlc1tqXSA9IHRtcDtcbiAgfVxuXG4gIHNvcnQoa2V5cywgdmFsdWVzLCAgbGVmdCwgICAgIGosIGNvbXBhcmUpO1xuICBzb3J0KGtleXMsIHZhbHVlcywgaiArIDEsIHJpZ2h0LCBjb21wYXJlKTtcbn1cblxucmV0dXJuIFNwbGF5VHJlZTtcblxufSkpKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNwbGF5LmpzLm1hcFxuIiwiLyoqXG4gKiBSb290IHJlZmVyZW5jZSBmb3IgaWZyYW1lcy5cbiAqL1xuXG52YXIgcm9vdDtcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgeyAvLyBCcm93c2VyIHdpbmRvd1xuICByb290ID0gd2luZG93O1xufSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHsgLy8gV2ViIFdvcmtlclxuICByb290ID0gc2VsZjtcbn0gZWxzZSB7IC8vIE90aGVyIGVudmlyb25tZW50c1xuICBjb25zb2xlLndhcm4oXCJVc2luZyBicm93c2VyLW9ubHkgdmVyc2lvbiBvZiBzdXBlcmFnZW50IGluIG5vbi1icm93c2VyIGVudmlyb25tZW50XCIpO1xuICByb290ID0gdGhpcztcbn1cblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCdlbWl0dGVyJyk7XG52YXIgcmVxdWVzdEJhc2UgPSByZXF1aXJlKCcuL3JlcXVlc3QtYmFzZScpO1xudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pcy1vYmplY3QnKTtcblxuLyoqXG4gKiBOb29wLlxuICovXG5cbmZ1bmN0aW9uIG5vb3AoKXt9O1xuXG4vKipcbiAqIEV4cG9zZSBgcmVxdWVzdGAuXG4gKi9cblxudmFyIHJlcXVlc3QgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vcmVxdWVzdCcpLmJpbmQobnVsbCwgUmVxdWVzdCk7XG5cbi8qKlxuICogRGV0ZXJtaW5lIFhIUi5cbiAqL1xuXG5yZXF1ZXN0LmdldFhIUiA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHJvb3QuWE1MSHR0cFJlcXVlc3RcbiAgICAgICYmICghcm9vdC5sb2NhdGlvbiB8fCAnZmlsZTonICE9IHJvb3QubG9jYXRpb24ucHJvdG9jb2xcbiAgICAgICAgICB8fCAhcm9vdC5BY3RpdmVYT2JqZWN0KSkge1xuICAgIHJldHVybiBuZXcgWE1MSHR0cFJlcXVlc3Q7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KCdNaWNyb3NvZnQuWE1MSFRUUCcpOyB9IGNhdGNoKGUpIHt9XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KCdNc3htbDIuWE1MSFRUUC42LjAnKTsgfSBjYXRjaChlKSB7fVxuICAgIHRyeSB7IHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTXN4bWwyLlhNTEhUVFAuMy4wJyk7IH0gY2F0Y2goZSkge31cbiAgICB0cnkgeyByZXR1cm4gbmV3IEFjdGl2ZVhPYmplY3QoJ01zeG1sMi5YTUxIVFRQJyk7IH0gY2F0Y2goZSkge31cbiAgfVxuICB0aHJvdyBFcnJvcihcIkJyb3dzZXItb25seSB2ZXJpc29uIG9mIHN1cGVyYWdlbnQgY291bGQgbm90IGZpbmQgWEhSXCIpO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UsIGFkZGVkIHRvIHN1cHBvcnQgSUUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbnZhciB0cmltID0gJycudHJpbVxuICA/IGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMudHJpbSgpOyB9XG4gIDogZnVuY3Rpb24ocykgeyByZXR1cm4gcy5yZXBsYWNlKC8oXlxccyp8XFxzKiQpL2csICcnKTsgfTtcblxuLyoqXG4gKiBTZXJpYWxpemUgdGhlIGdpdmVuIGBvYmpgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZShvYmopIHtcbiAgaWYgKCFpc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICB2YXIgcGFpcnMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIHB1c2hFbmNvZGVkS2V5VmFsdWVQYWlyKHBhaXJzLCBrZXksIG9ialtrZXldKTtcbiAgfVxuICByZXR1cm4gcGFpcnMuam9pbignJicpO1xufVxuXG4vKipcbiAqIEhlbHBzICdzZXJpYWxpemUnIHdpdGggc2VyaWFsaXppbmcgYXJyYXlzLlxuICogTXV0YXRlcyB0aGUgcGFpcnMgYXJyYXkuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gcGFpcnNcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICovXG5cbmZ1bmN0aW9uIHB1c2hFbmNvZGVkS2V5VmFsdWVQYWlyKHBhaXJzLCBrZXksIHZhbCkge1xuICBpZiAodmFsICE9IG51bGwpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgICB2YWwuZm9yRWFjaChmdW5jdGlvbih2KSB7XG4gICAgICAgIHB1c2hFbmNvZGVkS2V5VmFsdWVQYWlyKHBhaXJzLCBrZXksIHYpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChpc09iamVjdCh2YWwpKSB7XG4gICAgICBmb3IodmFyIHN1YmtleSBpbiB2YWwpIHtcbiAgICAgICAgcHVzaEVuY29kZWRLZXlWYWx1ZVBhaXIocGFpcnMsIGtleSArICdbJyArIHN1YmtleSArICddJywgdmFsW3N1YmtleV0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwYWlycy5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChrZXkpXG4gICAgICAgICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbCkpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh2YWwgPT09IG51bGwpIHtcbiAgICBwYWlycy5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChrZXkpKTtcbiAgfVxufVxuXG4vKipcbiAqIEV4cG9zZSBzZXJpYWxpemF0aW9uIG1ldGhvZC5cbiAqL1xuXG4gcmVxdWVzdC5zZXJpYWxpemVPYmplY3QgPSBzZXJpYWxpemU7XG5cbiAvKipcbiAgKiBQYXJzZSB0aGUgZ2l2ZW4geC13d3ctZm9ybS11cmxlbmNvZGVkIGBzdHJgLlxuICAqXG4gICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICAqIEByZXR1cm4ge09iamVjdH1cbiAgKiBAYXBpIHByaXZhdGVcbiAgKi9cblxuZnVuY3Rpb24gcGFyc2VTdHJpbmcoc3RyKSB7XG4gIHZhciBvYmogPSB7fTtcbiAgdmFyIHBhaXJzID0gc3RyLnNwbGl0KCcmJyk7XG4gIHZhciBwYWlyO1xuICB2YXIgcG9zO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwYWlycy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHBhaXIgPSBwYWlyc1tpXTtcbiAgICBwb3MgPSBwYWlyLmluZGV4T2YoJz0nKTtcbiAgICBpZiAocG9zID09IC0xKSB7XG4gICAgICBvYmpbZGVjb2RlVVJJQ29tcG9uZW50KHBhaXIpXSA9ICcnO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmpbZGVjb2RlVVJJQ29tcG9uZW50KHBhaXIuc2xpY2UoMCwgcG9zKSldID1cbiAgICAgICAgZGVjb2RlVVJJQ29tcG9uZW50KHBhaXIuc2xpY2UocG9zICsgMSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogRXhwb3NlIHBhcnNlci5cbiAqL1xuXG5yZXF1ZXN0LnBhcnNlU3RyaW5nID0gcGFyc2VTdHJpbmc7XG5cbi8qKlxuICogRGVmYXVsdCBNSU1FIHR5cGUgbWFwLlxuICpcbiAqICAgICBzdXBlcmFnZW50LnR5cGVzLnhtbCA9ICdhcHBsaWNhdGlvbi94bWwnO1xuICpcbiAqL1xuXG5yZXF1ZXN0LnR5cGVzID0ge1xuICBodG1sOiAndGV4dC9odG1sJyxcbiAganNvbjogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICB4bWw6ICdhcHBsaWNhdGlvbi94bWwnLFxuICB1cmxlbmNvZGVkOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyxcbiAgJ2Zvcm0nOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyxcbiAgJ2Zvcm0tZGF0YSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXG59O1xuXG4vKipcbiAqIERlZmF1bHQgc2VyaWFsaXphdGlvbiBtYXAuXG4gKlxuICogICAgIHN1cGVyYWdlbnQuc2VyaWFsaXplWydhcHBsaWNhdGlvbi94bWwnXSA9IGZ1bmN0aW9uKG9iail7XG4gKiAgICAgICByZXR1cm4gJ2dlbmVyYXRlZCB4bWwgaGVyZSc7XG4gKiAgICAgfTtcbiAqXG4gKi9cblxuIHJlcXVlc3Quc2VyaWFsaXplID0ge1xuICAgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCc6IHNlcmlhbGl6ZSxcbiAgICdhcHBsaWNhdGlvbi9qc29uJzogSlNPTi5zdHJpbmdpZnlcbiB9O1xuXG4gLyoqXG4gICogRGVmYXVsdCBwYXJzZXJzLlxuICAqXG4gICogICAgIHN1cGVyYWdlbnQucGFyc2VbJ2FwcGxpY2F0aW9uL3htbCddID0gZnVuY3Rpb24oc3RyKXtcbiAgKiAgICAgICByZXR1cm4geyBvYmplY3QgcGFyc2VkIGZyb20gc3RyIH07XG4gICogICAgIH07XG4gICpcbiAgKi9cblxucmVxdWVzdC5wYXJzZSA9IHtcbiAgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCc6IHBhcnNlU3RyaW5nLFxuICAnYXBwbGljYXRpb24vanNvbic6IEpTT04ucGFyc2Vcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGhlYWRlciBgc3RyYCBpbnRvXG4gKiBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgbWFwcGVkIGZpZWxkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZUhlYWRlcihzdHIpIHtcbiAgdmFyIGxpbmVzID0gc3RyLnNwbGl0KC9cXHI/XFxuLyk7XG4gIHZhciBmaWVsZHMgPSB7fTtcbiAgdmFyIGluZGV4O1xuICB2YXIgbGluZTtcbiAgdmFyIGZpZWxkO1xuICB2YXIgdmFsO1xuXG4gIGxpbmVzLnBvcCgpOyAvLyB0cmFpbGluZyBDUkxGXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGxpbmVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgbGluZSA9IGxpbmVzW2ldO1xuICAgIGluZGV4ID0gbGluZS5pbmRleE9mKCc6Jyk7XG4gICAgZmllbGQgPSBsaW5lLnNsaWNlKDAsIGluZGV4KS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhbCA9IHRyaW0obGluZS5zbGljZShpbmRleCArIDEpKTtcbiAgICBmaWVsZHNbZmllbGRdID0gdmFsO1xuICB9XG5cbiAgcmV0dXJuIGZpZWxkcztcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBgbWltZWAgaXMganNvbiBvciBoYXMgK2pzb24gc3RydWN0dXJlZCBzeW50YXggc3VmZml4LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBtaW1lXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gaXNKU09OKG1pbWUpIHtcbiAgcmV0dXJuIC9bXFwvK11qc29uXFxiLy50ZXN0KG1pbWUpO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgbWltZSB0eXBlIGZvciB0aGUgZ2l2ZW4gYHN0cmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gdHlwZShzdHIpe1xuICByZXR1cm4gc3RyLnNwbGl0KC8gKjsgKi8pLnNoaWZ0KCk7XG59O1xuXG4vKipcbiAqIFJldHVybiBoZWFkZXIgZmllbGQgcGFyYW1ldGVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJhbXMoc3RyKXtcbiAgcmV0dXJuIHN0ci5zcGxpdCgvICo7ICovKS5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBzdHIpe1xuICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdCgvICo9ICovKSxcbiAgICAgICAga2V5ID0gcGFydHMuc2hpZnQoKSxcbiAgICAgICAgdmFsID0gcGFydHMuc2hpZnQoKTtcblxuICAgIGlmIChrZXkgJiYgdmFsKSBvYmpba2V5XSA9IHZhbDtcbiAgICByZXR1cm4gb2JqO1xuICB9LCB7fSk7XG59O1xuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYFJlc3BvbnNlYCB3aXRoIHRoZSBnaXZlbiBgeGhyYC5cbiAqXG4gKiAgLSBzZXQgZmxhZ3MgKC5vaywgLmVycm9yLCBldGMpXG4gKiAgLSBwYXJzZSBoZWFkZXJcbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgQWxpYXNpbmcgYHN1cGVyYWdlbnRgIGFzIGByZXF1ZXN0YCBpcyBuaWNlOlxuICpcbiAqICAgICAgcmVxdWVzdCA9IHN1cGVyYWdlbnQ7XG4gKlxuICogIFdlIGNhbiB1c2UgdGhlIHByb21pc2UtbGlrZSBBUEksIG9yIHBhc3MgY2FsbGJhY2tzOlxuICpcbiAqICAgICAgcmVxdWVzdC5nZXQoJy8nKS5lbmQoZnVuY3Rpb24ocmVzKXt9KTtcbiAqICAgICAgcmVxdWVzdC5nZXQoJy8nLCBmdW5jdGlvbihyZXMpe30pO1xuICpcbiAqICBTZW5kaW5nIGRhdGEgY2FuIGJlIGNoYWluZWQ6XG4gKlxuICogICAgICByZXF1ZXN0XG4gKiAgICAgICAgLnBvc3QoJy91c2VyJylcbiAqICAgICAgICAuc2VuZCh7IG5hbWU6ICd0aicgfSlcbiAqICAgICAgICAuZW5kKGZ1bmN0aW9uKHJlcyl7fSk7XG4gKlxuICogIE9yIHBhc3NlZCB0byBgLnNlbmQoKWA6XG4gKlxuICogICAgICByZXF1ZXN0XG4gKiAgICAgICAgLnBvc3QoJy91c2VyJylcbiAqICAgICAgICAuc2VuZCh7IG5hbWU6ICd0aicgfSwgZnVuY3Rpb24ocmVzKXt9KTtcbiAqXG4gKiAgT3IgcGFzc2VkIHRvIGAucG9zdCgpYDpcbiAqXG4gKiAgICAgIHJlcXVlc3RcbiAqICAgICAgICAucG9zdCgnL3VzZXInLCB7IG5hbWU6ICd0aicgfSlcbiAqICAgICAgICAuZW5kKGZ1bmN0aW9uKHJlcyl7fSk7XG4gKlxuICogT3IgZnVydGhlciByZWR1Y2VkIHRvIGEgc2luZ2xlIGNhbGwgZm9yIHNpbXBsZSBjYXNlczpcbiAqXG4gKiAgICAgIHJlcXVlc3RcbiAqICAgICAgICAucG9zdCgnL3VzZXInLCB7IG5hbWU6ICd0aicgfSwgZnVuY3Rpb24ocmVzKXt9KTtcbiAqXG4gKiBAcGFyYW0ge1hNTEhUVFBSZXF1ZXN0fSB4aHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBSZXNwb25zZShyZXEsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHRoaXMucmVxID0gcmVxO1xuICB0aGlzLnhociA9IHRoaXMucmVxLnhocjtcbiAgLy8gcmVzcG9uc2VUZXh0IGlzIGFjY2Vzc2libGUgb25seSBpZiByZXNwb25zZVR5cGUgaXMgJycgb3IgJ3RleHQnIGFuZCBvbiBvbGRlciBicm93c2Vyc1xuICB0aGlzLnRleHQgPSAoKHRoaXMucmVxLm1ldGhvZCAhPSdIRUFEJyAmJiAodGhpcy54aHIucmVzcG9uc2VUeXBlID09PSAnJyB8fCB0aGlzLnhoci5yZXNwb25zZVR5cGUgPT09ICd0ZXh0JykpIHx8IHR5cGVvZiB0aGlzLnhoci5yZXNwb25zZVR5cGUgPT09ICd1bmRlZmluZWQnKVxuICAgICA/IHRoaXMueGhyLnJlc3BvbnNlVGV4dFxuICAgICA6IG51bGw7XG4gIHRoaXMuc3RhdHVzVGV4dCA9IHRoaXMucmVxLnhoci5zdGF0dXNUZXh0O1xuICB0aGlzLl9zZXRTdGF0dXNQcm9wZXJ0aWVzKHRoaXMueGhyLnN0YXR1cyk7XG4gIHRoaXMuaGVhZGVyID0gdGhpcy5oZWFkZXJzID0gcGFyc2VIZWFkZXIodGhpcy54aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkpO1xuICAvLyBnZXRBbGxSZXNwb25zZUhlYWRlcnMgc29tZXRpbWVzIGZhbHNlbHkgcmV0dXJucyBcIlwiIGZvciBDT1JTIHJlcXVlc3RzLCBidXRcbiAgLy8gZ2V0UmVzcG9uc2VIZWFkZXIgc3RpbGwgd29ya3MuIHNvIHdlIGdldCBjb250ZW50LXR5cGUgZXZlbiBpZiBnZXR0aW5nXG4gIC8vIG90aGVyIGhlYWRlcnMgZmFpbHMuXG4gIHRoaXMuaGVhZGVyWydjb250ZW50LXR5cGUnXSA9IHRoaXMueGhyLmdldFJlc3BvbnNlSGVhZGVyKCdjb250ZW50LXR5cGUnKTtcbiAgdGhpcy5fc2V0SGVhZGVyUHJvcGVydGllcyh0aGlzLmhlYWRlcik7XG4gIHRoaXMuYm9keSA9IHRoaXMucmVxLm1ldGhvZCAhPSAnSEVBRCdcbiAgICA/IHRoaXMuX3BhcnNlQm9keSh0aGlzLnRleHQgPyB0aGlzLnRleHQgOiB0aGlzLnhoci5yZXNwb25zZSlcbiAgICA6IG51bGw7XG59XG5cbi8qKlxuICogR2V0IGNhc2UtaW5zZW5zaXRpdmUgYGZpZWxkYCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVzcG9uc2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGZpZWxkKXtcbiAgcmV0dXJuIHRoaXMuaGVhZGVyW2ZpZWxkLnRvTG93ZXJDYXNlKCldO1xufTtcblxuLyoqXG4gKiBTZXQgaGVhZGVyIHJlbGF0ZWQgcHJvcGVydGllczpcbiAqXG4gKiAgIC0gYC50eXBlYCB0aGUgY29udGVudCB0eXBlIHdpdGhvdXQgcGFyYW1zXG4gKlxuICogQSByZXNwb25zZSBvZiBcIkNvbnRlbnQtVHlwZTogdGV4dC9wbGFpbjsgY2hhcnNldD11dGYtOFwiXG4gKiB3aWxsIHByb3ZpZGUgeW91IHdpdGggYSBgLnR5cGVgIG9mIFwidGV4dC9wbGFpblwiLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBoZWFkZXJcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJlc3BvbnNlLnByb3RvdHlwZS5fc2V0SGVhZGVyUHJvcGVydGllcyA9IGZ1bmN0aW9uKGhlYWRlcil7XG4gIC8vIGNvbnRlbnQtdHlwZVxuICB2YXIgY3QgPSB0aGlzLmhlYWRlclsnY29udGVudC10eXBlJ10gfHwgJyc7XG4gIHRoaXMudHlwZSA9IHR5cGUoY3QpO1xuXG4gIC8vIHBhcmFtc1xuICB2YXIgb2JqID0gcGFyYW1zKGN0KTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikgdGhpc1trZXldID0gb2JqW2tleV07XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBib2R5IGBzdHJgLlxuICpcbiAqIFVzZWQgZm9yIGF1dG8tcGFyc2luZyBvZiBib2RpZXMuIFBhcnNlcnNcbiAqIGFyZSBkZWZpbmVkIG9uIHRoZSBgc3VwZXJhZ2VudC5wYXJzZWAgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVzcG9uc2UucHJvdG90eXBlLl9wYXJzZUJvZHkgPSBmdW5jdGlvbihzdHIpe1xuICB2YXIgcGFyc2UgPSByZXF1ZXN0LnBhcnNlW3RoaXMudHlwZV07XG4gIGlmICghcGFyc2UgJiYgaXNKU09OKHRoaXMudHlwZSkpIHtcbiAgICBwYXJzZSA9IHJlcXVlc3QucGFyc2VbJ2FwcGxpY2F0aW9uL2pzb24nXTtcbiAgfVxuICByZXR1cm4gcGFyc2UgJiYgc3RyICYmIChzdHIubGVuZ3RoIHx8IHN0ciBpbnN0YW5jZW9mIE9iamVjdClcbiAgICA/IHBhcnNlKHN0cilcbiAgICA6IG51bGw7XG59O1xuXG4vKipcbiAqIFNldCBmbGFncyBzdWNoIGFzIGAub2tgIGJhc2VkIG9uIGBzdGF0dXNgLlxuICpcbiAqIEZvciBleGFtcGxlIGEgMnh4IHJlc3BvbnNlIHdpbGwgZ2l2ZSB5b3UgYSBgLm9rYCBvZiBfX3RydWVfX1xuICogd2hlcmVhcyA1eHggd2lsbCBiZSBfX2ZhbHNlX18gYW5kIGAuZXJyb3JgIHdpbGwgYmUgX190cnVlX18uIFRoZVxuICogYC5jbGllbnRFcnJvcmAgYW5kIGAuc2VydmVyRXJyb3JgIGFyZSBhbHNvIGF2YWlsYWJsZSB0byBiZSBtb3JlXG4gKiBzcGVjaWZpYywgYW5kIGAuc3RhdHVzVHlwZWAgaXMgdGhlIGNsYXNzIG9mIGVycm9yIHJhbmdpbmcgZnJvbSAxLi41XG4gKiBzb21ldGltZXMgdXNlZnVsIGZvciBtYXBwaW5nIHJlc3BvbmQgY29sb3JzIGV0Yy5cbiAqXG4gKiBcInN1Z2FyXCIgcHJvcGVydGllcyBhcmUgYWxzbyBkZWZpbmVkIGZvciBjb21tb24gY2FzZXMuIEN1cnJlbnRseSBwcm92aWRpbmc6XG4gKlxuICogICAtIC5ub0NvbnRlbnRcbiAqICAgLSAuYmFkUmVxdWVzdFxuICogICAtIC51bmF1dGhvcml6ZWRcbiAqICAgLSAubm90QWNjZXB0YWJsZVxuICogICAtIC5ub3RGb3VuZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdGF0dXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJlc3BvbnNlLnByb3RvdHlwZS5fc2V0U3RhdHVzUHJvcGVydGllcyA9IGZ1bmN0aW9uKHN0YXR1cyl7XG4gIC8vIGhhbmRsZSBJRTkgYnVnOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwMDQ2OTcyL21zaWUtcmV0dXJucy1zdGF0dXMtY29kZS1vZi0xMjIzLWZvci1hamF4LXJlcXVlc3RcbiAgaWYgKHN0YXR1cyA9PT0gMTIyMykge1xuICAgIHN0YXR1cyA9IDIwNDtcbiAgfVxuXG4gIHZhciB0eXBlID0gc3RhdHVzIC8gMTAwIHwgMDtcblxuICAvLyBzdGF0dXMgLyBjbGFzc1xuICB0aGlzLnN0YXR1cyA9IHRoaXMuc3RhdHVzQ29kZSA9IHN0YXR1cztcbiAgdGhpcy5zdGF0dXNUeXBlID0gdHlwZTtcblxuICAvLyBiYXNpY3NcbiAgdGhpcy5pbmZvID0gMSA9PSB0eXBlO1xuICB0aGlzLm9rID0gMiA9PSB0eXBlO1xuICB0aGlzLmNsaWVudEVycm9yID0gNCA9PSB0eXBlO1xuICB0aGlzLnNlcnZlckVycm9yID0gNSA9PSB0eXBlO1xuICB0aGlzLmVycm9yID0gKDQgPT0gdHlwZSB8fCA1ID09IHR5cGUpXG4gICAgPyB0aGlzLnRvRXJyb3IoKVxuICAgIDogZmFsc2U7XG5cbiAgLy8gc3VnYXJcbiAgdGhpcy5hY2NlcHRlZCA9IDIwMiA9PSBzdGF0dXM7XG4gIHRoaXMubm9Db250ZW50ID0gMjA0ID09IHN0YXR1cztcbiAgdGhpcy5iYWRSZXF1ZXN0ID0gNDAwID09IHN0YXR1cztcbiAgdGhpcy51bmF1dGhvcml6ZWQgPSA0MDEgPT0gc3RhdHVzO1xuICB0aGlzLm5vdEFjY2VwdGFibGUgPSA0MDYgPT0gc3RhdHVzO1xuICB0aGlzLm5vdEZvdW5kID0gNDA0ID09IHN0YXR1cztcbiAgdGhpcy5mb3JiaWRkZW4gPSA0MDMgPT0gc3RhdHVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYW4gYEVycm9yYCByZXByZXNlbnRhdGl2ZSBvZiB0aGlzIHJlc3BvbnNlLlxuICpcbiAqIEByZXR1cm4ge0Vycm9yfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXNwb25zZS5wcm90b3R5cGUudG9FcnJvciA9IGZ1bmN0aW9uKCl7XG4gIHZhciByZXEgPSB0aGlzLnJlcTtcbiAgdmFyIG1ldGhvZCA9IHJlcS5tZXRob2Q7XG4gIHZhciB1cmwgPSByZXEudXJsO1xuXG4gIHZhciBtc2cgPSAnY2Fubm90ICcgKyBtZXRob2QgKyAnICcgKyB1cmwgKyAnICgnICsgdGhpcy5zdGF0dXMgKyAnKSc7XG4gIHZhciBlcnIgPSBuZXcgRXJyb3IobXNnKTtcbiAgZXJyLnN0YXR1cyA9IHRoaXMuc3RhdHVzO1xuICBlcnIubWV0aG9kID0gbWV0aG9kO1xuICBlcnIudXJsID0gdXJsO1xuXG4gIHJldHVybiBlcnI7XG59O1xuXG4vKipcbiAqIEV4cG9zZSBgUmVzcG9uc2VgLlxuICovXG5cbnJlcXVlc3QuUmVzcG9uc2UgPSBSZXNwb25zZTtcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBSZXF1ZXN0YCB3aXRoIHRoZSBnaXZlbiBgbWV0aG9kYCBhbmQgYHVybGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBSZXF1ZXN0KG1ldGhvZCwgdXJsKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5fcXVlcnkgPSB0aGlzLl9xdWVyeSB8fCBbXTtcbiAgdGhpcy5tZXRob2QgPSBtZXRob2Q7XG4gIHRoaXMudXJsID0gdXJsO1xuICB0aGlzLmhlYWRlciA9IHt9OyAvLyBwcmVzZXJ2ZXMgaGVhZGVyIG5hbWUgY2FzZVxuICB0aGlzLl9oZWFkZXIgPSB7fTsgLy8gY29lcmNlcyBoZWFkZXIgbmFtZXMgdG8gbG93ZXJjYXNlXG4gIHRoaXMub24oJ2VuZCcsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGVyciA9IG51bGw7XG4gICAgdmFyIHJlcyA9IG51bGw7XG5cbiAgICB0cnkge1xuICAgICAgcmVzID0gbmV3IFJlc3BvbnNlKHNlbGYpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgZXJyID0gbmV3IEVycm9yKCdQYXJzZXIgaXMgdW5hYmxlIHRvIHBhcnNlIHRoZSByZXNwb25zZScpO1xuICAgICAgZXJyLnBhcnNlID0gdHJ1ZTtcbiAgICAgIGVyci5vcmlnaW5hbCA9IGU7XG4gICAgICAvLyBpc3N1ZSAjNjc1OiByZXR1cm4gdGhlIHJhdyByZXNwb25zZSBpZiB0aGUgcmVzcG9uc2UgcGFyc2luZyBmYWlsc1xuICAgICAgZXJyLnJhd1Jlc3BvbnNlID0gc2VsZi54aHIgJiYgc2VsZi54aHIucmVzcG9uc2VUZXh0ID8gc2VsZi54aHIucmVzcG9uc2VUZXh0IDogbnVsbDtcbiAgICAgIC8vIGlzc3VlICM4NzY6IHJldHVybiB0aGUgaHR0cCBzdGF0dXMgY29kZSBpZiB0aGUgcmVzcG9uc2UgcGFyc2luZyBmYWlsc1xuICAgICAgZXJyLnN0YXR1c0NvZGUgPSBzZWxmLnhociAmJiBzZWxmLnhoci5zdGF0dXMgPyBzZWxmLnhoci5zdGF0dXMgOiBudWxsO1xuICAgICAgcmV0dXJuIHNlbGYuY2FsbGJhY2soZXJyKTtcbiAgICB9XG5cbiAgICBzZWxmLmVtaXQoJ3Jlc3BvbnNlJywgcmVzKTtcblxuICAgIHZhciBuZXdfZXJyO1xuICAgIHRyeSB7XG4gICAgICBpZiAocmVzLnN0YXR1cyA8IDIwMCB8fCByZXMuc3RhdHVzID49IDMwMCkge1xuICAgICAgICBuZXdfZXJyID0gbmV3IEVycm9yKHJlcy5zdGF0dXNUZXh0IHx8ICdVbnN1Y2Nlc3NmdWwgSFRUUCByZXNwb25zZScpO1xuICAgICAgICBuZXdfZXJyLm9yaWdpbmFsID0gZXJyO1xuICAgICAgICBuZXdfZXJyLnJlc3BvbnNlID0gcmVzO1xuICAgICAgICBuZXdfZXJyLnN0YXR1cyA9IHJlcy5zdGF0dXM7XG4gICAgICB9XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBuZXdfZXJyID0gZTsgLy8gIzk4NSB0b3VjaGluZyByZXMgbWF5IGNhdXNlIElOVkFMSURfU1RBVEVfRVJSIG9uIG9sZCBBbmRyb2lkXG4gICAgfVxuXG4gICAgLy8gIzEwMDAgZG9uJ3QgY2F0Y2ggZXJyb3JzIGZyb20gdGhlIGNhbGxiYWNrIHRvIGF2b2lkIGRvdWJsZSBjYWxsaW5nIGl0XG4gICAgaWYgKG5ld19lcnIpIHtcbiAgICAgIHNlbGYuY2FsbGJhY2sobmV3X2VyciwgcmVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5jYWxsYmFjayhudWxsLCByZXMpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKlxuICogTWl4aW4gYEVtaXR0ZXJgIGFuZCBgcmVxdWVzdEJhc2VgLlxuICovXG5cbkVtaXR0ZXIoUmVxdWVzdC5wcm90b3R5cGUpO1xuZm9yICh2YXIga2V5IGluIHJlcXVlc3RCYXNlKSB7XG4gIFJlcXVlc3QucHJvdG90eXBlW2tleV0gPSByZXF1ZXN0QmFzZVtrZXldO1xufVxuXG4vKipcbiAqIFNldCBDb250ZW50LVR5cGUgdG8gYHR5cGVgLCBtYXBwaW5nIHZhbHVlcyBmcm9tIGByZXF1ZXN0LnR5cGVzYC5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgIHN1cGVyYWdlbnQudHlwZXMueG1sID0gJ2FwcGxpY2F0aW9uL3htbCc7XG4gKlxuICogICAgICByZXF1ZXN0LnBvc3QoJy8nKVxuICogICAgICAgIC50eXBlKCd4bWwnKVxuICogICAgICAgIC5zZW5kKHhtbHN0cmluZylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiAgICAgIHJlcXVlc3QucG9zdCgnLycpXG4gKiAgICAgICAgLnR5cGUoJ2FwcGxpY2F0aW9uL3htbCcpXG4gKiAgICAgICAgLnNlbmQoeG1sc3RyaW5nKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUudHlwZSA9IGZ1bmN0aW9uKHR5cGUpe1xuICB0aGlzLnNldCgnQ29udGVudC1UeXBlJywgcmVxdWVzdC50eXBlc1t0eXBlXSB8fCB0eXBlKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCByZXNwb25zZVR5cGUgdG8gYHZhbGAuIFByZXNlbnRseSB2YWxpZCByZXNwb25zZVR5cGVzIGFyZSAnYmxvYicgYW5kXG4gKiAnYXJyYXlidWZmZXInLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgcmVxLmdldCgnLycpXG4gKiAgICAgICAgLnJlc3BvbnNlVHlwZSgnYmxvYicpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHZhbFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLnJlc3BvbnNlVHlwZSA9IGZ1bmN0aW9uKHZhbCl7XG4gIHRoaXMuX3Jlc3BvbnNlVHlwZSA9IHZhbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCBBY2NlcHQgdG8gYHR5cGVgLCBtYXBwaW5nIHZhbHVlcyBmcm9tIGByZXF1ZXN0LnR5cGVzYC5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgIHN1cGVyYWdlbnQudHlwZXMuanNvbiA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAqXG4gKiAgICAgIHJlcXVlc3QuZ2V0KCcvYWdlbnQnKVxuICogICAgICAgIC5hY2NlcHQoJ2pzb24nKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqICAgICAgcmVxdWVzdC5nZXQoJy9hZ2VudCcpXG4gKiAgICAgICAgLmFjY2VwdCgnYXBwbGljYXRpb24vanNvbicpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGFjY2VwdFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmFjY2VwdCA9IGZ1bmN0aW9uKHR5cGUpe1xuICB0aGlzLnNldCgnQWNjZXB0JywgcmVxdWVzdC50eXBlc1t0eXBlXSB8fCB0eXBlKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCBBdXRob3JpemF0aW9uIGZpZWxkIHZhbHVlIHdpdGggYHVzZXJgIGFuZCBgcGFzc2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXNzXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyB3aXRoICd0eXBlJyBwcm9wZXJ0eSAnYXV0bycgb3IgJ2Jhc2ljJyAoZGVmYXVsdCAnYmFzaWMnKVxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmF1dGggPSBmdW5jdGlvbih1c2VyLCBwYXNzLCBvcHRpb25zKXtcbiAgaWYgKCFvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHtcbiAgICAgIHR5cGU6ICdiYXNpYydcbiAgICB9XG4gIH1cblxuICBzd2l0Y2ggKG9wdGlvbnMudHlwZSkge1xuICAgIGNhc2UgJ2Jhc2ljJzpcbiAgICAgIHZhciBzdHIgPSBidG9hKHVzZXIgKyAnOicgKyBwYXNzKTtcbiAgICAgIHRoaXMuc2V0KCdBdXRob3JpemF0aW9uJywgJ0Jhc2ljICcgKyBzdHIpO1xuICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnYXV0byc6XG4gICAgICB0aGlzLnVzZXJuYW1lID0gdXNlcjtcbiAgICAgIHRoaXMucGFzc3dvcmQgPSBwYXNzO1xuICAgIGJyZWFrO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4qIEFkZCBxdWVyeS1zdHJpbmcgYHZhbGAuXG4qXG4qIEV4YW1wbGVzOlxuKlxuKiAgIHJlcXVlc3QuZ2V0KCcvc2hvZXMnKVxuKiAgICAgLnF1ZXJ5KCdzaXplPTEwJylcbiogICAgIC5xdWVyeSh7IGNvbG9yOiAnYmx1ZScgfSlcbipcbiogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSB2YWxcbiogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4qIEBhcGkgcHVibGljXG4qL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uKHZhbCl7XG4gIGlmICgnc3RyaW5nJyAhPSB0eXBlb2YgdmFsKSB2YWwgPSBzZXJpYWxpemUodmFsKTtcbiAgaWYgKHZhbCkgdGhpcy5fcXVlcnkucHVzaCh2YWwpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUXVldWUgdGhlIGdpdmVuIGBmaWxlYCBhcyBhbiBhdHRhY2htZW50IHRvIHRoZSBzcGVjaWZpZWQgYGZpZWxkYCxcbiAqIHdpdGggb3B0aW9uYWwgYGZpbGVuYW1lYC5cbiAqXG4gKiBgYGAganNcbiAqIHJlcXVlc3QucG9zdCgnL3VwbG9hZCcpXG4gKiAgIC5hdHRhY2goJ2NvbnRlbnQnLCBuZXcgQmxvYihbJzxhIGlkPVwiYVwiPjxiIGlkPVwiYlwiPmhleSE8L2I+PC9hPiddLCB7IHR5cGU6IFwidGV4dC9odG1sXCJ9KSlcbiAqICAgLmVuZChjYWxsYmFjayk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqIEBwYXJhbSB7QmxvYnxGaWxlfSBmaWxlXG4gKiBAcGFyYW0ge1N0cmluZ30gZmlsZW5hbWVcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5hdHRhY2ggPSBmdW5jdGlvbihmaWVsZCwgZmlsZSwgZmlsZW5hbWUpe1xuICB0aGlzLl9nZXRGb3JtRGF0YSgpLmFwcGVuZChmaWVsZCwgZmlsZSwgZmlsZW5hbWUgfHwgZmlsZS5uYW1lKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5fZ2V0Rm9ybURhdGEgPSBmdW5jdGlvbigpe1xuICBpZiAoIXRoaXMuX2Zvcm1EYXRhKSB7XG4gICAgdGhpcy5fZm9ybURhdGEgPSBuZXcgcm9vdC5Gb3JtRGF0YSgpO1xuICB9XG4gIHJldHVybiB0aGlzLl9mb3JtRGF0YTtcbn07XG5cbi8qKlxuICogSW52b2tlIHRoZSBjYWxsYmFjayB3aXRoIGBlcnJgIGFuZCBgcmVzYFxuICogYW5kIGhhbmRsZSBhcml0eSBjaGVjay5cbiAqXG4gKiBAcGFyYW0ge0Vycm9yfSBlcnJcbiAqIEBwYXJhbSB7UmVzcG9uc2V9IHJlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuY2FsbGJhY2sgPSBmdW5jdGlvbihlcnIsIHJlcyl7XG4gIHZhciBmbiA9IHRoaXMuX2NhbGxiYWNrO1xuICB0aGlzLmNsZWFyVGltZW91dCgpO1xuICBmbihlcnIsIHJlcyk7XG59O1xuXG4vKipcbiAqIEludm9rZSBjYWxsYmFjayB3aXRoIHgtZG9tYWluIGVycm9yLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmNyb3NzRG9tYWluRXJyb3IgPSBmdW5jdGlvbigpe1xuICB2YXIgZXJyID0gbmV3IEVycm9yKCdSZXF1ZXN0IGhhcyBiZWVuIHRlcm1pbmF0ZWRcXG5Qb3NzaWJsZSBjYXVzZXM6IHRoZSBuZXR3b3JrIGlzIG9mZmxpbmUsIE9yaWdpbiBpcyBub3QgYWxsb3dlZCBieSBBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4sIHRoZSBwYWdlIGlzIGJlaW5nIHVubG9hZGVkLCBldGMuJyk7XG4gIGVyci5jcm9zc0RvbWFpbiA9IHRydWU7XG5cbiAgZXJyLnN0YXR1cyA9IHRoaXMuc3RhdHVzO1xuICBlcnIubWV0aG9kID0gdGhpcy5tZXRob2Q7XG4gIGVyci51cmwgPSB0aGlzLnVybDtcblxuICB0aGlzLmNhbGxiYWNrKGVycik7XG59O1xuXG4vKipcbiAqIEludm9rZSBjYWxsYmFjayB3aXRoIHRpbWVvdXQgZXJyb3IuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuX3RpbWVvdXRFcnJvciA9IGZ1bmN0aW9uKCl7XG4gIHZhciB0aW1lb3V0ID0gdGhpcy5fdGltZW91dDtcbiAgdmFyIGVyciA9IG5ldyBFcnJvcigndGltZW91dCBvZiAnICsgdGltZW91dCArICdtcyBleGNlZWRlZCcpO1xuICBlcnIudGltZW91dCA9IHRpbWVvdXQ7XG4gIHRoaXMuY2FsbGJhY2soZXJyKTtcbn07XG5cbi8qKlxuICogQ29tcG9zZSBxdWVyeXN0cmluZyB0byBhcHBlbmQgdG8gcmVxLnVybFxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJlcXVlc3QucHJvdG90eXBlLl9hcHBlbmRRdWVyeVN0cmluZyA9IGZ1bmN0aW9uKCl7XG4gIHZhciBxdWVyeSA9IHRoaXMuX3F1ZXJ5LmpvaW4oJyYnKTtcbiAgaWYgKHF1ZXJ5KSB7XG4gICAgdGhpcy51cmwgKz0gfnRoaXMudXJsLmluZGV4T2YoJz8nKVxuICAgICAgPyAnJicgKyBxdWVyeVxuICAgICAgOiAnPycgKyBxdWVyeTtcbiAgfVxufTtcblxuLyoqXG4gKiBJbml0aWF0ZSByZXF1ZXN0LCBpbnZva2luZyBjYWxsYmFjayBgZm4ocmVzKWBcbiAqIHdpdGggYW4gaW5zdGFuY2VvZiBgUmVzcG9uc2VgLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24oZm4pe1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciB4aHIgPSB0aGlzLnhociA9IHJlcXVlc3QuZ2V0WEhSKCk7XG4gIHZhciB0aW1lb3V0ID0gdGhpcy5fdGltZW91dDtcbiAgdmFyIGRhdGEgPSB0aGlzLl9mb3JtRGF0YSB8fCB0aGlzLl9kYXRhO1xuXG4gIC8vIHN0b3JlIGNhbGxiYWNrXG4gIHRoaXMuX2NhbGxiYWNrID0gZm4gfHwgbm9vcDtcblxuICAvLyBzdGF0ZSBjaGFuZ2VcbiAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCl7XG4gICAgaWYgKDQgIT0geGhyLnJlYWR5U3RhdGUpIHJldHVybjtcblxuICAgIC8vIEluIElFOSwgcmVhZHMgdG8gYW55IHByb3BlcnR5IChlLmcuIHN0YXR1cykgb2ZmIG9mIGFuIGFib3J0ZWQgWEhSIHdpbGxcbiAgICAvLyByZXN1bHQgaW4gdGhlIGVycm9yIFwiQ291bGQgbm90IGNvbXBsZXRlIHRoZSBvcGVyYXRpb24gZHVlIHRvIGVycm9yIGMwMGMwMjNmXCJcbiAgICB2YXIgc3RhdHVzO1xuICAgIHRyeSB7IHN0YXR1cyA9IHhoci5zdGF0dXMgfSBjYXRjaChlKSB7IHN0YXR1cyA9IDA7IH1cblxuICAgIGlmICgwID09IHN0YXR1cykge1xuICAgICAgaWYgKHNlbGYudGltZWRvdXQpIHJldHVybiBzZWxmLl90aW1lb3V0RXJyb3IoKTtcbiAgICAgIGlmIChzZWxmLl9hYm9ydGVkKSByZXR1cm47XG4gICAgICByZXR1cm4gc2VsZi5jcm9zc0RvbWFpbkVycm9yKCk7XG4gICAgfVxuICAgIHNlbGYuZW1pdCgnZW5kJyk7XG4gIH07XG5cbiAgLy8gcHJvZ3Jlc3NcbiAgdmFyIGhhbmRsZVByb2dyZXNzID0gZnVuY3Rpb24oZGlyZWN0aW9uLCBlKSB7XG4gICAgaWYgKGUudG90YWwgPiAwKSB7XG4gICAgICBlLnBlcmNlbnQgPSBlLmxvYWRlZCAvIGUudG90YWwgKiAxMDA7XG4gICAgfVxuICAgIGUuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgIHNlbGYuZW1pdCgncHJvZ3Jlc3MnLCBlKTtcbiAgfVxuICBpZiAodGhpcy5oYXNMaXN0ZW5lcnMoJ3Byb2dyZXNzJykpIHtcbiAgICB0cnkge1xuICAgICAgeGhyLm9ucHJvZ3Jlc3MgPSBoYW5kbGVQcm9ncmVzcy5iaW5kKG51bGwsICdkb3dubG9hZCcpO1xuICAgICAgaWYgKHhoci51cGxvYWQpIHtcbiAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gaGFuZGxlUHJvZ3Jlc3MuYmluZChudWxsLCAndXBsb2FkJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICAvLyBBY2Nlc3NpbmcgeGhyLnVwbG9hZCBmYWlscyBpbiBJRSBmcm9tIGEgd2ViIHdvcmtlciwgc28ganVzdCBwcmV0ZW5kIGl0IGRvZXNuJ3QgZXhpc3QuXG4gICAgICAvLyBSZXBvcnRlZCBoZXJlOlxuICAgICAgLy8gaHR0cHM6Ly9jb25uZWN0Lm1pY3Jvc29mdC5jb20vSUUvZmVlZGJhY2svZGV0YWlscy84MzcyNDUveG1saHR0cHJlcXVlc3QtdXBsb2FkLXRocm93cy1pbnZhbGlkLWFyZ3VtZW50LXdoZW4tdXNlZC1mcm9tLXdlYi13b3JrZXItY29udGV4dFxuICAgIH1cbiAgfVxuXG4gIC8vIHRpbWVvdXRcbiAgaWYgKHRpbWVvdXQgJiYgIXRoaXMuX3RpbWVyKSB7XG4gICAgdGhpcy5fdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBzZWxmLnRpbWVkb3V0ID0gdHJ1ZTtcbiAgICAgIHNlbGYuYWJvcnQoKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgfVxuXG4gIC8vIHF1ZXJ5c3RyaW5nXG4gIHRoaXMuX2FwcGVuZFF1ZXJ5U3RyaW5nKCk7XG5cbiAgLy8gaW5pdGlhdGUgcmVxdWVzdFxuICBpZiAodGhpcy51c2VybmFtZSAmJiB0aGlzLnBhc3N3b3JkKSB7XG4gICAgeGhyLm9wZW4odGhpcy5tZXRob2QsIHRoaXMudXJsLCB0cnVlLCB0aGlzLnVzZXJuYW1lLCB0aGlzLnBhc3N3b3JkKTtcbiAgfSBlbHNlIHtcbiAgICB4aHIub3Blbih0aGlzLm1ldGhvZCwgdGhpcy51cmwsIHRydWUpO1xuICB9XG5cbiAgLy8gQ09SU1xuICBpZiAodGhpcy5fd2l0aENyZWRlbnRpYWxzKSB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcblxuICAvLyBib2R5XG4gIGlmICgnR0VUJyAhPSB0aGlzLm1ldGhvZCAmJiAnSEVBRCcgIT0gdGhpcy5tZXRob2QgJiYgJ3N0cmluZycgIT0gdHlwZW9mIGRhdGEgJiYgIXRoaXMuX2lzSG9zdChkYXRhKSkge1xuICAgIC8vIHNlcmlhbGl6ZSBzdHVmZlxuICAgIHZhciBjb250ZW50VHlwZSA9IHRoaXMuX2hlYWRlclsnY29udGVudC10eXBlJ107XG4gICAgdmFyIHNlcmlhbGl6ZSA9IHRoaXMuX3NlcmlhbGl6ZXIgfHwgcmVxdWVzdC5zZXJpYWxpemVbY29udGVudFR5cGUgPyBjb250ZW50VHlwZS5zcGxpdCgnOycpWzBdIDogJyddO1xuICAgIGlmICghc2VyaWFsaXplICYmIGlzSlNPTihjb250ZW50VHlwZSkpIHNlcmlhbGl6ZSA9IHJlcXVlc3Quc2VyaWFsaXplWydhcHBsaWNhdGlvbi9qc29uJ107XG4gICAgaWYgKHNlcmlhbGl6ZSkgZGF0YSA9IHNlcmlhbGl6ZShkYXRhKTtcbiAgfVxuXG4gIC8vIHNldCBoZWFkZXIgZmllbGRzXG4gIGZvciAodmFyIGZpZWxkIGluIHRoaXMuaGVhZGVyKSB7XG4gICAgaWYgKG51bGwgPT0gdGhpcy5oZWFkZXJbZmllbGRdKSBjb250aW51ZTtcbiAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihmaWVsZCwgdGhpcy5oZWFkZXJbZmllbGRdKTtcbiAgfVxuXG4gIGlmICh0aGlzLl9yZXNwb25zZVR5cGUpIHtcbiAgICB4aHIucmVzcG9uc2VUeXBlID0gdGhpcy5fcmVzcG9uc2VUeXBlO1xuICB9XG5cbiAgLy8gc2VuZCBzdHVmZlxuICB0aGlzLmVtaXQoJ3JlcXVlc3QnLCB0aGlzKTtcblxuICAvLyBJRTExIHhoci5zZW5kKHVuZGVmaW5lZCkgc2VuZHMgJ3VuZGVmaW5lZCcgc3RyaW5nIGFzIFBPU1QgcGF5bG9hZCAoaW5zdGVhZCBvZiBub3RoaW5nKVxuICAvLyBXZSBuZWVkIG51bGwgaGVyZSBpZiBkYXRhIGlzIHVuZGVmaW5lZFxuICB4aHIuc2VuZCh0eXBlb2YgZGF0YSAhPT0gJ3VuZGVmaW5lZCcgPyBkYXRhIDogbnVsbCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuXG4vKipcbiAqIEV4cG9zZSBgUmVxdWVzdGAuXG4gKi9cblxucmVxdWVzdC5SZXF1ZXN0ID0gUmVxdWVzdDtcblxuLyoqXG4gKiBHRVQgYHVybGAgd2l0aCBvcHRpb25hbCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtNaXhlZHxGdW5jdGlvbn0gW2RhdGFdIG9yIGZuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZm5dXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5yZXF1ZXN0LmdldCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgZm4pe1xuICB2YXIgcmVxID0gcmVxdWVzdCgnR0VUJywgdXJsKTtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGRhdGEpIGZuID0gZGF0YSwgZGF0YSA9IG51bGw7XG4gIGlmIChkYXRhKSByZXEucXVlcnkoZGF0YSk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuXG4vKipcbiAqIEhFQUQgYHVybGAgd2l0aCBvcHRpb25hbCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtNaXhlZHxGdW5jdGlvbn0gW2RhdGFdIG9yIGZuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZm5dXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5yZXF1ZXN0LmhlYWQgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ0hFQUQnLCB1cmwpO1xuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgZGF0YSkgZm4gPSBkYXRhLCBkYXRhID0gbnVsbDtcbiAgaWYgKGRhdGEpIHJlcS5zZW5kKGRhdGEpO1xuICBpZiAoZm4pIHJlcS5lbmQoZm4pO1xuICByZXR1cm4gcmVxO1xufTtcblxuLyoqXG4gKiBPUFRJT05TIHF1ZXJ5IHRvIGB1cmxgIHdpdGggb3B0aW9uYWwgY2FsbGJhY2sgYGZuKHJlcylgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7TWl4ZWR8RnVuY3Rpb259IFtkYXRhXSBvciBmblxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2ZuXVxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucmVxdWVzdC5vcHRpb25zID0gZnVuY3Rpb24odXJsLCBkYXRhLCBmbil7XG4gIHZhciByZXEgPSByZXF1ZXN0KCdPUFRJT05TJywgdXJsKTtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGRhdGEpIGZuID0gZGF0YSwgZGF0YSA9IG51bGw7XG4gIGlmIChkYXRhKSByZXEuc2VuZChkYXRhKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn07XG5cbi8qKlxuICogREVMRVRFIGB1cmxgIHdpdGggb3B0aW9uYWwgY2FsbGJhY2sgYGZuKHJlcylgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtmbl1cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRlbCh1cmwsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ0RFTEVURScsIHVybCk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuXG5yZXF1ZXN0WydkZWwnXSA9IGRlbDtcbnJlcXVlc3RbJ2RlbGV0ZSddID0gZGVsO1xuXG4vKipcbiAqIFBBVENIIGB1cmxgIHdpdGggb3B0aW9uYWwgYGRhdGFgIGFuZCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtNaXhlZH0gW2RhdGFdXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZm5dXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5yZXF1ZXN0LnBhdGNoID0gZnVuY3Rpb24odXJsLCBkYXRhLCBmbil7XG4gIHZhciByZXEgPSByZXF1ZXN0KCdQQVRDSCcsIHVybCk7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBkYXRhKSBmbiA9IGRhdGEsIGRhdGEgPSBudWxsO1xuICBpZiAoZGF0YSkgcmVxLnNlbmQoZGF0YSk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuXG4vKipcbiAqIFBPU1QgYHVybGAgd2l0aCBvcHRpb25hbCBgZGF0YWAgYW5kIGNhbGxiYWNrIGBmbihyZXMpYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge01peGVkfSBbZGF0YV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtmbl1cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnJlcXVlc3QucG9zdCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgZm4pe1xuICB2YXIgcmVxID0gcmVxdWVzdCgnUE9TVCcsIHVybCk7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBkYXRhKSBmbiA9IGRhdGEsIGRhdGEgPSBudWxsO1xuICBpZiAoZGF0YSkgcmVxLnNlbmQoZGF0YSk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuXG4vKipcbiAqIFBVVCBgdXJsYCB3aXRoIG9wdGlvbmFsIGBkYXRhYCBhbmQgY2FsbGJhY2sgYGZuKHJlcylgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7TWl4ZWR8RnVuY3Rpb259IFtkYXRhXSBvciBmblxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2ZuXVxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucmVxdWVzdC5wdXQgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ1BVVCcsIHVybCk7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBkYXRhKSBmbiA9IGRhdGEsIGRhdGEgPSBudWxsO1xuICBpZiAoZGF0YSkgcmVxLnNlbmQoZGF0YSk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuIiwiLyoqXG4gKiBDaGVjayBpZiBgb2JqYCBpcyBhbiBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGlzT2JqZWN0KG9iaikge1xuICByZXR1cm4gbnVsbCAhPT0gb2JqICYmICdvYmplY3QnID09PSB0eXBlb2Ygb2JqO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0O1xuIiwiLyoqXG4gKiBNb2R1bGUgb2YgbWl4ZWQtaW4gZnVuY3Rpb25zIHNoYXJlZCBiZXR3ZWVuIG5vZGUgYW5kIGNsaWVudCBjb2RlXG4gKi9cbnZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXMtb2JqZWN0Jyk7XG5cbi8qKlxuICogQ2xlYXIgcHJldmlvdXMgdGltZW91dC5cbiAqXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5jbGVhclRpbWVvdXQgPSBmdW5jdGlvbiBfY2xlYXJUaW1lb3V0KCl7XG4gIHRoaXMuX3RpbWVvdXQgPSAwO1xuICBjbGVhclRpbWVvdXQodGhpcy5fdGltZXIpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogT3ZlcnJpZGUgZGVmYXVsdCByZXNwb25zZSBib2R5IHBhcnNlclxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgdG8gY29udmVydCBpbmNvbWluZyBkYXRhIGludG8gcmVxdWVzdC5ib2R5XG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIHBhcnNlKGZuKXtcbiAgdGhpcy5fcGFyc2VyID0gZm47XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBPdmVycmlkZSBkZWZhdWx0IHJlcXVlc3QgYm9keSBzZXJpYWxpemVyXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB0byBjb252ZXJ0IGRhdGEgc2V0IHZpYSAuc2VuZCBvciAuYXR0YWNoIGludG8gcGF5bG9hZCB0byBzZW5kXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5zZXJpYWxpemUgPSBmdW5jdGlvbiBzZXJpYWxpemUoZm4pe1xuICB0aGlzLl9zZXJpYWxpemVyID0gZm47XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgdGltZW91dCB0byBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMudGltZW91dCA9IGZ1bmN0aW9uIHRpbWVvdXQobXMpe1xuICB0aGlzLl90aW1lb3V0ID0gbXM7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBQcm9taXNlIHN1cHBvcnRcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSByZXNvbHZlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSByZWplY3RcbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKi9cblxuZXhwb3J0cy50aGVuID0gZnVuY3Rpb24gdGhlbihyZXNvbHZlLCByZWplY3QpIHtcbiAgaWYgKCF0aGlzLl9mdWxsZmlsbGVkUHJvbWlzZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLl9mdWxsZmlsbGVkUHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKGlubmVyUmVzb2x2ZSwgaW5uZXJSZWplY3Qpe1xuICAgICAgc2VsZi5lbmQoZnVuY3Rpb24oZXJyLCByZXMpe1xuICAgICAgICBpZiAoZXJyKSBpbm5lclJlamVjdChlcnIpOyBlbHNlIGlubmVyUmVzb2x2ZShyZXMpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2Z1bGxmaWxsZWRQcm9taXNlLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbn1cblxuZXhwb3J0cy5jYXRjaCA9IGZ1bmN0aW9uKGNiKSB7XG4gIHJldHVybiB0aGlzLnRoZW4odW5kZWZpbmVkLCBjYik7XG59O1xuXG4vKipcbiAqIEFsbG93IGZvciBleHRlbnNpb25cbiAqL1xuXG5leHBvcnRzLnVzZSA9IGZ1bmN0aW9uIHVzZShmbikge1xuICBmbih0aGlzKTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cblxuLyoqXG4gKiBHZXQgcmVxdWVzdCBoZWFkZXIgYGZpZWxkYC5cbiAqIENhc2UtaW5zZW5zaXRpdmUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuZ2V0ID0gZnVuY3Rpb24oZmllbGQpe1xuICByZXR1cm4gdGhpcy5faGVhZGVyW2ZpZWxkLnRvTG93ZXJDYXNlKCldO1xufTtcblxuLyoqXG4gKiBHZXQgY2FzZS1pbnNlbnNpdGl2ZSBoZWFkZXIgYGZpZWxkYCB2YWx1ZS5cbiAqIFRoaXMgaXMgYSBkZXByZWNhdGVkIGludGVybmFsIEFQSS4gVXNlIGAuZ2V0KGZpZWxkKWAgaW5zdGVhZC5cbiAqXG4gKiAoZ2V0SGVhZGVyIGlzIG5vIGxvbmdlciB1c2VkIGludGVybmFsbHkgYnkgdGhlIHN1cGVyYWdlbnQgY29kZSBiYXNlKVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKiBAZGVwcmVjYXRlZFxuICovXG5cbmV4cG9ydHMuZ2V0SGVhZGVyID0gZXhwb3J0cy5nZXQ7XG5cbi8qKlxuICogU2V0IGhlYWRlciBgZmllbGRgIHRvIGB2YWxgLCBvciBtdWx0aXBsZSBmaWVsZHMgd2l0aCBvbmUgb2JqZWN0LlxuICogQ2FzZS1pbnNlbnNpdGl2ZS5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgIHJlcS5nZXQoJy8nKVxuICogICAgICAgIC5zZXQoJ0FjY2VwdCcsICdhcHBsaWNhdGlvbi9qc29uJylcbiAqICAgICAgICAuc2V0KCdYLUFQSS1LZXknLCAnZm9vYmFyJylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiAgICAgIHJlcS5nZXQoJy8nKVxuICogICAgICAgIC5zZXQoeyBBY2NlcHQ6ICdhcHBsaWNhdGlvbi9qc29uJywgJ1gtQVBJLUtleSc6ICdmb29iYXInIH0pXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBmaWVsZFxuICogQHBhcmFtIHtTdHJpbmd9IHZhbFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuc2V0ID0gZnVuY3Rpb24oZmllbGQsIHZhbCl7XG4gIGlmIChpc09iamVjdChmaWVsZCkpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gZmllbGQpIHtcbiAgICAgIHRoaXMuc2V0KGtleSwgZmllbGRba2V5XSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHRoaXMuX2hlYWRlcltmaWVsZC50b0xvd2VyQ2FzZSgpXSA9IHZhbDtcbiAgdGhpcy5oZWFkZXJbZmllbGRdID0gdmFsO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGhlYWRlciBgZmllbGRgLlxuICogQ2FzZS1pbnNlbnNpdGl2ZS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqICAgICAgcmVxLmdldCgnLycpXG4gKiAgICAgICAgLnVuc2V0KCdVc2VyLUFnZW50JylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqL1xuZXhwb3J0cy51bnNldCA9IGZ1bmN0aW9uKGZpZWxkKXtcbiAgZGVsZXRlIHRoaXMuX2hlYWRlcltmaWVsZC50b0xvd2VyQ2FzZSgpXTtcbiAgZGVsZXRlIHRoaXMuaGVhZGVyW2ZpZWxkXTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFdyaXRlIHRoZSBmaWVsZCBgbmFtZWAgYW5kIGB2YWxgLCBvciBtdWx0aXBsZSBmaWVsZHMgd2l0aCBvbmUgb2JqZWN0XG4gKiBmb3IgXCJtdWx0aXBhcnQvZm9ybS1kYXRhXCIgcmVxdWVzdCBib2RpZXMuXG4gKlxuICogYGBgIGpzXG4gKiByZXF1ZXN0LnBvc3QoJy91cGxvYWQnKVxuICogICAuZmllbGQoJ2ZvbycsICdiYXInKVxuICogICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiByZXF1ZXN0LnBvc3QoJy91cGxvYWQnKVxuICogICAuZmllbGQoeyBmb286ICdiYXInLCBiYXo6ICdxdXgnIH0pXG4gKiAgIC5lbmQoY2FsbGJhY2spO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBuYW1lXG4gKiBAcGFyYW0ge1N0cmluZ3xCbG9ifEZpbGV8QnVmZmVyfGZzLlJlYWRTdHJlYW19IHZhbFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5leHBvcnRzLmZpZWxkID0gZnVuY3Rpb24obmFtZSwgdmFsKSB7XG5cbiAgLy8gbmFtZSBzaG91bGQgYmUgZWl0aGVyIGEgc3RyaW5nIG9yIGFuIG9iamVjdC5cbiAgaWYgKG51bGwgPT09IG5hbWUgfHwgIHVuZGVmaW5lZCA9PT0gbmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignLmZpZWxkKG5hbWUsIHZhbCkgbmFtZSBjYW4gbm90IGJlIGVtcHR5Jyk7XG4gIH1cblxuICBpZiAoaXNPYmplY3QobmFtZSkpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gbmFtZSkge1xuICAgICAgdGhpcy5maWVsZChrZXksIG5hbWVba2V5XSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gdmFsIHNob3VsZCBiZSBkZWZpbmVkIG5vd1xuICBpZiAobnVsbCA9PT0gdmFsIHx8IHVuZGVmaW5lZCA9PT0gdmFsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCcuZmllbGQobmFtZSwgdmFsKSB2YWwgY2FuIG5vdCBiZSBlbXB0eScpO1xuICB9XG4gIHRoaXMuX2dldEZvcm1EYXRhKCkuYXBwZW5kKG5hbWUsIHZhbCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBYm9ydCB0aGUgcmVxdWVzdCwgYW5kIGNsZWFyIHBvdGVudGlhbCB0aW1lb3V0LlxuICpcbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5leHBvcnRzLmFib3J0ID0gZnVuY3Rpb24oKXtcbiAgaWYgKHRoaXMuX2Fib3J0ZWQpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICB0aGlzLl9hYm9ydGVkID0gdHJ1ZTtcbiAgdGhpcy54aHIgJiYgdGhpcy54aHIuYWJvcnQoKTsgLy8gYnJvd3NlclxuICB0aGlzLnJlcSAmJiB0aGlzLnJlcS5hYm9ydCgpOyAvLyBub2RlXG4gIHRoaXMuY2xlYXJUaW1lb3V0KCk7XG4gIHRoaXMuZW1pdCgnYWJvcnQnKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEVuYWJsZSB0cmFuc21pc3Npb24gb2YgY29va2llcyB3aXRoIHgtZG9tYWluIHJlcXVlc3RzLlxuICpcbiAqIE5vdGUgdGhhdCBmb3IgdGhpcyB0byB3b3JrIHRoZSBvcmlnaW4gbXVzdCBub3QgYmVcbiAqIHVzaW5nIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIgd2l0aCBhIHdpbGRjYXJkLFxuICogYW5kIGFsc28gbXVzdCBzZXQgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1DcmVkZW50aWFsc1wiXG4gKiB0byBcInRydWVcIi5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMud2l0aENyZWRlbnRpYWxzID0gZnVuY3Rpb24oKXtcbiAgLy8gVGhpcyBpcyBicm93c2VyLW9ubHkgZnVuY3Rpb25hbGl0eS4gTm9kZSBzaWRlIGlzIG5vLW9wLlxuICB0aGlzLl93aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IHRoZSBtYXggcmVkaXJlY3RzIHRvIGBuYC4gRG9lcyBub3RpbmcgaW4gYnJvd3NlciBYSFIgaW1wbGVtZW50YXRpb24uXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG5cbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnJlZGlyZWN0cyA9IGZ1bmN0aW9uKG4pe1xuICB0aGlzLl9tYXhSZWRpcmVjdHMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ29udmVydCB0byBhIHBsYWluIGphdmFzY3JpcHQgb2JqZWN0IChub3QgSlNPTiBzdHJpbmcpIG9mIHNjYWxhciBwcm9wZXJ0aWVzLlxuICogTm90ZSBhcyB0aGlzIG1ldGhvZCBpcyBkZXNpZ25lZCB0byByZXR1cm4gYSB1c2VmdWwgbm9uLXRoaXMgdmFsdWUsXG4gKiBpdCBjYW5ub3QgYmUgY2hhaW5lZC5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IGRlc2NyaWJpbmcgbWV0aG9kLCB1cmwsIGFuZCBkYXRhIG9mIHRoaXMgcmVxdWVzdFxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnRvSlNPTiA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB7XG4gICAgbWV0aG9kOiB0aGlzLm1ldGhvZCxcbiAgICB1cmw6IHRoaXMudXJsLFxuICAgIGRhdGE6IHRoaXMuX2RhdGEsXG4gICAgaGVhZGVyczogdGhpcy5faGVhZGVyXG4gIH07XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGBvYmpgIGlzIGEgaG9zdCBvYmplY3QsXG4gKiB3ZSBkb24ndCB3YW50IHRvIHNlcmlhbGl6ZSB0aGVzZSA6KVxuICpcbiAqIFRPRE86IGZ1dHVyZSBwcm9vZiwgbW92ZSB0byBjb21wb2VudCBsYW5kXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmV4cG9ydHMuX2lzSG9zdCA9IGZ1bmN0aW9uIF9pc0hvc3Qob2JqKSB7XG4gIHZhciBzdHIgPSB7fS50b1N0cmluZy5jYWxsKG9iaik7XG5cbiAgc3dpdGNoIChzdHIpIHtcbiAgICBjYXNlICdbb2JqZWN0IEZpbGVdJzpcbiAgICBjYXNlICdbb2JqZWN0IEJsb2JdJzpcbiAgICBjYXNlICdbb2JqZWN0IEZvcm1EYXRhXSc6XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogU2VuZCBgZGF0YWAgYXMgdGhlIHJlcXVlc3QgYm9keSwgZGVmYXVsdGluZyB0aGUgYC50eXBlKClgIHRvIFwianNvblwiIHdoZW5cbiAqIGFuIG9iamVjdCBpcyBnaXZlbi5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgICAvLyBtYW51YWwganNvblxuICogICAgICAgcmVxdWVzdC5wb3N0KCcvdXNlcicpXG4gKiAgICAgICAgIC50eXBlKCdqc29uJylcbiAqICAgICAgICAgLnNlbmQoJ3tcIm5hbWVcIjpcInRqXCJ9JylcbiAqICAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiAgICAgICAvLyBhdXRvIGpzb25cbiAqICAgICAgIHJlcXVlc3QucG9zdCgnL3VzZXInKVxuICogICAgICAgICAuc2VuZCh7IG5hbWU6ICd0aicgfSlcbiAqICAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiAgICAgICAvLyBtYW51YWwgeC13d3ctZm9ybS11cmxlbmNvZGVkXG4gKiAgICAgICByZXF1ZXN0LnBvc3QoJy91c2VyJylcbiAqICAgICAgICAgLnR5cGUoJ2Zvcm0nKVxuICogICAgICAgICAuc2VuZCgnbmFtZT10aicpXG4gKiAgICAgICAgIC5lbmQoY2FsbGJhY2spXG4gKlxuICogICAgICAgLy8gYXV0byB4LXd3dy1mb3JtLXVybGVuY29kZWRcbiAqICAgICAgIHJlcXVlc3QucG9zdCgnL3VzZXInKVxuICogICAgICAgICAudHlwZSgnZm9ybScpXG4gKiAgICAgICAgIC5zZW5kKHsgbmFtZTogJ3RqJyB9KVxuICogICAgICAgICAuZW5kKGNhbGxiYWNrKVxuICpcbiAqICAgICAgIC8vIGRlZmF1bHRzIHRvIHgtd3d3LWZvcm0tdXJsZW5jb2RlZFxuICogICAgICByZXF1ZXN0LnBvc3QoJy91c2VyJylcbiAqICAgICAgICAuc2VuZCgnbmFtZT10b2JpJylcbiAqICAgICAgICAuc2VuZCgnc3BlY2llcz1mZXJyZXQnKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBkYXRhXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5zZW5kID0gZnVuY3Rpb24oZGF0YSl7XG4gIHZhciBvYmogPSBpc09iamVjdChkYXRhKTtcbiAgdmFyIHR5cGUgPSB0aGlzLl9oZWFkZXJbJ2NvbnRlbnQtdHlwZSddO1xuXG4gIC8vIG1lcmdlXG4gIGlmIChvYmogJiYgaXNPYmplY3QodGhpcy5fZGF0YSkpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuICAgICAgdGhpcy5fZGF0YVtrZXldID0gZGF0YVtrZXldO1xuICAgIH1cbiAgfSBlbHNlIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgZGF0YSkge1xuICAgIC8vIGRlZmF1bHQgdG8geC13d3ctZm9ybS11cmxlbmNvZGVkXG4gICAgaWYgKCF0eXBlKSB0aGlzLnR5cGUoJ2Zvcm0nKTtcbiAgICB0eXBlID0gdGhpcy5faGVhZGVyWydjb250ZW50LXR5cGUnXTtcbiAgICBpZiAoJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgPT0gdHlwZSkge1xuICAgICAgdGhpcy5fZGF0YSA9IHRoaXMuX2RhdGFcbiAgICAgICAgPyB0aGlzLl9kYXRhICsgJyYnICsgZGF0YVxuICAgICAgICA6IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2RhdGEgPSAodGhpcy5fZGF0YSB8fCAnJykgKyBkYXRhO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9kYXRhID0gZGF0YTtcbiAgfVxuXG4gIGlmICghb2JqIHx8IHRoaXMuX2lzSG9zdChkYXRhKSkgcmV0dXJuIHRoaXM7XG5cbiAgLy8gZGVmYXVsdCB0byBqc29uXG4gIGlmICghdHlwZSkgdGhpcy50eXBlKCdqc29uJyk7XG4gIHJldHVybiB0aGlzO1xufTtcbiIsIi8vIFRoZSBub2RlIGFuZCBicm93c2VyIG1vZHVsZXMgZXhwb3NlIHZlcnNpb25zIG9mIHRoaXMgd2l0aCB0aGVcbi8vIGFwcHJvcHJpYXRlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGJvdW5kIGFzIGZpcnN0IGFyZ3VtZW50XG4vKipcbiAqIElzc3VlIGEgcmVxdWVzdDpcbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICByZXF1ZXN0KCdHRVQnLCAnL3VzZXJzJykuZW5kKGNhbGxiYWNrKVxuICogICAgcmVxdWVzdCgnL3VzZXJzJykuZW5kKGNhbGxiYWNrKVxuICogICAgcmVxdWVzdCgnL3VzZXJzJywgY2FsbGJhY2spXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IHVybCBvciBjYWxsYmFja1xuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gcmVxdWVzdChSZXF1ZXN0Q29uc3RydWN0b3IsIG1ldGhvZCwgdXJsKSB7XG4gIC8vIGNhbGxiYWNrXG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiB1cmwpIHtcbiAgICByZXR1cm4gbmV3IFJlcXVlc3RDb25zdHJ1Y3RvcignR0VUJywgbWV0aG9kKS5lbmQodXJsKTtcbiAgfVxuXG4gIC8vIHVybCBmaXJzdFxuICBpZiAoMiA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG5ldyBSZXF1ZXN0Q29uc3RydWN0b3IoJ0dFVCcsIG1ldGhvZCk7XG4gIH1cblxuICByZXR1cm4gbmV3IFJlcXVlc3RDb25zdHJ1Y3RvcihtZXRob2QsIHVybCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWVzdDtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBUaW55UXVldWU7XG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gVGlueVF1ZXVlO1xuXG5mdW5jdGlvbiBUaW55UXVldWUoZGF0YSwgY29tcGFyZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBUaW55UXVldWUpKSByZXR1cm4gbmV3IFRpbnlRdWV1ZShkYXRhLCBjb21wYXJlKTtcblxuICAgIHRoaXMuZGF0YSA9IGRhdGEgfHwgW107XG4gICAgdGhpcy5sZW5ndGggPSB0aGlzLmRhdGEubGVuZ3RoO1xuICAgIHRoaXMuY29tcGFyZSA9IGNvbXBhcmUgfHwgZGVmYXVsdENvbXBhcmU7XG5cbiAgICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAodGhpcy5sZW5ndGggPj4gMSkgLSAxOyBpID49IDA7IGktLSkgdGhpcy5fZG93bihpKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb21wYXJlKGEsIGIpIHtcbiAgICByZXR1cm4gYSA8IGIgPyAtMSA6IGEgPiBiID8gMSA6IDA7XG59XG5cblRpbnlRdWV1ZS5wcm90b3R5cGUgPSB7XG5cbiAgICBwdXNoOiBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICB0aGlzLmRhdGEucHVzaChpdGVtKTtcbiAgICAgICAgdGhpcy5sZW5ndGgrKztcbiAgICAgICAgdGhpcy5fdXAodGhpcy5sZW5ndGggLSAxKTtcbiAgICB9LFxuXG4gICAgcG9wOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHVuZGVmaW5lZDtcblxuICAgICAgICB2YXIgdG9wID0gdGhpcy5kYXRhWzBdO1xuICAgICAgICB0aGlzLmxlbmd0aC0tO1xuXG4gICAgICAgIGlmICh0aGlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YVswXSA9IHRoaXMuZGF0YVt0aGlzLmxlbmd0aF07XG4gICAgICAgICAgICB0aGlzLl9kb3duKDApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGF0YS5wb3AoKTtcblxuICAgICAgICByZXR1cm4gdG9wO1xuICAgIH0sXG5cbiAgICBwZWVrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFbMF07XG4gICAgfSxcblxuICAgIF91cDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZGF0YTtcbiAgICAgICAgdmFyIGNvbXBhcmUgPSB0aGlzLmNvbXBhcmU7XG4gICAgICAgIHZhciBpdGVtID0gZGF0YVtwb3NdO1xuXG4gICAgICAgIHdoaWxlIChwb3MgPiAwKSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gKHBvcyAtIDEpID4+IDE7XG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IGRhdGFbcGFyZW50XTtcbiAgICAgICAgICAgIGlmIChjb21wYXJlKGl0ZW0sIGN1cnJlbnQpID49IDApIGJyZWFrO1xuICAgICAgICAgICAgZGF0YVtwb3NdID0gY3VycmVudDtcbiAgICAgICAgICAgIHBvcyA9IHBhcmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIGRhdGFbcG9zXSA9IGl0ZW07XG4gICAgfSxcblxuICAgIF9kb3duOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICAgIHZhciBkYXRhID0gdGhpcy5kYXRhO1xuICAgICAgICB2YXIgY29tcGFyZSA9IHRoaXMuY29tcGFyZTtcbiAgICAgICAgdmFyIGhhbGZMZW5ndGggPSB0aGlzLmxlbmd0aCA+PiAxO1xuICAgICAgICB2YXIgaXRlbSA9IGRhdGFbcG9zXTtcblxuICAgICAgICB3aGlsZSAocG9zIDwgaGFsZkxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIGxlZnQgPSAocG9zIDw8IDEpICsgMTtcbiAgICAgICAgICAgIHZhciByaWdodCA9IGxlZnQgKyAxO1xuICAgICAgICAgICAgdmFyIGJlc3QgPSBkYXRhW2xlZnRdO1xuXG4gICAgICAgICAgICBpZiAocmlnaHQgPCB0aGlzLmxlbmd0aCAmJiBjb21wYXJlKGRhdGFbcmlnaHRdLCBiZXN0KSA8IDApIHtcbiAgICAgICAgICAgICAgICBsZWZ0ID0gcmlnaHQ7XG4gICAgICAgICAgICAgICAgYmVzdCA9IGRhdGFbcmlnaHRdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNvbXBhcmUoYmVzdCwgaXRlbSkgPj0gMCkgYnJlYWs7XG5cbiAgICAgICAgICAgIGRhdGFbcG9zXSA9IGJlc3Q7XG4gICAgICAgICAgICBwb3MgPSBsZWZ0O1xuICAgICAgICB9XG5cbiAgICAgICAgZGF0YVtwb3NdID0gaXRlbTtcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2lnbmVkQXJlYSA9IHJlcXVpcmUoJy4vc2lnbmVkX2FyZWEnKTtcbi8vIHZhciBlcXVhbHMgPSByZXF1aXJlKCcuL2VxdWFscycpO1xuXG4vKipcbiAqIEBwYXJhbSAge1N3ZWVwRXZlbnR9IGUxXG4gKiBAcGFyYW0gIHtTd2VlcEV2ZW50fSBlMlxuICogQHJldHVybiB7TnVtYmVyfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNvbXBhcmVFdmVudHMoZTEsIGUyKSB7XG4gIHZhciBwMSA9IGUxLnBvaW50O1xuICB2YXIgcDIgPSBlMi5wb2ludDtcblxuICAvLyBEaWZmZXJlbnQgeC1jb29yZGluYXRlXG4gIGlmIChwMVswXSA+IHAyWzBdKSByZXR1cm4gMTtcbiAgaWYgKHAxWzBdIDwgcDJbMF0pIHJldHVybiAtMTtcblxuICAvLyBEaWZmZXJlbnQgcG9pbnRzLCBidXQgc2FtZSB4LWNvb3JkaW5hdGVcbiAgLy8gRXZlbnQgd2l0aCBsb3dlciB5LWNvb3JkaW5hdGUgaXMgcHJvY2Vzc2VkIGZpcnN0XG4gIGlmIChwMVsxXSAhPT0gcDJbMV0pIHJldHVybiBwMVsxXSA+IHAyWzFdID8gMSA6IC0xO1xuXG4gIHJldHVybiBzcGVjaWFsQ2FzZXMoZTEsIGUyLCBwMSwgcDIpO1xufTtcblxuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xuZnVuY3Rpb24gc3BlY2lhbENhc2VzKGUxLCBlMiwgcDEsIHAyKSB7XG4gIC8vIFNhbWUgY29vcmRpbmF0ZXMsIGJ1dCBvbmUgaXMgYSBsZWZ0IGVuZHBvaW50IGFuZCB0aGUgb3RoZXIgaXNcbiAgLy8gYSByaWdodCBlbmRwb2ludC4gVGhlIHJpZ2h0IGVuZHBvaW50IGlzIHByb2Nlc3NlZCBmaXJzdFxuICBpZiAoZTEubGVmdCAhPT0gZTIubGVmdClcbiAgICByZXR1cm4gZTEubGVmdCA/IDEgOiAtMTtcblxuICAvLyB2YXIgcDIgPSBlMS5vdGhlckV2ZW50LnBvaW50LCBwMyA9IGUyLm90aGVyRXZlbnQucG9pbnQ7XG4gIC8vIHZhciBzYSA9IChwMVswXSAtIHAzWzBdKSAqIChwMlsxXSAtIHAzWzFdKSAtIChwMlswXSAtIHAzWzBdKSAqIChwMVsxXSAtIHAzWzFdKVxuICAvLyBTYW1lIGNvb3JkaW5hdGVzLCBib3RoIGV2ZW50c1xuICAvLyBhcmUgbGVmdCBlbmRwb2ludHMgb3IgcmlnaHQgZW5kcG9pbnRzLlxuICAvLyBub3QgY29sbGluZWFyXG4gIGlmIChzaWduZWRBcmVhKHAxLCBlMS5vdGhlckV2ZW50LnBvaW50LCBlMi5vdGhlckV2ZW50LnBvaW50KSAhPT0gMCkge1xuICAgIC8vIHRoZSBldmVudCBhc3NvY2lhdGUgdG8gdGhlIGJvdHRvbSBzZWdtZW50IGlzIHByb2Nlc3NlZCBmaXJzdFxuICAgIHJldHVybiAoIWUxLmlzQmVsb3coZTIub3RoZXJFdmVudC5wb2ludCkpID8gMSA6IC0xO1xuICB9XG5cbiAgcmV0dXJuICghZTEuaXNTdWJqZWN0ICYmIGUyLmlzU3ViamVjdCkgPyAxIDogLTE7XG59XG4vKiBlc2xpbnQtZW5hYmxlIG5vLXVudXNlZC12YXJzICovXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzaWduZWRBcmVhICAgID0gcmVxdWlyZSgnLi9zaWduZWRfYXJlYScpO1xudmFyIGNvbXBhcmVFdmVudHMgPSByZXF1aXJlKCcuL2NvbXBhcmVfZXZlbnRzJyk7XG52YXIgZXF1YWxzICAgICAgICA9IHJlcXVpcmUoJy4vZXF1YWxzJyk7XG5cblxuLyoqXG4gKiBAcGFyYW0gIHtTd2VlcEV2ZW50fSBsZTFcbiAqIEBwYXJhbSAge1N3ZWVwRXZlbnR9IGxlMlxuICogQHJldHVybiB7TnVtYmVyfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNvbXBhcmVTZWdtZW50cyhsZTEsIGxlMikge1xuICBpZiAobGUxID09PSBsZTIpIHJldHVybiAwO1xuXG4gIC8vIFNlZ21lbnRzIGFyZSBub3QgY29sbGluZWFyXG4gIGlmIChzaWduZWRBcmVhKGxlMS5wb2ludCwgbGUxLm90aGVyRXZlbnQucG9pbnQsIGxlMi5wb2ludCkgIT09IDAgfHxcbiAgICBzaWduZWRBcmVhKGxlMS5wb2ludCwgbGUxLm90aGVyRXZlbnQucG9pbnQsIGxlMi5vdGhlckV2ZW50LnBvaW50KSAhPT0gMCkge1xuXG4gICAgLy8gSWYgdGhleSBzaGFyZSB0aGVpciBsZWZ0IGVuZHBvaW50IHVzZSB0aGUgcmlnaHQgZW5kcG9pbnQgdG8gc29ydFxuICAgIGlmIChlcXVhbHMobGUxLnBvaW50LCBsZTIucG9pbnQpKSByZXR1cm4gbGUxLmlzQmVsb3cobGUyLm90aGVyRXZlbnQucG9pbnQpID8gLTEgOiAxO1xuXG4gICAgLy8gRGlmZmVyZW50IGxlZnQgZW5kcG9pbnQ6IHVzZSB0aGUgbGVmdCBlbmRwb2ludCB0byBzb3J0XG4gICAgaWYgKGxlMS5wb2ludFswXSA9PT0gbGUyLnBvaW50WzBdKSByZXR1cm4gbGUxLnBvaW50WzFdIDwgbGUyLnBvaW50WzFdID8gLTEgOiAxO1xuXG4gICAgLy8gaGFzIHRoZSBsaW5lIHNlZ21lbnQgYXNzb2NpYXRlZCB0byBlMSBiZWVuIGluc2VydGVkXG4gICAgLy8gaW50byBTIGFmdGVyIHRoZSBsaW5lIHNlZ21lbnQgYXNzb2NpYXRlZCB0byBlMiA/XG4gICAgaWYgKGNvbXBhcmVFdmVudHMobGUxLCBsZTIpID09PSAxKSByZXR1cm4gbGUyLmlzQWJvdmUobGUxLnBvaW50KSA/IC0xIDogMTtcblxuICAgIC8vIFRoZSBsaW5lIHNlZ21lbnQgYXNzb2NpYXRlZCB0byBlMiBoYXMgYmVlbiBpbnNlcnRlZFxuICAgIC8vIGludG8gUyBhZnRlciB0aGUgbGluZSBzZWdtZW50IGFzc29jaWF0ZWQgdG8gZTFcbiAgICByZXR1cm4gbGUxLmlzQmVsb3cobGUyLnBvaW50KSA/IC0xIDogMTtcbiAgfVxuXG4gIGlmIChsZTEuaXNTdWJqZWN0ID09PSBsZTIuaXNTdWJqZWN0KSB7IC8vIHNhbWUgcG9seWdvblxuICAgIHZhciBwMSA9IGxlMS5wb2ludCwgcDIgPSBsZTIucG9pbnQ7XG4gICAgaWYgKHAxWzBdID09PSBwMlswXSAmJiBwMVsxXSA9PT0gcDJbMV0vKmVxdWFscyhsZTEucG9pbnQsIGxlMi5wb2ludCkqLykge1xuICAgICAgcDEgPSBsZTEub3RoZXJFdmVudC5wb2ludDsgcDIgPSBsZTIub3RoZXJFdmVudC5wb2ludDtcbiAgICAgIGlmIChwMVswXSA9PT0gcDJbMF0gJiYgcDFbMV0gPT09IHAyWzFdKSByZXR1cm4gMDtcbiAgICAgIGVsc2UgcmV0dXJuIGxlMS5jb250b3VySWQgPiBsZTIuY29udG91cklkID8gMSA6IC0xO1xuICAgIH1cbiAgfSBlbHNlIHsgLy8gU2VnbWVudHMgYXJlIGNvbGxpbmVhciwgYnV0IGJlbG9uZyB0byBzZXBhcmF0ZSBwb2x5Z29uc1xuICAgIHJldHVybiBsZTEuaXNTdWJqZWN0ID8gLTEgOiAxO1xuICB9XG5cbiAgcmV0dXJuIGNvbXBhcmVFdmVudHMobGUxLCBsZTIpID09PSAxID8gMSA6IC0xO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGVkZ2VUeXBlID0gcmVxdWlyZSgnLi9lZGdlX3R5cGUnKTtcbnZhciBvcGVyYXRpb25UeXBlID0gcmVxdWlyZSgnLi9vcGVyYXRpb24nKTtcblxudmFyIElOVEVSU0VDVElPTiA9IG9wZXJhdGlvblR5cGUuSU5URVJTRUNUSU9OO1xudmFyIFVOSU9OICAgICAgICA9IG9wZXJhdGlvblR5cGUuVU5JT047XG52YXIgRElGRkVSRU5DRSAgID0gb3BlcmF0aW9uVHlwZS5ESUZGRVJFTkNFO1xudmFyIFhPUiAgICAgICAgICA9IG9wZXJhdGlvblR5cGUuWE9SO1xuXG4vKipcbiAqIEBwYXJhbSAge1N3ZWVwRXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0gIHtTd2VlcEV2ZW50fSBwcmV2XG4gKiBAcGFyYW0gIHtPcGVyYXRpb259IG9wZXJhdGlvblxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNvbXB1dGVGaWVsZHMoZXZlbnQsIHByZXYsIG9wZXJhdGlvbikge1xuICAvLyBjb21wdXRlIGluT3V0IGFuZCBvdGhlckluT3V0IGZpZWxkc1xuICBpZiAocHJldiA9PT0gbnVsbCkge1xuICAgIGV2ZW50LmluT3V0ICAgICAgPSBmYWxzZTtcbiAgICBldmVudC5vdGhlckluT3V0ID0gdHJ1ZTtcblxuICAvLyBwcmV2aW91cyBsaW5lIHNlZ21lbnQgaW4gc3dlZXBsaW5lIGJlbG9uZ3MgdG8gdGhlIHNhbWUgcG9seWdvblxuICB9IGVsc2Uge1xuICAgIGlmIChldmVudC5pc1N1YmplY3QgPT09IHByZXYuaXNTdWJqZWN0KSB7XG4gICAgICBldmVudC5pbk91dCAgICAgID0gIXByZXYuaW5PdXQ7XG4gICAgICBldmVudC5vdGhlckluT3V0ID0gcHJldi5vdGhlckluT3V0O1xuXG4gICAgLy8gcHJldmlvdXMgbGluZSBzZWdtZW50IGluIHN3ZWVwbGluZSBiZWxvbmdzIHRvIHRoZSBjbGlwcGluZyBwb2x5Z29uXG4gICAgfSBlbHNlIHtcbiAgICAgIGV2ZW50LmluT3V0ICAgICAgPSAhcHJldi5vdGhlckluT3V0O1xuICAgICAgZXZlbnQub3RoZXJJbk91dCA9IHByZXYuaXNWZXJ0aWNhbCgpID8gIXByZXYuaW5PdXQgOiBwcmV2LmluT3V0O1xuICAgIH1cblxuICAgIC8vIGNvbXB1dGUgcHJldkluUmVzdWx0IGZpZWxkXG4gICAgaWYgKHByZXYpIHtcbiAgICAgIGV2ZW50LnByZXZJblJlc3VsdCA9ICghaW5SZXN1bHQocHJldiwgb3BlcmF0aW9uKSB8fCBwcmV2LmlzVmVydGljYWwoKSkgP1xuICAgICAgICAgcHJldi5wcmV2SW5SZXN1bHQgOiBwcmV2O1xuICAgIH1cbiAgfVxuXG4gIC8vIGNoZWNrIGlmIHRoZSBsaW5lIHNlZ21lbnQgYmVsb25ncyB0byB0aGUgQm9vbGVhbiBvcGVyYXRpb25cbiAgZXZlbnQuaW5SZXN1bHQgPSBpblJlc3VsdChldmVudCwgb3BlcmF0aW9uKTtcbn07XG5cblxuLyogZXNsaW50LWRpc2FibGUgaW5kZW50ICovXG5mdW5jdGlvbiBpblJlc3VsdChldmVudCwgb3BlcmF0aW9uKSB7XG4gIHN3aXRjaCAoZXZlbnQudHlwZSkge1xuICAgIGNhc2UgZWRnZVR5cGUuTk9STUFMOlxuICAgICAgc3dpdGNoIChvcGVyYXRpb24pIHtcbiAgICAgICAgY2FzZSBJTlRFUlNFQ1RJT046XG4gICAgICAgICAgcmV0dXJuICFldmVudC5vdGhlckluT3V0O1xuICAgICAgICBjYXNlIFVOSU9OOlxuICAgICAgICAgIHJldHVybiBldmVudC5vdGhlckluT3V0O1xuICAgICAgICBjYXNlIERJRkZFUkVOQ0U6XG4gICAgICAgICAgLy8gcmV0dXJuIChldmVudC5pc1N1YmplY3QgJiYgIWV2ZW50Lm90aGVySW5PdXQpIHx8XG4gICAgICAgICAgLy8gICAgICAgICAoIWV2ZW50LmlzU3ViamVjdCAmJiBldmVudC5vdGhlckluT3V0KTtcbiAgICAgICAgICByZXR1cm4gKGV2ZW50LmlzU3ViamVjdCAmJiBldmVudC5vdGhlckluT3V0KSB8fFxuICAgICAgICAgICAgICAgICAgKCFldmVudC5pc1N1YmplY3QgJiYgIWV2ZW50Lm90aGVySW5PdXQpO1xuICAgICAgICBjYXNlIFhPUjpcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZWRnZVR5cGUuU0FNRV9UUkFOU0lUSU9OOlxuICAgICAgcmV0dXJuIG9wZXJhdGlvbiA9PT0gSU5URVJTRUNUSU9OIHx8IG9wZXJhdGlvbiA9PT0gVU5JT047XG4gICAgY2FzZSBlZGdlVHlwZS5ESUZGRVJFTlRfVFJBTlNJVElPTjpcbiAgICAgIHJldHVybiBvcGVyYXRpb24gPT09IERJRkZFUkVOQ0U7XG4gICAgY2FzZSBlZGdlVHlwZS5OT05fQ09OVFJJQlVUSU5HOlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbi8qIGVzbGludC1lbmFibGUgaW5kZW50ICovXG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIHZhciBlcXVhbHMgPSByZXF1aXJlKCcuL2VxdWFscycpO1xudmFyIGNvbXBhcmVFdmVudHMgPSByZXF1aXJlKCcuL2NvbXBhcmVfZXZlbnRzJyk7XG52YXIgb3BlcmF0aW9uVHlwZSA9IHJlcXVpcmUoJy4vb3BlcmF0aW9uJyk7XG5cbi8qKlxuICogQHBhcmFtICB7QXJyYXkuPFN3ZWVwRXZlbnQ+fSBzb3J0ZWRFdmVudHNcbiAqIEByZXR1cm4ge0FycmF5LjxTd2VlcEV2ZW50Pn1cbiAqL1xuZnVuY3Rpb24gb3JkZXJFdmVudHMoc29ydGVkRXZlbnRzKSB7XG4gIHZhciBldmVudCwgaSwgbGVuLCB0bXA7XG4gIHZhciByZXN1bHRFdmVudHMgPSBbXTtcbiAgZm9yIChpID0gMCwgbGVuID0gc29ydGVkRXZlbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgZXZlbnQgPSBzb3J0ZWRFdmVudHNbaV07XG4gICAgaWYgKChldmVudC5sZWZ0ICYmIGV2ZW50LmluUmVzdWx0KSB8fFxuICAgICAgKCFldmVudC5sZWZ0ICYmIGV2ZW50Lm90aGVyRXZlbnQuaW5SZXN1bHQpKSB7XG4gICAgICByZXN1bHRFdmVudHMucHVzaChldmVudCk7XG4gICAgfVxuICB9XG4gIC8vIER1ZSB0byBvdmVybGFwcGluZyBlZGdlcyB0aGUgcmVzdWx0RXZlbnRzIGFycmF5IGNhbiBiZSBub3Qgd2hvbGx5IHNvcnRlZFxuICB2YXIgc29ydGVkID0gZmFsc2U7XG4gIHdoaWxlICghc29ydGVkKSB7XG4gICAgc29ydGVkID0gdHJ1ZTtcbiAgICBmb3IgKGkgPSAwLCBsZW4gPSByZXN1bHRFdmVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGlmICgoaSArIDEpIDwgbGVuICYmXG4gICAgICAgIGNvbXBhcmVFdmVudHMocmVzdWx0RXZlbnRzW2ldLCByZXN1bHRFdmVudHNbaSArIDFdKSA9PT0gMSkge1xuICAgICAgICB0bXAgPSByZXN1bHRFdmVudHNbaV07XG4gICAgICAgIHJlc3VsdEV2ZW50c1tpXSA9IHJlc3VsdEV2ZW50c1tpICsgMV07XG4gICAgICAgIHJlc3VsdEV2ZW50c1tpICsgMV0gPSB0bXA7XG4gICAgICAgIHNvcnRlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZvciAoaSA9IDAsIGxlbiA9IHJlc3VsdEV2ZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGV2ZW50ID0gcmVzdWx0RXZlbnRzW2ldO1xuICAgIGV2ZW50LnBvcyA9IGk7XG5cbiAgICBpZiAoIWV2ZW50LmxlZnQpIHtcbiAgICAgIHRtcCA9IGV2ZW50LnBvcztcbiAgICAgIGV2ZW50LnBvcyA9IGV2ZW50Lm90aGVyRXZlbnQucG9zO1xuICAgICAgZXZlbnQub3RoZXJFdmVudC5wb3MgPSB0bXA7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdEV2ZW50cztcbn1cblxuXG4vKipcbiAqIEBwYXJhbSAge051bWJlcn0gcG9zXG4gKiBAcGFyYW0gIHtBcnJheS48U3dlZXBFdmVudD59IHJlc3VsdEV2ZW50c1xuICogQHBhcmFtICB7T2JqZWN0Pn0gICAgcHJvY2Vzc2VkXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIG5leHRQb3MocG9zLCByZXN1bHRFdmVudHMsIHByb2Nlc3NlZCwgb3JpZ0luZGV4KSB7XG4gIHZhciBuZXdQb3MgPSBwb3MgKyAxO1xuICB2YXIgbGVuZ3RoID0gcmVzdWx0RXZlbnRzLmxlbmd0aDtcbiAgaWYgKG5ld1BvcyA+IGxlbmd0aCAtIDEpIHJldHVybiBwb3MgLSAxO1xuICB2YXIgcCAgPSByZXN1bHRFdmVudHNbcG9zXS5wb2ludDtcbiAgdmFyIHAxID0gcmVzdWx0RXZlbnRzW25ld1Bvc10ucG9pbnQ7XG5cblxuICAvLyB3aGlsZSBpbiByYW5nZSBhbmQgbm90IHRoZSBjdXJyZW50IG9uZSBieSB2YWx1ZVxuICB3aGlsZSAobmV3UG9zIDwgbGVuZ3RoICYmIHAxWzBdID09PSBwWzBdICYmIHAxWzFdID09PSBwWzFdKSB7XG4gICAgaWYgKCFwcm9jZXNzZWRbbmV3UG9zXSkge1xuICAgICAgcmV0dXJuIG5ld1BvcztcbiAgICB9IGVsc2UgICB7XG4gICAgICBuZXdQb3MrKztcbiAgICB9XG4gICAgcDEgPSByZXN1bHRFdmVudHNbbmV3UG9zXS5wb2ludDtcbiAgfVxuXG4gIG5ld1BvcyA9IHBvcyAtIDE7XG5cbiAgd2hpbGUgKHByb2Nlc3NlZFtuZXdQb3NdICYmIG5ld1BvcyA+PSBvcmlnSW5kZXgpIHtcbiAgICBuZXdQb3MtLTtcbiAgfVxuICByZXR1cm4gbmV3UG9zO1xufVxuXG5cbi8qKlxuICogQHBhcmFtICB7QXJyYXkuPFN3ZWVwRXZlbnQ+fSBzb3J0ZWRFdmVudHNcbiAqIEByZXR1cm4ge0FycmF5LjwqPn0gcG9seWdvbnNcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjb25uZWN0RWRnZXMoc29ydGVkRXZlbnRzLCBvcGVyYXRpb24pIHtcbiAgdmFyIGksIGxlbjtcbiAgdmFyIHJlc3VsdEV2ZW50cyA9IG9yZGVyRXZlbnRzKHNvcnRlZEV2ZW50cyk7XG5cbiAgLy8gXCJmYWxzZVwiLWZpbGxlZCBhcnJheVxuICB2YXIgcHJvY2Vzc2VkID0ge307XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgdmFyIGV2ZW50O1xuXG4gIGZvciAoaSA9IDAsIGxlbiA9IHJlc3VsdEV2ZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChwcm9jZXNzZWRbaV0pIGNvbnRpbnVlO1xuICAgIHZhciBjb250b3VyID0gW1tdXTtcblxuICAgIGlmICghcmVzdWx0RXZlbnRzW2ldLmlzRXh0ZXJpb3JSaW5nKSB7XG4gICAgICBpZiAob3BlcmF0aW9uID09PSBvcGVyYXRpb25UeXBlLkRJRkZFUkVOQ0UgJiYgIXJlc3VsdEV2ZW50c1tpXS5pc1N1YmplY3QgJiYgcmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXN1bHQucHVzaChjb250b3VyKTtcbiAgICAgIH0gZWxzZSBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXN1bHQucHVzaChbW2NvbnRvdXJdXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdLnB1c2goY29udG91clswXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09IG9wZXJhdGlvblR5cGUuRElGRkVSRU5DRSAmJiAhcmVzdWx0RXZlbnRzW2ldLmlzU3ViamVjdCAmJiByZXN1bHQubGVuZ3RoID4gMSkge1xuICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXS5wdXNoKGNvbnRvdXJbMF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQucHVzaChjb250b3VyKTtcbiAgICB9XG5cbiAgICB2YXIgcmluZ0lkID0gcmVzdWx0Lmxlbmd0aCAtIDE7XG4gICAgdmFyIHBvcyA9IGk7XG5cbiAgICB2YXIgaW5pdGlhbCA9IHJlc3VsdEV2ZW50c1tpXS5wb2ludDtcbiAgICBjb250b3VyWzBdLnB1c2goaW5pdGlhbCk7XG5cbiAgICB3aGlsZSAocG9zID49IGkpIHtcbiAgICAgIGV2ZW50ID0gcmVzdWx0RXZlbnRzW3Bvc107XG4gICAgICBwcm9jZXNzZWRbcG9zXSA9IHRydWU7XG5cbiAgICAgIGlmIChldmVudC5sZWZ0KSB7XG4gICAgICAgIGV2ZW50LnJlc3VsdEluT3V0ID0gZmFsc2U7XG4gICAgICAgIGV2ZW50LmNvbnRvdXJJZCAgID0gcmluZ0lkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXZlbnQub3RoZXJFdmVudC5yZXN1bHRJbk91dCA9IHRydWU7XG4gICAgICAgIGV2ZW50Lm90aGVyRXZlbnQuY29udG91cklkICAgPSByaW5nSWQ7XG4gICAgICB9XG5cbiAgICAgIHBvcyA9IGV2ZW50LnBvcztcbiAgICAgIHByb2Nlc3NlZFtwb3NdID0gdHJ1ZTtcbiAgICAgIGNvbnRvdXJbMF0ucHVzaChyZXN1bHRFdmVudHNbcG9zXS5wb2ludCk7XG4gICAgICBwb3MgPSBuZXh0UG9zKHBvcywgcmVzdWx0RXZlbnRzLCBwcm9jZXNzZWQsIGkpO1xuICAgIH1cblxuICAgIHBvcyA9IHBvcyA9PT0gLTEgPyBpIDogcG9zO1xuXG4gICAgZXZlbnQgPSByZXN1bHRFdmVudHNbcG9zXTtcbiAgICBwcm9jZXNzZWRbcG9zXSA9IHByb2Nlc3NlZFtldmVudC5wb3NdID0gdHJ1ZTtcbiAgICBldmVudC5vdGhlckV2ZW50LnJlc3VsdEluT3V0ID0gdHJ1ZTtcbiAgICBldmVudC5vdGhlckV2ZW50LmNvbnRvdXJJZCAgID0gcmluZ0lkO1xuICB9XG5cbiAgLy8gZm9yIChpID0gMCwgbGVuID0gcmVzdWx0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gIC8vICAgdmFyIHBvbHlnb24gPSByZXN1bHRbaV07XG4gIC8vICAgZm9yICh2YXIgaiA9IDAsIGpqID0gcG9seWdvbi5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gIC8vICAgICB2YXIgcG9seWdvbkNvbnRvdXIgPSBwb2x5Z29uW2pdO1xuICAvLyAgICAgZm9yICh2YXIgayA9IDAsIGtrID0gcG9seWdvbkNvbnRvdXIubGVuZ3RoOyBrIDwga2s7IGsrKykge1xuICAvLyAgICAgICB2YXIgY29vcmRzID0gcG9seWdvbkNvbnRvdXJba107XG4gIC8vICAgICAgIGlmICh0eXBlb2YgY29vcmRzWzBdICE9PSAnbnVtYmVyJykge1xuICAvLyAgICAgICAgIHBvbHlnb24uc3BsaWNlKGosIDEpO1xuICAvLyAgICAgICAgIHBvbHlnb24ucHVzaChjb29yZHMpO1xuICAvLyAgICAgICB9XG4gIC8vICAgICB9XG4gIC8vICAgfVxuICAvLyB9XG5cbiAgLy8gSGFuZGxlIGlmIHRoZSByZXN1bHQgaXMgYSBwb2x5Z29uIChlZyBub3QgbXVsdGlwb2x5KVxuICAvLyBDb21tZW50ZWQgaXQgYWdhaW4sIGxldCdzIHNlZSB3aGF0IGRvIHdlIG1lYW4gYnkgdGhhdFxuICAvLyBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMSkgcmVzdWx0ID0gcmVzdWx0WzBdO1xuICByZXR1cm4gcmVzdWx0O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFN3ZWVwRXZlbnQgICAgPSByZXF1aXJlKCcuL3N3ZWVwX2V2ZW50Jyk7XG52YXIgZXF1YWxzICAgICAgICA9IHJlcXVpcmUoJy4vZXF1YWxzJyk7XG52YXIgY29tcGFyZUV2ZW50cyA9IHJlcXVpcmUoJy4vY29tcGFyZV9ldmVudHMnKTtcblxuLyoqXG4gKiBAcGFyYW0gIHtTd2VlcEV2ZW50fSBzZVxuICogQHBhcmFtICB7QXJyYXkuPE51bWJlcj59IHBcbiAqIEBwYXJhbSAge1F1ZXVlfSBxdWV1ZVxuICogQHJldHVybiB7UXVldWV9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGl2aWRlU2VnbWVudChzZSwgcCwgcXVldWUpICB7XG4gIHZhciByID0gbmV3IFN3ZWVwRXZlbnQocCwgZmFsc2UsIHNlLCAgICAgICAgICAgIHNlLmlzU3ViamVjdCk7XG4gIHZhciBsID0gbmV3IFN3ZWVwRXZlbnQocCwgdHJ1ZSwgIHNlLm90aGVyRXZlbnQsIHNlLmlzU3ViamVjdCk7XG5cbiAgaWYgKGVxdWFscyhzZS5wb2ludCwgc2Uub3RoZXJFdmVudC5wb2ludCkpIHtcbiAgICBjb25zb2xlLndhcm4oJ3doYXQgaXMgdGhhdCwgYSBjb2xsYXBzZWQgc2VnbWVudD8nLCBzZSk7XG4gIH1cblxuICByLmNvbnRvdXJJZCA9IGwuY29udG91cklkID0gc2UuY29udG91cklkO1xuXG4gIC8vIGF2b2lkIGEgcm91bmRpbmcgZXJyb3IuIFRoZSBsZWZ0IGV2ZW50IHdvdWxkIGJlIHByb2Nlc3NlZCBhZnRlciB0aGUgcmlnaHQgZXZlbnRcbiAgaWYgKGNvbXBhcmVFdmVudHMobCwgc2Uub3RoZXJFdmVudCkgPiAwKSB7XG4gICAgc2Uub3RoZXJFdmVudC5sZWZ0ID0gdHJ1ZTtcbiAgICBsLmxlZnQgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIGF2b2lkIGEgcm91bmRpbmcgZXJyb3IuIFRoZSBsZWZ0IGV2ZW50IHdvdWxkIGJlIHByb2Nlc3NlZCBhZnRlciB0aGUgcmlnaHQgZXZlbnRcbiAgLy8gaWYgKGNvbXBhcmVFdmVudHMoc2UsIHIpID4gMCkge31cblxuICBzZS5vdGhlckV2ZW50Lm90aGVyRXZlbnQgPSBsO1xuICBzZS5vdGhlckV2ZW50ID0gcjtcblxuICBxdWV1ZS5wdXNoKGwpO1xuICBxdWV1ZS5wdXNoKHIpO1xuXG4gIHJldHVybiBxdWV1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBOT1JNQUw6ICAgICAgICAgICAgICAgMCxcbiAgTk9OX0NPTlRSSUJVVElORzogICAgIDEsXG4gIFNBTUVfVFJBTlNJVElPTjogICAgICAyLFxuICBESUZGRVJFTlRfVFJBTlNJVElPTjogM1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gdmFyIEVQU0lMT04gPSAxZS05O1xuLy8gdmFyIGFicyA9IE1hdGguYWJzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGVxdWFscyhwMSwgcDIpIHtcbiAgaWYgKHAxWzBdID09PSBwMlswXSkge1xuICAgIGlmIChwMVsxXSA9PT0gcDJbMV0pIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8vIFRPRE8gaHR0cHM6Ly9naXRodWIuY29tL3c4ci9tYXJ0aW5lei9pc3N1ZXMvNiNpc3N1ZWNvbW1lbnQtMjYyODQ3MTY0XG4vLyBQcmVjaXNpb24gcHJvYmxlbS5cbi8vXG4vLyBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGVxdWFscyhwMSwgcDIpIHtcbi8vICAgcmV0dXJuIGFicyhwMVswXSAtIHAyWzBdKSA8PSBFUFNJTE9OICYmIGFicyhwMVsxXSAtIHAyWzFdKSA8PSBFUFNJTE9OO1xuLy8gfTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFF1ZXVlICAgICAgICAgICA9IHJlcXVpcmUoJ3RpbnlxdWV1ZScpO1xudmFyIFN3ZWVwRXZlbnQgICAgICA9IHJlcXVpcmUoJy4vc3dlZXBfZXZlbnQnKTtcbnZhciBjb21wYXJlRXZlbnRzICAgPSByZXF1aXJlKCcuL2NvbXBhcmVfZXZlbnRzJyk7XG52YXIgb3BlcmF0aW9ucyAgICAgID0gcmVxdWlyZSgnLi9vcGVyYXRpb24nKTtcblxudmFyIG1heCA9IE1hdGgubWF4O1xudmFyIG1pbiA9IE1hdGgubWluO1xuXG52YXIgY29udG91cklkID0gMDtcblxuXG5mdW5jdGlvbiBwcm9jZXNzUG9seWdvbihjb250b3VyT3JIb2xlLCBpc1N1YmplY3QsIGRlcHRoLCBRLCBiYm94LCBpc0V4dGVyaW9yUmluZykge1xuICB2YXIgaSwgbGVuLCBzMSwgczIsIGUxLCBlMjtcbiAgZm9yIChpID0gMCwgbGVuID0gY29udG91ck9ySG9sZS5sZW5ndGggLSAxOyBpIDwgbGVuOyBpKyspIHtcbiAgICBzMSA9IGNvbnRvdXJPckhvbGVbaV07XG4gICAgczIgPSBjb250b3VyT3JIb2xlW2kgKyAxXTtcbiAgICBlMSA9IG5ldyBTd2VlcEV2ZW50KHMxLCBmYWxzZSwgdW5kZWZpbmVkLCBpc1N1YmplY3QpO1xuICAgIGUyID0gbmV3IFN3ZWVwRXZlbnQoczIsIGZhbHNlLCBlMSwgICAgICAgIGlzU3ViamVjdCk7XG4gICAgZTEub3RoZXJFdmVudCA9IGUyO1xuXG4gICAgaWYgKHMxWzBdID09PSBzMlswXSAmJiBzMVsxXSA9PT0gczJbMV0pIHtcbiAgICAgIGNvbnRpbnVlOyAvLyBza2lwIGNvbGxhcHNlZCBlZGdlcywgb3IgaXQgYnJlYWtzXG4gICAgfVxuXG4gICAgZTEuY29udG91cklkID0gZTIuY29udG91cklkID0gZGVwdGg7XG4gICAgaWYgKCFpc0V4dGVyaW9yUmluZykge1xuICAgICAgZTEuaXNFeHRlcmlvclJpbmcgPSBmYWxzZTtcbiAgICAgIGUyLmlzRXh0ZXJpb3JSaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChjb21wYXJlRXZlbnRzKGUxLCBlMikgPiAwKSB7XG4gICAgICBlMi5sZWZ0ID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZTEubGVmdCA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIHggPSBzMVswXSwgeSA9IHMxWzFdO1xuICAgIGJib3hbMF0gPSBtaW4oYmJveFswXSwgeCk7XG4gICAgYmJveFsxXSA9IG1pbihiYm94WzFdLCB5KTtcbiAgICBiYm94WzJdID0gbWF4KGJib3hbMl0sIHgpO1xuICAgIGJib3hbM10gPSBtYXgoYmJveFszXSwgeSk7XG5cbiAgICAvLyBQdXNoaW5nIGl0IHNvIHRoZSBxdWV1ZSBpcyBzb3J0ZWQgZnJvbSBsZWZ0IHRvIHJpZ2h0LFxuICAgIC8vIHdpdGggb2JqZWN0IG9uIHRoZSBsZWZ0IGhhdmluZyB0aGUgaGlnaGVzdCBwcmlvcml0eS5cbiAgICBRLnB1c2goZTEpO1xuICAgIFEucHVzaChlMik7XG4gIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZpbGxRdWV1ZShzdWJqZWN0LCBjbGlwcGluZywgc2Jib3gsIGNiYm94LCBvcGVyYXRpb24pIHtcbiAgdmFyIGV2ZW50UXVldWUgPSBuZXcgUXVldWUobnVsbCwgY29tcGFyZUV2ZW50cyk7XG4gIHZhciBwb2x5Z29uU2V0LCBpc0V4dGVyaW9yUmluZywgaSwgaWksIGosIGpqOyAvLywgaywga2s7XG5cbiAgZm9yIChpID0gMCwgaWkgPSBzdWJqZWN0Lmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICBwb2x5Z29uU2V0ID0gc3ViamVjdFtpXTtcbiAgICBmb3IgKGogPSAwLCBqaiA9IHBvbHlnb25TZXQubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgaXNFeHRlcmlvclJpbmcgPSBqID09PSAwO1xuICAgICAgaWYgKGlzRXh0ZXJpb3JSaW5nKSBjb250b3VySWQrKztcbiAgICAgIHByb2Nlc3NQb2x5Z29uKHBvbHlnb25TZXRbal0sIHRydWUsIGNvbnRvdXJJZCwgZXZlbnRRdWV1ZSwgc2Jib3gsIGlzRXh0ZXJpb3JSaW5nKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGkgPSAwLCBpaSA9IGNsaXBwaW5nLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICBwb2x5Z29uU2V0ID0gY2xpcHBpbmdbaV07XG4gICAgZm9yIChqID0gMCwgamogPSBwb2x5Z29uU2V0Lmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgIGlzRXh0ZXJpb3JSaW5nID0gaiA9PT0gMDtcbiAgICAgIGlmIChvcGVyYXRpb24gPT09IG9wZXJhdGlvbnMuRElGRkVSRU5DRSkgaXNFeHRlcmlvclJpbmcgPSBmYWxzZTtcbiAgICAgIGlmIChpc0V4dGVyaW9yUmluZykgY29udG91cklkKys7XG4gICAgICBwcm9jZXNzUG9seWdvbihwb2x5Z29uU2V0W2pdLCBmYWxzZSwgY29udG91cklkLCBldmVudFF1ZXVlLCBjYmJveCwgaXNFeHRlcmlvclJpbmcpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBldmVudFF1ZXVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHN1YmRpdmlkZVNlZ21lbnRzID0gcmVxdWlyZSgnLi9zdWJkaXZpZGVfc2VnbWVudHMnKTtcbnZhciBjb25uZWN0RWRnZXMgICAgICA9IHJlcXVpcmUoJy4vY29ubmVjdF9lZGdlcycpO1xudmFyIGZpbGxRdWV1ZSAgICAgICAgID0gcmVxdWlyZSgnLi9maWxsX3F1ZXVlJyk7XG52YXIgb3BlcmF0aW9ucyAgICAgICAgPSByZXF1aXJlKCcuL29wZXJhdGlvbicpO1xuXG52YXIgRU1QVFkgPSBbXTtcblxuXG5mdW5jdGlvbiB0cml2aWFsT3BlcmF0aW9uKHN1YmplY3QsIGNsaXBwaW5nLCBvcGVyYXRpb24pIHtcbiAgdmFyIHJlc3VsdCA9IG51bGw7XG4gIGlmIChzdWJqZWN0Lmxlbmd0aCAqIGNsaXBwaW5nLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmICAgICAgICAob3BlcmF0aW9uID09PSBvcGVyYXRpb25zLklOVEVSU0VDVElPTikge1xuICAgICAgcmVzdWx0ID0gRU1QVFk7XG4gICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09IG9wZXJhdGlvbnMuRElGRkVSRU5DRSkge1xuICAgICAgcmVzdWx0ID0gc3ViamVjdDtcbiAgICB9IGVsc2UgaWYgKG9wZXJhdGlvbiA9PT0gb3BlcmF0aW9ucy5VTklPTiB8fFxuICAgICAgICAgICAgICAgb3BlcmF0aW9uID09PSBvcGVyYXRpb25zLlhPUikge1xuICAgICAgcmVzdWx0ID0gKHN1YmplY3QubGVuZ3RoID09PSAwKSA/IGNsaXBwaW5nIDogc3ViamVjdDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5mdW5jdGlvbiBjb21wYXJlQkJveGVzKHN1YmplY3QsIGNsaXBwaW5nLCBzYmJveCwgY2Jib3gsIG9wZXJhdGlvbikge1xuICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgaWYgKHNiYm94WzBdID4gY2Jib3hbMl0gfHxcbiAgICAgIGNiYm94WzBdID4gc2Jib3hbMl0gfHxcbiAgICAgIHNiYm94WzFdID4gY2Jib3hbM10gfHxcbiAgICAgIGNiYm94WzFdID4gc2Jib3hbM10pIHtcbiAgICBpZiAgICAgICAgKG9wZXJhdGlvbiA9PT0gb3BlcmF0aW9ucy5JTlRFUlNFQ1RJT04pIHtcbiAgICAgIHJlc3VsdCA9IEVNUFRZO1xuICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uID09PSBvcGVyYXRpb25zLkRJRkZFUkVOQ0UpIHtcbiAgICAgIHJlc3VsdCA9IHN1YmplY3Q7XG4gICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09IG9wZXJhdGlvbnMuVU5JT04gfHxcbiAgICAgICAgICAgICAgIG9wZXJhdGlvbiA9PT0gb3BlcmF0aW9ucy5YT1IpIHtcbiAgICAgIHJlc3VsdCA9IHN1YmplY3QuY29uY2F0KGNsaXBwaW5nKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5mdW5jdGlvbiBib29sZWFuKHN1YmplY3QsIGNsaXBwaW5nLCBvcGVyYXRpb24pIHtcbiAgaWYgKHR5cGVvZiBzdWJqZWN0WzBdWzBdWzBdID09PSAnbnVtYmVyJykge1xuICAgIHN1YmplY3QgPSBbc3ViamVjdF07XG4gIH1cbiAgaWYgKHR5cGVvZiBjbGlwcGluZ1swXVswXVswXSA9PT0gJ251bWJlcicpIHtcbiAgICBjbGlwcGluZyA9IFtjbGlwcGluZ107XG4gIH1cbiAgdmFyIHRyaXZpYWwgPSB0cml2aWFsT3BlcmF0aW9uKHN1YmplY3QsIGNsaXBwaW5nLCBvcGVyYXRpb24pO1xuICBpZiAodHJpdmlhbCkge1xuICAgIHJldHVybiB0cml2aWFsID09PSBFTVBUWSA/IG51bGwgOiB0cml2aWFsO1xuICB9XG4gIHZhciBzYmJveCA9IFtJbmZpbml0eSwgSW5maW5pdHksIC1JbmZpbml0eSwgLUluZmluaXR5XTtcbiAgdmFyIGNiYm94ID0gW0luZmluaXR5LCBJbmZpbml0eSwgLUluZmluaXR5LCAtSW5maW5pdHldO1xuXG4gIC8vY29uc29sZS50aW1lKCdmaWxsIHF1ZXVlJyk7XG4gIHZhciBldmVudFF1ZXVlID0gZmlsbFF1ZXVlKHN1YmplY3QsIGNsaXBwaW5nLCBzYmJveCwgY2Jib3gsIG9wZXJhdGlvbik7XG4gIC8vY29uc29sZS50aW1lRW5kKCdmaWxsIHF1ZXVlJyk7XG5cbiAgdHJpdmlhbCA9IGNvbXBhcmVCQm94ZXMoc3ViamVjdCwgY2xpcHBpbmcsIHNiYm94LCBjYmJveCwgb3BlcmF0aW9uKTtcbiAgaWYgKHRyaXZpYWwpIHtcbiAgICByZXR1cm4gdHJpdmlhbCA9PT0gRU1QVFkgPyBudWxsIDogdHJpdmlhbDtcbiAgfVxuICAvL2NvbnNvbGUudGltZSgnc3ViZGl2aWRlIGVkZ2VzJyk7XG4gIHZhciBzb3J0ZWRFdmVudHMgPSBzdWJkaXZpZGVTZWdtZW50cyhldmVudFF1ZXVlLCBzdWJqZWN0LCBjbGlwcGluZywgc2Jib3gsIGNiYm94LCBvcGVyYXRpb24pO1xuICAvL2NvbnNvbGUudGltZUVuZCgnc3ViZGl2aWRlIGVkZ2VzJyk7XG5cbiAgLy9jb25zb2xlLnRpbWUoJ2Nvbm5lY3QgdmVydGljZXMnKTtcbiAgdmFyIHJlc3VsdCA9IGNvbm5lY3RFZGdlcyhzb3J0ZWRFdmVudHMsIG9wZXJhdGlvbik7XG4gIC8vY29uc29sZS50aW1lRW5kKCdjb25uZWN0IHZlcnRpY2VzJyk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmJvb2xlYW4udW5pb24gPSBmdW5jdGlvbiAoc3ViamVjdCwgY2xpcHBpbmcpIHtcbiAgcmV0dXJuIGJvb2xlYW4oc3ViamVjdCwgY2xpcHBpbmcsIG9wZXJhdGlvbnMuVU5JT04pO1xufTtcblxuXG5ib29sZWFuLmRpZmYgPSBmdW5jdGlvbiAoc3ViamVjdCwgY2xpcHBpbmcpIHtcbiAgcmV0dXJuIGJvb2xlYW4oc3ViamVjdCwgY2xpcHBpbmcsIG9wZXJhdGlvbnMuRElGRkVSRU5DRSk7XG59O1xuXG5cbmJvb2xlYW4ueG9yID0gZnVuY3Rpb24gKHN1YmplY3QsIGNsaXBwaW5nKSB7XG4gIHJldHVybiBib29sZWFuKHN1YmplY3QsIGNsaXBwaW5nLCBvcGVyYXRpb25zLlhPUik7XG59O1xuXG5cbmJvb2xlYW4uaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24gKHN1YmplY3QsIGNsaXBwaW5nKSB7XG4gIHJldHVybiBib29sZWFuKHN1YmplY3QsIGNsaXBwaW5nLCBvcGVyYXRpb25zLklOVEVSU0VDVElPTik7XG59O1xuXG5cbi8qKlxuICogQGVudW0ge051bWJlcn1cbiAqL1xuYm9vbGVhbi5vcGVyYXRpb25zID0gb3BlcmF0aW9ucztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGJvb2xlYW47XG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gYm9vbGVhbjtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIElOVEVSU0VDVElPTjogMCxcbiAgVU5JT046ICAgICAgICAxLFxuICBESUZGRVJFTkNFOiAgIDIsXG4gIFhPUjogICAgICAgICAgM1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRpdmlkZVNlZ21lbnQgPSByZXF1aXJlKCcuL2RpdmlkZV9zZWdtZW50Jyk7XG52YXIgaW50ZXJzZWN0aW9uICA9IHJlcXVpcmUoJy4vc2VnbWVudF9pbnRlcnNlY3Rpb24nKTtcbnZhciBlcXVhbHMgICAgICAgID0gcmVxdWlyZSgnLi9lcXVhbHMnKTtcbnZhciBjb21wYXJlRXZlbnRzID0gcmVxdWlyZSgnLi9jb21wYXJlX2V2ZW50cycpO1xudmFyIGVkZ2VUeXBlICAgICAgPSByZXF1aXJlKCcuL2VkZ2VfdHlwZScpO1xuXG4vKipcbiAqIEBwYXJhbSAge1N3ZWVwRXZlbnR9IHNlMVxuICogQHBhcmFtICB7U3dlZXBFdmVudH0gc2UyXG4gKiBAcGFyYW0gIHtRdWV1ZX0gICAgICBxdWV1ZVxuICogQHJldHVybiB7TnVtYmVyfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBvc3NpYmxlSW50ZXJzZWN0aW9uKHNlMSwgc2UyLCBxdWV1ZSkge1xuICAvLyB0aGF0IGRpc2FsbG93cyBzZWxmLWludGVyc2VjdGluZyBwb2x5Z29ucyxcbiAgLy8gZGlkIGNvc3QgdXMgaGFsZiBhIGRheSwgc28gSSdsbCBsZWF2ZSBpdFxuICAvLyBvdXQgb2YgcmVzcGVjdFxuICAvLyBpZiAoc2UxLmlzU3ViamVjdCA9PT0gc2UyLmlzU3ViamVjdCkgcmV0dXJuO1xuICB2YXIgaW50ZXIgPSBpbnRlcnNlY3Rpb24oXG4gICAgc2UxLnBvaW50LCBzZTEub3RoZXJFdmVudC5wb2ludCxcbiAgICBzZTIucG9pbnQsIHNlMi5vdGhlckV2ZW50LnBvaW50XG4gICk7XG5cbiAgdmFyIG5pbnRlcnNlY3Rpb25zID0gaW50ZXIgPyBpbnRlci5sZW5ndGggOiAwO1xuICBpZiAobmludGVyc2VjdGlvbnMgPT09IDApIHJldHVybiAwOyAvLyBubyBpbnRlcnNlY3Rpb25cblxuICAvLyB0aGUgbGluZSBzZWdtZW50cyBpbnRlcnNlY3QgYXQgYW4gZW5kcG9pbnQgb2YgYm90aCBsaW5lIHNlZ21lbnRzXG4gIGlmICgobmludGVyc2VjdGlvbnMgPT09IDEpICYmXG4gICAgICAoZXF1YWxzKHNlMS5wb2ludCwgc2UyLnBvaW50KSB8fFxuICAgICAgIGVxdWFscyhzZTEub3RoZXJFdmVudC5wb2ludCwgc2UyLm90aGVyRXZlbnQucG9pbnQpKSkge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgaWYgKG5pbnRlcnNlY3Rpb25zID09PSAyICYmIHNlMS5pc1N1YmplY3QgPT09IHNlMi5pc1N1YmplY3QpIHtcbiAgICAvLyBpZihzZTEuY29udG91cklkID09PSBzZTIuY29udG91cklkKXtcbiAgICAvLyBjb25zb2xlLndhcm4oJ0VkZ2VzIG9mIHRoZSBzYW1lIHBvbHlnb24gb3ZlcmxhcCcsXG4gICAgLy8gICBzZTEucG9pbnQsIHNlMS5vdGhlckV2ZW50LnBvaW50LCBzZTIucG9pbnQsIHNlMi5vdGhlckV2ZW50LnBvaW50KTtcbiAgICAvLyB9XG4gICAgLy90aHJvdyBuZXcgRXJyb3IoJ0VkZ2VzIG9mIHRoZSBzYW1lIHBvbHlnb24gb3ZlcmxhcCcpO1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgLy8gVGhlIGxpbmUgc2VnbWVudHMgYXNzb2NpYXRlZCB0byBzZTEgYW5kIHNlMiBpbnRlcnNlY3RcbiAgaWYgKG5pbnRlcnNlY3Rpb25zID09PSAxKSB7XG5cbiAgICAvLyBpZiB0aGUgaW50ZXJzZWN0aW9uIHBvaW50IGlzIG5vdCBhbiBlbmRwb2ludCBvZiBzZTFcbiAgICBpZiAoIWVxdWFscyhzZTEucG9pbnQsIGludGVyWzBdKSAmJiAhZXF1YWxzKHNlMS5vdGhlckV2ZW50LnBvaW50LCBpbnRlclswXSkpIHtcbiAgICAgIGRpdmlkZVNlZ21lbnQoc2UxLCBpbnRlclswXSwgcXVldWUpO1xuICAgIH1cblxuICAgIC8vIGlmIHRoZSBpbnRlcnNlY3Rpb24gcG9pbnQgaXMgbm90IGFuIGVuZHBvaW50IG9mIHNlMlxuICAgIGlmICghZXF1YWxzKHNlMi5wb2ludCwgaW50ZXJbMF0pICYmICFlcXVhbHMoc2UyLm90aGVyRXZlbnQucG9pbnQsIGludGVyWzBdKSkge1xuICAgICAgZGl2aWRlU2VnbWVudChzZTIsIGludGVyWzBdLCBxdWV1ZSk7XG4gICAgfVxuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLy8gVGhlIGxpbmUgc2VnbWVudHMgYXNzb2NpYXRlZCB0byBzZTEgYW5kIHNlMiBvdmVybGFwXG4gIHZhciBldmVudHMgICAgICAgID0gW107XG4gIHZhciBsZWZ0Q29pbmNpZGUgID0gZmFsc2U7XG4gIHZhciByaWdodENvaW5jaWRlID0gZmFsc2U7XG5cbiAgaWYgKGVxdWFscyhzZTEucG9pbnQsIHNlMi5wb2ludCkpIHtcbiAgICBsZWZ0Q29pbmNpZGUgPSB0cnVlOyAvLyBsaW5rZWRcbiAgfSBlbHNlIGlmIChjb21wYXJlRXZlbnRzKHNlMSwgc2UyKSA9PT0gMSkge1xuICAgIGV2ZW50cy5wdXNoKHNlMiwgc2UxKTtcbiAgfSBlbHNlIHtcbiAgICBldmVudHMucHVzaChzZTEsIHNlMik7XG4gIH1cblxuICBpZiAoZXF1YWxzKHNlMS5vdGhlckV2ZW50LnBvaW50LCBzZTIub3RoZXJFdmVudC5wb2ludCkpIHtcbiAgICByaWdodENvaW5jaWRlID0gdHJ1ZTtcbiAgfSBlbHNlIGlmIChjb21wYXJlRXZlbnRzKHNlMS5vdGhlckV2ZW50LCBzZTIub3RoZXJFdmVudCkgPT09IDEpIHtcbiAgICBldmVudHMucHVzaChzZTIub3RoZXJFdmVudCwgc2UxLm90aGVyRXZlbnQpO1xuICB9IGVsc2Uge1xuICAgIGV2ZW50cy5wdXNoKHNlMS5vdGhlckV2ZW50LCBzZTIub3RoZXJFdmVudCk7XG4gIH1cblxuICBpZiAoKGxlZnRDb2luY2lkZSAmJiByaWdodENvaW5jaWRlKSB8fCBsZWZ0Q29pbmNpZGUpIHtcbiAgICAvLyBib3RoIGxpbmUgc2VnbWVudHMgYXJlIGVxdWFsIG9yIHNoYXJlIHRoZSBsZWZ0IGVuZHBvaW50XG4gICAgc2UyLnR5cGUgPSBlZGdlVHlwZS5OT05fQ09OVFJJQlVUSU5HO1xuICAgIHNlMS50eXBlID0gKHNlMi5pbk91dCA9PT0gc2UxLmluT3V0KSA/XG4gICAgICBlZGdlVHlwZS5TQU1FX1RSQU5TSVRJT04gOlxuICAgICAgZWRnZVR5cGUuRElGRkVSRU5UX1RSQU5TSVRJT047XG5cbiAgICBpZiAobGVmdENvaW5jaWRlICYmICFyaWdodENvaW5jaWRlKSB7XG4gICAgICAvLyBob25lc3RseSBubyBpZGVhLCBidXQgY2hhbmdpbmcgZXZlbnRzIHNlbGVjdGlvbiBmcm9tIFsyLCAxXVxuICAgICAgLy8gdG8gWzAsIDFdIGZpeGVzIHRoZSBvdmVybGFwcGluZyBzZWxmLWludGVyc2VjdGluZyBwb2x5Z29ucyBpc3N1ZVxuICAgICAgZGl2aWRlU2VnbWVudChldmVudHNbMV0ub3RoZXJFdmVudCwgZXZlbnRzWzBdLnBvaW50LCBxdWV1ZSk7XG4gICAgfVxuICAgIHJldHVybiAyO1xuICB9XG5cbiAgLy8gdGhlIGxpbmUgc2VnbWVudHMgc2hhcmUgdGhlIHJpZ2h0IGVuZHBvaW50XG4gIGlmIChyaWdodENvaW5jaWRlKSB7XG4gICAgZGl2aWRlU2VnbWVudChldmVudHNbMF0sIGV2ZW50c1sxXS5wb2ludCwgcXVldWUpO1xuICAgIHJldHVybiAzO1xuICB9XG5cbiAgLy8gbm8gbGluZSBzZWdtZW50IGluY2x1ZGVzIHRvdGFsbHkgdGhlIG90aGVyIG9uZVxuICBpZiAoZXZlbnRzWzBdICE9PSBldmVudHNbM10ub3RoZXJFdmVudCkge1xuICAgIGRpdmlkZVNlZ21lbnQoZXZlbnRzWzBdLCBldmVudHNbMV0ucG9pbnQsIHF1ZXVlKTtcbiAgICBkaXZpZGVTZWdtZW50KGV2ZW50c1sxXSwgZXZlbnRzWzJdLnBvaW50LCBxdWV1ZSk7XG4gICAgcmV0dXJuIDM7XG4gIH1cblxuICAvLyBvbmUgbGluZSBzZWdtZW50IGluY2x1ZGVzIHRoZSBvdGhlciBvbmVcbiAgZGl2aWRlU2VnbWVudChldmVudHNbMF0sIGV2ZW50c1sxXS5wb2ludCwgcXVldWUpO1xuICBkaXZpZGVTZWdtZW50KGV2ZW50c1szXS5vdGhlckV2ZW50LCBldmVudHNbMl0ucG9pbnQsIHF1ZXVlKTtcblxuICByZXR1cm4gMztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vdmFyIEVQUyA9IDFlLTk7XG5cbi8qKlxuICogRmluZHMgdGhlIG1hZ25pdHVkZSBvZiB0aGUgY3Jvc3MgcHJvZHVjdCBvZiB0d28gdmVjdG9ycyAoaWYgd2UgcHJldGVuZFxuICogdGhleSdyZSBpbiB0aHJlZSBkaW1lbnNpb25zKVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhIEZpcnN0IHZlY3RvclxuICogQHBhcmFtIHtPYmplY3R9IGIgU2Vjb25kIHZlY3RvclxuICogQHByaXZhdGVcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBtYWduaXR1ZGUgb2YgdGhlIGNyb3NzIHByb2R1Y3RcbiAqL1xuZnVuY3Rpb24gY3Jvc3NQcm9kdWN0KGEsIGIpIHtcbiAgcmV0dXJuIChhWzBdICogYlsxXSkgLSAoYVsxXSAqIGJbMF0pO1xufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBkb3QgcHJvZHVjdCBvZiB0d28gdmVjdG9ycy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYSBGaXJzdCB2ZWN0b3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBiIFNlY29uZCB2ZWN0b3JcbiAqIEBwcml2YXRlXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgZG90IHByb2R1Y3RcbiAqL1xuZnVuY3Rpb24gZG90UHJvZHVjdChhLCBiKSB7XG4gIHJldHVybiAoYVswXSAqIGJbMF0pICsgKGFbMV0gKiBiWzFdKTtcbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgaW50ZXJzZWN0aW9uIChpZiBhbnkpIGJldHdlZW4gdHdvIGxpbmUgc2VnbWVudHMgYSBhbmQgYiwgZ2l2ZW4gdGhlXG4gKiBsaW5lIHNlZ21lbnRzJyBlbmQgcG9pbnRzIGExLCBhMiBhbmQgYjEsIGIyLlxuICpcbiAqIFRoaXMgYWxnb3JpdGhtIGlzIGJhc2VkIG9uIFNjaG5laWRlciBhbmQgRWJlcmx5LlxuICogaHR0cDovL3d3dy5jaW1lYy5vcmcuYXIvfm5jYWx2by9TY2huZWlkZXJfRWJlcmx5LnBkZlxuICogUGFnZSAyNDQuXG4gKlxuICogQHBhcmFtIHtBcnJheS48TnVtYmVyPn0gYTEgcG9pbnQgb2YgZmlyc3QgbGluZVxuICogQHBhcmFtIHtBcnJheS48TnVtYmVyPn0gYTIgcG9pbnQgb2YgZmlyc3QgbGluZVxuICogQHBhcmFtIHtBcnJheS48TnVtYmVyPn0gYjEgcG9pbnQgb2Ygc2Vjb25kIGxpbmVcbiAqIEBwYXJhbSB7QXJyYXkuPE51bWJlcj59IGIyIHBvaW50IG9mIHNlY29uZCBsaW5lXG4gKiBAcGFyYW0ge0Jvb2xlYW49fSAgICAgICBub0VuZHBvaW50VG91Y2ggd2hldGhlciB0byBza2lwIHNpbmdsZSB0b3VjaHBvaW50c1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChtZWFuaW5nIGNvbm5lY3RlZCBzZWdtZW50cykgYXNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnNlY3Rpb25zXG4gKiBAcmV0dXJucyB7QXJyYXkuPEFycmF5LjxOdW1iZXI+PnxOdWxsfSBJZiB0aGUgbGluZXMgaW50ZXJzZWN0LCB0aGUgcG9pbnQgb2ZcbiAqIGludGVyc2VjdGlvbi4gSWYgdGhleSBvdmVybGFwLCB0aGUgdHdvIGVuZCBwb2ludHMgb2YgdGhlIG92ZXJsYXBwaW5nIHNlZ21lbnQuXG4gKiBPdGhlcndpc2UsIG51bGwuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGExLCBhMiwgYjEsIGIyLCBub0VuZHBvaW50VG91Y2gpIHtcbiAgLy8gVGhlIGFsZ29yaXRobSBleHBlY3RzIG91ciBsaW5lcyBpbiB0aGUgZm9ybSBQICsgc2QsIHdoZXJlIFAgaXMgYSBwb2ludCxcbiAgLy8gcyBpcyBvbiB0aGUgaW50ZXJ2YWwgWzAsIDFdLCBhbmQgZCBpcyBhIHZlY3Rvci5cbiAgLy8gV2UgYXJlIHBhc3NlZCB0d28gcG9pbnRzLiBQIGNhbiBiZSB0aGUgZmlyc3QgcG9pbnQgb2YgZWFjaCBwYWlyLiBUaGVcbiAgLy8gdmVjdG9yLCB0aGVuLCBjb3VsZCBiZSB0aG91Z2h0IG9mIGFzIHRoZSBkaXN0YW5jZSAoaW4geCBhbmQgeSBjb21wb25lbnRzKVxuICAvLyBmcm9tIHRoZSBmaXJzdCBwb2ludCB0byB0aGUgc2Vjb25kIHBvaW50LlxuICAvLyBTbyBmaXJzdCwgbGV0J3MgbWFrZSBvdXIgdmVjdG9yczpcbiAgdmFyIHZhID0gW2EyWzBdIC0gYTFbMF0sIGEyWzFdIC0gYTFbMV1dO1xuICB2YXIgdmIgPSBbYjJbMF0gLSBiMVswXSwgYjJbMV0gLSBiMVsxXV07XG4gIC8vIFdlIGFsc28gZGVmaW5lIGEgZnVuY3Rpb24gdG8gY29udmVydCBiYWNrIHRvIHJlZ3VsYXIgcG9pbnQgZm9ybTpcblxuICAvKiBlc2xpbnQtZGlzYWJsZSBhcnJvdy1ib2R5LXN0eWxlICovXG5cbiAgZnVuY3Rpb24gdG9Qb2ludChwLCBzLCBkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIHBbMF0gKyBzICogZFswXSxcbiAgICAgIHBbMV0gKyBzICogZFsxXVxuICAgIF07XG4gIH1cblxuICAvKiBlc2xpbnQtZW5hYmxlIGFycm93LWJvZHktc3R5bGUgKi9cblxuICAvLyBUaGUgcmVzdCBpcyBwcmV0dHkgbXVjaCBhIHN0cmFpZ2h0IHBvcnQgb2YgdGhlIGFsZ29yaXRobS5cbiAgdmFyIGUgPSBbYjFbMF0gLSBhMVswXSwgYjFbMV0gLSBhMVsxXV07XG4gIHZhciBrcm9zcyAgICA9IGNyb3NzUHJvZHVjdCh2YSwgdmIpO1xuICB2YXIgc3FyS3Jvc3MgPSBrcm9zcyAqIGtyb3NzO1xuICB2YXIgc3FyTGVuQSAgPSBkb3RQcm9kdWN0KHZhLCB2YSk7XG4gIC8vdmFyIHNxckxlbkIgID0gZG90UHJvZHVjdCh2YiwgdmIpO1xuXG4gIC8vIENoZWNrIGZvciBsaW5lIGludGVyc2VjdGlvbi4gVGhpcyB3b3JrcyBiZWNhdXNlIG9mIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZVxuICAvLyBjcm9zcyBwcm9kdWN0IC0tIHNwZWNpZmljYWxseSwgdHdvIHZlY3RvcnMgYXJlIHBhcmFsbGVsIGlmIGFuZCBvbmx5IGlmIHRoZVxuICAvLyBjcm9zcyBwcm9kdWN0IGlzIHRoZSAwIHZlY3Rvci4gVGhlIGZ1bGwgY2FsY3VsYXRpb24gaW52b2x2ZXMgcmVsYXRpdmUgZXJyb3JcbiAgLy8gdG8gYWNjb3VudCBmb3IgcG9zc2libGUgdmVyeSBzbWFsbCBsaW5lIHNlZ21lbnRzLiBTZWUgU2NobmVpZGVyICYgRWJlcmx5XG4gIC8vIGZvciBkZXRhaWxzLlxuICBpZiAoc3FyS3Jvc3MgPiAwLyogRVBTICogc3FyTGVuQiAqIHNxTGVuQSAqLykge1xuICAgIC8vIElmIHRoZXkncmUgbm90IHBhcmFsbGVsLCB0aGVuIChiZWNhdXNlIHRoZXNlIGFyZSBsaW5lIHNlZ21lbnRzKSB0aGV5XG4gICAgLy8gc3RpbGwgbWlnaHQgbm90IGFjdHVhbGx5IGludGVyc2VjdC4gVGhpcyBjb2RlIGNoZWNrcyB0aGF0IHRoZVxuICAgIC8vIGludGVyc2VjdGlvbiBwb2ludCBvZiB0aGUgbGluZXMgaXMgYWN0dWFsbHkgb24gYm90aCBsaW5lIHNlZ21lbnRzLlxuICAgIHZhciBzID0gY3Jvc3NQcm9kdWN0KGUsIHZiKSAvIGtyb3NzO1xuICAgIGlmIChzIDwgMCB8fCBzID4gMSkge1xuICAgICAgLy8gbm90IG9uIGxpbmUgc2VnbWVudCBhXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIHQgPSBjcm9zc1Byb2R1Y3QoZSwgdmEpIC8ga3Jvc3M7XG4gICAgaWYgKHQgPCAwIHx8IHQgPiAxKSB7XG4gICAgICAvLyBub3Qgb24gbGluZSBzZWdtZW50IGJcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAocyA9PT0gMCB8fCBzID09PSAxKSB7XG4gICAgICAvLyBvbiBhbiBlbmRwb2ludCBvZiBsaW5lIHNlZ21lbnQgYVxuICAgICAgcmV0dXJuIG5vRW5kcG9pbnRUb3VjaCA/IG51bGwgOiBbdG9Qb2ludChhMSwgcywgdmEpXTtcbiAgICB9XG4gICAgaWYgKHQgPT09IDAgfHwgdCA9PT0gMSkge1xuICAgICAgLy8gb24gYW4gZW5kcG9pbnQgb2YgbGluZSBzZWdtZW50IGJcbiAgICAgIHJldHVybiBub0VuZHBvaW50VG91Y2ggPyBudWxsIDogW3RvUG9pbnQoYjEsIHQsIHZiKV07XG4gICAgfVxuICAgIHJldHVybiBbdG9Qb2ludChhMSwgcywgdmEpXTtcbiAgfVxuXG4gIC8vIElmIHdlJ3ZlIHJlYWNoZWQgdGhpcyBwb2ludCwgdGhlbiB0aGUgbGluZXMgYXJlIGVpdGhlciBwYXJhbGxlbCBvciB0aGVcbiAgLy8gc2FtZSwgYnV0IHRoZSBzZWdtZW50cyBjb3VsZCBvdmVybGFwIHBhcnRpYWxseSBvciBmdWxseSwgb3Igbm90IGF0IGFsbC5cbiAgLy8gU28gd2UgbmVlZCB0byBmaW5kIHRoZSBvdmVybGFwLCBpZiBhbnkuIFRvIGRvIHRoYXQsIHdlIGNhbiB1c2UgZSwgd2hpY2ggaXNcbiAgLy8gdGhlICh2ZWN0b3IpIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgdHdvIGluaXRpYWwgcG9pbnRzLiBJZiB0aGlzIGlzIHBhcmFsbGVsXG4gIC8vIHdpdGggdGhlIGxpbmUgaXRzZWxmLCB0aGVuIHRoZSB0d28gbGluZXMgYXJlIHRoZSBzYW1lIGxpbmUsIGFuZCB0aGVyZSB3aWxsXG4gIC8vIGJlIG92ZXJsYXAuXG4gIC8vdmFyIHNxckxlbkUgPSBkb3RQcm9kdWN0KGUsIGUpO1xuICBrcm9zcyA9IGNyb3NzUHJvZHVjdChlLCB2YSk7XG4gIHNxcktyb3NzID0ga3Jvc3MgKiBrcm9zcztcblxuICBpZiAoc3FyS3Jvc3MgPiAwIC8qIEVQUyAqIHNxTGVuQiAqIHNxTGVuRSAqLykge1xuICAvLyBMaW5lcyBhcmUganVzdCBwYXJhbGxlbCwgbm90IHRoZSBzYW1lLiBObyBvdmVybGFwLlxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdmFyIHNhID0gZG90UHJvZHVjdCh2YSwgZSkgLyBzcXJMZW5BO1xuICB2YXIgc2IgPSBzYSArIGRvdFByb2R1Y3QodmEsIHZiKSAvIHNxckxlbkE7XG4gIHZhciBzbWluID0gTWF0aC5taW4oc2EsIHNiKTtcbiAgdmFyIHNtYXggPSBNYXRoLm1heChzYSwgc2IpO1xuXG4gIC8vIHRoaXMgaXMsIGVzc2VudGlhbGx5LCB0aGUgRmluZEludGVyc2VjdGlvbiBhY3Rpbmcgb24gZmxvYXRzIGZyb21cbiAgLy8gU2NobmVpZGVyICYgRWJlcmx5LCBqdXN0IGlubGluZWQgaW50byB0aGlzIGZ1bmN0aW9uLlxuICBpZiAoc21pbiA8PSAxICYmIHNtYXggPj0gMCkge1xuXG4gICAgLy8gb3ZlcmxhcCBvbiBhbiBlbmQgcG9pbnRcbiAgICBpZiAoc21pbiA9PT0gMSkge1xuICAgICAgcmV0dXJuIG5vRW5kcG9pbnRUb3VjaCA/IG51bGwgOiBbdG9Qb2ludChhMSwgc21pbiA+IDAgPyBzbWluIDogMCwgdmEpXTtcbiAgICB9XG5cbiAgICBpZiAoc21heCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG5vRW5kcG9pbnRUb3VjaCA/IG51bGwgOiBbdG9Qb2ludChhMSwgc21heCA8IDEgPyBzbWF4IDogMSwgdmEpXTtcbiAgICB9XG5cbiAgICBpZiAobm9FbmRwb2ludFRvdWNoICYmIHNtaW4gPT09IDAgJiYgc21heCA9PT0gMSkgcmV0dXJuIG51bGw7XG5cbiAgICAvLyBUaGVyZSdzIG92ZXJsYXAgb24gYSBzZWdtZW50IC0tIHR3byBwb2ludHMgb2YgaW50ZXJzZWN0aW9uLiBSZXR1cm4gYm90aC5cbiAgICByZXR1cm4gW1xuICAgICAgdG9Qb2ludChhMSwgc21pbiA+IDAgPyBzbWluIDogMCwgdmEpLFxuICAgICAgdG9Qb2ludChhMSwgc21heCA8IDEgPyBzbWF4IDogMSwgdmEpLFxuICAgIF07XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogU2lnbmVkIGFyZWEgb2YgdGhlIHRyaWFuZ2xlIChwMCwgcDEsIHAyKVxuICogQHBhcmFtICB7QXJyYXkuPE51bWJlcj59IHAwXG4gKiBAcGFyYW0gIHtBcnJheS48TnVtYmVyPn0gcDFcbiAqIEBwYXJhbSAge0FycmF5LjxOdW1iZXI+fSBwMlxuICogQHJldHVybiB7TnVtYmVyfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNpZ25lZEFyZWEocDAsIHAxLCBwMikge1xuICByZXR1cm4gKHAwWzBdIC0gcDJbMF0pICogKHAxWzFdIC0gcDJbMV0pIC0gKHAxWzBdIC0gcDJbMF0pICogKHAwWzFdIC0gcDJbMV0pO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFRyZWUgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnc3BsYXl0cmVlJyk7XG52YXIgY29tcHV0ZUZpZWxkcyAgICAgICAgPSByZXF1aXJlKCcuL2NvbXB1dGVfZmllbGRzJyk7XG52YXIgcG9zc2libGVJbnRlcnNlY3Rpb24gPSByZXF1aXJlKCcuL3Bvc3NpYmxlX2ludGVyc2VjdGlvbicpO1xudmFyIGNvbXBhcmVTZWdtZW50cyAgICAgID0gcmVxdWlyZSgnLi9jb21wYXJlX3NlZ21lbnRzJyk7XG52YXIgb3BlcmF0aW9ucyAgICAgICAgICAgPSByZXF1aXJlKCcuL29wZXJhdGlvbicpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3ViZGl2aWRlKGV2ZW50UXVldWUsIHN1YmplY3QsIGNsaXBwaW5nLCBzYmJveCwgY2Jib3gsIG9wZXJhdGlvbikge1xuICB2YXIgc3dlZXBMaW5lID0gbmV3IFRyZWUoY29tcGFyZVNlZ21lbnRzKTtcbiAgdmFyIHNvcnRlZEV2ZW50cyA9IFtdO1xuXG4gIHZhciByaWdodGJvdW5kID0gTWF0aC5taW4oc2Jib3hbMl0sIGNiYm94WzJdKTtcblxuICB2YXIgcHJldiwgbmV4dCwgYmVnaW47XG5cbiAgdmFyIElOVEVSU0VDVElPTiA9IG9wZXJhdGlvbnMuSU5URVJTRUNUSU9OO1xuICB2YXIgRElGRkVSRU5DRSAgID0gb3BlcmF0aW9ucy5ESUZGRVJFTkNFO1xuXG4gIHdoaWxlIChldmVudFF1ZXVlLmxlbmd0aCAhPT0gMCkge1xuICAgIHZhciBldmVudCA9IGV2ZW50UXVldWUucG9wKCk7XG4gICAgc29ydGVkRXZlbnRzLnB1c2goZXZlbnQpO1xuXG4gICAgLy8gb3B0aW1pemF0aW9uIGJ5IGJib3hlcyBmb3IgaW50ZXJzZWN0aW9uIGFuZCBkaWZmZXJlbmNlIGdvZXMgaGVyZVxuICAgIGlmICgob3BlcmF0aW9uID09PSBJTlRFUlNFQ1RJT04gJiYgZXZlbnQucG9pbnRbMF0gPiByaWdodGJvdW5kKSB8fFxuICAgICAgICAob3BlcmF0aW9uID09PSBESUZGRVJFTkNFICAgJiYgZXZlbnQucG9pbnRbMF0gPiBzYmJveFsyXSkpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChldmVudC5sZWZ0KSB7XG4gICAgICBuZXh0ICA9IHByZXYgPSBzd2VlcExpbmUuaW5zZXJ0KGV2ZW50KTtcbiAgICAgIGJlZ2luID0gc3dlZXBMaW5lLm1pbk5vZGUoKTtcblxuICAgICAgaWYgKHByZXYgIT09IGJlZ2luKSBwcmV2ID0gc3dlZXBMaW5lLnByZXYocHJldik7XG4gICAgICBlbHNlICAgICAgICAgICAgICAgIHByZXYgPSBudWxsO1xuXG4gICAgICBuZXh0ID0gc3dlZXBMaW5lLm5leHQobmV4dCk7XG5cbiAgICAgIHZhciBwcmV2RXZlbnQgPSBwcmV2ID8gcHJldi5rZXkgOiBudWxsO1xuICAgICAgdmFyIHByZXZwcmV2RXZlbnQ7XG4gICAgICBjb21wdXRlRmllbGRzKGV2ZW50LCBwcmV2RXZlbnQsIG9wZXJhdGlvbik7XG4gICAgICBpZiAobmV4dCkge1xuICAgICAgICBpZiAocG9zc2libGVJbnRlcnNlY3Rpb24oZXZlbnQsIG5leHQua2V5LCBldmVudFF1ZXVlKSA9PT0gMikge1xuICAgICAgICAgIGNvbXB1dGVGaWVsZHMoZXZlbnQsIHByZXZFdmVudCwgb3BlcmF0aW9uKTtcbiAgICAgICAgICBjb21wdXRlRmllbGRzKGV2ZW50LCBuZXh0LmtleSwgb3BlcmF0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocHJldikge1xuICAgICAgICBpZiAocG9zc2libGVJbnRlcnNlY3Rpb24ocHJldi5rZXksIGV2ZW50LCBldmVudFF1ZXVlKSA9PT0gMikge1xuICAgICAgICAgIHZhciBwcmV2cHJldiA9IHByZXY7XG4gICAgICAgICAgaWYgKHByZXZwcmV2ICE9PSBiZWdpbikgcHJldnByZXYgPSBzd2VlcExpbmUucHJldihwcmV2cHJldik7XG4gICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgcHJldnByZXYgPSBudWxsO1xuXG4gICAgICAgICAgcHJldnByZXZFdmVudCA9IHByZXZwcmV2ID8gcHJldnByZXYua2V5IDogbnVsbDtcbiAgICAgICAgICBjb21wdXRlRmllbGRzKHByZXZFdmVudCwgcHJldnByZXZFdmVudCwgb3BlcmF0aW9uKTtcbiAgICAgICAgICBjb21wdXRlRmllbGRzKGV2ZW50LCAgICAgcHJldkV2ZW50LCAgICAgb3BlcmF0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBldmVudCA9IGV2ZW50Lm90aGVyRXZlbnQ7XG4gICAgICBuZXh0ID0gcHJldiA9IHN3ZWVwTGluZS5maW5kKGV2ZW50KTtcblxuICAgICAgaWYgKHByZXYgJiYgbmV4dCkge1xuXG4gICAgICAgIGlmIChwcmV2ICE9PSBiZWdpbikgcHJldiA9IHN3ZWVwTGluZS5wcmV2KHByZXYpO1xuICAgICAgICBlbHNlICAgICAgICAgICAgICAgIHByZXYgPSBudWxsO1xuXG4gICAgICAgIG5leHQgPSBzd2VlcExpbmUubmV4dChuZXh0KTtcbiAgICAgICAgc3dlZXBMaW5lLnJlbW92ZShldmVudCk7XG5cbiAgICAgICAgaWYgKG5leHQgJiYgcHJldikge1xuICAgICAgICAgIHBvc3NpYmxlSW50ZXJzZWN0aW9uKHByZXYua2V5LCBuZXh0LmtleSwgZXZlbnRRdWV1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNvcnRlZEV2ZW50cztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vdmFyIHNpZ25lZEFyZWEgPSByZXF1aXJlKCcuL3NpZ25lZF9hcmVhJyk7XG52YXIgRWRnZVR5cGUgICA9IHJlcXVpcmUoJy4vZWRnZV90eXBlJyk7XG5cbi8qKlxuICogU3dlZXBsaW5lIGV2ZW50XG4gKlxuICogQGNsYXNzIHtTd2VlcEV2ZW50fVxuICogQHBhcmFtIHtBcnJheS48TnVtYmVyPn0gIHBvaW50XG4gKiBAcGFyYW0ge0Jvb2xlYW59ICAgICAgICAgbGVmdFxuICogQHBhcmFtIHtTd2VlcEV2ZW50PX0gICAgIG90aGVyRXZlbnRcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gICAgICAgICBpc1N1YmplY3RcbiAqIEBwYXJhbSB7TnVtYmVyfSAgICAgICAgICBlZGdlVHlwZVxuICovXG5mdW5jdGlvbiBTd2VlcEV2ZW50KHBvaW50LCBsZWZ0LCBvdGhlckV2ZW50LCBpc1N1YmplY3QsIGVkZ2VUeXBlKSB7XG5cbiAgLyoqXG4gICAqIElzIGxlZnQgZW5kcG9pbnQ/XG4gICAqIEB0eXBlIHtCb29sZWFufVxuICAgKi9cbiAgdGhpcy5sZWZ0ID0gbGVmdDtcblxuICAvKipcbiAgICogQHR5cGUge0FycmF5LjxOdW1iZXI+fVxuICAgKi9cbiAgdGhpcy5wb2ludCA9IHBvaW50O1xuXG4gIC8qKlxuICAgKiBPdGhlciBlZGdlIHJlZmVyZW5jZVxuICAgKiBAdHlwZSB7U3dlZXBFdmVudH1cbiAgICovXG4gIHRoaXMub3RoZXJFdmVudCA9IG90aGVyRXZlbnQ7XG5cbiAgLyoqXG4gICAqIEJlbG9uZ3MgdG8gc291cmNlIG9yIGNsaXBwaW5nIHBvbHlnb25cbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmlzU3ViamVjdCA9IGlzU3ViamVjdDtcblxuICAvKipcbiAgICogRWRnZSBjb250cmlidXRpb24gdHlwZVxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy50eXBlID0gZWRnZVR5cGUgfHwgRWRnZVR5cGUuTk9STUFMO1xuXG5cbiAgLyoqXG4gICAqIEluLW91dCB0cmFuc2l0aW9uIGZvciB0aGUgc3dlZXBsaW5lIGNyb3NzaW5nIHBvbHlnb25cbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmluT3V0ID0gZmFsc2U7XG5cblxuICAvKipcbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuICB0aGlzLm90aGVySW5PdXQgPSBmYWxzZTtcblxuICAvKipcbiAgICogUHJldmlvdXMgZXZlbnQgaW4gcmVzdWx0P1xuICAgKiBAdHlwZSB7U3dlZXBFdmVudH1cbiAgICovXG4gIHRoaXMucHJldkluUmVzdWx0ID0gbnVsbDtcblxuICAvKipcbiAgICogRG9lcyBldmVudCBiZWxvbmcgdG8gcmVzdWx0P1xuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG4gIHRoaXMuaW5SZXN1bHQgPSBmYWxzZTtcblxuXG4gIC8vIGNvbm5lY3Rpb24gc3RlcFxuXG4gIC8qKlxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG4gIHRoaXMucmVzdWx0SW5PdXQgPSBmYWxzZTtcblxuICB0aGlzLmlzRXh0ZXJpb3JSaW5nID0gdHJ1ZTtcbn1cblxuXG5Td2VlcEV2ZW50LnByb3RvdHlwZSA9IHtcblxuICAvKipcbiAgICogQHBhcmFtICB7QXJyYXkuPE51bWJlcj59ICBwXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqL1xuICBpc0JlbG93OiBmdW5jdGlvbiAocCkge1xuICAgIHZhciBwMCA9IHRoaXMucG9pbnQsIHAxID0gdGhpcy5vdGhlckV2ZW50LnBvaW50O1xuICAgIHJldHVybiB0aGlzLmxlZnQgP1xuICAgICAgKHAwWzBdIC0gcFswXSkgKiAocDFbMV0gLSBwWzFdKSAtIChwMVswXSAtIHBbMF0pICogKHAwWzFdIC0gcFsxXSkgPiAwIDpcbiAgICAgIC8vIHNpZ25lZEFyZWEodGhpcy5wb2ludCwgdGhpcy5vdGhlckV2ZW50LnBvaW50LCBwKSA+IDAgOlxuICAgICAgKHAxWzBdIC0gcFswXSkgKiAocDBbMV0gLSBwWzFdKSAtIChwMFswXSAtIHBbMF0pICogKHAxWzFdIC0gcFsxXSkgPiAwO1xuICAgICAgLy9zaWduZWRBcmVhKHRoaXMub3RoZXJFdmVudC5wb2ludCwgdGhpcy5wb2ludCwgcCkgPiAwO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0FycmF5LjxOdW1iZXI+fSAgcFxuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKi9cbiAgaXNBYm92ZTogZnVuY3Rpb24gKHApIHtcbiAgICByZXR1cm4gIXRoaXMuaXNCZWxvdyhwKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKi9cbiAgaXNWZXJ0aWNhbDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnBvaW50WzBdID09PSB0aGlzLm90aGVyRXZlbnQucG9pbnRbMF07XG4gIH0sXG5cblxuICBjbG9uZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb3B5ID0gbmV3IFN3ZWVwRXZlbnQoXG4gICAgICB0aGlzLnBvaW50LCB0aGlzLmxlZnQsIHRoaXMub3RoZXJFdmVudCwgdGhpcy5pc1N1YmplY3QsIHRoaXMudHlwZSk7XG5cbiAgICBjb3B5LmluUmVzdWx0ICAgICAgID0gdGhpcy5pblJlc3VsdDtcbiAgICBjb3B5LnByZXZJblJlc3VsdCAgID0gdGhpcy5wcmV2SW5SZXN1bHQ7XG4gICAgY29weS5pc0V4dGVyaW9yUmluZyA9IHRoaXMuaXNFeHRlcmlvclJpbmc7XG4gICAgY29weS5pbk91dCAgICAgICAgICA9IHRoaXMuaW5PdXQ7XG4gICAgY29weS5vdGhlckluT3V0ICAgICA9IHRoaXMub3RoZXJJbk91dDtcblxuICAgIHJldHVybiBjb3B5O1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN3ZWVwRXZlbnQ7XG4iXX0=
