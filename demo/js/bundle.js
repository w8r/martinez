(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
          '<li>','<label>', '<input type="radio" name="op" value="2" />',  ' Difference', '</label>', '</li>',
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
var martinez = window.martinez = require('../../');
//var martinez = require('../../dist/martinez.min');
var xhr = require('superagent');
var mode = window.location.hash.substring(1);
var path = '../test/fixtures/';
var file;

switch (mode) {
  case 'geo':
    file = 'asia.geojson';
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
  case 'touching':
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
    transformation: new L.Transformation(0.5, 0, -0.5, 0)
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
  // var two_triangles = require('../../test/fixtures/two_shapes.geojson');
  // var oneInside = require('../../test/fixtures/one_inside.geojson');
  // var twoPointedTriangles = require('../../test/fixtures/two_pointed_triangles.geojson');
  // var selfIntersecting = require('../../test/fixtures/self_intersecting.geojson');
  // var holes = require('../../test/fixtures/hole_hole.geojson');
  //var data =  require('../../test/fixtures/indonesia.geojson');
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

  console.log('input', subject, clipping, op);

  subject  = JSON.parse(JSON.stringify(subject));
  clipping = JSON.parse(JSON.stringify(clipping));

  var operation;
  if (op === OPERATIONS.INTERSECTION) {
    operation = martinez.intersection;
  } else if (op === OPERATIONS.UNION) {
    operation = martinez.union;
  } else if (op === OPERATIONS.DIFFERENCE) {
    operation = martinez.diff;
  } else {
    operation = martinez.xor;
  }

  console.time('martinez');
  var result = operation(subject.geometry.coordinates, clipping.geometry.coordinates);
  console.timeEnd('martinez');

  //if (op === OPERATIONS.UNION) result = result[0];
  console.log('result', result);
  console.log(JSON.stringify(result))
  results.clearLayers();
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
  }, 500);
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

},{"../../":5,"./booleanopcontrol":1,"./coordinates":2,"./polygoncontrol":4,"superagent":8}],4:[function(require,module,exports){
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
'use strict';

var martinez = require('./src/index');

module.exports = {
  union: martinez.union,
  diff: martinez.diff,
  xor: martinez.xor,
  intersection: martinez.intersection
};

},{"./src/index":21}],6:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.avl = factory());
}(this, (function () { 'use strict';

/**
 * Prints tree horizontally
 * @param  {Node}                       root
 * @param  {Function(node:Node):String} [printNode]
 * @return {String}
 */
function print (root, printNode) {
  if ( printNode === void 0 ) printNode = function (n) { return n.key; };

  var out = [];
  row(root, '', true, function (v) { return out.push(v); }, printNode);
  return out.join('');
}

/**
 * Prints level of the tree
 * @param  {Node}                        root
 * @param  {String}                      prefix
 * @param  {Boolean}                     isTail
 * @param  {Function(in:string):void}    out
 * @param  {Function(node:Node):String}  printNode
 */
function row (root, prefix, isTail, out, printNode) {
  if (root) {
    out(("" + prefix + (isTail ? '└── ' : '├── ') + (printNode(root)) + "\n"));
    var indent = prefix + (isTail ? '    ' : '│   ');
    if (root.left)  { row(root.left,  indent, false, out, printNode); }
    if (root.right) { row(root.right, indent, true,  out, printNode); }
  }
}


/**
 * Is the tree balanced (none of the subtrees differ in height by more than 1)
 * @param  {Node}    root
 * @return {Boolean}
 */
function isBalanced(root) {
  if (root === null) { return true; } // If node is empty then return true

  // Get the height of left and right sub trees
  var lh = height(root.left);
  var rh = height(root.right);

  if (Math.abs(lh - rh) <= 1 &&
      isBalanced(root.left)  &&
      isBalanced(root.right)) { return true; }

  // If we reach here then tree is not height-balanced
  return false;
}

/**
 * The function Compute the 'height' of a tree.
 * Height is the number of nodes along the longest path
 * from the root node down to the farthest leaf node.
 *
 * @param  {Node} node
 * @return {Number}
 */
function height(node) {
  return node ? (1 + Math.max(height(node.left), height(node.right))) : 0;
}

// function createNode (parent, left, right, height, key, data) {
//   return { parent, left, right, balanceFactor: height, key, data };
// }

/**
 * @typedef {{
 *   parent:        ?Node,
 *   left:          ?Node,
 *   right:         ?Node,
 *   balanceFactor: number,
 *   key:           Key,
 *   data:          Value
 * }} Node
 */

/**
 * @typedef {*} Key
 */

/**
 * @typedef {*} Value
 */

/**
 * Default comparison function
 * @param {Key} a
 * @param {Key} b
 * @returns {number}
 */
function DEFAULT_COMPARE (a, b) { return a > b ? 1 : a < b ? -1 : 0; }


/**
 * Single left rotation
 * @param  {Node} node
 * @return {Node}
 */
function rotateLeft (node) {
  var rightNode = node.right;
  node.right    = rightNode.left;

  if (rightNode.left) { rightNode.left.parent = node; }

  rightNode.parent = node.parent;
  if (rightNode.parent) {
    if (rightNode.parent.left === node) {
      rightNode.parent.left = rightNode;
    } else {
      rightNode.parent.right = rightNode;
    }
  }

  node.parent    = rightNode;
  rightNode.left = node;

  node.balanceFactor += 1;
  if (rightNode.balanceFactor < 0) {
    node.balanceFactor -= rightNode.balanceFactor;
  }

  rightNode.balanceFactor += 1;
  if (node.balanceFactor > 0) {
    rightNode.balanceFactor += node.balanceFactor;
  }
  return rightNode;
}


function rotateRight (node) {
  var leftNode = node.left;
  node.left = leftNode.right;
  if (node.left) { node.left.parent = node; }

  leftNode.parent = node.parent;
  if (leftNode.parent) {
    if (leftNode.parent.left === node) {
      leftNode.parent.left = leftNode;
    } else {
      leftNode.parent.right = leftNode;
    }
  }

  node.parent    = leftNode;
  leftNode.right = node;

  node.balanceFactor -= 1;
  if (leftNode.balanceFactor > 0) {
    node.balanceFactor -= leftNode.balanceFactor;
  }

  leftNode.balanceFactor -= 1;
  if (node.balanceFactor < 0) {
    leftNode.balanceFactor += node.balanceFactor;
  }

  return leftNode;
}


// function leftBalance (node) {
//   if (node.left.balanceFactor === -1) rotateLeft(node.left);
//   return rotateRight(node);
// }


// function rightBalance (node) {
//   if (node.right.balanceFactor === 1) rotateRight(node.right);
//   return rotateLeft(node);
// }


var AVLTree = function AVLTree (comparator, noDuplicates) {
  if ( noDuplicates === void 0 ) noDuplicates = false;

  this._comparator = comparator || DEFAULT_COMPARE;
  this._root = null;
  this._size = 0;
  this._noDuplicates = !!noDuplicates;
};

var prototypeAccessors = { size: {} };


/**
 * Clear the tree
 * @return {AVLTree}
 */
AVLTree.prototype.destroy = function destroy () {
  this._root = null;
  return this;
};

/**
 * Number of nodes
 * @return {number}
 */
prototypeAccessors.size.get = function () {
  return this._size;
};


/**
 * Whether the tree contains a node with the given key
 * @param{Key} key
 * @return {boolean} true/false
 */
AVLTree.prototype.contains = function contains (key) {
  if (this._root){
    var node     = this._root;
    var comparator = this._comparator;
    while (node){
      var cmp = comparator(key, node.key);
      if    (cmp === 0) { return true; }
      else if (cmp < 0) { node = node.left; }
      else              { node = node.right; }
    }
  }
  return false;
};


/* eslint-disable class-methods-use-this */

/**
 * Successor node
 * @param{Node} node
 * @return {?Node}
 */
AVLTree.prototype.next = function next (node) {
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
AVLTree.prototype.prev = function prev (node) {
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
 * Callback for forEach
 * @callback forEachCallback
 * @param {Node} node
 * @param {number} index
 */

/**
 * @param{forEachCallback} callback
 * @return {AVLTree}
 */
AVLTree.prototype.forEach = function forEach (callback) {
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
 * Returns all keys in order
 * @return {Array<Key>}
 */
AVLTree.prototype.keys = function keys () {
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
AVLTree.prototype.values = function values () {
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
AVLTree.prototype.at = function at (index) {
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
 * Returns node with the minimum key
 * @return {?Node}
 */
AVLTree.prototype.minNode = function minNode () {
  var node = this._root;
  if (!node) { return null; }
  while (node.left) { node = node.left; }
  return node;
};


/**
 * Returns node with the max key
 * @return {?Node}
 */
AVLTree.prototype.maxNode = function maxNode () {
  var node = this._root;
  if (!node) { return null; }
  while (node.right) { node = node.right; }
  return node;
};


/**
 * Min key
 * @return {?Key}
 */
AVLTree.prototype.min = function min () {
  var node = this._root;
  if (!node) { return null; }
  while (node.left) { node = node.left; }
  return node.key;
};


/**
 * Max key
 * @return {?Key}
 */
AVLTree.prototype.max = function max () {
  var node = this._root;
  if (!node) { return null; }
  while (node.right) { node = node.right; }
  return node.key;
};


/**
 * @return {boolean} true/false
 */
AVLTree.prototype.isEmpty = function isEmpty () {
  return !this._root;
};


/**
 * Removes and returns the node with smallest key
 * @return {?Node}
 */
AVLTree.prototype.pop = function pop () {
  var node = this._root, returnValue = null;
  if (node) {
    while (node.left) { node = node.left; }
    returnValue = { key: node.key, data: node.data };
    this.remove(node.key);
  }
  return returnValue;
};


/**
 * Find node by key
 * @param{Key} key
 * @return {?Node}
 */
AVLTree.prototype.find = function find (key) {
  var root = this._root;
  // if (root === null)  return null;
  // if (key === root.key) return root;

  var subtree = root, cmp;
  var compare = this._comparator;
  while (subtree) {
    cmp = compare(key, subtree.key);
    if    (cmp === 0) { return subtree; }
    else if (cmp < 0) { subtree = subtree.left; }
    else              { subtree = subtree.right; }
  }

  return null;
};


/**
 * Insert a node into the tree
 * @param{Key} key
 * @param{Value} [data]
 * @return {?Node}
 */
AVLTree.prototype.insert = function insert (key, data) {
    var this$1 = this;

  if (!this._root) {
    this._root = {
      parent: null, left: null, right: null, balanceFactor: 0,
      key: key, data: data
    };
    this._size++;
    return this._root;
  }

  var compare = this._comparator;
  var node  = this._root;
  var parent= null;
  var cmp   = 0;

  if (this._noDuplicates) {
    while (node) {
      cmp = compare(key, node.key);
      parent = node;
      if    (cmp === 0) { return null; }
      else if (cmp < 0) { node = node.left; }
      else              { node = node.right; }
    }
  } else {
    while (node) {
      cmp = compare(key, node.key);
      parent = node;
      if    (cmp <= 0){ node = node.left; } //return null;
      else              { node = node.right; }
    }
  }

  var newNode = {
    left: null,
    right: null,
    balanceFactor: 0,
    parent: parent, key: key, data: data
  };
  var newRoot;
  if (cmp <= 0) { parent.left= newNode; }
  else       { parent.right = newNode; }

  while (parent) {
    cmp = compare(parent.key, key);
    if (cmp < 0) { parent.balanceFactor -= 1; }
    else       { parent.balanceFactor += 1; }

    if      (parent.balanceFactor === 0) { break; }
    else if (parent.balanceFactor < -1) {
      // inlined
      //var newRoot = rightBalance(parent);
      if (parent.right.balanceFactor === 1) { rotateRight(parent.right); }
      newRoot = rotateLeft(parent);

      if (parent === this$1._root) { this$1._root = newRoot; }
      break;
    } else if (parent.balanceFactor > 1) {
      // inlined
      // var newRoot = leftBalance(parent);
      if (parent.left.balanceFactor === -1) { rotateLeft(parent.left); }
      newRoot = rotateRight(parent);

      if (parent === this$1._root) { this$1._root = newRoot; }
      break;
    }
    parent = parent.parent;
  }

  this._size++;
  return newNode;
};


/**
 * Removes the node from the tree. If not found, returns null.
 * @param{Key} key
 * @return {?Node}
 */
AVLTree.prototype.remove = function remove (key) {
    var this$1 = this;

  if (!this._root) { return null; }

  var node = this._root;
  var compare = this._comparator;
  var cmp = 0;

  while (node) {
    cmp = compare(key, node.key);
    if    (cmp === 0) { break; }
    else if (cmp < 0) { node = node.left; }
    else              { node = node.right; }
  }
  if (!node) { return null; }

  var returnValue = node.key;
  var max, min;

  if (node.left) {
    max = node.left;

    while (max.left || max.right) {
      while (max.right) { max = max.right; }

      node.key = max.key;
      node.data = max.data;
      if (max.left) {
        node = max;
        max = max.left;
      }
    }

    node.key= max.key;
    node.data = max.data;
    node = max;
  }

  if (node.right) {
    min = node.right;

    while (min.left || min.right) {
      while (min.left) { min = min.left; }

      node.key= min.key;
      node.data = min.data;
      if (min.right) {
        node = min;
        min = min.right;
      }
    }

    node.key= min.key;
    node.data = min.data;
    node = min;
  }

  var parent = node.parent;
  var pp   = node;
  var newRoot;

  while (parent) {
    if (parent.left === pp) { parent.balanceFactor -= 1; }
    else                  { parent.balanceFactor += 1; }

    if      (parent.balanceFactor < -1) {
      // inlined
      //var newRoot = rightBalance(parent);
      if (parent.right.balanceFactor === 1) { rotateRight(parent.right); }
      newRoot = rotateLeft(parent);

      if (parent === this$1._root) { this$1._root = newRoot; }
      parent = newRoot;
    } else if (parent.balanceFactor > 1) {
      // inlined
      // var newRoot = leftBalance(parent);
      if (parent.left.balanceFactor === -1) { rotateLeft(parent.left); }
      newRoot = rotateRight(parent);

      if (parent === this$1._root) { this$1._root = newRoot; }
      parent = newRoot;
    }

    if (parent.balanceFactor === -1 || parent.balanceFactor === 1) { break; }

    pp   = parent;
    parent = parent.parent;
  }

  if (node.parent) {
    if (node.parent.left === node) { node.parent.left= null; }
    else                         { node.parent.right = null; }
  }

  if (node === this._root) { this._root = null; }

  this._size--;
  return returnValue;
};


/**
 * Bulk-load items
 * @param{Array<Key>}keys
 * @param{Array<Value>}[values]
 * @return {AVLTree}
 */
AVLTree.prototype.load = function load (keys, values) {
    var this$1 = this;
    if ( keys === void 0 ) keys = [];
    if ( values === void 0 ) values = [];

  if (Array.isArray(keys)) {
    for (var i = 0, len = keys.length; i < len; i++) {
      this$1.insert(keys[i], values[i]);
    }
  }
  return this;
};


/**
 * Returns true if the tree is balanced
 * @return {boolean}
 */
AVLTree.prototype.isBalanced = function isBalanced$1 () {
  return isBalanced(this._root);
};


/**
 * String representation of the tree - primitive horizontal print-out
 * @param{Function(Node):string} [printNode]
 * @return {string}
 */
AVLTree.prototype.toString = function toString (printNode) {
  return print(this._root, printNode);
};

Object.defineProperties( AVLTree.prototype, prototypeAccessors );

return AVLTree;

})));


},{}],7:[function(require,module,exports){

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

},{}],8:[function(require,module,exports){
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

},{"./is-object":9,"./request":11,"./request-base":10,"emitter":7}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"./is-object":9}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
'use strict';

module.exports = TinyQueue;

function TinyQueue(data, compare) {
    if (!(this instanceof TinyQueue)) return new TinyQueue(data, compare);

    this.data = data || [];
    this.length = this.data.length;
    this.compare = compare || defaultCompare;

    if (data) for (var i = Math.floor(this.length / 2); i >= 0; i--) this._down(i);
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
        var top = this.data[0];
        this.data[0] = this.data[this.length - 1];
        this.length--;
        this.data.pop();
        this._down(0);
        return top;
    },

    peek: function () {
        return this.data[0];
    },

    _up: function (pos) {
        var data = this.data,
            compare = this.compare;

        while (pos > 0) {
            var parent = Math.floor((pos - 1) / 2);
            if (compare(data[pos], data[parent]) < 0) {
                swap(data, parent, pos);
                pos = parent;

            } else break;
        }
    },

    _down: function (pos) {
        var data = this.data,
            compare = this.compare,
            len = this.length;

        while (true) {
            var left = 2 * pos + 1,
                right = left + 1,
                min = pos;

            if (left < len && compare(data[left], data[min]) < 0) min = left;
            if (right < len && compare(data[right], data[min]) < 0) min = right;

            if (min === pos) return;

            swap(data, min, pos);
            pos = min;
        }
    }
};

function swap(data, i, j) {
    var tmp = data[i];
    data[i] = data[j];
    data[j] = tmp;
}

},{}],13:[function(require,module,exports){
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

  // uncomment this if you want to play with multipolygons
  // if (e1.isSubject === e2.isSubject) {
  //   if(equals(e1.point, e2.point) && e1.contourId === e2.contourId) {
  //     return 0;
  //   } else {
  //     return e1.contourId > e2.contourId ? 1 : -1;
  //   }
  // }

  return (!e1.isSubject && e2.isSubject) ? 1 : -1;
}
/* eslint-enable no-unused-vars */

},{"./signed_area":25}],14:[function(require,module,exports){
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

},{"./compare_events":13,"./equals":19,"./signed_area":25}],15:[function(require,module,exports){
'use strict';

var edgeType = require('./edge_type');

var INTERSECTION = 0;
var UNION        = 1;
var DIFFERENCE   = 2;
var XOR          = 3;

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


function inResult(event, operation) {
  switch (event.type) {
  case edgeType.NORMAL:
    switch (operation) {
    case INTERSECTION:
      return !event.otherInOut;
    case UNION:
      return event.otherInOut;
    case DIFFERENCE:
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

},{"./edge_type":18}],16:[function(require,module,exports){
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
    resultEvents[i].pos = i;
  }

  for (i = 0, len = resultEvents.length; i < len; i++) {
    event = resultEvents[i];
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
  var p  = resultEvents[pos].point;
  var p1 = resultEvents[newPos].point;

  // if (newPos < length &&
  //   p1[0] !== p[0] || p1[1] !== p[1] &&
  //   !processed[newPos]) return newPos;
  // else return pos - 1;


  // while in range and not the current one by value
  while (newPos < length && p1[0] === p[0] && p1[1] === p[1]) {
    if (!processed[newPos]) {
      // console.log(pos, newPos, length);
      return newPos;
    } else                    newPos++;
    p1 = resultEvents[newPos].point;
  }

  newPos = pos - 1;

  while (processed[newPos] && newPos >= origIndex) {
    newPos--;
  }
  // console.log('other', pos, newPos, length);
  return newPos;
}


/**
 * @param  {Array.<SweepEvent>} sortedEvents
 * @return {Array.<*>} polygons
 */
module.exports = function (sortedEvents, operation) {
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
      if (result.length === 0) {
        result.push([[contour]]);
      } else if (operation === operationType.UNION || operation === operationType.XOR) {
        result[result.length - 1].push(contour[0]);
      } else {
        result[result.length - 1].push(contour);
      }
    } else {
      result.push(contour);
    }

    var ringId = result.length - 1;
    var pos = i;

    var initial = resultEvents[i].point;
    // initial.push(resultEvents[i].isExteriorRing);
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
      // resultEvents[pos].point.push(resultEvents[pos].isExteriorRing);

      contour[0].push(resultEvents[pos].point);
      pos = nextPos(pos, resultEvents, processed, i);
    }

    pos = pos === -1 ? i : pos;

    event = resultEvents[pos];
    processed[pos] = processed[event.pos] = true;
    event.otherEvent.resultInOut = true;
    event.otherEvent.contourId   = ringId;
  }

  for (i = 0, len = result.length; i < len; i++) {
    var polygon = result[i];
    for (var j = 0, jj = polygon.length; j < jj; j++) {
      var polygonContour = polygon[j];
      for (var k = 0, kk = polygonContour.length; k < kk; k++) {
        var coords = polygonContour[k];
        if (typeof coords[0] !== 'number') {
          polygon.push(coords[0]);
          polygon.splice(j, 1);
        }
      }
    }
  }

  // Handle if the result is a polygon (eg not multipoly)
  // Commented it again, let's see what do we mean by that
  // if (result.length === 1) result = result[0];
  return result;
};

},{"./compare_events":13,"./operation":22}],17:[function(require,module,exports){
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
    console.warn('what is that?', se);
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

},{"./compare_events":13,"./equals":19,"./sweep_event":27}],18:[function(require,module,exports){
'use strict';

module.exports = {
  NORMAL:               0,
  NON_CONTRIBUTING:     1,
  SAME_TRANSITION:      2,
  DIFFERENT_TRANSITION: 3
};

},{}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
'use strict';

var Queue           = require('tinyqueue');
var SweepEvent      = require('./sweep_event');
var compareEvents   = require('./compare_events');

var max = Math.max;
var min = Math.min;

var contourId = 0;


function processPolygon(contourOrHole, isSubject, depth, Q, bbox, isExteriorRing) {
  var i, len, s1, s2, e1, e2;
  // var d = depth + 1;
  for (i = 0, len = contourOrHole.length - 1; i < len; i++) {
    s1 = contourOrHole[i];
    s2 = contourOrHole[i + 1];
    //processSegment(contourOrHole[i], contourOrHole[i + 1], isSubject, depth + 1, Q, bbox, isExteriorRing);
    e1 = new SweepEvent(s1, false, undefined, isSubject);
    e2 = new SweepEvent(s2, false, e1,        isSubject);
    e1.otherEvent = e2;

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


module.exports = function fillQueue(subject, clipping, sbbox, cbbox) {
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
      if (isExteriorRing) contourId++;
      processPolygon(polygonSet[j], false, contourId, eventQueue, cbbox, isExteriorRing);
    }
  }

  return eventQueue;
};

},{"./compare_events":13,"./sweep_event":27,"tinyqueue":12}],21:[function(require,module,exports){
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

  //console.time('fill');
  var eventQueue = fillQueue(subject, clipping, sbbox, cbbox);
  //console.timeEnd('fill');

  trivial = compareBBoxes(subject, clipping, sbbox, cbbox, operation);
  if (trivial) {
    return trivial === EMPTY ? null : trivial;
  }
  //console.time('subdiv');
  var sortedEvents = subdivideSegments(eventQueue, subject, clipping, sbbox, cbbox, operation);
  //console.timeEnd('subdiv');
  //console.time('connect');
  var result = connectEdges(sortedEvents, operation);
  //console.timeEnd('connect');
  return result;
}


module.exports = boolean;


module.exports.union = function (subject, clipping) {
  return boolean(subject, clipping, operations.UNION);
};


module.exports.diff = function (subject, clipping) {
  return boolean(subject, clipping, operations.DIFFERENCE);
};


module.exports.xor = function (subject, clipping) {
  return boolean(subject, clipping, operations.XOR);
};


module.exports.intersection = function (subject, clipping) {
  return boolean(subject, clipping, operations.INTERSECTION);
};


/**
 * @enum {Number}
 */
module.exports.operations = operations;

},{"./connect_edges":16,"./fill_queue":20,"./operation":22,"./subdivide_segments":26}],22:[function(require,module,exports){
'use strict';

module.exports = {
  INTERSECTION: 0,
  UNION:        1,
  DIFFERENCE:   2,
  XOR:          3
};

},{}],23:[function(require,module,exports){
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
    se1.type = edgeType.NON_CONTRIBUTING;
    se2.type = (se1.inOut === se2.inOut) ?
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

},{"./compare_events":13,"./divide_segment":17,"./edge_type":18,"./equals":19,"./segment_intersection":24}],24:[function(require,module,exports){
'use strict';

var EPSILON = 1e-9;

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
  return a[0] * b[1] - a[1] * b[0];
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
  return a[0] * b[0] + a[1] * b[1];
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
  var sqrLenB  = dotProduct(vb, vb);

  // Check for line intersection. This works because of the properties of the
  // cross product -- specifically, two vectors are parallel if and only if the
  // cross product is the 0 vector. The full calculation involves relative error
  // to account for possible very small line segments. See Schneider & Eberly
  // for details.
  if (sqrKross > EPSILON * sqrLenA * sqrLenB) {
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
    return noEndpointTouch ? null : [toPoint(a1, s, va)];
  }

  // If we've reached this point, then the lines are either parallel or the
  // same, but the segments could overlap partially or fully, or not at all.
  // So we need to find the overlap, if any. To do that, we can use e, which is
  // the (vector) difference between the two initial points. If this is parallel
  // with the line itself, then the two lines are the same line, and there will
  // be overlap.
  var sqrLenE = dotProduct(e, e);
  kross = crossProduct(e, va);
  sqrKross = kross * kross;

  if (sqrKross > EPSILON * sqrLenA * sqrLenE) {
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

},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
'use strict';

var Tree                 = require('avl');
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

  while (eventQueue.length) {
    var event = eventQueue.pop();
    sortedEvents.push(event);

    // optimization by bboxes for intersection and difference goes here
    if ((operation === INTERSECTION && event.point[0] > rightbound) ||
        (operation === DIFFERENCE   && event.point[0] > sbbox[2])) {
      break;
    }

    if (event.left) {
      next  = prev = sweepLine.insert(event);
      //_renderSweepLine(sweepLine, event.point, event);
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

      // _renderSweepLine(sweepLine, event.otherEvent.point, event);

      if (prev && next) {

        if (prev !== begin) prev = sweepLine.prev(prev);
        else                prev = null;

        next = sweepLine.next(next);
        sweepLine.remove(event);

        // _renderSweepLine(sweepLine, event.otherEvent.point, event);

        if (next && prev) {
          //if (typeof prev !== 'undefined' && typeof next !== 'undefined') {
          possibleIntersection(prev.key, next.key, eventQueue);
          //}
        }
      }
    }
  }
  return sortedEvents;
};


/* eslint-disable no-unused-vars, no-debugger, no-undef */
function _renderSweepLine(sweepLine, pos, event) {
  var map = window.map;
  if (!map) return;
  if (window.sws) window.sws.forEach(function (p) {
    map.removeLayer(p);
  });
  window.sws = [];
  sweepLine.forEach(function (e) {
    var poly = L.polyline([
      e.point.slice().reverse(),
      e.otherEvent.point.slice().reverse()
    ], {color: 'green'}).addTo(map);
    window.sws.push(poly);
  });

  if (window.vt) map.removeLayer(window.vt);
  var v = pos.slice();
  var b = map.getBounds();
  window.vt = L.polyline([
    [b.getNorth(), v[0]],
    [b.getSouth(), v[0]]
  ], {color: 'green', weight: 1}).addTo(map);

  if (window.ps) map.removeLayer(window.ps);
  window.ps = L.polyline([
    event.point.slice().reverse(),
    event.otherEvent.point.slice().reverse()
  ], {color: 'black', weight: 9, opacity: 0.4}).addTo(map);
  debugger;
}
/* eslint-enable no-unused-vars, no-debugger, no-undef */

},{"./compare_segments":14,"./compute_fields":15,"./operation":22,"./possible_intersection":23,"avl":6}],27:[function(require,module,exports){
'use strict';

//var signedArea = require('./signed_area');
var EdgeType   = require('./edge_type');

/**
 * Sweepline event
 *
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
  }
};

module.exports = SweepEvent;

},{"./edge_type":18}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZW1vL2pzL2Jvb2xlYW5vcGNvbnRyb2wuanMiLCJkZW1vL2pzL2Nvb3JkaW5hdGVzLmpzIiwiZGVtby9qcy9pbmRleC5qcyIsImRlbW8vanMvcG9seWdvbmNvbnRyb2wuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hdmwvZGlzdC9hdmwuanMiLCJub2RlX21vZHVsZXMvY29tcG9uZW50LWVtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3VwZXJhZ2VudC9saWIvY2xpZW50LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVyYWdlbnQvbGliL2lzLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcmFnZW50L2xpYi9yZXF1ZXN0LWJhc2UuanMiLCJub2RlX21vZHVsZXMvc3VwZXJhZ2VudC9saWIvcmVxdWVzdC5qcyIsIm5vZGVfbW9kdWxlcy90aW55cXVldWUvaW5kZXguanMiLCJzcmMvY29tcGFyZV9ldmVudHMuanMiLCJzcmMvY29tcGFyZV9zZWdtZW50cy5qcyIsInNyYy9jb21wdXRlX2ZpZWxkcy5qcyIsInNyYy9jb25uZWN0X2VkZ2VzLmpzIiwic3JjL2RpdmlkZV9zZWdtZW50LmpzIiwic3JjL2VkZ2VfdHlwZS5qcyIsInNyYy9lcXVhbHMuanMiLCJzcmMvZmlsbF9xdWV1ZS5qcyIsInNyYy9pbmRleC5qcyIsInNyYy9vcGVyYXRpb24uanMiLCJzcmMvcG9zc2libGVfaW50ZXJzZWN0aW9uLmpzIiwic3JjL3NlZ21lbnRfaW50ZXJzZWN0aW9uLmpzIiwic3JjL3NpZ25lZF9hcmVhLmpzIiwic3JjL3N1YmRpdmlkZV9zZWdtZW50cy5qcyIsInNyYy9zd2VlcF9ldmVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ250QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiTC5Cb29sZWFuQ29udHJvbCA9IEwuQ29udHJvbC5leHRlbmQoe1xyXG4gIG9wdGlvbnM6IHtcclxuICAgIHBvc2l0aW9uOiAndG9wcmlnaHQnXHJcbiAgfSxcclxuXHJcbiAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xyXG4gICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuX2NvbnRhaW5lciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LWJhcicpO1xyXG4gICAgdGhpcy5fY29udGFpbmVyLnN0eWxlLmJhY2tncm91bmQgPSAnI2ZmZmZmZic7XHJcbiAgICB0aGlzLl9jb250YWluZXIuc3R5bGUucGFkZGluZyA9ICcxMHB4JztcclxuICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBbXHJcbiAgICAgICc8Zm9ybT4nLFxyXG4gICAgICAgICc8dWwgc3R5bGU9XCJsaXN0LXN0eWxlOm5vbmU7IHBhZGRpbmctbGVmdDogMFwiPicsXHJcbiAgICAgICAgICAnPGxpPicsJzxsYWJlbD4nLCAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJvcFwiIHZhbHVlPVwiMFwiIGNoZWNrZWQgLz4nLCAgJyBJbnRlcnNlY3Rpb24nLCAnPC9sYWJlbD4nLCAnPC9saT4nLFxyXG4gICAgICAgICAgJzxsaT4nLCc8bGFiZWw+JywgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwib3BcIiB2YWx1ZT1cIjFcIiAvPicsICAnIFVuaW9uJywgJzwvbGFiZWw+JywgJzwvbGk+JyxcclxuICAgICAgICAgICc8bGk+JywnPGxhYmVsPicsICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIm9wXCIgdmFsdWU9XCIyXCIgLz4nLCAgJyBEaWZmZXJlbmNlJywgJzwvbGFiZWw+JywgJzwvbGk+JyxcclxuICAgICAgICAgICc8bGk+JywnPGxhYmVsPicsICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIm9wXCIgdmFsdWU9XCIzXCIgLz4nLCAgJyBYb3InLCAnPC9sYWJlbD4nLCAnPC9saT4nLFxyXG4gICAgICAgICc8L3VsPicsXHJcbiAgICAgICAgJzxpbnB1dCB0eXBlPVwic3VibWl0XCIgdmFsdWU9XCJSdW5cIj4nLCAnPGlucHV0IG5hbWU9XCJjbGVhclwiIHR5cGU9XCJidXR0b25cIiB2YWx1ZT1cIkNsZWFyIGxheWVyc1wiPicsXHJcbiAgICAgICc8L2Zvcm0+J10uam9pbignJyk7XHJcbiAgICB2YXIgZm9ybSA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XHJcbiAgICBMLkRvbUV2ZW50XHJcbiAgICAgIC5vbihmb3JtLCAnc3VibWl0JywgZnVuY3Rpb24gKGV2dCkge1xyXG4gICAgICAgIEwuRG9tRXZlbnQuc3RvcChldnQpO1xyXG4gICAgICAgIHZhciByYWRpb3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChcclxuICAgICAgICAgIGZvcm0ucXVlcnlTZWxlY3RvckFsbCgnaW5wdXRbdHlwZT1yYWRpb10nKSk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHJhZGlvcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgaWYgKHJhZGlvc1tpXS5jaGVja2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jYWxsYmFjayhwYXJzZUludChyYWRpb3NbaV0udmFsdWUpKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCB0aGlzKVxyXG4gICAgICAub24oZm9ybVsnY2xlYXInXSwgJ2NsaWNrJywgZnVuY3Rpb24oZXZ0KSB7XHJcbiAgICAgICAgTC5Eb21FdmVudC5zdG9wKGV2dCk7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLmNsZWFyKCk7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIEwuRG9tRXZlbnRcclxuICAgICAgLmRpc2FibGVDbGlja1Byb3BhZ2F0aW9uKHRoaXMuX2NvbnRhaW5lcilcclxuICAgICAgLmRpc2FibGVTY3JvbGxQcm9wYWdhdGlvbih0aGlzLl9jb250YWluZXIpO1xyXG4gICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lcjtcclxuICB9XHJcblxyXG59KTsiLCJMLkNvb3JkaW5hdGVzID0gTC5Db250cm9sLmV4dGVuZCh7XHJcbiAgb3B0aW9uczoge1xyXG4gICAgcG9zaXRpb246ICdib3R0b21yaWdodCdcclxuICB9LFxyXG5cclxuICBvbkFkZDogZnVuY3Rpb24obWFwKSB7XHJcbiAgICB0aGlzLl9jb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbGVhZmxldC1iYXInKTtcclxuICAgIHRoaXMuX2NvbnRhaW5lci5zdHlsZS5iYWNrZ3JvdW5kID0gJyNmZmZmZmYnO1xyXG4gICAgbWFwLm9uKCdtb3VzZW1vdmUnLCB0aGlzLl9vbk1vdXNlTW92ZSwgdGhpcyk7XHJcbiAgICByZXR1cm4gdGhpcy5fY29udGFpbmVyO1xyXG4gIH0sXHJcblxyXG4gIF9vbk1vdXNlTW92ZTogZnVuY3Rpb24oZSkge1xyXG4gICAgdGhpcy5fY29udGFpbmVyLmlubmVySFRNTCA9ICc8c3BhbiBzdHlsZT1cInBhZGRpbmc6IDVweFwiPicgK1xyXG4gICAgICBlLmxhdGxuZy5sbmcudG9GaXhlZCgzKSArICcsICcgKyBlLmxhdGxuZy5sYXQudG9GaXhlZCgzKSArICc8L3NwYW4+JztcclxuICB9XHJcblxyXG59KTsiLCJyZXF1aXJlKCcuL2Nvb3JkaW5hdGVzJyk7XHJcbnJlcXVpcmUoJy4vcG9seWdvbmNvbnRyb2wnKTtcclxucmVxdWlyZSgnLi9ib29sZWFub3Bjb250cm9sJyk7XHJcbnZhciBtYXJ0aW5leiA9IHdpbmRvdy5tYXJ0aW5leiA9IHJlcXVpcmUoJy4uLy4uLycpO1xyXG4vL3ZhciBtYXJ0aW5leiA9IHJlcXVpcmUoJy4uLy4uL2Rpc3QvbWFydGluZXoubWluJyk7XHJcbnZhciB4aHIgPSByZXF1aXJlKCdzdXBlcmFnZW50Jyk7XHJcbnZhciBtb2RlID0gd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDEpO1xyXG52YXIgcGF0aCA9ICcuLi90ZXN0L2ZpeHR1cmVzLyc7XHJcbnZhciBmaWxlO1xyXG5cclxuc3dpdGNoIChtb2RlKSB7XHJcbiAgY2FzZSAnZ2VvJzpcclxuICAgIGZpbGUgPSAnYXNpYS5nZW9qc29uJztcclxuICAgIGJyZWFrO1xyXG4gIGNhc2UgJ3RyYXBlem9pZCc6XHJcbiAgICBmaWxlID0gJ3RyYXBlem9pZC1ib3guZ2VvanNvbic7XHJcbiAgICBicmVhaztcclxuICBjYXNlICdjYW5hZGEnOlxyXG4gICAgZmlsZSA9ICdjYW5hZGEuZ2VvanNvbic7XHJcbiAgICBicmVhaztcclxuICBjYXNlICdob3JzZXNob2UnOlxyXG4gICAgZmlsZSA9ICdob3JzZXNob2UuZ2VvanNvbic7XHJcbiAgICBicmVhaztcclxuICBjYXNlICdob3VyZ2xhc3Nlcyc6XHJcbiAgICBmaWxlID0gJ2hvdXJnbGFzc2VzLmdlb2pzb24nO1xyXG4gICAgYnJlYWs7XHJcbiAgY2FzZSAnZWRnZV9vdmVybGFwJzpcclxuICAgIGZpbGUgPSAncG9seWdvbl90cmFwZXpvaWRfZWRnZV9vdmVybGFwLmdlb2pzb24nO1xyXG4gICAgYnJlYWs7XHJcbiAgY2FzZSAndG91Y2hpbmcnOlxyXG4gICAgZmlsZSA9ICd0b3VjaGluZ19ib3hlcy5nZW9qc29uJztcclxuICAgIGJyZWFrO1xyXG4gIGNhc2UgJ3RyaWFuZ2xlcyc6XHJcbiAgICBmaWxlID0gJ3R3b19wb2ludGVkX3RyaWFuZ2xlcy5nZW9qc29uJztcclxuICAgIGJyZWFrO1xyXG4gIGNhc2UgJ2hvbGVjdXQnOlxyXG4gICAgZmlsZSA9ICdob2xlX2N1dC5nZW9qc29uJztcclxuICAgIGJyZWFrO1xyXG4gIGNhc2UgJ292ZXJsYXBwaW5nX3NlZ21lbnRzJzpcclxuICAgIGZpbGUgPSAnb3ZlcmxhcHBpbmdfc2VnbWVudHMuZ2VvanNvbic7XHJcbiAgICBicmVhaztcclxuICBkZWZhdWx0OlxyXG4gICAgZmlsZSA9ICdob2xlX2hvbGUuZ2VvanNvbic7XHJcbiAgICBicmVhaztcclxufVxyXG5cclxuY29uc29sZS5sb2cobW9kZSk7XHJcblxyXG5cclxudmFyIE9QRVJBVElPTlMgPSB7XHJcbiAgSU5URVJTRUNUSU9OOiAwLFxyXG4gIFVOSU9OOiAgICAgICAgMSxcclxuICBESUZGRVJFTkNFOiAgIDIsXHJcbiAgWE9SOiAgICAgICAgICAzXHJcbn07XHJcblxyXG52YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbmRpdi5pZCA9ICdpbWFnZS1tYXAnO1xyXG5kaXYuc3R5bGUud2lkdGggPSBkaXYuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xyXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRpdik7XHJcblxyXG4vLyBjcmVhdGUgdGhlIHNsaXBweSBtYXBcclxudmFyIG1hcCA9IHdpbmRvdy5tYXAgPSBMLm1hcCgnaW1hZ2UtbWFwJywge1xyXG4gIG1pblpvb206IDEsXHJcbiAgbWF4Wm9vbTogMjAsXHJcbiAgY2VudGVyOiBbMCwgMF0sXHJcbiAgem9vbTogMixcclxuICBjcnM6IG1vZGUgPT09ICdnZW8nID8gTC5DUlMuRVBTRzQzMjYgOiBMLmV4dGVuZCh7fSwgTC5DUlMuU2ltcGxlLCB7XHJcbiAgICB0cmFuc2Zvcm1hdGlvbjogbmV3IEwuVHJhbnNmb3JtYXRpb24oMC41LCAwLCAtMC41LCAwKVxyXG4gIH0pLFxyXG4gIGVkaXRhYmxlOiB0cnVlXHJcbn0pO1xyXG5cclxubWFwLmFkZENvbnRyb2wobmV3IEwuTmV3UG9seWdvbkNvbnRyb2woe1xyXG4gIGNhbGxiYWNrOiBtYXAuZWRpdFRvb2xzLnN0YXJ0UG9seWdvblxyXG59KSk7XHJcbm1hcC5hZGRDb250cm9sKG5ldyBMLkNvb3JkaW5hdGVzKCkpO1xyXG5tYXAuYWRkQ29udHJvbChuZXcgTC5Cb29sZWFuQ29udHJvbCh7XHJcbiAgY2FsbGJhY2s6IHJ1bixcclxuICBjbGVhcjogY2xlYXJcclxufSkpO1xyXG5cclxudmFyIGRyYXduSXRlbXMgPSB3aW5kb3cuZHJhd25JdGVtcyA9IEwuZ2VvSnNvbigpLmFkZFRvKG1hcCk7XHJcblxyXG5mdW5jdGlvbiBsb2FkRGF0YShwYXRoKSB7XHJcbiAgY29uc29sZS5sb2cocGF0aCk7XHJcbiAgLy8gdmFyIHR3b190cmlhbmdsZXMgPSByZXF1aXJlKCcuLi8uLi90ZXN0L2ZpeHR1cmVzL3R3b19zaGFwZXMuZ2VvanNvbicpO1xyXG4gIC8vIHZhciBvbmVJbnNpZGUgPSByZXF1aXJlKCcuLi8uLi90ZXN0L2ZpeHR1cmVzL29uZV9pbnNpZGUuZ2VvanNvbicpO1xyXG4gIC8vIHZhciB0d29Qb2ludGVkVHJpYW5nbGVzID0gcmVxdWlyZSgnLi4vLi4vdGVzdC9maXh0dXJlcy90d29fcG9pbnRlZF90cmlhbmdsZXMuZ2VvanNvbicpO1xyXG4gIC8vIHZhciBzZWxmSW50ZXJzZWN0aW5nID0gcmVxdWlyZSgnLi4vLi4vdGVzdC9maXh0dXJlcy9zZWxmX2ludGVyc2VjdGluZy5nZW9qc29uJyk7XHJcbiAgLy8gdmFyIGhvbGVzID0gcmVxdWlyZSgnLi4vLi4vdGVzdC9maXh0dXJlcy9ob2xlX2hvbGUuZ2VvanNvbicpO1xyXG4gIC8vdmFyIGRhdGEgPSAgcmVxdWlyZSgnLi4vLi4vdGVzdC9maXh0dXJlcy9pbmRvbmVzaWEuZ2VvanNvbicpO1xyXG4gIHhoclxyXG4gICAgLmdldChwYXRoKVxyXG4gICAgLmFjY2VwdCgnanNvbicpXHJcbiAgICAuZW5kKGZ1bmN0aW9uKGUsIHIpIHtcclxuICAgICAgaWYgKCFlKSB7XHJcbiAgICAgICAgZHJhd25JdGVtcy5hZGREYXRhKEpTT04ucGFyc2Uoci50ZXh0KSk7XHJcbiAgICAgICAgbWFwLmZpdEJvdW5kcyhkcmF3bkl0ZW1zLmdldEJvdW5kcygpLnBhZCgwLjA1KSwgeyBhbmltYXRlOiBmYWxzZSB9KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsZWFyKCkge1xyXG4gIGRyYXduSXRlbXMuY2xlYXJMYXllcnMoKTtcclxuICByZXN1bHRzLmNsZWFyTGF5ZXJzKCk7XHJcbn1cclxuXHJcbnZhciByZWFkZXIgPSBuZXcganN0cy5pby5HZW9KU09OUmVhZGVyKCk7XHJcbnZhciB3cml0ZXIgPSBuZXcganN0cy5pby5HZW9KU09OV3JpdGVyKCk7XHJcblxyXG5mdW5jdGlvbiBydW4gKG9wKSB7XHJcbiAgdmFyIGxheWVycyA9IGRyYXduSXRlbXMuZ2V0TGF5ZXJzKCk7XHJcbiAgaWYgKGxheWVycy5sZW5ndGggPCAyKSByZXR1cm47XHJcbiAgdmFyIHN1YmplY3QgPSBsYXllcnNbMF0udG9HZW9KU09OKCk7XHJcbiAgdmFyIGNsaXBwaW5nID0gbGF5ZXJzWzFdLnRvR2VvSlNPTigpO1xyXG5cclxuICBjb25zb2xlLmxvZygnaW5wdXQnLCBzdWJqZWN0LCBjbGlwcGluZywgb3ApO1xyXG5cclxuICBzdWJqZWN0ICA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc3ViamVjdCkpO1xyXG4gIGNsaXBwaW5nID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjbGlwcGluZykpO1xyXG5cclxuICB2YXIgb3BlcmF0aW9uO1xyXG4gIGlmIChvcCA9PT0gT1BFUkFUSU9OUy5JTlRFUlNFQ1RJT04pIHtcclxuICAgIG9wZXJhdGlvbiA9IG1hcnRpbmV6LmludGVyc2VjdGlvbjtcclxuICB9IGVsc2UgaWYgKG9wID09PSBPUEVSQVRJT05TLlVOSU9OKSB7XHJcbiAgICBvcGVyYXRpb24gPSBtYXJ0aW5lei51bmlvbjtcclxuICB9IGVsc2UgaWYgKG9wID09PSBPUEVSQVRJT05TLkRJRkZFUkVOQ0UpIHtcclxuICAgIG9wZXJhdGlvbiA9IG1hcnRpbmV6LmRpZmY7XHJcbiAgfSBlbHNlIHtcclxuICAgIG9wZXJhdGlvbiA9IG1hcnRpbmV6LnhvcjtcclxuICB9XHJcblxyXG4gIGNvbnNvbGUudGltZSgnbWFydGluZXonKTtcclxuICB2YXIgcmVzdWx0ID0gb3BlcmF0aW9uKHN1YmplY3QuZ2VvbWV0cnkuY29vcmRpbmF0ZXMsIGNsaXBwaW5nLmdlb21ldHJ5LmNvb3JkaW5hdGVzKTtcclxuICBjb25zb2xlLnRpbWVFbmQoJ21hcnRpbmV6Jyk7XHJcblxyXG4gIC8vaWYgKG9wID09PSBPUEVSQVRJT05TLlVOSU9OKSByZXN1bHQgPSByZXN1bHRbMF07XHJcbiAgY29uc29sZS5sb2coJ3Jlc3VsdCcsIHJlc3VsdCk7XHJcbiAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0KSlcclxuICByZXN1bHRzLmNsZWFyTGF5ZXJzKCk7XHJcbiAgcmVzdWx0cy5hZGREYXRhKHtcclxuICAgICd0eXBlJzogJ0ZlYXR1cmUnLFxyXG4gICAgJ2dlb21ldHJ5Jzoge1xyXG4gICAgICAndHlwZSc6ICdNdWx0aVBvbHlnb24nLFxyXG4gICAgICAnY29vcmRpbmF0ZXMnOiByZXN1bHRcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgIGNvbnNvbGUudGltZSgnanN0cycpO1xyXG4gICAgdmFyIHMgPSByZWFkZXIucmVhZChzdWJqZWN0KTtcclxuICAgIHZhciBjID0gcmVhZGVyLnJlYWQoY2xpcHBpbmcpO1xyXG4gICAgdmFyIHJlcztcclxuICAgIGlmIChvcCA9PT0gT1BFUkFUSU9OUy5JTlRFUlNFQ1RJT04pIHtcclxuICAgICAgcmVzID0gcy5nZW9tZXRyeS5pbnRlcnNlY3Rpb24oYy5nZW9tZXRyeSk7XHJcbiAgICB9IGVsc2UgaWYgKG9wID09PSBPUEVSQVRJT05TLlVOSU9OKSB7XHJcbiAgICAgIHJlcyA9IHMuZ2VvbWV0cnkudW5pb24oYy5nZW9tZXRyeSk7XHJcbiAgICB9IGVsc2UgaWYgKG9wID09PSBPUEVSQVRJT05TLkRJRkZFUkVOQ0UpIHtcclxuICAgICAgcmVzID0gcy5nZW9tZXRyeS5kaWZmZXJlbmNlKGMuZ2VvbWV0cnkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmVzID0gcy5nZW9tZXRyeS5zeW1EaWZmZXJlbmNlKGMuZ2VvbWV0cnkpO1xyXG4gICAgfVxyXG4gICAgcmVzID0gd3JpdGVyLndyaXRlKHJlcyk7XHJcbiAgICBjb25zb2xlLnRpbWVFbmQoJ2pzdHMnKTtcclxuICB9LCA1MDApO1xyXG59XHJcblxyXG4vL2RyYXduSXRlbXMuYWRkRGF0YShvbmVJbnNpZGUpO1xyXG4vL2RyYXduSXRlbXMuYWRkRGF0YSh0d29Qb2ludGVkVHJpYW5nbGVzKTtcclxuLy9kcmF3bkl0ZW1zLmFkZERhdGEoc2VsZkludGVyc2VjdGluZyk7XHJcbi8vZHJhd25JdGVtcy5hZGREYXRhKGhvbGVzKTtcclxuLy9kcmF3bkl0ZW1zLmFkZERhdGEoZGF0YSk7XHJcblxyXG5tYXAub24oJ2VkaXRhYmxlOmNyZWF0ZWQnLCBmdW5jdGlvbihldnQpIHtcclxuICBkcmF3bkl0ZW1zLmFkZExheWVyKGV2dC5sYXllcik7XHJcbiAgZXZ0LmxheWVyLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcclxuICAgIGlmICgoZS5vcmlnaW5hbEV2ZW50LmN0cmxLZXkgfHwgZS5vcmlnaW5hbEV2ZW50Lm1ldGFLZXkpICYmIHRoaXMuZWRpdEVuYWJsZWQoKSkge1xyXG4gICAgICB0aGlzLmVkaXRvci5uZXdIb2xlKGUubGF0bG5nKTtcclxuICAgIH1cclxuICB9KTtcclxufSk7XHJcblxyXG52YXIgcmVzdWx0cyA9IHdpbmRvdy5yZXN1bHRzID0gTC5nZW9Kc29uKG51bGwsIHtcclxuICBzdHlsZTogZnVuY3Rpb24oZmVhdHVyZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgY29sb3I6ICdyZWQnLFxyXG4gICAgICB3ZWlnaHQ6IDFcclxuICAgIH07XHJcbiAgfVxyXG59KS5hZGRUbyhtYXApO1xyXG5cclxubG9hZERhdGEocGF0aCArIGZpbGUpO1xyXG4iLCJMLkVkaXRDb250cm9sID0gTC5Db250cm9sLmV4dGVuZCh7XHJcblxyXG4gIG9wdGlvbnM6IHtcclxuICAgIHBvc2l0aW9uOiAndG9wbGVmdCcsXHJcbiAgICBjYWxsYmFjazogbnVsbCxcclxuICAgIGtpbmQ6ICcnLFxyXG4gICAgaHRtbDogJydcclxuICB9LFxyXG5cclxuICBvbkFkZDogZnVuY3Rpb24gKG1hcCkge1xyXG4gICAgdmFyIGNvbnRhaW5lciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LWNvbnRyb2wgbGVhZmxldC1iYXInKSxcclxuICAgICAgICBsaW5rID0gTC5Eb21VdGlsLmNyZWF0ZSgnYScsICcnLCBjb250YWluZXIpO1xyXG5cclxuICAgIGxpbmsuaHJlZiA9ICcjJztcclxuICAgIGxpbmsudGl0bGUgPSAnQ3JlYXRlIGEgbmV3ICcgKyB0aGlzLm9wdGlvbnMua2luZDtcclxuICAgIGxpbmsuaW5uZXJIVE1MID0gdGhpcy5vcHRpb25zLmh0bWw7XHJcbiAgICBMLkRvbUV2ZW50Lm9uKGxpbmssICdjbGljaycsIEwuRG9tRXZlbnQuc3RvcClcclxuICAgICAgICAgICAgICAub24obGluaywgJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LkxBWUVSID0gdGhpcy5vcHRpb25zLmNhbGxiYWNrLmNhbGwobWFwLmVkaXRUb29scyk7XHJcbiAgICAgICAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgcmV0dXJuIGNvbnRhaW5lcjtcclxuICB9XHJcblxyXG59KTtcclxuXHJcbkwuTmV3UG9seWdvbkNvbnRyb2wgPSBMLkVkaXRDb250cm9sLmV4dGVuZCh7XHJcbiAgb3B0aW9uczoge1xyXG4gICAgcG9zaXRpb246ICd0b3BsZWZ0JyxcclxuICAgIGtpbmQ6ICdwb2x5Z29uJyxcclxuICAgIGh0bWw6ICfilrAnXHJcbiAgfVxyXG59KTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgbWFydGluZXogPSByZXF1aXJlKCcuL3NyYy9pbmRleCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgdW5pb246IG1hcnRpbmV6LnVuaW9uLFxyXG4gIGRpZmY6IG1hcnRpbmV6LmRpZmYsXHJcbiAgeG9yOiBtYXJ0aW5lei54b3IsXHJcbiAgaW50ZXJzZWN0aW9uOiBtYXJ0aW5lei5pbnRlcnNlY3Rpb25cclxufTtcclxuIiwiKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0dHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCkgOlxuXHR0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoZmFjdG9yeSkgOlxuXHQoZ2xvYmFsLmF2bCA9IGZhY3RvcnkoKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBQcmludHMgdHJlZSBob3Jpem9udGFsbHlcbiAqIEBwYXJhbSAge05vZGV9ICAgICAgICAgICAgICAgICAgICAgICByb290XG4gKiBAcGFyYW0gIHtGdW5jdGlvbihub2RlOk5vZGUpOlN0cmluZ30gW3ByaW50Tm9kZV1cbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gcHJpbnQgKHJvb3QsIHByaW50Tm9kZSkge1xuICBpZiAoIHByaW50Tm9kZSA9PT0gdm9pZCAwICkgcHJpbnROb2RlID0gZnVuY3Rpb24gKG4pIHsgcmV0dXJuIG4ua2V5OyB9O1xuXG4gIHZhciBvdXQgPSBbXTtcbiAgcm93KHJvb3QsICcnLCB0cnVlLCBmdW5jdGlvbiAodikgeyByZXR1cm4gb3V0LnB1c2godik7IH0sIHByaW50Tm9kZSk7XG4gIHJldHVybiBvdXQuam9pbignJyk7XG59XG5cbi8qKlxuICogUHJpbnRzIGxldmVsIG9mIHRoZSB0cmVlXG4gKiBAcGFyYW0gIHtOb2RlfSAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RcbiAqIEBwYXJhbSAge1N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgcHJlZml4XG4gKiBAcGFyYW0gIHtCb29sZWFufSAgICAgICAgICAgICAgICAgICAgIGlzVGFpbFxuICogQHBhcmFtICB7RnVuY3Rpb24oaW46c3RyaW5nKTp2b2lkfSAgICBvdXRcbiAqIEBwYXJhbSAge0Z1bmN0aW9uKG5vZGU6Tm9kZSk6U3RyaW5nfSAgcHJpbnROb2RlXG4gKi9cbmZ1bmN0aW9uIHJvdyAocm9vdCwgcHJlZml4LCBpc1RhaWwsIG91dCwgcHJpbnROb2RlKSB7XG4gIGlmIChyb290KSB7XG4gICAgb3V0KChcIlwiICsgcHJlZml4ICsgKGlzVGFpbCA/ICfilJTilIDilIAgJyA6ICfilJzilIDilIAgJykgKyAocHJpbnROb2RlKHJvb3QpKSArIFwiXFxuXCIpKTtcbiAgICB2YXIgaW5kZW50ID0gcHJlZml4ICsgKGlzVGFpbCA/ICcgICAgJyA6ICfilIIgICAnKTtcbiAgICBpZiAocm9vdC5sZWZ0KSAgeyByb3cocm9vdC5sZWZ0LCAgaW5kZW50LCBmYWxzZSwgb3V0LCBwcmludE5vZGUpOyB9XG4gICAgaWYgKHJvb3QucmlnaHQpIHsgcm93KHJvb3QucmlnaHQsIGluZGVudCwgdHJ1ZSwgIG91dCwgcHJpbnROb2RlKTsgfVxuICB9XG59XG5cblxuLyoqXG4gKiBJcyB0aGUgdHJlZSBiYWxhbmNlZCAobm9uZSBvZiB0aGUgc3VidHJlZXMgZGlmZmVyIGluIGhlaWdodCBieSBtb3JlIHRoYW4gMSlcbiAqIEBwYXJhbSAge05vZGV9ICAgIHJvb3RcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzQmFsYW5jZWQocm9vdCkge1xuICBpZiAocm9vdCA9PT0gbnVsbCkgeyByZXR1cm4gdHJ1ZTsgfSAvLyBJZiBub2RlIGlzIGVtcHR5IHRoZW4gcmV0dXJuIHRydWVcblxuICAvLyBHZXQgdGhlIGhlaWdodCBvZiBsZWZ0IGFuZCByaWdodCBzdWIgdHJlZXNcbiAgdmFyIGxoID0gaGVpZ2h0KHJvb3QubGVmdCk7XG4gIHZhciByaCA9IGhlaWdodChyb290LnJpZ2h0KTtcblxuICBpZiAoTWF0aC5hYnMobGggLSByaCkgPD0gMSAmJlxuICAgICAgaXNCYWxhbmNlZChyb290LmxlZnQpICAmJlxuICAgICAgaXNCYWxhbmNlZChyb290LnJpZ2h0KSkgeyByZXR1cm4gdHJ1ZTsgfVxuXG4gIC8vIElmIHdlIHJlYWNoIGhlcmUgdGhlbiB0cmVlIGlzIG5vdCBoZWlnaHQtYmFsYW5jZWRcbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFRoZSBmdW5jdGlvbiBDb21wdXRlIHRoZSAnaGVpZ2h0JyBvZiBhIHRyZWUuXG4gKiBIZWlnaHQgaXMgdGhlIG51bWJlciBvZiBub2RlcyBhbG9uZyB0aGUgbG9uZ2VzdCBwYXRoXG4gKiBmcm9tIHRoZSByb290IG5vZGUgZG93biB0byB0aGUgZmFydGhlc3QgbGVhZiBub2RlLlxuICpcbiAqIEBwYXJhbSAge05vZGV9IG5vZGVcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqL1xuZnVuY3Rpb24gaGVpZ2h0KG5vZGUpIHtcbiAgcmV0dXJuIG5vZGUgPyAoMSArIE1hdGgubWF4KGhlaWdodChub2RlLmxlZnQpLCBoZWlnaHQobm9kZS5yaWdodCkpKSA6IDA7XG59XG5cbi8vIGZ1bmN0aW9uIGNyZWF0ZU5vZGUgKHBhcmVudCwgbGVmdCwgcmlnaHQsIGhlaWdodCwga2V5LCBkYXRhKSB7XG4vLyAgIHJldHVybiB7IHBhcmVudCwgbGVmdCwgcmlnaHQsIGJhbGFuY2VGYWN0b3I6IGhlaWdodCwga2V5LCBkYXRhIH07XG4vLyB9XG5cbi8qKlxuICogQHR5cGVkZWYge3tcbiAqICAgcGFyZW50OiAgICAgICAgP05vZGUsXG4gKiAgIGxlZnQ6ICAgICAgICAgID9Ob2RlLFxuICogICByaWdodDogICAgICAgICA/Tm9kZSxcbiAqICAgYmFsYW5jZUZhY3RvcjogbnVtYmVyLFxuICogICBrZXk6ICAgICAgICAgICBLZXksXG4gKiAgIGRhdGE6ICAgICAgICAgIFZhbHVlXG4gKiB9fSBOb2RlXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7Kn0gS2V5XG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7Kn0gVmFsdWVcbiAqL1xuXG4vKipcbiAqIERlZmF1bHQgY29tcGFyaXNvbiBmdW5jdGlvblxuICogQHBhcmFtIHtLZXl9IGFcbiAqIEBwYXJhbSB7S2V5fSBiXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBERUZBVUxUX0NPTVBBUkUgKGEsIGIpIHsgcmV0dXJuIGEgPiBiID8gMSA6IGEgPCBiID8gLTEgOiAwOyB9XG5cblxuLyoqXG4gKiBTaW5nbGUgbGVmdCByb3RhdGlvblxuICogQHBhcmFtICB7Tm9kZX0gbm9kZVxuICogQHJldHVybiB7Tm9kZX1cbiAqL1xuZnVuY3Rpb24gcm90YXRlTGVmdCAobm9kZSkge1xuICB2YXIgcmlnaHROb2RlID0gbm9kZS5yaWdodDtcbiAgbm9kZS5yaWdodCAgICA9IHJpZ2h0Tm9kZS5sZWZ0O1xuXG4gIGlmIChyaWdodE5vZGUubGVmdCkgeyByaWdodE5vZGUubGVmdC5wYXJlbnQgPSBub2RlOyB9XG5cbiAgcmlnaHROb2RlLnBhcmVudCA9IG5vZGUucGFyZW50O1xuICBpZiAocmlnaHROb2RlLnBhcmVudCkge1xuICAgIGlmIChyaWdodE5vZGUucGFyZW50LmxlZnQgPT09IG5vZGUpIHtcbiAgICAgIHJpZ2h0Tm9kZS5wYXJlbnQubGVmdCA9IHJpZ2h0Tm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmlnaHROb2RlLnBhcmVudC5yaWdodCA9IHJpZ2h0Tm9kZTtcbiAgICB9XG4gIH1cblxuICBub2RlLnBhcmVudCAgICA9IHJpZ2h0Tm9kZTtcbiAgcmlnaHROb2RlLmxlZnQgPSBub2RlO1xuXG4gIG5vZGUuYmFsYW5jZUZhY3RvciArPSAxO1xuICBpZiAocmlnaHROb2RlLmJhbGFuY2VGYWN0b3IgPCAwKSB7XG4gICAgbm9kZS5iYWxhbmNlRmFjdG9yIC09IHJpZ2h0Tm9kZS5iYWxhbmNlRmFjdG9yO1xuICB9XG5cbiAgcmlnaHROb2RlLmJhbGFuY2VGYWN0b3IgKz0gMTtcbiAgaWYgKG5vZGUuYmFsYW5jZUZhY3RvciA+IDApIHtcbiAgICByaWdodE5vZGUuYmFsYW5jZUZhY3RvciArPSBub2RlLmJhbGFuY2VGYWN0b3I7XG4gIH1cbiAgcmV0dXJuIHJpZ2h0Tm9kZTtcbn1cblxuXG5mdW5jdGlvbiByb3RhdGVSaWdodCAobm9kZSkge1xuICB2YXIgbGVmdE5vZGUgPSBub2RlLmxlZnQ7XG4gIG5vZGUubGVmdCA9IGxlZnROb2RlLnJpZ2h0O1xuICBpZiAobm9kZS5sZWZ0KSB7IG5vZGUubGVmdC5wYXJlbnQgPSBub2RlOyB9XG5cbiAgbGVmdE5vZGUucGFyZW50ID0gbm9kZS5wYXJlbnQ7XG4gIGlmIChsZWZ0Tm9kZS5wYXJlbnQpIHtcbiAgICBpZiAobGVmdE5vZGUucGFyZW50LmxlZnQgPT09IG5vZGUpIHtcbiAgICAgIGxlZnROb2RlLnBhcmVudC5sZWZ0ID0gbGVmdE5vZGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxlZnROb2RlLnBhcmVudC5yaWdodCA9IGxlZnROb2RlO1xuICAgIH1cbiAgfVxuXG4gIG5vZGUucGFyZW50ICAgID0gbGVmdE5vZGU7XG4gIGxlZnROb2RlLnJpZ2h0ID0gbm9kZTtcblxuICBub2RlLmJhbGFuY2VGYWN0b3IgLT0gMTtcbiAgaWYgKGxlZnROb2RlLmJhbGFuY2VGYWN0b3IgPiAwKSB7XG4gICAgbm9kZS5iYWxhbmNlRmFjdG9yIC09IGxlZnROb2RlLmJhbGFuY2VGYWN0b3I7XG4gIH1cblxuICBsZWZ0Tm9kZS5iYWxhbmNlRmFjdG9yIC09IDE7XG4gIGlmIChub2RlLmJhbGFuY2VGYWN0b3IgPCAwKSB7XG4gICAgbGVmdE5vZGUuYmFsYW5jZUZhY3RvciArPSBub2RlLmJhbGFuY2VGYWN0b3I7XG4gIH1cblxuICByZXR1cm4gbGVmdE5vZGU7XG59XG5cblxuLy8gZnVuY3Rpb24gbGVmdEJhbGFuY2UgKG5vZGUpIHtcbi8vICAgaWYgKG5vZGUubGVmdC5iYWxhbmNlRmFjdG9yID09PSAtMSkgcm90YXRlTGVmdChub2RlLmxlZnQpO1xuLy8gICByZXR1cm4gcm90YXRlUmlnaHQobm9kZSk7XG4vLyB9XG5cblxuLy8gZnVuY3Rpb24gcmlnaHRCYWxhbmNlIChub2RlKSB7XG4vLyAgIGlmIChub2RlLnJpZ2h0LmJhbGFuY2VGYWN0b3IgPT09IDEpIHJvdGF0ZVJpZ2h0KG5vZGUucmlnaHQpO1xuLy8gICByZXR1cm4gcm90YXRlTGVmdChub2RlKTtcbi8vIH1cblxuXG52YXIgQVZMVHJlZSA9IGZ1bmN0aW9uIEFWTFRyZWUgKGNvbXBhcmF0b3IsIG5vRHVwbGljYXRlcykge1xuICBpZiAoIG5vRHVwbGljYXRlcyA9PT0gdm9pZCAwICkgbm9EdXBsaWNhdGVzID0gZmFsc2U7XG5cbiAgdGhpcy5fY29tcGFyYXRvciA9IGNvbXBhcmF0b3IgfHwgREVGQVVMVF9DT01QQVJFO1xuICB0aGlzLl9yb290ID0gbnVsbDtcbiAgdGhpcy5fc2l6ZSA9IDA7XG4gIHRoaXMuX25vRHVwbGljYXRlcyA9ICEhbm9EdXBsaWNhdGVzO1xufTtcblxudmFyIHByb3RvdHlwZUFjY2Vzc29ycyA9IHsgc2l6ZToge30gfTtcblxuXG4vKipcbiAqIENsZWFyIHRoZSB0cmVlXG4gKiBAcmV0dXJuIHtBVkxUcmVlfVxuICovXG5BVkxUcmVlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gZGVzdHJveSAoKSB7XG4gIHRoaXMuX3Jvb3QgPSBudWxsO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTnVtYmVyIG9mIG5vZGVzXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbnByb3RvdHlwZUFjY2Vzc29ycy5zaXplLmdldCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX3NpemU7XG59O1xuXG5cbi8qKlxuICogV2hldGhlciB0aGUgdHJlZSBjb250YWlucyBhIG5vZGUgd2l0aCB0aGUgZ2l2ZW4ga2V5XG4gKiBAcGFyYW17S2V5fSBrZXlcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUvZmFsc2VcbiAqL1xuQVZMVHJlZS5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiBjb250YWlucyAoa2V5KSB7XG4gIGlmICh0aGlzLl9yb290KXtcbiAgICB2YXIgbm9kZSAgICAgPSB0aGlzLl9yb290O1xuICAgIHZhciBjb21wYXJhdG9yID0gdGhpcy5fY29tcGFyYXRvcjtcbiAgICB3aGlsZSAobm9kZSl7XG4gICAgICB2YXIgY21wID0gY29tcGFyYXRvcihrZXksIG5vZGUua2V5KTtcbiAgICAgIGlmICAgIChjbXAgPT09IDApIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgIGVsc2UgaWYgKGNtcCA8IDApIHsgbm9kZSA9IG5vZGUubGVmdDsgfVxuICAgICAgZWxzZSAgICAgICAgICAgICAgeyBub2RlID0gbm9kZS5yaWdodDsgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5cbi8qIGVzbGludC1kaXNhYmxlIGNsYXNzLW1ldGhvZHMtdXNlLXRoaXMgKi9cblxuLyoqXG4gKiBTdWNjZXNzb3Igbm9kZVxuICogQHBhcmFte05vZGV9IG5vZGVcbiAqIEByZXR1cm4gez9Ob2RlfVxuICovXG5BVkxUcmVlLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gbmV4dCAobm9kZSkge1xuICB2YXIgc3VjY2Vzc29yID0gbm9kZTtcbiAgaWYgKHN1Y2Nlc3Nvcikge1xuICAgIGlmIChzdWNjZXNzb3IucmlnaHQpIHtcbiAgICAgIHN1Y2Nlc3NvciA9IHN1Y2Nlc3Nvci5yaWdodDtcbiAgICAgIHdoaWxlIChzdWNjZXNzb3IgJiYgc3VjY2Vzc29yLmxlZnQpIHsgc3VjY2Vzc29yID0gc3VjY2Vzc29yLmxlZnQ7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3VjY2Vzc29yID0gbm9kZS5wYXJlbnQ7XG4gICAgICB3aGlsZSAoc3VjY2Vzc29yICYmIHN1Y2Nlc3Nvci5yaWdodCA9PT0gbm9kZSkge1xuICAgICAgICBub2RlID0gc3VjY2Vzc29yOyBzdWNjZXNzb3IgPSBzdWNjZXNzb3IucGFyZW50O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gc3VjY2Vzc29yO1xufTtcblxuXG4vKipcbiAqIFByZWRlY2Vzc29yIG5vZGVcbiAqIEBwYXJhbXtOb2RlfSBub2RlXG4gKiBAcmV0dXJuIHs/Tm9kZX1cbiAqL1xuQVZMVHJlZS5wcm90b3R5cGUucHJldiA9IGZ1bmN0aW9uIHByZXYgKG5vZGUpIHtcbiAgdmFyIHByZWRlY2Vzc29yID0gbm9kZTtcbiAgaWYgKHByZWRlY2Vzc29yKSB7XG4gICAgaWYgKHByZWRlY2Vzc29yLmxlZnQpIHtcbiAgICAgIHByZWRlY2Vzc29yID0gcHJlZGVjZXNzb3IubGVmdDtcbiAgICAgIHdoaWxlIChwcmVkZWNlc3NvciAmJiBwcmVkZWNlc3Nvci5yaWdodCkgeyBwcmVkZWNlc3NvciA9IHByZWRlY2Vzc29yLnJpZ2h0OyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZWRlY2Vzc29yID0gbm9kZS5wYXJlbnQ7XG4gICAgICB3aGlsZSAocHJlZGVjZXNzb3IgJiYgcHJlZGVjZXNzb3IubGVmdCA9PT0gbm9kZSkge1xuICAgICAgICBub2RlID0gcHJlZGVjZXNzb3I7XG4gICAgICAgIHByZWRlY2Vzc29yID0gcHJlZGVjZXNzb3IucGFyZW50O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcHJlZGVjZXNzb3I7XG59O1xuLyogZXNsaW50LWVuYWJsZSBjbGFzcy1tZXRob2RzLXVzZS10aGlzICovXG5cblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgZm9yRWFjaFxuICogQGNhbGxiYWNrIGZvckVhY2hDYWxsYmFja1xuICogQHBhcmFtIHtOb2RlfSBub2RlXG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAqL1xuXG4vKipcbiAqIEBwYXJhbXtmb3JFYWNoQ2FsbGJhY2t9IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtBVkxUcmVlfVxuICovXG5BVkxUcmVlLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gZm9yRWFjaCAoY2FsbGJhY2spIHtcbiAgdmFyIGN1cnJlbnQgPSB0aGlzLl9yb290O1xuICB2YXIgcyA9IFtdLCBkb25lID0gZmFsc2UsIGkgPSAwO1xuXG4gIHdoaWxlICghZG9uZSkge1xuICAgIC8vIFJlYWNoIHRoZSBsZWZ0IG1vc3QgTm9kZSBvZiB0aGUgY3VycmVudCBOb2RlXG4gICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgIC8vIFBsYWNlIHBvaW50ZXIgdG8gYSB0cmVlIG5vZGUgb24gdGhlIHN0YWNrXG4gICAgICAvLyBiZWZvcmUgdHJhdmVyc2luZyB0aGUgbm9kZSdzIGxlZnQgc3VidHJlZVxuICAgICAgcy5wdXNoKGN1cnJlbnQpO1xuICAgICAgY3VycmVudCA9IGN1cnJlbnQubGVmdDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQmFja1RyYWNrIGZyb20gdGhlIGVtcHR5IHN1YnRyZWUgYW5kIHZpc2l0IHRoZSBOb2RlXG4gICAgICAvLyBhdCB0aGUgdG9wIG9mIHRoZSBzdGFjazsgaG93ZXZlciwgaWYgdGhlIHN0YWNrIGlzXG4gICAgICAvLyBlbXB0eSB5b3UgYXJlIGRvbmVcbiAgICAgIGlmIChzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY3VycmVudCA9IHMucG9wKCk7XG4gICAgICAgIGNhbGxiYWNrKGN1cnJlbnQsIGkrKyk7XG5cbiAgICAgICAgLy8gV2UgaGF2ZSB2aXNpdGVkIHRoZSBub2RlIGFuZCBpdHMgbGVmdFxuICAgICAgICAvLyBzdWJ0cmVlLiBOb3csIGl0J3MgcmlnaHQgc3VidHJlZSdzIHR1cm5cbiAgICAgICAgY3VycmVudCA9IGN1cnJlbnQucmlnaHQ7XG4gICAgICB9IGVsc2UgeyBkb25lID0gdHJ1ZTsgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqXG4gKiBSZXR1cm5zIGFsbCBrZXlzIGluIG9yZGVyXG4gKiBAcmV0dXJuIHtBcnJheTxLZXk+fVxuICovXG5BVkxUcmVlLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24ga2V5cyAoKSB7XG4gIHZhciBjdXJyZW50ID0gdGhpcy5fcm9vdDtcbiAgdmFyIHMgPSBbXSwgciA9IFtdLCBkb25lID0gZmFsc2U7XG5cbiAgd2hpbGUgKCFkb25lKSB7XG4gICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgIHMucHVzaChjdXJyZW50KTtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50LmxlZnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY3VycmVudCA9IHMucG9wKCk7XG4gICAgICAgIHIucHVzaChjdXJyZW50LmtleSk7XG4gICAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnJpZ2h0O1xuICAgICAgfSBlbHNlIHsgZG9uZSA9IHRydWU7IH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHI7XG59O1xuXG5cbi8qKlxuICogUmV0dXJucyBgZGF0YWAgZmllbGRzIG9mIGFsbCBub2RlcyBpbiBvcmRlci5cbiAqIEByZXR1cm4ge0FycmF5PFZhbHVlPn1cbiAqL1xuQVZMVHJlZS5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24gdmFsdWVzICgpIHtcbiAgdmFyIGN1cnJlbnQgPSB0aGlzLl9yb290O1xuICB2YXIgcyA9IFtdLCByID0gW10sIGRvbmUgPSBmYWxzZTtcblxuICB3aGlsZSAoIWRvbmUpIHtcbiAgICBpZiAoY3VycmVudCkge1xuICAgICAgcy5wdXNoKGN1cnJlbnQpO1xuICAgICAgY3VycmVudCA9IGN1cnJlbnQubGVmdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjdXJyZW50ID0gcy5wb3AoKTtcbiAgICAgICAgci5wdXNoKGN1cnJlbnQuZGF0YSk7XG4gICAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnJpZ2h0O1xuICAgICAgfSBlbHNlIHsgZG9uZSA9IHRydWU7IH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHI7XG59O1xuXG5cbi8qKlxuICogUmV0dXJucyBub2RlIGF0IGdpdmVuIGluZGV4XG4gKiBAcGFyYW17bnVtYmVyfSBpbmRleFxuICogQHJldHVybiB7P05vZGV9XG4gKi9cbkFWTFRyZWUucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gYXQgKGluZGV4KSB7XG4gIC8vIHJlbW92ZWQgYWZ0ZXIgYSBjb25zaWRlcmF0aW9uLCBtb3JlIG1pc2xlYWRpbmcgdGhhbiB1c2VmdWxcbiAgLy8gaW5kZXggPSBpbmRleCAlIHRoaXMuc2l6ZTtcbiAgLy8gaWYgKGluZGV4IDwgMCkgaW5kZXggPSB0aGlzLnNpemUgLSBpbmRleDtcblxuICB2YXIgY3VycmVudCA9IHRoaXMuX3Jvb3Q7XG4gIHZhciBzID0gW10sIGRvbmUgPSBmYWxzZSwgaSA9IDA7XG5cbiAgd2hpbGUgKCFkb25lKSB7XG4gICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgIHMucHVzaChjdXJyZW50KTtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50LmxlZnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY3VycmVudCA9IHMucG9wKCk7XG4gICAgICAgIGlmIChpID09PSBpbmRleCkgeyByZXR1cm4gY3VycmVudDsgfVxuICAgICAgICBpKys7XG4gICAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnJpZ2h0O1xuICAgICAgfSBlbHNlIHsgZG9uZSA9IHRydWU7IH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5cbi8qKlxuICogUmV0dXJucyBub2RlIHdpdGggdGhlIG1pbmltdW0ga2V5XG4gKiBAcmV0dXJuIHs/Tm9kZX1cbiAqL1xuQVZMVHJlZS5wcm90b3R5cGUubWluTm9kZSA9IGZ1bmN0aW9uIG1pbk5vZGUgKCkge1xuICB2YXIgbm9kZSA9IHRoaXMuX3Jvb3Q7XG4gIGlmICghbm9kZSkgeyByZXR1cm4gbnVsbDsgfVxuICB3aGlsZSAobm9kZS5sZWZ0KSB7IG5vZGUgPSBub2RlLmxlZnQ7IH1cbiAgcmV0dXJuIG5vZGU7XG59O1xuXG5cbi8qKlxuICogUmV0dXJucyBub2RlIHdpdGggdGhlIG1heCBrZXlcbiAqIEByZXR1cm4gez9Ob2RlfVxuICovXG5BVkxUcmVlLnByb3RvdHlwZS5tYXhOb2RlID0gZnVuY3Rpb24gbWF4Tm9kZSAoKSB7XG4gIHZhciBub2RlID0gdGhpcy5fcm9vdDtcbiAgaWYgKCFub2RlKSB7IHJldHVybiBudWxsOyB9XG4gIHdoaWxlIChub2RlLnJpZ2h0KSB7IG5vZGUgPSBub2RlLnJpZ2h0OyB9XG4gIHJldHVybiBub2RlO1xufTtcblxuXG4vKipcbiAqIE1pbiBrZXlcbiAqIEByZXR1cm4gez9LZXl9XG4gKi9cbkFWTFRyZWUucHJvdG90eXBlLm1pbiA9IGZ1bmN0aW9uIG1pbiAoKSB7XG4gIHZhciBub2RlID0gdGhpcy5fcm9vdDtcbiAgaWYgKCFub2RlKSB7IHJldHVybiBudWxsOyB9XG4gIHdoaWxlIChub2RlLmxlZnQpIHsgbm9kZSA9IG5vZGUubGVmdDsgfVxuICByZXR1cm4gbm9kZS5rZXk7XG59O1xuXG5cbi8qKlxuICogTWF4IGtleVxuICogQHJldHVybiB7P0tleX1cbiAqL1xuQVZMVHJlZS5wcm90b3R5cGUubWF4ID0gZnVuY3Rpb24gbWF4ICgpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLl9yb290O1xuICBpZiAoIW5vZGUpIHsgcmV0dXJuIG51bGw7IH1cbiAgd2hpbGUgKG5vZGUucmlnaHQpIHsgbm9kZSA9IG5vZGUucmlnaHQ7IH1cbiAgcmV0dXJuIG5vZGUua2V5O1xufTtcblxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUvZmFsc2VcbiAqL1xuQVZMVHJlZS5wcm90b3R5cGUuaXNFbXB0eSA9IGZ1bmN0aW9uIGlzRW1wdHkgKCkge1xuICByZXR1cm4gIXRoaXMuX3Jvb3Q7XG59O1xuXG5cbi8qKlxuICogUmVtb3ZlcyBhbmQgcmV0dXJucyB0aGUgbm9kZSB3aXRoIHNtYWxsZXN0IGtleVxuICogQHJldHVybiB7P05vZGV9XG4gKi9cbkFWTFRyZWUucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uIHBvcCAoKSB7XG4gIHZhciBub2RlID0gdGhpcy5fcm9vdCwgcmV0dXJuVmFsdWUgPSBudWxsO1xuICBpZiAobm9kZSkge1xuICAgIHdoaWxlIChub2RlLmxlZnQpIHsgbm9kZSA9IG5vZGUubGVmdDsgfVxuICAgIHJldHVyblZhbHVlID0geyBrZXk6IG5vZGUua2V5LCBkYXRhOiBub2RlLmRhdGEgfTtcbiAgICB0aGlzLnJlbW92ZShub2RlLmtleSk7XG4gIH1cbiAgcmV0dXJuIHJldHVyblZhbHVlO1xufTtcblxuXG4vKipcbiAqIEZpbmQgbm9kZSBieSBrZXlcbiAqIEBwYXJhbXtLZXl9IGtleVxuICogQHJldHVybiB7P05vZGV9XG4gKi9cbkFWTFRyZWUucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbiBmaW5kIChrZXkpIHtcbiAgdmFyIHJvb3QgPSB0aGlzLl9yb290O1xuICAvLyBpZiAocm9vdCA9PT0gbnVsbCkgIHJldHVybiBudWxsO1xuICAvLyBpZiAoa2V5ID09PSByb290LmtleSkgcmV0dXJuIHJvb3Q7XG5cbiAgdmFyIHN1YnRyZWUgPSByb290LCBjbXA7XG4gIHZhciBjb21wYXJlID0gdGhpcy5fY29tcGFyYXRvcjtcbiAgd2hpbGUgKHN1YnRyZWUpIHtcbiAgICBjbXAgPSBjb21wYXJlKGtleSwgc3VidHJlZS5rZXkpO1xuICAgIGlmICAgIChjbXAgPT09IDApIHsgcmV0dXJuIHN1YnRyZWU7IH1cbiAgICBlbHNlIGlmIChjbXAgPCAwKSB7IHN1YnRyZWUgPSBzdWJ0cmVlLmxlZnQ7IH1cbiAgICBlbHNlICAgICAgICAgICAgICB7IHN1YnRyZWUgPSBzdWJ0cmVlLnJpZ2h0OyB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn07XG5cblxuLyoqXG4gKiBJbnNlcnQgYSBub2RlIGludG8gdGhlIHRyZWVcbiAqIEBwYXJhbXtLZXl9IGtleVxuICogQHBhcmFte1ZhbHVlfSBbZGF0YV1cbiAqIEByZXR1cm4gez9Ob2RlfVxuICovXG5BVkxUcmVlLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbiBpbnNlcnQgKGtleSwgZGF0YSkge1xuICAgIHZhciB0aGlzJDEgPSB0aGlzO1xuXG4gIGlmICghdGhpcy5fcm9vdCkge1xuICAgIHRoaXMuX3Jvb3QgPSB7XG4gICAgICBwYXJlbnQ6IG51bGwsIGxlZnQ6IG51bGwsIHJpZ2h0OiBudWxsLCBiYWxhbmNlRmFjdG9yOiAwLFxuICAgICAga2V5OiBrZXksIGRhdGE6IGRhdGFcbiAgICB9O1xuICAgIHRoaXMuX3NpemUrKztcbiAgICByZXR1cm4gdGhpcy5fcm9vdDtcbiAgfVxuXG4gIHZhciBjb21wYXJlID0gdGhpcy5fY29tcGFyYXRvcjtcbiAgdmFyIG5vZGUgID0gdGhpcy5fcm9vdDtcbiAgdmFyIHBhcmVudD0gbnVsbDtcbiAgdmFyIGNtcCAgID0gMDtcblxuICBpZiAodGhpcy5fbm9EdXBsaWNhdGVzKSB7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgIGNtcCA9IGNvbXBhcmUoa2V5LCBub2RlLmtleSk7XG4gICAgICBwYXJlbnQgPSBub2RlO1xuICAgICAgaWYgICAgKGNtcCA9PT0gMCkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgZWxzZSBpZiAoY21wIDwgMCkgeyBub2RlID0gbm9kZS5sZWZ0OyB9XG4gICAgICBlbHNlICAgICAgICAgICAgICB7IG5vZGUgPSBub2RlLnJpZ2h0OyB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICBjbXAgPSBjb21wYXJlKGtleSwgbm9kZS5rZXkpO1xuICAgICAgcGFyZW50ID0gbm9kZTtcbiAgICAgIGlmICAgIChjbXAgPD0gMCl7IG5vZGUgPSBub2RlLmxlZnQ7IH0gLy9yZXR1cm4gbnVsbDtcbiAgICAgIGVsc2UgICAgICAgICAgICAgIHsgbm9kZSA9IG5vZGUucmlnaHQ7IH1cbiAgICB9XG4gIH1cblxuICB2YXIgbmV3Tm9kZSA9IHtcbiAgICBsZWZ0OiBudWxsLFxuICAgIHJpZ2h0OiBudWxsLFxuICAgIGJhbGFuY2VGYWN0b3I6IDAsXG4gICAgcGFyZW50OiBwYXJlbnQsIGtleToga2V5LCBkYXRhOiBkYXRhXG4gIH07XG4gIHZhciBuZXdSb290O1xuICBpZiAoY21wIDw9IDApIHsgcGFyZW50LmxlZnQ9IG5ld05vZGU7IH1cbiAgZWxzZSAgICAgICB7IHBhcmVudC5yaWdodCA9IG5ld05vZGU7IH1cblxuICB3aGlsZSAocGFyZW50KSB7XG4gICAgY21wID0gY29tcGFyZShwYXJlbnQua2V5LCBrZXkpO1xuICAgIGlmIChjbXAgPCAwKSB7IHBhcmVudC5iYWxhbmNlRmFjdG9yIC09IDE7IH1cbiAgICBlbHNlICAgICAgIHsgcGFyZW50LmJhbGFuY2VGYWN0b3IgKz0gMTsgfVxuXG4gICAgaWYgICAgICAocGFyZW50LmJhbGFuY2VGYWN0b3IgPT09IDApIHsgYnJlYWs7IH1cbiAgICBlbHNlIGlmIChwYXJlbnQuYmFsYW5jZUZhY3RvciA8IC0xKSB7XG4gICAgICAvLyBpbmxpbmVkXG4gICAgICAvL3ZhciBuZXdSb290ID0gcmlnaHRCYWxhbmNlKHBhcmVudCk7XG4gICAgICBpZiAocGFyZW50LnJpZ2h0LmJhbGFuY2VGYWN0b3IgPT09IDEpIHsgcm90YXRlUmlnaHQocGFyZW50LnJpZ2h0KTsgfVxuICAgICAgbmV3Um9vdCA9IHJvdGF0ZUxlZnQocGFyZW50KTtcblxuICAgICAgaWYgKHBhcmVudCA9PT0gdGhpcyQxLl9yb290KSB7IHRoaXMkMS5fcm9vdCA9IG5ld1Jvb3Q7IH1cbiAgICAgIGJyZWFrO1xuICAgIH0gZWxzZSBpZiAocGFyZW50LmJhbGFuY2VGYWN0b3IgPiAxKSB7XG4gICAgICAvLyBpbmxpbmVkXG4gICAgICAvLyB2YXIgbmV3Um9vdCA9IGxlZnRCYWxhbmNlKHBhcmVudCk7XG4gICAgICBpZiAocGFyZW50LmxlZnQuYmFsYW5jZUZhY3RvciA9PT0gLTEpIHsgcm90YXRlTGVmdChwYXJlbnQubGVmdCk7IH1cbiAgICAgIG5ld1Jvb3QgPSByb3RhdGVSaWdodChwYXJlbnQpO1xuXG4gICAgICBpZiAocGFyZW50ID09PSB0aGlzJDEuX3Jvb3QpIHsgdGhpcyQxLl9yb290ID0gbmV3Um9vdDsgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gIH1cblxuICB0aGlzLl9zaXplKys7XG4gIHJldHVybiBuZXdOb2RlO1xufTtcblxuXG4vKipcbiAqIFJlbW92ZXMgdGhlIG5vZGUgZnJvbSB0aGUgdHJlZS4gSWYgbm90IGZvdW5kLCByZXR1cm5zIG51bGwuXG4gKiBAcGFyYW17S2V5fSBrZXlcbiAqIEByZXR1cm4gez9Ob2RlfVxuICovXG5BVkxUcmVlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiByZW1vdmUgKGtleSkge1xuICAgIHZhciB0aGlzJDEgPSB0aGlzO1xuXG4gIGlmICghdGhpcy5fcm9vdCkgeyByZXR1cm4gbnVsbDsgfVxuXG4gIHZhciBub2RlID0gdGhpcy5fcm9vdDtcbiAgdmFyIGNvbXBhcmUgPSB0aGlzLl9jb21wYXJhdG9yO1xuICB2YXIgY21wID0gMDtcblxuICB3aGlsZSAobm9kZSkge1xuICAgIGNtcCA9IGNvbXBhcmUoa2V5LCBub2RlLmtleSk7XG4gICAgaWYgICAgKGNtcCA9PT0gMCkgeyBicmVhazsgfVxuICAgIGVsc2UgaWYgKGNtcCA8IDApIHsgbm9kZSA9IG5vZGUubGVmdDsgfVxuICAgIGVsc2UgICAgICAgICAgICAgIHsgbm9kZSA9IG5vZGUucmlnaHQ7IH1cbiAgfVxuICBpZiAoIW5vZGUpIHsgcmV0dXJuIG51bGw7IH1cblxuICB2YXIgcmV0dXJuVmFsdWUgPSBub2RlLmtleTtcbiAgdmFyIG1heCwgbWluO1xuXG4gIGlmIChub2RlLmxlZnQpIHtcbiAgICBtYXggPSBub2RlLmxlZnQ7XG5cbiAgICB3aGlsZSAobWF4LmxlZnQgfHwgbWF4LnJpZ2h0KSB7XG4gICAgICB3aGlsZSAobWF4LnJpZ2h0KSB7IG1heCA9IG1heC5yaWdodDsgfVxuXG4gICAgICBub2RlLmtleSA9IG1heC5rZXk7XG4gICAgICBub2RlLmRhdGEgPSBtYXguZGF0YTtcbiAgICAgIGlmIChtYXgubGVmdCkge1xuICAgICAgICBub2RlID0gbWF4O1xuICAgICAgICBtYXggPSBtYXgubGVmdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBub2RlLmtleT0gbWF4LmtleTtcbiAgICBub2RlLmRhdGEgPSBtYXguZGF0YTtcbiAgICBub2RlID0gbWF4O1xuICB9XG5cbiAgaWYgKG5vZGUucmlnaHQpIHtcbiAgICBtaW4gPSBub2RlLnJpZ2h0O1xuXG4gICAgd2hpbGUgKG1pbi5sZWZ0IHx8IG1pbi5yaWdodCkge1xuICAgICAgd2hpbGUgKG1pbi5sZWZ0KSB7IG1pbiA9IG1pbi5sZWZ0OyB9XG5cbiAgICAgIG5vZGUua2V5PSBtaW4ua2V5O1xuICAgICAgbm9kZS5kYXRhID0gbWluLmRhdGE7XG4gICAgICBpZiAobWluLnJpZ2h0KSB7XG4gICAgICAgIG5vZGUgPSBtaW47XG4gICAgICAgIG1pbiA9IG1pbi5yaWdodDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBub2RlLmtleT0gbWluLmtleTtcbiAgICBub2RlLmRhdGEgPSBtaW4uZGF0YTtcbiAgICBub2RlID0gbWluO1xuICB9XG5cbiAgdmFyIHBhcmVudCA9IG5vZGUucGFyZW50O1xuICB2YXIgcHAgICA9IG5vZGU7XG4gIHZhciBuZXdSb290O1xuXG4gIHdoaWxlIChwYXJlbnQpIHtcbiAgICBpZiAocGFyZW50LmxlZnQgPT09IHBwKSB7IHBhcmVudC5iYWxhbmNlRmFjdG9yIC09IDE7IH1cbiAgICBlbHNlICAgICAgICAgICAgICAgICAgeyBwYXJlbnQuYmFsYW5jZUZhY3RvciArPSAxOyB9XG5cbiAgICBpZiAgICAgIChwYXJlbnQuYmFsYW5jZUZhY3RvciA8IC0xKSB7XG4gICAgICAvLyBpbmxpbmVkXG4gICAgICAvL3ZhciBuZXdSb290ID0gcmlnaHRCYWxhbmNlKHBhcmVudCk7XG4gICAgICBpZiAocGFyZW50LnJpZ2h0LmJhbGFuY2VGYWN0b3IgPT09IDEpIHsgcm90YXRlUmlnaHQocGFyZW50LnJpZ2h0KTsgfVxuICAgICAgbmV3Um9vdCA9IHJvdGF0ZUxlZnQocGFyZW50KTtcblxuICAgICAgaWYgKHBhcmVudCA9PT0gdGhpcyQxLl9yb290KSB7IHRoaXMkMS5fcm9vdCA9IG5ld1Jvb3Q7IH1cbiAgICAgIHBhcmVudCA9IG5ld1Jvb3Q7XG4gICAgfSBlbHNlIGlmIChwYXJlbnQuYmFsYW5jZUZhY3RvciA+IDEpIHtcbiAgICAgIC8vIGlubGluZWRcbiAgICAgIC8vIHZhciBuZXdSb290ID0gbGVmdEJhbGFuY2UocGFyZW50KTtcbiAgICAgIGlmIChwYXJlbnQubGVmdC5iYWxhbmNlRmFjdG9yID09PSAtMSkgeyByb3RhdGVMZWZ0KHBhcmVudC5sZWZ0KTsgfVxuICAgICAgbmV3Um9vdCA9IHJvdGF0ZVJpZ2h0KHBhcmVudCk7XG5cbiAgICAgIGlmIChwYXJlbnQgPT09IHRoaXMkMS5fcm9vdCkgeyB0aGlzJDEuX3Jvb3QgPSBuZXdSb290OyB9XG4gICAgICBwYXJlbnQgPSBuZXdSb290O1xuICAgIH1cblxuICAgIGlmIChwYXJlbnQuYmFsYW5jZUZhY3RvciA9PT0gLTEgfHwgcGFyZW50LmJhbGFuY2VGYWN0b3IgPT09IDEpIHsgYnJlYWs7IH1cblxuICAgIHBwICAgPSBwYXJlbnQ7XG4gICAgcGFyZW50ID0gcGFyZW50LnBhcmVudDtcbiAgfVxuXG4gIGlmIChub2RlLnBhcmVudCkge1xuICAgIGlmIChub2RlLnBhcmVudC5sZWZ0ID09PSBub2RlKSB7IG5vZGUucGFyZW50LmxlZnQ9IG51bGw7IH1cbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgIHsgbm9kZS5wYXJlbnQucmlnaHQgPSBudWxsOyB9XG4gIH1cblxuICBpZiAobm9kZSA9PT0gdGhpcy5fcm9vdCkgeyB0aGlzLl9yb290ID0gbnVsbDsgfVxuXG4gIHRoaXMuX3NpemUtLTtcbiAgcmV0dXJuIHJldHVyblZhbHVlO1xufTtcblxuXG4vKipcbiAqIEJ1bGstbG9hZCBpdGVtc1xuICogQHBhcmFte0FycmF5PEtleT59a2V5c1xuICogQHBhcmFte0FycmF5PFZhbHVlPn1bdmFsdWVzXVxuICogQHJldHVybiB7QVZMVHJlZX1cbiAqL1xuQVZMVHJlZS5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uIGxvYWQgKGtleXMsIHZhbHVlcykge1xuICAgIHZhciB0aGlzJDEgPSB0aGlzO1xuICAgIGlmICgga2V5cyA9PT0gdm9pZCAwICkga2V5cyA9IFtdO1xuICAgIGlmICggdmFsdWVzID09PSB2b2lkIDAgKSB2YWx1ZXMgPSBbXTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShrZXlzKSkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0aGlzJDEuaW5zZXJ0KGtleXNbaV0sIHZhbHVlc1tpXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgdHJlZSBpcyBiYWxhbmNlZFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuQVZMVHJlZS5wcm90b3R5cGUuaXNCYWxhbmNlZCA9IGZ1bmN0aW9uIGlzQmFsYW5jZWQkMSAoKSB7XG4gIHJldHVybiBpc0JhbGFuY2VkKHRoaXMuX3Jvb3QpO1xufTtcblxuXG4vKipcbiAqIFN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJlZSAtIHByaW1pdGl2ZSBob3Jpem9udGFsIHByaW50LW91dFxuICogQHBhcmFte0Z1bmN0aW9uKE5vZGUpOnN0cmluZ30gW3ByaW50Tm9kZV1cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuQVZMVHJlZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAocHJpbnROb2RlKSB7XG4gIHJldHVybiBwcmludCh0aGlzLl9yb290LCBwcmludE5vZGUpO1xufTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoIEFWTFRyZWUucHJvdG90eXBlLCBwcm90b3R5cGVBY2Nlc3NvcnMgKTtcblxucmV0dXJuIEFWTFRyZWU7XG5cbn0pKSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hdmwuanMubWFwXG4iLCJcclxuLyoqXHJcbiAqIEV4cG9zZSBgRW1pdHRlcmAuXHJcbiAqL1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyO1xyXG59XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBhIG5ldyBgRW1pdHRlcmAuXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gRW1pdHRlcihvYmopIHtcclxuICBpZiAob2JqKSByZXR1cm4gbWl4aW4ob2JqKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNaXhpbiB0aGUgZW1pdHRlciBwcm9wZXJ0aWVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXHJcbiAqIEByZXR1cm4ge09iamVjdH1cclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gbWl4aW4ob2JqKSB7XHJcbiAgZm9yICh2YXIga2V5IGluIEVtaXR0ZXIucHJvdG90eXBlKSB7XHJcbiAgICBvYmpba2V5XSA9IEVtaXR0ZXIucHJvdG90eXBlW2tleV07XHJcbiAgfVxyXG4gIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBMaXN0ZW4gb24gdGhlIGdpdmVuIGBldmVudGAgd2l0aCBgZm5gLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cclxuICogQHJldHVybiB7RW1pdHRlcn1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5FbWl0dGVyLnByb3RvdHlwZS5vbiA9XHJcbkVtaXR0ZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCwgZm4pe1xyXG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcclxuICAodGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XSA9IHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF0gfHwgW10pXHJcbiAgICAucHVzaChmbik7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbiBgZXZlbnRgIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIGEgc2luZ2xlXHJcbiAqIHRpbWUgdGhlbiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxyXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbkVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgZm4pe1xyXG4gIGZ1bmN0aW9uIG9uKCkge1xyXG4gICAgdGhpcy5vZmYoZXZlbnQsIG9uKTtcclxuICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgfVxyXG5cclxuICBvbi5mbiA9IGZuO1xyXG4gIHRoaXMub24oZXZlbnQsIG9uKTtcclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmUgdGhlIGdpdmVuIGNhbGxiYWNrIGZvciBgZXZlbnRgIG9yIGFsbFxyXG4gKiByZWdpc3RlcmVkIGNhbGxiYWNrcy5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXHJcbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuRW1pdHRlci5wcm90b3R5cGUub2ZmID1cclxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPVxyXG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxyXG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcclxuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XHJcblxyXG4gIC8vIGFsbFxyXG4gIGlmICgwID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgIHRoaXMuX2NhbGxiYWNrcyA9IHt9O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvLyBzcGVjaWZpYyBldmVudFxyXG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xyXG4gIGlmICghY2FsbGJhY2tzKSByZXR1cm4gdGhpcztcclxuXHJcbiAgLy8gcmVtb3ZlIGFsbCBoYW5kbGVyc1xyXG4gIGlmICgxID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvLyByZW1vdmUgc3BlY2lmaWMgaGFuZGxlclxyXG4gIHZhciBjYjtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xyXG4gICAgY2IgPSBjYWxsYmFja3NbaV07XHJcbiAgICBpZiAoY2IgPT09IGZuIHx8IGNiLmZuID09PSBmbikge1xyXG4gICAgICBjYWxsYmFja3Muc3BsaWNlKGksIDEpO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogRW1pdCBgZXZlbnRgIHdpdGggdGhlIGdpdmVuIGFyZ3MuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxyXG4gKiBAcGFyYW0ge01peGVkfSAuLi5cclxuICogQHJldHVybiB7RW1pdHRlcn1cclxuICovXHJcblxyXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcclxuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxyXG4gICAgLCBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xyXG5cclxuICBpZiAoY2FsbGJhY2tzKSB7XHJcbiAgICBjYWxsYmFja3MgPSBjYWxsYmFja3Muc2xpY2UoMCk7XHJcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gY2FsbGJhY2tzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XHJcbiAgICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybiBhcnJheSBvZiBjYWxsYmFja3MgZm9yIGBldmVudGAuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxyXG4gKiBAcmV0dXJuIHtBcnJheX1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5FbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XHJcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xyXG4gIHJldHVybiB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdIHx8IFtdO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrIGlmIHRoaXMgZW1pdHRlciBoYXMgYGV2ZW50YCBoYW5kbGVycy5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuRW1pdHRlci5wcm90b3R5cGUuaGFzTGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gIHJldHVybiAhISB0aGlzLmxpc3RlbmVycyhldmVudCkubGVuZ3RoO1xyXG59O1xyXG4iLCIvKipcbiAqIFJvb3QgcmVmZXJlbmNlIGZvciBpZnJhbWVzLlxuICovXG5cbnZhciByb290O1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7IC8vIEJyb3dzZXIgd2luZG93XG4gIHJvb3QgPSB3aW5kb3c7XG59IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykgeyAvLyBXZWIgV29ya2VyXG4gIHJvb3QgPSBzZWxmO1xufSBlbHNlIHsgLy8gT3RoZXIgZW52aXJvbm1lbnRzXG4gIGNvbnNvbGUud2FybihcIlVzaW5nIGJyb3dzZXItb25seSB2ZXJzaW9uIG9mIHN1cGVyYWdlbnQgaW4gbm9uLWJyb3dzZXIgZW52aXJvbm1lbnRcIik7XG4gIHJvb3QgPSB0aGlzO1xufVxuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJ2VtaXR0ZXInKTtcbnZhciByZXF1ZXN0QmFzZSA9IHJlcXVpcmUoJy4vcmVxdWVzdC1iYXNlJyk7XG52YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzLW9iamVjdCcpO1xuXG4vKipcbiAqIE5vb3AuXG4gKi9cblxuZnVuY3Rpb24gbm9vcCgpe307XG5cbi8qKlxuICogRXhwb3NlIGByZXF1ZXN0YC5cbiAqL1xuXG52YXIgcmVxdWVzdCA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9yZXF1ZXN0JykuYmluZChudWxsLCBSZXF1ZXN0KTtcblxuLyoqXG4gKiBEZXRlcm1pbmUgWEhSLlxuICovXG5cbnJlcXVlc3QuZ2V0WEhSID0gZnVuY3Rpb24gKCkge1xuICBpZiAocm9vdC5YTUxIdHRwUmVxdWVzdFxuICAgICAgJiYgKCFyb290LmxvY2F0aW9uIHx8ICdmaWxlOicgIT0gcm9vdC5sb2NhdGlvbi5wcm90b2NvbFxuICAgICAgICAgIHx8ICFyb290LkFjdGl2ZVhPYmplY3QpKSB7XG4gICAgcmV0dXJuIG5ldyBYTUxIdHRwUmVxdWVzdDtcbiAgfSBlbHNlIHtcbiAgICB0cnkgeyByZXR1cm4gbmV3IEFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJyk7IH0gY2F0Y2goZSkge31cbiAgICB0cnkgeyByZXR1cm4gbmV3IEFjdGl2ZVhPYmplY3QoJ01zeG1sMi5YTUxIVFRQLjYuMCcpOyB9IGNhdGNoKGUpIHt9XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KCdNc3htbDIuWE1MSFRUUC4zLjAnKTsgfSBjYXRjaChlKSB7fVxuICAgIHRyeSB7IHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTXN4bWwyLlhNTEhUVFAnKTsgfSBjYXRjaChlKSB7fVxuICB9XG4gIHRocm93IEVycm9yKFwiQnJvd3Nlci1vbmx5IHZlcmlzb24gb2Ygc3VwZXJhZ2VudCBjb3VsZCBub3QgZmluZCBYSFJcIik7XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZSwgYWRkZWQgdG8gc3VwcG9ydCBJRS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxudmFyIHRyaW0gPSAnJy50cmltXG4gID8gZnVuY3Rpb24ocykgeyByZXR1cm4gcy50cmltKCk7IH1cbiAgOiBmdW5jdGlvbihzKSB7IHJldHVybiBzLnJlcGxhY2UoLyheXFxzKnxcXHMqJCkvZywgJycpOyB9O1xuXG4vKipcbiAqIFNlcmlhbGl6ZSB0aGUgZ2l2ZW4gYG9iamAuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2VyaWFsaXplKG9iaikge1xuICBpZiAoIWlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gIHZhciBwYWlycyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgcHVzaEVuY29kZWRLZXlWYWx1ZVBhaXIocGFpcnMsIGtleSwgb2JqW2tleV0pO1xuICB9XG4gIHJldHVybiBwYWlycy5qb2luKCcmJyk7XG59XG5cbi8qKlxuICogSGVscHMgJ3NlcmlhbGl6ZScgd2l0aCBzZXJpYWxpemluZyBhcnJheXMuXG4gKiBNdXRhdGVzIHRoZSBwYWlycyBhcnJheS5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBwYWlyc1xuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKi9cblxuZnVuY3Rpb24gcHVzaEVuY29kZWRLZXlWYWx1ZVBhaXIocGFpcnMsIGtleSwgdmFsKSB7XG4gIGlmICh2YWwgIT0gbnVsbCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgIHZhbC5mb3JFYWNoKGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgcHVzaEVuY29kZWRLZXlWYWx1ZVBhaXIocGFpcnMsIGtleSwgdik7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KHZhbCkpIHtcbiAgICAgIGZvcih2YXIgc3Via2V5IGluIHZhbCkge1xuICAgICAgICBwdXNoRW5jb2RlZEtleVZhbHVlUGFpcihwYWlycywga2V5ICsgJ1snICsgc3Via2V5ICsgJ10nLCB2YWxbc3Via2V5XSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhaXJzLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGtleSlcbiAgICAgICAgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQodmFsKSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHZhbCA9PT0gbnVsbCkge1xuICAgIHBhaXJzLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGtleSkpO1xuICB9XG59XG5cbi8qKlxuICogRXhwb3NlIHNlcmlhbGl6YXRpb24gbWV0aG9kLlxuICovXG5cbiByZXF1ZXN0LnNlcmlhbGl6ZU9iamVjdCA9IHNlcmlhbGl6ZTtcblxuIC8qKlxuICAqIFBhcnNlIHRoZSBnaXZlbiB4LXd3dy1mb3JtLXVybGVuY29kZWQgYHN0cmAuXG4gICpcbiAgKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gICogQHJldHVybiB7T2JqZWN0fVxuICAqIEBhcGkgcHJpdmF0ZVxuICAqL1xuXG5mdW5jdGlvbiBwYXJzZVN0cmluZyhzdHIpIHtcbiAgdmFyIG9iaiA9IHt9O1xuICB2YXIgcGFpcnMgPSBzdHIuc3BsaXQoJyYnKTtcbiAgdmFyIHBhaXI7XG4gIHZhciBwb3M7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHBhaXJzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgcGFpciA9IHBhaXJzW2ldO1xuICAgIHBvcyA9IHBhaXIuaW5kZXhPZignPScpO1xuICAgIGlmIChwb3MgPT0gLTEpIHtcbiAgICAgIG9ialtkZWNvZGVVUklDb21wb25lbnQocGFpcildID0gJyc7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9ialtkZWNvZGVVUklDb21wb25lbnQocGFpci5zbGljZSgwLCBwb3MpKV0gPVxuICAgICAgICBkZWNvZGVVUklDb21wb25lbnQocGFpci5zbGljZShwb3MgKyAxKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBFeHBvc2UgcGFyc2VyLlxuICovXG5cbnJlcXVlc3QucGFyc2VTdHJpbmcgPSBwYXJzZVN0cmluZztcblxuLyoqXG4gKiBEZWZhdWx0IE1JTUUgdHlwZSBtYXAuXG4gKlxuICogICAgIHN1cGVyYWdlbnQudHlwZXMueG1sID0gJ2FwcGxpY2F0aW9uL3htbCc7XG4gKlxuICovXG5cbnJlcXVlc3QudHlwZXMgPSB7XG4gIGh0bWw6ICd0ZXh0L2h0bWwnLFxuICBqc29uOiAnYXBwbGljYXRpb24vanNvbicsXG4gIHhtbDogJ2FwcGxpY2F0aW9uL3htbCcsXG4gIHVybGVuY29kZWQ6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnLFxuICAnZm9ybSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnLFxuICAnZm9ybS1kYXRhJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcbn07XG5cbi8qKlxuICogRGVmYXVsdCBzZXJpYWxpemF0aW9uIG1hcC5cbiAqXG4gKiAgICAgc3VwZXJhZ2VudC5zZXJpYWxpemVbJ2FwcGxpY2F0aW9uL3htbCddID0gZnVuY3Rpb24ob2JqKXtcbiAqICAgICAgIHJldHVybiAnZ2VuZXJhdGVkIHhtbCBoZXJlJztcbiAqICAgICB9O1xuICpcbiAqL1xuXG4gcmVxdWVzdC5zZXJpYWxpemUgPSB7XG4gICAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJzogc2VyaWFsaXplLFxuICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBKU09OLnN0cmluZ2lmeVxuIH07XG5cbiAvKipcbiAgKiBEZWZhdWx0IHBhcnNlcnMuXG4gICpcbiAgKiAgICAgc3VwZXJhZ2VudC5wYXJzZVsnYXBwbGljYXRpb24veG1sJ10gPSBmdW5jdGlvbihzdHIpe1xuICAqICAgICAgIHJldHVybiB7IG9iamVjdCBwYXJzZWQgZnJvbSBzdHIgfTtcbiAgKiAgICAgfTtcbiAgKlxuICAqL1xuXG5yZXF1ZXN0LnBhcnNlID0ge1xuICAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJzogcGFyc2VTdHJpbmcsXG4gICdhcHBsaWNhdGlvbi9qc29uJzogSlNPTi5wYXJzZVxufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gaGVhZGVyIGBzdHJgIGludG9cbiAqIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSBtYXBwZWQgZmllbGRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlSGVhZGVyKHN0cikge1xuICB2YXIgbGluZXMgPSBzdHIuc3BsaXQoL1xccj9cXG4vKTtcbiAgdmFyIGZpZWxkcyA9IHt9O1xuICB2YXIgaW5kZXg7XG4gIHZhciBsaW5lO1xuICB2YXIgZmllbGQ7XG4gIHZhciB2YWw7XG5cbiAgbGluZXMucG9wKCk7IC8vIHRyYWlsaW5nIENSTEZcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gbGluZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBsaW5lID0gbGluZXNbaV07XG4gICAgaW5kZXggPSBsaW5lLmluZGV4T2YoJzonKTtcbiAgICBmaWVsZCA9IGxpbmUuc2xpY2UoMCwgaW5kZXgpLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFsID0gdHJpbShsaW5lLnNsaWNlKGluZGV4ICsgMSkpO1xuICAgIGZpZWxkc1tmaWVsZF0gPSB2YWw7XG4gIH1cblxuICByZXR1cm4gZmllbGRzO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGBtaW1lYCBpcyBqc29uIG9yIGhhcyAranNvbiBzdHJ1Y3R1cmVkIHN5bnRheCBzdWZmaXguXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1pbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBpc0pTT04obWltZSkge1xuICByZXR1cm4gL1tcXC8rXWpzb25cXGIvLnRlc3QobWltZSk7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBtaW1lIHR5cGUgZm9yIHRoZSBnaXZlbiBgc3RyYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiB0eXBlKHN0cil7XG4gIHJldHVybiBzdHIuc3BsaXQoLyAqOyAqLykuc2hpZnQoKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIGhlYWRlciBmaWVsZCBwYXJhbWV0ZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcmFtcyhzdHIpe1xuICByZXR1cm4gc3RyLnNwbGl0KC8gKjsgKi8pLnJlZHVjZShmdW5jdGlvbihvYmosIHN0cil7XG4gICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KC8gKj0gKi8pLFxuICAgICAgICBrZXkgPSBwYXJ0cy5zaGlmdCgpLFxuICAgICAgICB2YWwgPSBwYXJ0cy5zaGlmdCgpO1xuXG4gICAgaWYgKGtleSAmJiB2YWwpIG9ialtrZXldID0gdmFsO1xuICAgIHJldHVybiBvYmo7XG4gIH0sIHt9KTtcbn07XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgUmVzcG9uc2VgIHdpdGggdGhlIGdpdmVuIGB4aHJgLlxuICpcbiAqICAtIHNldCBmbGFncyAoLm9rLCAuZXJyb3IsIGV0YylcbiAqICAtIHBhcnNlIGhlYWRlclxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICBBbGlhc2luZyBgc3VwZXJhZ2VudGAgYXMgYHJlcXVlc3RgIGlzIG5pY2U6XG4gKlxuICogICAgICByZXF1ZXN0ID0gc3VwZXJhZ2VudDtcbiAqXG4gKiAgV2UgY2FuIHVzZSB0aGUgcHJvbWlzZS1saWtlIEFQSSwgb3IgcGFzcyBjYWxsYmFja3M6XG4gKlxuICogICAgICByZXF1ZXN0LmdldCgnLycpLmVuZChmdW5jdGlvbihyZXMpe30pO1xuICogICAgICByZXF1ZXN0LmdldCgnLycsIGZ1bmN0aW9uKHJlcyl7fSk7XG4gKlxuICogIFNlbmRpbmcgZGF0YSBjYW4gYmUgY2hhaW5lZDpcbiAqXG4gKiAgICAgIHJlcXVlc3RcbiAqICAgICAgICAucG9zdCgnL3VzZXInKVxuICogICAgICAgIC5zZW5kKHsgbmFtZTogJ3RqJyB9KVxuICogICAgICAgIC5lbmQoZnVuY3Rpb24ocmVzKXt9KTtcbiAqXG4gKiAgT3IgcGFzc2VkIHRvIGAuc2VuZCgpYDpcbiAqXG4gKiAgICAgIHJlcXVlc3RcbiAqICAgICAgICAucG9zdCgnL3VzZXInKVxuICogICAgICAgIC5zZW5kKHsgbmFtZTogJ3RqJyB9LCBmdW5jdGlvbihyZXMpe30pO1xuICpcbiAqICBPciBwYXNzZWQgdG8gYC5wb3N0KClgOlxuICpcbiAqICAgICAgcmVxdWVzdFxuICogICAgICAgIC5wb3N0KCcvdXNlcicsIHsgbmFtZTogJ3RqJyB9KVxuICogICAgICAgIC5lbmQoZnVuY3Rpb24ocmVzKXt9KTtcbiAqXG4gKiBPciBmdXJ0aGVyIHJlZHVjZWQgdG8gYSBzaW5nbGUgY2FsbCBmb3Igc2ltcGxlIGNhc2VzOlxuICpcbiAqICAgICAgcmVxdWVzdFxuICogICAgICAgIC5wb3N0KCcvdXNlcicsIHsgbmFtZTogJ3RqJyB9LCBmdW5jdGlvbihyZXMpe30pO1xuICpcbiAqIEBwYXJhbSB7WE1MSFRUUFJlcXVlc3R9IHhoclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIFJlc3BvbnNlKHJlcSwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy5yZXEgPSByZXE7XG4gIHRoaXMueGhyID0gdGhpcy5yZXEueGhyO1xuICAvLyByZXNwb25zZVRleHQgaXMgYWNjZXNzaWJsZSBvbmx5IGlmIHJlc3BvbnNlVHlwZSBpcyAnJyBvciAndGV4dCcgYW5kIG9uIG9sZGVyIGJyb3dzZXJzXG4gIHRoaXMudGV4dCA9ICgodGhpcy5yZXEubWV0aG9kICE9J0hFQUQnICYmICh0aGlzLnhoci5yZXNwb25zZVR5cGUgPT09ICcnIHx8IHRoaXMueGhyLnJlc3BvbnNlVHlwZSA9PT0gJ3RleHQnKSkgfHwgdHlwZW9mIHRoaXMueGhyLnJlc3BvbnNlVHlwZSA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgID8gdGhpcy54aHIucmVzcG9uc2VUZXh0XG4gICAgIDogbnVsbDtcbiAgdGhpcy5zdGF0dXNUZXh0ID0gdGhpcy5yZXEueGhyLnN0YXR1c1RleHQ7XG4gIHRoaXMuX3NldFN0YXR1c1Byb3BlcnRpZXModGhpcy54aHIuc3RhdHVzKTtcbiAgdGhpcy5oZWFkZXIgPSB0aGlzLmhlYWRlcnMgPSBwYXJzZUhlYWRlcih0aGlzLnhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSk7XG4gIC8vIGdldEFsbFJlc3BvbnNlSGVhZGVycyBzb21ldGltZXMgZmFsc2VseSByZXR1cm5zIFwiXCIgZm9yIENPUlMgcmVxdWVzdHMsIGJ1dFxuICAvLyBnZXRSZXNwb25zZUhlYWRlciBzdGlsbCB3b3Jrcy4gc28gd2UgZ2V0IGNvbnRlbnQtdHlwZSBldmVuIGlmIGdldHRpbmdcbiAgLy8gb3RoZXIgaGVhZGVycyBmYWlscy5cbiAgdGhpcy5oZWFkZXJbJ2NvbnRlbnQtdHlwZSddID0gdGhpcy54aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ2NvbnRlbnQtdHlwZScpO1xuICB0aGlzLl9zZXRIZWFkZXJQcm9wZXJ0aWVzKHRoaXMuaGVhZGVyKTtcbiAgdGhpcy5ib2R5ID0gdGhpcy5yZXEubWV0aG9kICE9ICdIRUFEJ1xuICAgID8gdGhpcy5fcGFyc2VCb2R5KHRoaXMudGV4dCA/IHRoaXMudGV4dCA6IHRoaXMueGhyLnJlc3BvbnNlKVxuICAgIDogbnVsbDtcbn1cblxuLyoqXG4gKiBHZXQgY2FzZS1pbnNlbnNpdGl2ZSBgZmllbGRgIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXNwb25zZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oZmllbGQpe1xuICByZXR1cm4gdGhpcy5oZWFkZXJbZmllbGQudG9Mb3dlckNhc2UoKV07XG59O1xuXG4vKipcbiAqIFNldCBoZWFkZXIgcmVsYXRlZCBwcm9wZXJ0aWVzOlxuICpcbiAqICAgLSBgLnR5cGVgIHRoZSBjb250ZW50IHR5cGUgd2l0aG91dCBwYXJhbXNcbiAqXG4gKiBBIHJlc3BvbnNlIG9mIFwiQ29udGVudC1UeXBlOiB0ZXh0L3BsYWluOyBjaGFyc2V0PXV0Zi04XCJcbiAqIHdpbGwgcHJvdmlkZSB5b3Ugd2l0aCBhIGAudHlwZWAgb2YgXCJ0ZXh0L3BsYWluXCIuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGhlYWRlclxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVzcG9uc2UucHJvdG90eXBlLl9zZXRIZWFkZXJQcm9wZXJ0aWVzID0gZnVuY3Rpb24oaGVhZGVyKXtcbiAgLy8gY29udGVudC10eXBlXG4gIHZhciBjdCA9IHRoaXMuaGVhZGVyWydjb250ZW50LXR5cGUnXSB8fCAnJztcbiAgdGhpcy50eXBlID0gdHlwZShjdCk7XG5cbiAgLy8gcGFyYW1zXG4gIHZhciBvYmogPSBwYXJhbXMoY3QpO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB0aGlzW2tleV0gPSBvYmpba2V5XTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGJvZHkgYHN0cmAuXG4gKlxuICogVXNlZCBmb3IgYXV0by1wYXJzaW5nIG9mIGJvZGllcy4gUGFyc2Vyc1xuICogYXJlIGRlZmluZWQgb24gdGhlIGBzdXBlcmFnZW50LnBhcnNlYCBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SZXNwb25zZS5wcm90b3R5cGUuX3BhcnNlQm9keSA9IGZ1bmN0aW9uKHN0cil7XG4gIHZhciBwYXJzZSA9IHJlcXVlc3QucGFyc2VbdGhpcy50eXBlXTtcbiAgaWYgKCFwYXJzZSAmJiBpc0pTT04odGhpcy50eXBlKSkge1xuICAgIHBhcnNlID0gcmVxdWVzdC5wYXJzZVsnYXBwbGljYXRpb24vanNvbiddO1xuICB9XG4gIHJldHVybiBwYXJzZSAmJiBzdHIgJiYgKHN0ci5sZW5ndGggfHwgc3RyIGluc3RhbmNlb2YgT2JqZWN0KVxuICAgID8gcGFyc2Uoc3RyKVxuICAgIDogbnVsbDtcbn07XG5cbi8qKlxuICogU2V0IGZsYWdzIHN1Y2ggYXMgYC5va2AgYmFzZWQgb24gYHN0YXR1c2AuXG4gKlxuICogRm9yIGV4YW1wbGUgYSAyeHggcmVzcG9uc2Ugd2lsbCBnaXZlIHlvdSBhIGAub2tgIG9mIF9fdHJ1ZV9fXG4gKiB3aGVyZWFzIDV4eCB3aWxsIGJlIF9fZmFsc2VfXyBhbmQgYC5lcnJvcmAgd2lsbCBiZSBfX3RydWVfXy4gVGhlXG4gKiBgLmNsaWVudEVycm9yYCBhbmQgYC5zZXJ2ZXJFcnJvcmAgYXJlIGFsc28gYXZhaWxhYmxlIHRvIGJlIG1vcmVcbiAqIHNwZWNpZmljLCBhbmQgYC5zdGF0dXNUeXBlYCBpcyB0aGUgY2xhc3Mgb2YgZXJyb3IgcmFuZ2luZyBmcm9tIDEuLjVcbiAqIHNvbWV0aW1lcyB1c2VmdWwgZm9yIG1hcHBpbmcgcmVzcG9uZCBjb2xvcnMgZXRjLlxuICpcbiAqIFwic3VnYXJcIiBwcm9wZXJ0aWVzIGFyZSBhbHNvIGRlZmluZWQgZm9yIGNvbW1vbiBjYXNlcy4gQ3VycmVudGx5IHByb3ZpZGluZzpcbiAqXG4gKiAgIC0gLm5vQ29udGVudFxuICogICAtIC5iYWRSZXF1ZXN0XG4gKiAgIC0gLnVuYXV0aG9yaXplZFxuICogICAtIC5ub3RBY2NlcHRhYmxlXG4gKiAgIC0gLm5vdEZvdW5kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHN0YXR1c1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVzcG9uc2UucHJvdG90eXBlLl9zZXRTdGF0dXNQcm9wZXJ0aWVzID0gZnVuY3Rpb24oc3RhdHVzKXtcbiAgLy8gaGFuZGxlIElFOSBidWc6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTAwNDY5NzIvbXNpZS1yZXR1cm5zLXN0YXR1cy1jb2RlLW9mLTEyMjMtZm9yLWFqYXgtcmVxdWVzdFxuICBpZiAoc3RhdHVzID09PSAxMjIzKSB7XG4gICAgc3RhdHVzID0gMjA0O1xuICB9XG5cbiAgdmFyIHR5cGUgPSBzdGF0dXMgLyAxMDAgfCAwO1xuXG4gIC8vIHN0YXR1cyAvIGNsYXNzXG4gIHRoaXMuc3RhdHVzID0gdGhpcy5zdGF0dXNDb2RlID0gc3RhdHVzO1xuICB0aGlzLnN0YXR1c1R5cGUgPSB0eXBlO1xuXG4gIC8vIGJhc2ljc1xuICB0aGlzLmluZm8gPSAxID09IHR5cGU7XG4gIHRoaXMub2sgPSAyID09IHR5cGU7XG4gIHRoaXMuY2xpZW50RXJyb3IgPSA0ID09IHR5cGU7XG4gIHRoaXMuc2VydmVyRXJyb3IgPSA1ID09IHR5cGU7XG4gIHRoaXMuZXJyb3IgPSAoNCA9PSB0eXBlIHx8IDUgPT0gdHlwZSlcbiAgICA/IHRoaXMudG9FcnJvcigpXG4gICAgOiBmYWxzZTtcblxuICAvLyBzdWdhclxuICB0aGlzLmFjY2VwdGVkID0gMjAyID09IHN0YXR1cztcbiAgdGhpcy5ub0NvbnRlbnQgPSAyMDQgPT0gc3RhdHVzO1xuICB0aGlzLmJhZFJlcXVlc3QgPSA0MDAgPT0gc3RhdHVzO1xuICB0aGlzLnVuYXV0aG9yaXplZCA9IDQwMSA9PSBzdGF0dXM7XG4gIHRoaXMubm90QWNjZXB0YWJsZSA9IDQwNiA9PSBzdGF0dXM7XG4gIHRoaXMubm90Rm91bmQgPSA0MDQgPT0gc3RhdHVzO1xuICB0aGlzLmZvcmJpZGRlbiA9IDQwMyA9PSBzdGF0dXM7XG59O1xuXG4vKipcbiAqIFJldHVybiBhbiBgRXJyb3JgIHJlcHJlc2VudGF0aXZlIG9mIHRoaXMgcmVzcG9uc2UuXG4gKlxuICogQHJldHVybiB7RXJyb3J9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlc3BvbnNlLnByb3RvdHlwZS50b0Vycm9yID0gZnVuY3Rpb24oKXtcbiAgdmFyIHJlcSA9IHRoaXMucmVxO1xuICB2YXIgbWV0aG9kID0gcmVxLm1ldGhvZDtcbiAgdmFyIHVybCA9IHJlcS51cmw7XG5cbiAgdmFyIG1zZyA9ICdjYW5ub3QgJyArIG1ldGhvZCArICcgJyArIHVybCArICcgKCcgKyB0aGlzLnN0YXR1cyArICcpJztcbiAgdmFyIGVyciA9IG5ldyBFcnJvcihtc2cpO1xuICBlcnIuc3RhdHVzID0gdGhpcy5zdGF0dXM7XG4gIGVyci5tZXRob2QgPSBtZXRob2Q7XG4gIGVyci51cmwgPSB1cmw7XG5cbiAgcmV0dXJuIGVycjtcbn07XG5cbi8qKlxuICogRXhwb3NlIGBSZXNwb25zZWAuXG4gKi9cblxucmVxdWVzdC5SZXNwb25zZSA9IFJlc3BvbnNlO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYFJlcXVlc3RgIHdpdGggdGhlIGdpdmVuIGBtZXRob2RgIGFuZCBgdXJsYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIFJlcXVlc3QobWV0aG9kLCB1cmwpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLl9xdWVyeSA9IHRoaXMuX3F1ZXJ5IHx8IFtdO1xuICB0aGlzLm1ldGhvZCA9IG1ldGhvZDtcbiAgdGhpcy51cmwgPSB1cmw7XG4gIHRoaXMuaGVhZGVyID0ge307IC8vIHByZXNlcnZlcyBoZWFkZXIgbmFtZSBjYXNlXG4gIHRoaXMuX2hlYWRlciA9IHt9OyAvLyBjb2VyY2VzIGhlYWRlciBuYW1lcyB0byBsb3dlcmNhc2VcbiAgdGhpcy5vbignZW5kJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgZXJyID0gbnVsbDtcbiAgICB2YXIgcmVzID0gbnVsbDtcblxuICAgIHRyeSB7XG4gICAgICByZXMgPSBuZXcgUmVzcG9uc2Uoc2VsZik7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBlcnIgPSBuZXcgRXJyb3IoJ1BhcnNlciBpcyB1bmFibGUgdG8gcGFyc2UgdGhlIHJlc3BvbnNlJyk7XG4gICAgICBlcnIucGFyc2UgPSB0cnVlO1xuICAgICAgZXJyLm9yaWdpbmFsID0gZTtcbiAgICAgIC8vIGlzc3VlICM2NzU6IHJldHVybiB0aGUgcmF3IHJlc3BvbnNlIGlmIHRoZSByZXNwb25zZSBwYXJzaW5nIGZhaWxzXG4gICAgICBlcnIucmF3UmVzcG9uc2UgPSBzZWxmLnhociAmJiBzZWxmLnhoci5yZXNwb25zZVRleHQgPyBzZWxmLnhoci5yZXNwb25zZVRleHQgOiBudWxsO1xuICAgICAgLy8gaXNzdWUgIzg3NjogcmV0dXJuIHRoZSBodHRwIHN0YXR1cyBjb2RlIGlmIHRoZSByZXNwb25zZSBwYXJzaW5nIGZhaWxzXG4gICAgICBlcnIuc3RhdHVzQ29kZSA9IHNlbGYueGhyICYmIHNlbGYueGhyLnN0YXR1cyA/IHNlbGYueGhyLnN0YXR1cyA6IG51bGw7XG4gICAgICByZXR1cm4gc2VsZi5jYWxsYmFjayhlcnIpO1xuICAgIH1cblxuICAgIHNlbGYuZW1pdCgncmVzcG9uc2UnLCByZXMpO1xuXG4gICAgdmFyIG5ld19lcnI7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChyZXMuc3RhdHVzIDwgMjAwIHx8IHJlcy5zdGF0dXMgPj0gMzAwKSB7XG4gICAgICAgIG5ld19lcnIgPSBuZXcgRXJyb3IocmVzLnN0YXR1c1RleHQgfHwgJ1Vuc3VjY2Vzc2Z1bCBIVFRQIHJlc3BvbnNlJyk7XG4gICAgICAgIG5ld19lcnIub3JpZ2luYWwgPSBlcnI7XG4gICAgICAgIG5ld19lcnIucmVzcG9uc2UgPSByZXM7XG4gICAgICAgIG5ld19lcnIuc3RhdHVzID0gcmVzLnN0YXR1cztcbiAgICAgIH1cbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIG5ld19lcnIgPSBlOyAvLyAjOTg1IHRvdWNoaW5nIHJlcyBtYXkgY2F1c2UgSU5WQUxJRF9TVEFURV9FUlIgb24gb2xkIEFuZHJvaWRcbiAgICB9XG5cbiAgICAvLyAjMTAwMCBkb24ndCBjYXRjaCBlcnJvcnMgZnJvbSB0aGUgY2FsbGJhY2sgdG8gYXZvaWQgZG91YmxlIGNhbGxpbmcgaXRcbiAgICBpZiAobmV3X2Vycikge1xuICAgICAgc2VsZi5jYWxsYmFjayhuZXdfZXJyLCByZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLmNhbGxiYWNrKG51bGwsIHJlcyk7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBNaXhpbiBgRW1pdHRlcmAgYW5kIGByZXF1ZXN0QmFzZWAuXG4gKi9cblxuRW1pdHRlcihSZXF1ZXN0LnByb3RvdHlwZSk7XG5mb3IgKHZhciBrZXkgaW4gcmVxdWVzdEJhc2UpIHtcbiAgUmVxdWVzdC5wcm90b3R5cGVba2V5XSA9IHJlcXVlc3RCYXNlW2tleV07XG59XG5cbi8qKlxuICogU2V0IENvbnRlbnQtVHlwZSB0byBgdHlwZWAsIG1hcHBpbmcgdmFsdWVzIGZyb20gYHJlcXVlc3QudHlwZXNgLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgc3VwZXJhZ2VudC50eXBlcy54bWwgPSAnYXBwbGljYXRpb24veG1sJztcbiAqXG4gKiAgICAgIHJlcXVlc3QucG9zdCgnLycpXG4gKiAgICAgICAgLnR5cGUoJ3htbCcpXG4gKiAgICAgICAgLnNlbmQoeG1sc3RyaW5nKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqICAgICAgcmVxdWVzdC5wb3N0KCcvJylcbiAqICAgICAgICAudHlwZSgnYXBwbGljYXRpb24veG1sJylcbiAqICAgICAgICAuc2VuZCh4bWxzdHJpbmcpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS50eXBlID0gZnVuY3Rpb24odHlwZSl7XG4gIHRoaXMuc2V0KCdDb250ZW50LVR5cGUnLCByZXF1ZXN0LnR5cGVzW3R5cGVdIHx8IHR5cGUpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IHJlc3BvbnNlVHlwZSB0byBgdmFsYC4gUHJlc2VudGx5IHZhbGlkIHJlc3BvbnNlVHlwZXMgYXJlICdibG9iJyBhbmRcbiAqICdhcnJheWJ1ZmZlcicuXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICAgICByZXEuZ2V0KCcvJylcbiAqICAgICAgICAucmVzcG9uc2VUeXBlKCdibG9iJylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUucmVzcG9uc2VUeXBlID0gZnVuY3Rpb24odmFsKXtcbiAgdGhpcy5fcmVzcG9uc2VUeXBlID0gdmFsO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IEFjY2VwdCB0byBgdHlwZWAsIG1hcHBpbmcgdmFsdWVzIGZyb20gYHJlcXVlc3QudHlwZXNgLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgc3VwZXJhZ2VudC50eXBlcy5qc29uID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICpcbiAqICAgICAgcmVxdWVzdC5nZXQoJy9hZ2VudCcpXG4gKiAgICAgICAgLmFjY2VwdCgnanNvbicpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogICAgICByZXF1ZXN0LmdldCgnL2FnZW50JylcbiAqICAgICAgICAuYWNjZXB0KCdhcHBsaWNhdGlvbi9qc29uJylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gYWNjZXB0XG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuYWNjZXB0ID0gZnVuY3Rpb24odHlwZSl7XG4gIHRoaXMuc2V0KCdBY2NlcHQnLCByZXF1ZXN0LnR5cGVzW3R5cGVdIHx8IHR5cGUpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IEF1dGhvcml6YXRpb24gZmllbGQgdmFsdWUgd2l0aCBgdXNlcmAgYW5kIGBwYXNzYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlclxuICogQHBhcmFtIHtTdHJpbmd9IHBhc3NcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIHdpdGggJ3R5cGUnIHByb3BlcnR5ICdhdXRvJyBvciAnYmFzaWMnIChkZWZhdWx0ICdiYXNpYycpXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuYXV0aCA9IGZ1bmN0aW9uKHVzZXIsIHBhc3MsIG9wdGlvbnMpe1xuICBpZiAoIW9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0ge1xuICAgICAgdHlwZTogJ2Jhc2ljJ1xuICAgIH1cbiAgfVxuXG4gIHN3aXRjaCAob3B0aW9ucy50eXBlKSB7XG4gICAgY2FzZSAnYmFzaWMnOlxuICAgICAgdmFyIHN0ciA9IGJ0b2EodXNlciArICc6JyArIHBhc3MpO1xuICAgICAgdGhpcy5zZXQoJ0F1dGhvcml6YXRpb24nLCAnQmFzaWMgJyArIHN0cik7XG4gICAgYnJlYWs7XG5cbiAgICBjYXNlICdhdXRvJzpcbiAgICAgIHRoaXMudXNlcm5hbWUgPSB1c2VyO1xuICAgICAgdGhpcy5wYXNzd29yZCA9IHBhc3M7XG4gICAgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiogQWRkIHF1ZXJ5LXN0cmluZyBgdmFsYC5cbipcbiogRXhhbXBsZXM6XG4qXG4qICAgcmVxdWVzdC5nZXQoJy9zaG9lcycpXG4qICAgICAucXVlcnkoJ3NpemU9MTAnKVxuKiAgICAgLnF1ZXJ5KHsgY29sb3I6ICdibHVlJyB9KVxuKlxuKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IHZhbFxuKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiogQGFwaSBwdWJsaWNcbiovXG5cblJlcXVlc3QucHJvdG90eXBlLnF1ZXJ5ID0gZnVuY3Rpb24odmFsKXtcbiAgaWYgKCdzdHJpbmcnICE9IHR5cGVvZiB2YWwpIHZhbCA9IHNlcmlhbGl6ZSh2YWwpO1xuICBpZiAodmFsKSB0aGlzLl9xdWVyeS5wdXNoKHZhbCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBRdWV1ZSB0aGUgZ2l2ZW4gYGZpbGVgIGFzIGFuIGF0dGFjaG1lbnQgdG8gdGhlIHNwZWNpZmllZCBgZmllbGRgLFxuICogd2l0aCBvcHRpb25hbCBgZmlsZW5hbWVgLlxuICpcbiAqIGBgYCBqc1xuICogcmVxdWVzdC5wb3N0KCcvdXBsb2FkJylcbiAqICAgLmF0dGFjaCgnY29udGVudCcsIG5ldyBCbG9iKFsnPGEgaWQ9XCJhXCI+PGIgaWQ9XCJiXCI+aGV5ITwvYj48L2E+J10sIHsgdHlwZTogXCJ0ZXh0L2h0bWxcIn0pKVxuICogICAuZW5kKGNhbGxiYWNrKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZFxuICogQHBhcmFtIHtCbG9ifEZpbGV9IGZpbGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlbmFtZVxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmF0dGFjaCA9IGZ1bmN0aW9uKGZpZWxkLCBmaWxlLCBmaWxlbmFtZSl7XG4gIHRoaXMuX2dldEZvcm1EYXRhKCkuYXBwZW5kKGZpZWxkLCBmaWxlLCBmaWxlbmFtZSB8fCBmaWxlLm5hbWUpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblJlcXVlc3QucHJvdG90eXBlLl9nZXRGb3JtRGF0YSA9IGZ1bmN0aW9uKCl7XG4gIGlmICghdGhpcy5fZm9ybURhdGEpIHtcbiAgICB0aGlzLl9mb3JtRGF0YSA9IG5ldyByb290LkZvcm1EYXRhKCk7XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2Zvcm1EYXRhO1xufTtcblxuLyoqXG4gKiBJbnZva2UgdGhlIGNhbGxiYWNrIHdpdGggYGVycmAgYW5kIGByZXNgXG4gKiBhbmQgaGFuZGxlIGFyaXR5IGNoZWNrLlxuICpcbiAqIEBwYXJhbSB7RXJyb3J9IGVyclxuICogQHBhcmFtIHtSZXNwb25zZX0gcmVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5jYWxsYmFjayA9IGZ1bmN0aW9uKGVyciwgcmVzKXtcbiAgdmFyIGZuID0gdGhpcy5fY2FsbGJhY2s7XG4gIHRoaXMuY2xlYXJUaW1lb3V0KCk7XG4gIGZuKGVyciwgcmVzKTtcbn07XG5cbi8qKlxuICogSW52b2tlIGNhbGxiYWNrIHdpdGggeC1kb21haW4gZXJyb3IuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuY3Jvc3NEb21haW5FcnJvciA9IGZ1bmN0aW9uKCl7XG4gIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1JlcXVlc3QgaGFzIGJlZW4gdGVybWluYXRlZFxcblBvc3NpYmxlIGNhdXNlczogdGhlIG5ldHdvcmsgaXMgb2ZmbGluZSwgT3JpZ2luIGlzIG5vdCBhbGxvd2VkIGJ5IEFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbiwgdGhlIHBhZ2UgaXMgYmVpbmcgdW5sb2FkZWQsIGV0Yy4nKTtcbiAgZXJyLmNyb3NzRG9tYWluID0gdHJ1ZTtcblxuICBlcnIuc3RhdHVzID0gdGhpcy5zdGF0dXM7XG4gIGVyci5tZXRob2QgPSB0aGlzLm1ldGhvZDtcbiAgZXJyLnVybCA9IHRoaXMudXJsO1xuXG4gIHRoaXMuY2FsbGJhY2soZXJyKTtcbn07XG5cbi8qKlxuICogSW52b2tlIGNhbGxiYWNrIHdpdGggdGltZW91dCBlcnJvci5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5fdGltZW91dEVycm9yID0gZnVuY3Rpb24oKXtcbiAgdmFyIHRpbWVvdXQgPSB0aGlzLl90aW1lb3V0O1xuICB2YXIgZXJyID0gbmV3IEVycm9yKCd0aW1lb3V0IG9mICcgKyB0aW1lb3V0ICsgJ21zIGV4Y2VlZGVkJyk7XG4gIGVyci50aW1lb3V0ID0gdGltZW91dDtcbiAgdGhpcy5jYWxsYmFjayhlcnIpO1xufTtcblxuLyoqXG4gKiBDb21wb3NlIHF1ZXJ5c3RyaW5nIHRvIGFwcGVuZCB0byByZXEudXJsXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuX2FwcGVuZFF1ZXJ5U3RyaW5nID0gZnVuY3Rpb24oKXtcbiAgdmFyIHF1ZXJ5ID0gdGhpcy5fcXVlcnkuam9pbignJicpO1xuICBpZiAocXVlcnkpIHtcbiAgICB0aGlzLnVybCArPSB+dGhpcy51cmwuaW5kZXhPZignPycpXG4gICAgICA/ICcmJyArIHF1ZXJ5XG4gICAgICA6ICc/JyArIHF1ZXJ5O1xuICB9XG59O1xuXG4vKipcbiAqIEluaXRpYXRlIHJlcXVlc3QsIGludm9raW5nIGNhbGxiYWNrIGBmbihyZXMpYFxuICogd2l0aCBhbiBpbnN0YW5jZW9mIGBSZXNwb25zZWAuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbihmbil7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIHhociA9IHRoaXMueGhyID0gcmVxdWVzdC5nZXRYSFIoKTtcbiAgdmFyIHRpbWVvdXQgPSB0aGlzLl90aW1lb3V0O1xuICB2YXIgZGF0YSA9IHRoaXMuX2Zvcm1EYXRhIHx8IHRoaXMuX2RhdGE7XG5cbiAgLy8gc3RvcmUgY2FsbGJhY2tcbiAgdGhpcy5fY2FsbGJhY2sgPSBmbiB8fCBub29wO1xuXG4gIC8vIHN0YXRlIGNoYW5nZVxuICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKXtcbiAgICBpZiAoNCAhPSB4aHIucmVhZHlTdGF0ZSkgcmV0dXJuO1xuXG4gICAgLy8gSW4gSUU5LCByZWFkcyB0byBhbnkgcHJvcGVydHkgKGUuZy4gc3RhdHVzKSBvZmYgb2YgYW4gYWJvcnRlZCBYSFIgd2lsbFxuICAgIC8vIHJlc3VsdCBpbiB0aGUgZXJyb3IgXCJDb3VsZCBub3QgY29tcGxldGUgdGhlIG9wZXJhdGlvbiBkdWUgdG8gZXJyb3IgYzAwYzAyM2ZcIlxuICAgIHZhciBzdGF0dXM7XG4gICAgdHJ5IHsgc3RhdHVzID0geGhyLnN0YXR1cyB9IGNhdGNoKGUpIHsgc3RhdHVzID0gMDsgfVxuXG4gICAgaWYgKDAgPT0gc3RhdHVzKSB7XG4gICAgICBpZiAoc2VsZi50aW1lZG91dCkgcmV0dXJuIHNlbGYuX3RpbWVvdXRFcnJvcigpO1xuICAgICAgaWYgKHNlbGYuX2Fib3J0ZWQpIHJldHVybjtcbiAgICAgIHJldHVybiBzZWxmLmNyb3NzRG9tYWluRXJyb3IoKTtcbiAgICB9XG4gICAgc2VsZi5lbWl0KCdlbmQnKTtcbiAgfTtcblxuICAvLyBwcm9ncmVzc1xuICB2YXIgaGFuZGxlUHJvZ3Jlc3MgPSBmdW5jdGlvbihkaXJlY3Rpb24sIGUpIHtcbiAgICBpZiAoZS50b3RhbCA+IDApIHtcbiAgICAgIGUucGVyY2VudCA9IGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMDtcbiAgICB9XG4gICAgZS5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgc2VsZi5lbWl0KCdwcm9ncmVzcycsIGUpO1xuICB9XG4gIGlmICh0aGlzLmhhc0xpc3RlbmVycygncHJvZ3Jlc3MnKSkge1xuICAgIHRyeSB7XG4gICAgICB4aHIub25wcm9ncmVzcyA9IGhhbmRsZVByb2dyZXNzLmJpbmQobnVsbCwgJ2Rvd25sb2FkJyk7XG4gICAgICBpZiAoeGhyLnVwbG9hZCkge1xuICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBoYW5kbGVQcm9ncmVzcy5iaW5kKG51bGwsICd1cGxvYWQnKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIC8vIEFjY2Vzc2luZyB4aHIudXBsb2FkIGZhaWxzIGluIElFIGZyb20gYSB3ZWIgd29ya2VyLCBzbyBqdXN0IHByZXRlbmQgaXQgZG9lc24ndCBleGlzdC5cbiAgICAgIC8vIFJlcG9ydGVkIGhlcmU6XG4gICAgICAvLyBodHRwczovL2Nvbm5lY3QubWljcm9zb2Z0LmNvbS9JRS9mZWVkYmFjay9kZXRhaWxzLzgzNzI0NS94bWxodHRwcmVxdWVzdC11cGxvYWQtdGhyb3dzLWludmFsaWQtYXJndW1lbnQtd2hlbi11c2VkLWZyb20td2ViLXdvcmtlci1jb250ZXh0XG4gICAgfVxuICB9XG5cbiAgLy8gdGltZW91dFxuICBpZiAodGltZW91dCAmJiAhdGhpcy5fdGltZXIpIHtcbiAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHNlbGYudGltZWRvdXQgPSB0cnVlO1xuICAgICAgc2VsZi5hYm9ydCgpO1xuICAgIH0sIHRpbWVvdXQpO1xuICB9XG5cbiAgLy8gcXVlcnlzdHJpbmdcbiAgdGhpcy5fYXBwZW5kUXVlcnlTdHJpbmcoKTtcblxuICAvLyBpbml0aWF0ZSByZXF1ZXN0XG4gIGlmICh0aGlzLnVzZXJuYW1lICYmIHRoaXMucGFzc3dvcmQpIHtcbiAgICB4aHIub3Blbih0aGlzLm1ldGhvZCwgdGhpcy51cmwsIHRydWUsIHRoaXMudXNlcm5hbWUsIHRoaXMucGFzc3dvcmQpO1xuICB9IGVsc2Uge1xuICAgIHhoci5vcGVuKHRoaXMubWV0aG9kLCB0aGlzLnVybCwgdHJ1ZSk7XG4gIH1cblxuICAvLyBDT1JTXG4gIGlmICh0aGlzLl93aXRoQ3JlZGVudGlhbHMpIHhoci53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuXG4gIC8vIGJvZHlcbiAgaWYgKCdHRVQnICE9IHRoaXMubWV0aG9kICYmICdIRUFEJyAhPSB0aGlzLm1ldGhvZCAmJiAnc3RyaW5nJyAhPSB0eXBlb2YgZGF0YSAmJiAhdGhpcy5faXNIb3N0KGRhdGEpKSB7XG4gICAgLy8gc2VyaWFsaXplIHN0dWZmXG4gICAgdmFyIGNvbnRlbnRUeXBlID0gdGhpcy5faGVhZGVyWydjb250ZW50LXR5cGUnXTtcbiAgICB2YXIgc2VyaWFsaXplID0gdGhpcy5fc2VyaWFsaXplciB8fCByZXF1ZXN0LnNlcmlhbGl6ZVtjb250ZW50VHlwZSA/IGNvbnRlbnRUeXBlLnNwbGl0KCc7JylbMF0gOiAnJ107XG4gICAgaWYgKCFzZXJpYWxpemUgJiYgaXNKU09OKGNvbnRlbnRUeXBlKSkgc2VyaWFsaXplID0gcmVxdWVzdC5zZXJpYWxpemVbJ2FwcGxpY2F0aW9uL2pzb24nXTtcbiAgICBpZiAoc2VyaWFsaXplKSBkYXRhID0gc2VyaWFsaXplKGRhdGEpO1xuICB9XG5cbiAgLy8gc2V0IGhlYWRlciBmaWVsZHNcbiAgZm9yICh2YXIgZmllbGQgaW4gdGhpcy5oZWFkZXIpIHtcbiAgICBpZiAobnVsbCA9PSB0aGlzLmhlYWRlcltmaWVsZF0pIGNvbnRpbnVlO1xuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKGZpZWxkLCB0aGlzLmhlYWRlcltmaWVsZF0pO1xuICB9XG5cbiAgaWYgKHRoaXMuX3Jlc3BvbnNlVHlwZSkge1xuICAgIHhoci5yZXNwb25zZVR5cGUgPSB0aGlzLl9yZXNwb25zZVR5cGU7XG4gIH1cblxuICAvLyBzZW5kIHN0dWZmXG4gIHRoaXMuZW1pdCgncmVxdWVzdCcsIHRoaXMpO1xuXG4gIC8vIElFMTEgeGhyLnNlbmQodW5kZWZpbmVkKSBzZW5kcyAndW5kZWZpbmVkJyBzdHJpbmcgYXMgUE9TVCBwYXlsb2FkIChpbnN0ZWFkIG9mIG5vdGhpbmcpXG4gIC8vIFdlIG5lZWQgbnVsbCBoZXJlIGlmIGRhdGEgaXMgdW5kZWZpbmVkXG4gIHhoci5zZW5kKHR5cGVvZiBkYXRhICE9PSAndW5kZWZpbmVkJyA/IGRhdGEgOiBudWxsKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogRXhwb3NlIGBSZXF1ZXN0YC5cbiAqL1xuXG5yZXF1ZXN0LlJlcXVlc3QgPSBSZXF1ZXN0O1xuXG4vKipcbiAqIEdFVCBgdXJsYCB3aXRoIG9wdGlvbmFsIGNhbGxiYWNrIGBmbihyZXMpYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge01peGVkfEZ1bmN0aW9ufSBbZGF0YV0gb3IgZm5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtmbl1cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnJlcXVlc3QuZ2V0ID0gZnVuY3Rpb24odXJsLCBkYXRhLCBmbil7XG4gIHZhciByZXEgPSByZXF1ZXN0KCdHRVQnLCB1cmwpO1xuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgZGF0YSkgZm4gPSBkYXRhLCBkYXRhID0gbnVsbDtcbiAgaWYgKGRhdGEpIHJlcS5xdWVyeShkYXRhKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn07XG5cbi8qKlxuICogSEVBRCBgdXJsYCB3aXRoIG9wdGlvbmFsIGNhbGxiYWNrIGBmbihyZXMpYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge01peGVkfEZ1bmN0aW9ufSBbZGF0YV0gb3IgZm5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtmbl1cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnJlcXVlc3QuaGVhZCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgZm4pe1xuICB2YXIgcmVxID0gcmVxdWVzdCgnSEVBRCcsIHVybCk7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBkYXRhKSBmbiA9IGRhdGEsIGRhdGEgPSBudWxsO1xuICBpZiAoZGF0YSkgcmVxLnNlbmQoZGF0YSk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuXG4vKipcbiAqIE9QVElPTlMgcXVlcnkgdG8gYHVybGAgd2l0aCBvcHRpb25hbCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtNaXhlZHxGdW5jdGlvbn0gW2RhdGFdIG9yIGZuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZm5dXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5yZXF1ZXN0Lm9wdGlvbnMgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ09QVElPTlMnLCB1cmwpO1xuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgZGF0YSkgZm4gPSBkYXRhLCBkYXRhID0gbnVsbDtcbiAgaWYgKGRhdGEpIHJlcS5zZW5kKGRhdGEpO1xuICBpZiAoZm4pIHJlcS5lbmQoZm4pO1xuICByZXR1cm4gcmVxO1xufTtcblxuLyoqXG4gKiBERUxFVEUgYHVybGAgd2l0aCBvcHRpb25hbCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2ZuXVxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVsKHVybCwgZm4pe1xuICB2YXIgcmVxID0gcmVxdWVzdCgnREVMRVRFJywgdXJsKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn07XG5cbnJlcXVlc3RbJ2RlbCddID0gZGVsO1xucmVxdWVzdFsnZGVsZXRlJ10gPSBkZWw7XG5cbi8qKlxuICogUEFUQ0ggYHVybGAgd2l0aCBvcHRpb25hbCBgZGF0YWAgYW5kIGNhbGxiYWNrIGBmbihyZXMpYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge01peGVkfSBbZGF0YV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtmbl1cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnJlcXVlc3QucGF0Y2ggPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ1BBVENIJywgdXJsKTtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGRhdGEpIGZuID0gZGF0YSwgZGF0YSA9IG51bGw7XG4gIGlmIChkYXRhKSByZXEuc2VuZChkYXRhKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn07XG5cbi8qKlxuICogUE9TVCBgdXJsYCB3aXRoIG9wdGlvbmFsIGBkYXRhYCBhbmQgY2FsbGJhY2sgYGZuKHJlcylgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7TWl4ZWR9IFtkYXRhXVxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2ZuXVxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucmVxdWVzdC5wb3N0ID0gZnVuY3Rpb24odXJsLCBkYXRhLCBmbil7XG4gIHZhciByZXEgPSByZXF1ZXN0KCdQT1NUJywgdXJsKTtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGRhdGEpIGZuID0gZGF0YSwgZGF0YSA9IG51bGw7XG4gIGlmIChkYXRhKSByZXEuc2VuZChkYXRhKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn07XG5cbi8qKlxuICogUFVUIGB1cmxgIHdpdGggb3B0aW9uYWwgYGRhdGFgIGFuZCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtNaXhlZHxGdW5jdGlvbn0gW2RhdGFdIG9yIGZuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZm5dXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5yZXF1ZXN0LnB1dCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgZm4pe1xuICB2YXIgcmVxID0gcmVxdWVzdCgnUFVUJywgdXJsKTtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGRhdGEpIGZuID0gZGF0YSwgZGF0YSA9IG51bGw7XG4gIGlmIChkYXRhKSByZXEuc2VuZChkYXRhKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn07XG4iLCIvKipcbiAqIENoZWNrIGlmIGBvYmpgIGlzIGFuIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gaXNPYmplY3Qob2JqKSB7XG4gIHJldHVybiBudWxsICE9PSBvYmogJiYgJ29iamVjdCcgPT09IHR5cGVvZiBvYmo7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3Q7XG4iLCIvKipcbiAqIE1vZHVsZSBvZiBtaXhlZC1pbiBmdW5jdGlvbnMgc2hhcmVkIGJldHdlZW4gbm9kZSBhbmQgY2xpZW50IGNvZGVcbiAqL1xudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pcy1vYmplY3QnKTtcblxuLyoqXG4gKiBDbGVhciBwcmV2aW91cyB0aW1lb3V0LlxuICpcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLmNsZWFyVGltZW91dCA9IGZ1bmN0aW9uIF9jbGVhclRpbWVvdXQoKXtcbiAgdGhpcy5fdGltZW91dCA9IDA7XG4gIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBPdmVycmlkZSBkZWZhdWx0IHJlc3BvbnNlIGJvZHkgcGFyc2VyXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB0byBjb252ZXJ0IGluY29taW5nIGRhdGEgaW50byByZXF1ZXN0LmJvZHlcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gcGFyc2UoZm4pe1xuICB0aGlzLl9wYXJzZXIgPSBmbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE92ZXJyaWRlIGRlZmF1bHQgcmVxdWVzdCBib2R5IHNlcmlhbGl6ZXJcbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHRvIGNvbnZlcnQgZGF0YSBzZXQgdmlhIC5zZW5kIG9yIC5hdHRhY2ggaW50byBwYXlsb2FkIHRvIHNlbmRcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnNlcmlhbGl6ZSA9IGZ1bmN0aW9uIHNlcmlhbGl6ZShmbil7XG4gIHRoaXMuX3NlcmlhbGl6ZXIgPSBmbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCB0aW1lb3V0IHRvIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy50aW1lb3V0ID0gZnVuY3Rpb24gdGltZW91dChtcyl7XG4gIHRoaXMuX3RpbWVvdXQgPSBtcztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFByb21pc2Ugc3VwcG9ydFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IHJlc29sdmVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IHJlamVjdFxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqL1xuXG5leHBvcnRzLnRoZW4gPSBmdW5jdGlvbiB0aGVuKHJlc29sdmUsIHJlamVjdCkge1xuICBpZiAoIXRoaXMuX2Z1bGxmaWxsZWRQcm9taXNlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuX2Z1bGxmaWxsZWRQcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24oaW5uZXJSZXNvbHZlLCBpbm5lclJlamVjdCl7XG4gICAgICBzZWxmLmVuZChmdW5jdGlvbihlcnIsIHJlcyl7XG4gICAgICAgIGlmIChlcnIpIGlubmVyUmVqZWN0KGVycik7IGVsc2UgaW5uZXJSZXNvbHZlKHJlcyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gdGhpcy5fZnVsbGZpbGxlZFByb21pc2UudGhlbihyZXNvbHZlLCByZWplY3QpO1xufVxuXG5leHBvcnRzLmNhdGNoID0gZnVuY3Rpb24oY2IpIHtcbiAgcmV0dXJuIHRoaXMudGhlbih1bmRlZmluZWQsIGNiKTtcbn07XG5cbi8qKlxuICogQWxsb3cgZm9yIGV4dGVuc2lvblxuICovXG5cbmV4cG9ydHMudXNlID0gZnVuY3Rpb24gdXNlKGZuKSB7XG4gIGZuKHRoaXMpO1xuICByZXR1cm4gdGhpcztcbn1cblxuXG4vKipcbiAqIEdldCByZXF1ZXN0IGhlYWRlciBgZmllbGRgLlxuICogQ2FzZS1pbnNlbnNpdGl2ZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5nZXQgPSBmdW5jdGlvbihmaWVsZCl7XG4gIHJldHVybiB0aGlzLl9oZWFkZXJbZmllbGQudG9Mb3dlckNhc2UoKV07XG59O1xuXG4vKipcbiAqIEdldCBjYXNlLWluc2Vuc2l0aXZlIGhlYWRlciBgZmllbGRgIHZhbHVlLlxuICogVGhpcyBpcyBhIGRlcHJlY2F0ZWQgaW50ZXJuYWwgQVBJLiBVc2UgYC5nZXQoZmllbGQpYCBpbnN0ZWFkLlxuICpcbiAqIChnZXRIZWFkZXIgaXMgbm8gbG9uZ2VyIHVzZWQgaW50ZXJuYWxseSBieSB0aGUgc3VwZXJhZ2VudCBjb2RlIGJhc2UpXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqIEBkZXByZWNhdGVkXG4gKi9cblxuZXhwb3J0cy5nZXRIZWFkZXIgPSBleHBvcnRzLmdldDtcblxuLyoqXG4gKiBTZXQgaGVhZGVyIGBmaWVsZGAgdG8gYHZhbGAsIG9yIG11bHRpcGxlIGZpZWxkcyB3aXRoIG9uZSBvYmplY3QuXG4gKiBDYXNlLWluc2Vuc2l0aXZlLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgcmVxLmdldCgnLycpXG4gKiAgICAgICAgLnNldCgnQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICogICAgICAgIC5zZXQoJ1gtQVBJLUtleScsICdmb29iYXInKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqICAgICAgcmVxLmdldCgnLycpXG4gKiAgICAgICAgLnNldCh7IEFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nLCAnWC1BUEktS2V5JzogJ2Zvb2JhcicgfSlcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IGZpZWxkXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5zZXQgPSBmdW5jdGlvbihmaWVsZCwgdmFsKXtcbiAgaWYgKGlzT2JqZWN0KGZpZWxkKSkge1xuICAgIGZvciAodmFyIGtleSBpbiBmaWVsZCkge1xuICAgICAgdGhpcy5zZXQoa2V5LCBmaWVsZFtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgdGhpcy5faGVhZGVyW2ZpZWxkLnRvTG93ZXJDYXNlKCldID0gdmFsO1xuICB0aGlzLmhlYWRlcltmaWVsZF0gPSB2YWw7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgaGVhZGVyIGBmaWVsZGAuXG4gKiBDYXNlLWluc2Vuc2l0aXZlLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogICAgICByZXEuZ2V0KCcvJylcbiAqICAgICAgICAudW5zZXQoJ1VzZXItQWdlbnQnKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZFxuICovXG5leHBvcnRzLnVuc2V0ID0gZnVuY3Rpb24oZmllbGQpe1xuICBkZWxldGUgdGhpcy5faGVhZGVyW2ZpZWxkLnRvTG93ZXJDYXNlKCldO1xuICBkZWxldGUgdGhpcy5oZWFkZXJbZmllbGRdO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogV3JpdGUgdGhlIGZpZWxkIGBuYW1lYCBhbmQgYHZhbGAsIG9yIG11bHRpcGxlIGZpZWxkcyB3aXRoIG9uZSBvYmplY3RcbiAqIGZvciBcIm11bHRpcGFydC9mb3JtLWRhdGFcIiByZXF1ZXN0IGJvZGllcy5cbiAqXG4gKiBgYGAganNcbiAqIHJlcXVlc3QucG9zdCgnL3VwbG9hZCcpXG4gKiAgIC5maWVsZCgnZm9vJywgJ2JhcicpXG4gKiAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqIHJlcXVlc3QucG9zdCgnL3VwbG9hZCcpXG4gKiAgIC5maWVsZCh7IGZvbzogJ2JhcicsIGJhejogJ3F1eCcgfSlcbiAqICAgLmVuZChjYWxsYmFjayk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IG5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfEJsb2J8RmlsZXxCdWZmZXJ8ZnMuUmVhZFN0cmVhbX0gdmFsXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cbmV4cG9ydHMuZmllbGQgPSBmdW5jdGlvbihuYW1lLCB2YWwpIHtcblxuICAvLyBuYW1lIHNob3VsZCBiZSBlaXRoZXIgYSBzdHJpbmcgb3IgYW4gb2JqZWN0LlxuICBpZiAobnVsbCA9PT0gbmFtZSB8fCAgdW5kZWZpbmVkID09PSBuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCcuZmllbGQobmFtZSwgdmFsKSBuYW1lIGNhbiBub3QgYmUgZW1wdHknKTtcbiAgfVxuXG4gIGlmIChpc09iamVjdChuYW1lKSkge1xuICAgIGZvciAodmFyIGtleSBpbiBuYW1lKSB7XG4gICAgICB0aGlzLmZpZWxkKGtleSwgbmFtZVtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyB2YWwgc2hvdWxkIGJlIGRlZmluZWQgbm93XG4gIGlmIChudWxsID09PSB2YWwgfHwgdW5kZWZpbmVkID09PSB2YWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJy5maWVsZChuYW1lLCB2YWwpIHZhbCBjYW4gbm90IGJlIGVtcHR5Jyk7XG4gIH1cbiAgdGhpcy5fZ2V0Rm9ybURhdGEoKS5hcHBlbmQobmFtZSwgdmFsKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFib3J0IHRoZSByZXF1ZXN0LCBhbmQgY2xlYXIgcG90ZW50aWFsIHRpbWVvdXQuXG4gKlxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cbmV4cG9ydHMuYWJvcnQgPSBmdW5jdGlvbigpe1xuICBpZiAodGhpcy5fYWJvcnRlZCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHRoaXMuX2Fib3J0ZWQgPSB0cnVlO1xuICB0aGlzLnhociAmJiB0aGlzLnhoci5hYm9ydCgpOyAvLyBicm93c2VyXG4gIHRoaXMucmVxICYmIHRoaXMucmVxLmFib3J0KCk7IC8vIG5vZGVcbiAgdGhpcy5jbGVhclRpbWVvdXQoKTtcbiAgdGhpcy5lbWl0KCdhYm9ydCcpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRW5hYmxlIHRyYW5zbWlzc2lvbiBvZiBjb29raWVzIHdpdGggeC1kb21haW4gcmVxdWVzdHMuXG4gKlxuICogTm90ZSB0aGF0IGZvciB0aGlzIHRvIHdvcmsgdGhlIG9yaWdpbiBtdXN0IG5vdCBiZVxuICogdXNpbmcgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiB3aXRoIGEgd2lsZGNhcmQsXG4gKiBhbmQgYWxzbyBtdXN0IHNldCBcIkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzXCJcbiAqIHRvIFwidHJ1ZVwiLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy53aXRoQ3JlZGVudGlhbHMgPSBmdW5jdGlvbigpe1xuICAvLyBUaGlzIGlzIGJyb3dzZXItb25seSBmdW5jdGlvbmFsaXR5LiBOb2RlIHNpZGUgaXMgbm8tb3AuXG4gIHRoaXMuX3dpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIG1heCByZWRpcmVjdHMgdG8gYG5gLiBEb2VzIG5vdGluZyBpbiBicm93c2VyIFhIUiBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gblxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMucmVkaXJlY3RzID0gZnVuY3Rpb24obil7XG4gIHRoaXMuX21heFJlZGlyZWN0cyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0IHRvIGEgcGxhaW4gamF2YXNjcmlwdCBvYmplY3QgKG5vdCBKU09OIHN0cmluZykgb2Ygc2NhbGFyIHByb3BlcnRpZXMuXG4gKiBOb3RlIGFzIHRoaXMgbWV0aG9kIGlzIGRlc2lnbmVkIHRvIHJldHVybiBhIHVzZWZ1bCBub24tdGhpcyB2YWx1ZSxcbiAqIGl0IGNhbm5vdCBiZSBjaGFpbmVkLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gZGVzY3JpYmluZyBtZXRob2QsIHVybCwgYW5kIGRhdGEgb2YgdGhpcyByZXF1ZXN0XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMudG9KU09OID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHtcbiAgICBtZXRob2Q6IHRoaXMubWV0aG9kLFxuICAgIHVybDogdGhpcy51cmwsXG4gICAgZGF0YTogdGhpcy5fZGF0YSxcbiAgICBoZWFkZXJzOiB0aGlzLl9oZWFkZXJcbiAgfTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgYG9iamAgaXMgYSBob3N0IG9iamVjdCxcbiAqIHdlIGRvbid0IHdhbnQgdG8gc2VyaWFsaXplIHRoZXNlIDopXG4gKlxuICogVE9ETzogZnV0dXJlIHByb29mLCBtb3ZlIHRvIGNvbXBvZW50IGxhbmRcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZXhwb3J0cy5faXNIb3N0ID0gZnVuY3Rpb24gX2lzSG9zdChvYmopIHtcbiAgdmFyIHN0ciA9IHt9LnRvU3RyaW5nLmNhbGwob2JqKTtcblxuICBzd2l0Y2ggKHN0cikge1xuICAgIGNhc2UgJ1tvYmplY3QgRmlsZV0nOlxuICAgIGNhc2UgJ1tvYmplY3QgQmxvYl0nOlxuICAgIGNhc2UgJ1tvYmplY3QgRm9ybURhdGFdJzpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBTZW5kIGBkYXRhYCBhcyB0aGUgcmVxdWVzdCBib2R5LCBkZWZhdWx0aW5nIHRoZSBgLnR5cGUoKWAgdG8gXCJqc29uXCIgd2hlblxuICogYW4gb2JqZWN0IGlzIGdpdmVuLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgIC8vIG1hbnVhbCBqc29uXG4gKiAgICAgICByZXF1ZXN0LnBvc3QoJy91c2VyJylcbiAqICAgICAgICAgLnR5cGUoJ2pzb24nKVxuICogICAgICAgICAuc2VuZCgne1wibmFtZVwiOlwidGpcIn0nKVxuICogICAgICAgICAuZW5kKGNhbGxiYWNrKVxuICpcbiAqICAgICAgIC8vIGF1dG8ganNvblxuICogICAgICAgcmVxdWVzdC5wb3N0KCcvdXNlcicpXG4gKiAgICAgICAgIC5zZW5kKHsgbmFtZTogJ3RqJyB9KVxuICogICAgICAgICAuZW5kKGNhbGxiYWNrKVxuICpcbiAqICAgICAgIC8vIG1hbnVhbCB4LXd3dy1mb3JtLXVybGVuY29kZWRcbiAqICAgICAgIHJlcXVlc3QucG9zdCgnL3VzZXInKVxuICogICAgICAgICAudHlwZSgnZm9ybScpXG4gKiAgICAgICAgIC5zZW5kKCduYW1lPXRqJylcbiAqICAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiAgICAgICAvLyBhdXRvIHgtd3d3LWZvcm0tdXJsZW5jb2RlZFxuICogICAgICAgcmVxdWVzdC5wb3N0KCcvdXNlcicpXG4gKiAgICAgICAgIC50eXBlKCdmb3JtJylcbiAqICAgICAgICAgLnNlbmQoeyBuYW1lOiAndGonIH0pXG4gKiAgICAgICAgIC5lbmQoY2FsbGJhY2spXG4gKlxuICogICAgICAgLy8gZGVmYXVsdHMgdG8geC13d3ctZm9ybS11cmxlbmNvZGVkXG4gKiAgICAgIHJlcXVlc3QucG9zdCgnL3VzZXInKVxuICogICAgICAgIC5zZW5kKCduYW1lPXRvYmknKVxuICogICAgICAgIC5zZW5kKCdzcGVjaWVzPWZlcnJldCcpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IGRhdGFcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnNlbmQgPSBmdW5jdGlvbihkYXRhKXtcbiAgdmFyIG9iaiA9IGlzT2JqZWN0KGRhdGEpO1xuICB2YXIgdHlwZSA9IHRoaXMuX2hlYWRlclsnY29udGVudC10eXBlJ107XG5cbiAgLy8gbWVyZ2VcbiAgaWYgKG9iaiAmJiBpc09iamVjdCh0aGlzLl9kYXRhKSkge1xuICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICB0aGlzLl9kYXRhW2tleV0gPSBkYXRhW2tleV07XG4gICAgfVxuICB9IGVsc2UgaWYgKCdzdHJpbmcnID09IHR5cGVvZiBkYXRhKSB7XG4gICAgLy8gZGVmYXVsdCB0byB4LXd3dy1mb3JtLXVybGVuY29kZWRcbiAgICBpZiAoIXR5cGUpIHRoaXMudHlwZSgnZm9ybScpO1xuICAgIHR5cGUgPSB0aGlzLl9oZWFkZXJbJ2NvbnRlbnQtdHlwZSddO1xuICAgIGlmICgnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyA9PSB0eXBlKSB7XG4gICAgICB0aGlzLl9kYXRhID0gdGhpcy5fZGF0YVxuICAgICAgICA/IHRoaXMuX2RhdGEgKyAnJicgKyBkYXRhXG4gICAgICAgIDogZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZGF0YSA9ICh0aGlzLl9kYXRhIHx8ICcnKSArIGRhdGE7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMuX2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgaWYgKCFvYmogfHwgdGhpcy5faXNIb3N0KGRhdGEpKSByZXR1cm4gdGhpcztcblxuICAvLyBkZWZhdWx0IHRvIGpzb25cbiAgaWYgKCF0eXBlKSB0aGlzLnR5cGUoJ2pzb24nKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuIiwiLy8gVGhlIG5vZGUgYW5kIGJyb3dzZXIgbW9kdWxlcyBleHBvc2UgdmVyc2lvbnMgb2YgdGhpcyB3aXRoIHRoZVxuLy8gYXBwcm9wcmlhdGUgY29uc3RydWN0b3IgZnVuY3Rpb24gYm91bmQgYXMgZmlyc3QgYXJndW1lbnRcbi8qKlxuICogSXNzdWUgYSByZXF1ZXN0OlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgIHJlcXVlc3QoJ0dFVCcsICcvdXNlcnMnKS5lbmQoY2FsbGJhY2spXG4gKiAgICByZXF1ZXN0KCcvdXNlcnMnKS5lbmQoY2FsbGJhY2spXG4gKiAgICByZXF1ZXN0KCcvdXNlcnMnLCBjYWxsYmFjaylcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbn0gdXJsIG9yIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiByZXF1ZXN0KFJlcXVlc3RDb25zdHJ1Y3RvciwgbWV0aG9kLCB1cmwpIHtcbiAgLy8gY2FsbGJhY2tcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIHVybCkge1xuICAgIHJldHVybiBuZXcgUmVxdWVzdENvbnN0cnVjdG9yKCdHRVQnLCBtZXRob2QpLmVuZCh1cmwpO1xuICB9XG5cbiAgLy8gdXJsIGZpcnN0XG4gIGlmICgyID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICByZXR1cm4gbmV3IFJlcXVlc3RDb25zdHJ1Y3RvcignR0VUJywgbWV0aG9kKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUmVxdWVzdENvbnN0cnVjdG9yKG1ldGhvZCwgdXJsKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1ZXN0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRpbnlRdWV1ZTtcblxuZnVuY3Rpb24gVGlueVF1ZXVlKGRhdGEsIGNvbXBhcmUpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVGlueVF1ZXVlKSkgcmV0dXJuIG5ldyBUaW55UXVldWUoZGF0YSwgY29tcGFyZSk7XG5cbiAgICB0aGlzLmRhdGEgPSBkYXRhIHx8IFtdO1xuICAgIHRoaXMubGVuZ3RoID0gdGhpcy5kYXRhLmxlbmd0aDtcbiAgICB0aGlzLmNvbXBhcmUgPSBjb21wYXJlIHx8IGRlZmF1bHRDb21wYXJlO1xuXG4gICAgaWYgKGRhdGEpIGZvciAodmFyIGkgPSBNYXRoLmZsb29yKHRoaXMubGVuZ3RoIC8gMik7IGkgPj0gMDsgaS0tKSB0aGlzLl9kb3duKGkpO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0Q29tcGFyZShhLCBiKSB7XG4gICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiAwO1xufVxuXG5UaW55UXVldWUucHJvdG90eXBlID0ge1xuXG4gICAgcHVzaDogZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdGhpcy5kYXRhLnB1c2goaXRlbSk7XG4gICAgICAgIHRoaXMubGVuZ3RoKys7XG4gICAgICAgIHRoaXMuX3VwKHRoaXMubGVuZ3RoIC0gMSk7XG4gICAgfSxcblxuICAgIHBvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdG9wID0gdGhpcy5kYXRhWzBdO1xuICAgICAgICB0aGlzLmRhdGFbMF0gPSB0aGlzLmRhdGFbdGhpcy5sZW5ndGggLSAxXTtcbiAgICAgICAgdGhpcy5sZW5ndGgtLTtcbiAgICAgICAgdGhpcy5kYXRhLnBvcCgpO1xuICAgICAgICB0aGlzLl9kb3duKDApO1xuICAgICAgICByZXR1cm4gdG9wO1xuICAgIH0sXG5cbiAgICBwZWVrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFbMF07XG4gICAgfSxcblxuICAgIF91cDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZGF0YSxcbiAgICAgICAgICAgIGNvbXBhcmUgPSB0aGlzLmNvbXBhcmU7XG5cbiAgICAgICAgd2hpbGUgKHBvcyA+IDApIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBNYXRoLmZsb29yKChwb3MgLSAxKSAvIDIpO1xuICAgICAgICAgICAgaWYgKGNvbXBhcmUoZGF0YVtwb3NdLCBkYXRhW3BhcmVudF0pIDwgMCkge1xuICAgICAgICAgICAgICAgIHN3YXAoZGF0YSwgcGFyZW50LCBwb3MpO1xuICAgICAgICAgICAgICAgIHBvcyA9IHBhcmVudDtcblxuICAgICAgICAgICAgfSBlbHNlIGJyZWFrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9kb3duOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICAgIHZhciBkYXRhID0gdGhpcy5kYXRhLFxuICAgICAgICAgICAgY29tcGFyZSA9IHRoaXMuY29tcGFyZSxcbiAgICAgICAgICAgIGxlbiA9IHRoaXMubGVuZ3RoO1xuXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICB2YXIgbGVmdCA9IDIgKiBwb3MgKyAxLFxuICAgICAgICAgICAgICAgIHJpZ2h0ID0gbGVmdCArIDEsXG4gICAgICAgICAgICAgICAgbWluID0gcG9zO1xuXG4gICAgICAgICAgICBpZiAobGVmdCA8IGxlbiAmJiBjb21wYXJlKGRhdGFbbGVmdF0sIGRhdGFbbWluXSkgPCAwKSBtaW4gPSBsZWZ0O1xuICAgICAgICAgICAgaWYgKHJpZ2h0IDwgbGVuICYmIGNvbXBhcmUoZGF0YVtyaWdodF0sIGRhdGFbbWluXSkgPCAwKSBtaW4gPSByaWdodDtcblxuICAgICAgICAgICAgaWYgKG1pbiA9PT0gcG9zKSByZXR1cm47XG5cbiAgICAgICAgICAgIHN3YXAoZGF0YSwgbWluLCBwb3MpO1xuICAgICAgICAgICAgcG9zID0gbWluO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuZnVuY3Rpb24gc3dhcChkYXRhLCBpLCBqKSB7XG4gICAgdmFyIHRtcCA9IGRhdGFbaV07XG4gICAgZGF0YVtpXSA9IGRhdGFbal07XG4gICAgZGF0YVtqXSA9IHRtcDtcbn1cbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBzaWduZWRBcmVhID0gcmVxdWlyZSgnLi9zaWduZWRfYXJlYScpO1xyXG4vLyB2YXIgZXF1YWxzID0gcmVxdWlyZSgnLi9lcXVhbHMnKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gIHtTd2VlcEV2ZW50fSBlMVxyXG4gKiBAcGFyYW0gIHtTd2VlcEV2ZW50fSBlMlxyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNvbXBhcmVFdmVudHMoZTEsIGUyKSB7XHJcbiAgdmFyIHAxID0gZTEucG9pbnQ7XHJcbiAgdmFyIHAyID0gZTIucG9pbnQ7XHJcblxyXG4gIC8vIERpZmZlcmVudCB4LWNvb3JkaW5hdGVcclxuICBpZiAocDFbMF0gPiBwMlswXSkgcmV0dXJuIDE7XHJcbiAgaWYgKHAxWzBdIDwgcDJbMF0pIHJldHVybiAtMTtcclxuXHJcbiAgLy8gRGlmZmVyZW50IHBvaW50cywgYnV0IHNhbWUgeC1jb29yZGluYXRlXHJcbiAgLy8gRXZlbnQgd2l0aCBsb3dlciB5LWNvb3JkaW5hdGUgaXMgcHJvY2Vzc2VkIGZpcnN0XHJcbiAgaWYgKHAxWzFdICE9PSBwMlsxXSkgcmV0dXJuIHAxWzFdID4gcDJbMV0gPyAxIDogLTE7XHJcblxyXG4gIHJldHVybiBzcGVjaWFsQ2FzZXMoZTEsIGUyLCBwMSwgcDIpO1xyXG59O1xyXG5cclxuXHJcbi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXHJcbmZ1bmN0aW9uIHNwZWNpYWxDYXNlcyhlMSwgZTIsIHAxLCBwMikge1xyXG4gIC8vIFNhbWUgY29vcmRpbmF0ZXMsIGJ1dCBvbmUgaXMgYSBsZWZ0IGVuZHBvaW50IGFuZCB0aGUgb3RoZXIgaXNcclxuICAvLyBhIHJpZ2h0IGVuZHBvaW50LiBUaGUgcmlnaHQgZW5kcG9pbnQgaXMgcHJvY2Vzc2VkIGZpcnN0XHJcbiAgaWYgKGUxLmxlZnQgIT09IGUyLmxlZnQpXHJcbiAgICByZXR1cm4gZTEubGVmdCA/IDEgOiAtMTtcclxuXHJcbiAgLy8gdmFyIHAyID0gZTEub3RoZXJFdmVudC5wb2ludCwgcDMgPSBlMi5vdGhlckV2ZW50LnBvaW50O1xyXG4gIC8vIHZhciBzYSA9IChwMVswXSAtIHAzWzBdKSAqIChwMlsxXSAtIHAzWzFdKSAtIChwMlswXSAtIHAzWzBdKSAqIChwMVsxXSAtIHAzWzFdKVxyXG4gIC8vIFNhbWUgY29vcmRpbmF0ZXMsIGJvdGggZXZlbnRzXHJcbiAgLy8gYXJlIGxlZnQgZW5kcG9pbnRzIG9yIHJpZ2h0IGVuZHBvaW50cy5cclxuICAvLyBub3QgY29sbGluZWFyXHJcbiAgaWYgKHNpZ25lZEFyZWEocDEsIGUxLm90aGVyRXZlbnQucG9pbnQsIGUyLm90aGVyRXZlbnQucG9pbnQpICE9PSAwKSB7XHJcbiAgICAvLyB0aGUgZXZlbnQgYXNzb2NpYXRlIHRvIHRoZSBib3R0b20gc2VnbWVudCBpcyBwcm9jZXNzZWQgZmlyc3RcclxuICAgIHJldHVybiAoIWUxLmlzQmVsb3coZTIub3RoZXJFdmVudC5wb2ludCkpID8gMSA6IC0xO1xyXG4gIH1cclxuXHJcbiAgLy8gdW5jb21tZW50IHRoaXMgaWYgeW91IHdhbnQgdG8gcGxheSB3aXRoIG11bHRpcG9seWdvbnNcclxuICAvLyBpZiAoZTEuaXNTdWJqZWN0ID09PSBlMi5pc1N1YmplY3QpIHtcclxuICAvLyAgIGlmKGVxdWFscyhlMS5wb2ludCwgZTIucG9pbnQpICYmIGUxLmNvbnRvdXJJZCA9PT0gZTIuY29udG91cklkKSB7XHJcbiAgLy8gICAgIHJldHVybiAwO1xyXG4gIC8vICAgfSBlbHNlIHtcclxuICAvLyAgICAgcmV0dXJuIGUxLmNvbnRvdXJJZCA+IGUyLmNvbnRvdXJJZCA/IDEgOiAtMTtcclxuICAvLyAgIH1cclxuICAvLyB9XHJcblxyXG4gIHJldHVybiAoIWUxLmlzU3ViamVjdCAmJiBlMi5pc1N1YmplY3QpID8gMSA6IC0xO1xyXG59XHJcbi8qIGVzbGludC1lbmFibGUgbm8tdW51c2VkLXZhcnMgKi9cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHNpZ25lZEFyZWEgICAgPSByZXF1aXJlKCcuL3NpZ25lZF9hcmVhJyk7XHJcbnZhciBjb21wYXJlRXZlbnRzID0gcmVxdWlyZSgnLi9jb21wYXJlX2V2ZW50cycpO1xyXG52YXIgZXF1YWxzICAgICAgICA9IHJlcXVpcmUoJy4vZXF1YWxzJyk7XHJcblxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSAge1N3ZWVwRXZlbnR9IGxlMVxyXG4gKiBAcGFyYW0gIHtTd2VlcEV2ZW50fSBsZTJcclxuICogQHJldHVybiB7TnVtYmVyfVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjb21wYXJlU2VnbWVudHMobGUxLCBsZTIpIHtcclxuICBpZiAobGUxID09PSBsZTIpIHJldHVybiAwO1xyXG5cclxuICAvLyBTZWdtZW50cyBhcmUgbm90IGNvbGxpbmVhclxyXG4gIGlmIChzaWduZWRBcmVhKGxlMS5wb2ludCwgbGUxLm90aGVyRXZlbnQucG9pbnQsIGxlMi5wb2ludCkgIT09IDAgfHxcclxuICAgIHNpZ25lZEFyZWEobGUxLnBvaW50LCBsZTEub3RoZXJFdmVudC5wb2ludCwgbGUyLm90aGVyRXZlbnQucG9pbnQpICE9PSAwKSB7XHJcblxyXG4gICAgLy8gSWYgdGhleSBzaGFyZSB0aGVpciBsZWZ0IGVuZHBvaW50IHVzZSB0aGUgcmlnaHQgZW5kcG9pbnQgdG8gc29ydFxyXG4gICAgaWYgKGVxdWFscyhsZTEucG9pbnQsIGxlMi5wb2ludCkpIHJldHVybiBsZTEuaXNCZWxvdyhsZTIub3RoZXJFdmVudC5wb2ludCkgPyAtMSA6IDE7XHJcblxyXG4gICAgLy8gRGlmZmVyZW50IGxlZnQgZW5kcG9pbnQ6IHVzZSB0aGUgbGVmdCBlbmRwb2ludCB0byBzb3J0XHJcbiAgICBpZiAobGUxLnBvaW50WzBdID09PSBsZTIucG9pbnRbMF0pIHJldHVybiBsZTEucG9pbnRbMV0gPCBsZTIucG9pbnRbMV0gPyAtMSA6IDE7XHJcblxyXG4gICAgLy8gaGFzIHRoZSBsaW5lIHNlZ21lbnQgYXNzb2NpYXRlZCB0byBlMSBiZWVuIGluc2VydGVkXHJcbiAgICAvLyBpbnRvIFMgYWZ0ZXIgdGhlIGxpbmUgc2VnbWVudCBhc3NvY2lhdGVkIHRvIGUyID9cclxuICAgIGlmIChjb21wYXJlRXZlbnRzKGxlMSwgbGUyKSA9PT0gMSkgcmV0dXJuIGxlMi5pc0Fib3ZlKGxlMS5wb2ludCkgPyAtMSA6IDE7XHJcblxyXG4gICAgLy8gVGhlIGxpbmUgc2VnbWVudCBhc3NvY2lhdGVkIHRvIGUyIGhhcyBiZWVuIGluc2VydGVkXHJcbiAgICAvLyBpbnRvIFMgYWZ0ZXIgdGhlIGxpbmUgc2VnbWVudCBhc3NvY2lhdGVkIHRvIGUxXHJcbiAgICByZXR1cm4gbGUxLmlzQmVsb3cobGUyLnBvaW50KSA/IC0xIDogMTtcclxuICB9XHJcblxyXG4gIGlmIChsZTEuaXNTdWJqZWN0ID09PSBsZTIuaXNTdWJqZWN0KSB7IC8vIHNhbWUgcG9seWdvblxyXG4gICAgdmFyIHAxID0gbGUxLnBvaW50LCBwMiA9IGxlMi5wb2ludDtcclxuICAgIGlmIChwMVswXSA9PT0gcDJbMF0gJiYgcDFbMV0gPT09IHAyWzFdLyplcXVhbHMobGUxLnBvaW50LCBsZTIucG9pbnQpKi8pIHtcclxuICAgICAgcDEgPSBsZTEub3RoZXJFdmVudC5wb2ludDsgcDIgPSBsZTIub3RoZXJFdmVudC5wb2ludDtcclxuICAgICAgaWYgKHAxWzBdID09PSBwMlswXSAmJiBwMVsxXSA9PT0gcDJbMV0pIHJldHVybiAwO1xyXG4gICAgICBlbHNlIHJldHVybiBsZTEuY29udG91cklkID4gbGUyLmNvbnRvdXJJZCA/IDEgOiAtMTtcclxuICAgIH1cclxuICB9IGVsc2UgeyAvLyBTZWdtZW50cyBhcmUgY29sbGluZWFyLCBidXQgYmVsb25nIHRvIHNlcGFyYXRlIHBvbHlnb25zXHJcbiAgICByZXR1cm4gbGUxLmlzU3ViamVjdCA/IC0xIDogMTtcclxuICB9XHJcblxyXG4gIHJldHVybiBjb21wYXJlRXZlbnRzKGxlMSwgbGUyKSA9PT0gMSA/IDEgOiAtMTtcclxufTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGVkZ2VUeXBlID0gcmVxdWlyZSgnLi9lZGdlX3R5cGUnKTtcclxuXHJcbnZhciBJTlRFUlNFQ1RJT04gPSAwO1xyXG52YXIgVU5JT04gICAgICAgID0gMTtcclxudmFyIERJRkZFUkVOQ0UgICA9IDI7XHJcbnZhciBYT1IgICAgICAgICAgPSAzO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSAge1N3ZWVwRXZlbnR9IGV2ZW50XHJcbiAqIEBwYXJhbSAge1N3ZWVwRXZlbnR9IHByZXZcclxuICogQHBhcmFtICB7T3BlcmF0aW9ufSBvcGVyYXRpb25cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY29tcHV0ZUZpZWxkcyhldmVudCwgcHJldiwgb3BlcmF0aW9uKSB7XHJcbiAgLy8gY29tcHV0ZSBpbk91dCBhbmQgb3RoZXJJbk91dCBmaWVsZHNcclxuICBpZiAocHJldiA9PT0gbnVsbCkge1xyXG4gICAgZXZlbnQuaW5PdXQgICAgICA9IGZhbHNlO1xyXG4gICAgZXZlbnQub3RoZXJJbk91dCA9IHRydWU7XHJcblxyXG4gIC8vIHByZXZpb3VzIGxpbmUgc2VnbWVudCBpbiBzd2VlcGxpbmUgYmVsb25ncyB0byB0aGUgc2FtZSBwb2x5Z29uXHJcbiAgfSBlbHNlIHtcclxuICAgIGlmIChldmVudC5pc1N1YmplY3QgPT09IHByZXYuaXNTdWJqZWN0KSB7XHJcbiAgICAgIGV2ZW50LmluT3V0ICAgICAgPSAhcHJldi5pbk91dDtcclxuICAgICAgZXZlbnQub3RoZXJJbk91dCA9IHByZXYub3RoZXJJbk91dDtcclxuXHJcbiAgICAvLyBwcmV2aW91cyBsaW5lIHNlZ21lbnQgaW4gc3dlZXBsaW5lIGJlbG9uZ3MgdG8gdGhlIGNsaXBwaW5nIHBvbHlnb25cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGV2ZW50LmluT3V0ICAgICAgPSAhcHJldi5vdGhlckluT3V0O1xyXG4gICAgICBldmVudC5vdGhlckluT3V0ID0gcHJldi5pc1ZlcnRpY2FsKCkgPyAhcHJldi5pbk91dCA6IHByZXYuaW5PdXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29tcHV0ZSBwcmV2SW5SZXN1bHQgZmllbGRcclxuICAgIGlmIChwcmV2KSB7XHJcbiAgICAgIGV2ZW50LnByZXZJblJlc3VsdCA9ICghaW5SZXN1bHQocHJldiwgb3BlcmF0aW9uKSB8fCBwcmV2LmlzVmVydGljYWwoKSkgP1xyXG4gICAgICAgICBwcmV2LnByZXZJblJlc3VsdCA6IHByZXY7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBjaGVjayBpZiB0aGUgbGluZSBzZWdtZW50IGJlbG9uZ3MgdG8gdGhlIEJvb2xlYW4gb3BlcmF0aW9uXHJcbiAgZXZlbnQuaW5SZXN1bHQgPSBpblJlc3VsdChldmVudCwgb3BlcmF0aW9uKTtcclxufTtcclxuXHJcblxyXG5mdW5jdGlvbiBpblJlc3VsdChldmVudCwgb3BlcmF0aW9uKSB7XHJcbiAgc3dpdGNoIChldmVudC50eXBlKSB7XHJcbiAgY2FzZSBlZGdlVHlwZS5OT1JNQUw6XHJcbiAgICBzd2l0Y2ggKG9wZXJhdGlvbikge1xyXG4gICAgY2FzZSBJTlRFUlNFQ1RJT046XHJcbiAgICAgIHJldHVybiAhZXZlbnQub3RoZXJJbk91dDtcclxuICAgIGNhc2UgVU5JT046XHJcbiAgICAgIHJldHVybiBldmVudC5vdGhlckluT3V0O1xyXG4gICAgY2FzZSBESUZGRVJFTkNFOlxyXG4gICAgICByZXR1cm4gKGV2ZW50LmlzU3ViamVjdCAmJiBldmVudC5vdGhlckluT3V0KSB8fFxyXG4gICAgICAgICAgICAgICghZXZlbnQuaXNTdWJqZWN0ICYmICFldmVudC5vdGhlckluT3V0KTtcclxuICAgIGNhc2UgWE9SOlxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGJyZWFrO1xyXG4gIGNhc2UgZWRnZVR5cGUuU0FNRV9UUkFOU0lUSU9OOlxyXG4gICAgcmV0dXJuIG9wZXJhdGlvbiA9PT0gSU5URVJTRUNUSU9OIHx8IG9wZXJhdGlvbiA9PT0gVU5JT047XHJcbiAgY2FzZSBlZGdlVHlwZS5ESUZGRVJFTlRfVFJBTlNJVElPTjpcclxuICAgIHJldHVybiBvcGVyYXRpb24gPT09IERJRkZFUkVOQ0U7XHJcbiAgY2FzZSBlZGdlVHlwZS5OT05fQ09OVFJJQlVUSU5HOlxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gdmFyIGVxdWFscyA9IHJlcXVpcmUoJy4vZXF1YWxzJyk7XHJcbnZhciBjb21wYXJlRXZlbnRzID0gcmVxdWlyZSgnLi9jb21wYXJlX2V2ZW50cycpO1xyXG52YXIgb3BlcmF0aW9uVHlwZSA9IHJlcXVpcmUoJy4vb3BlcmF0aW9uJyk7XHJcblxyXG4vKipcclxuICogQHBhcmFtICB7QXJyYXkuPFN3ZWVwRXZlbnQ+fSBzb3J0ZWRFdmVudHNcclxuICogQHJldHVybiB7QXJyYXkuPFN3ZWVwRXZlbnQ+fVxyXG4gKi9cclxuZnVuY3Rpb24gb3JkZXJFdmVudHMoc29ydGVkRXZlbnRzKSB7XHJcbiAgdmFyIGV2ZW50LCBpLCBsZW4sIHRtcDtcclxuICB2YXIgcmVzdWx0RXZlbnRzID0gW107XHJcbiAgZm9yIChpID0gMCwgbGVuID0gc29ydGVkRXZlbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICBldmVudCA9IHNvcnRlZEV2ZW50c1tpXTtcclxuICAgIGlmICgoZXZlbnQubGVmdCAmJiBldmVudC5pblJlc3VsdCkgfHxcclxuICAgICAgKCFldmVudC5sZWZ0ICYmIGV2ZW50Lm90aGVyRXZlbnQuaW5SZXN1bHQpKSB7XHJcbiAgICAgIHJlc3VsdEV2ZW50cy5wdXNoKGV2ZW50KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIER1ZSB0byBvdmVybGFwcGluZyBlZGdlcyB0aGUgcmVzdWx0RXZlbnRzIGFycmF5IGNhbiBiZSBub3Qgd2hvbGx5IHNvcnRlZFxyXG4gIHZhciBzb3J0ZWQgPSBmYWxzZTtcclxuICB3aGlsZSAoIXNvcnRlZCkge1xyXG4gICAgc29ydGVkID0gdHJ1ZTtcclxuICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlc3VsdEV2ZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICBpZiAoKGkgKyAxKSA8IGxlbiAmJlxyXG4gICAgICAgIGNvbXBhcmVFdmVudHMocmVzdWx0RXZlbnRzW2ldLCByZXN1bHRFdmVudHNbaSArIDFdKSA9PT0gMSkge1xyXG4gICAgICAgIHRtcCA9IHJlc3VsdEV2ZW50c1tpXTtcclxuICAgICAgICByZXN1bHRFdmVudHNbaV0gPSByZXN1bHRFdmVudHNbaSArIDFdO1xyXG4gICAgICAgIHJlc3VsdEV2ZW50c1tpICsgMV0gPSB0bXA7XHJcbiAgICAgICAgc29ydGVkID0gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZvciAoaSA9IDAsIGxlbiA9IHJlc3VsdEV2ZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgcmVzdWx0RXZlbnRzW2ldLnBvcyA9IGk7XHJcbiAgfVxyXG5cclxuICBmb3IgKGkgPSAwLCBsZW4gPSByZXN1bHRFdmVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgIGV2ZW50ID0gcmVzdWx0RXZlbnRzW2ldO1xyXG4gICAgaWYgKCFldmVudC5sZWZ0KSB7XHJcbiAgICAgIHRtcCA9IGV2ZW50LnBvcztcclxuICAgICAgZXZlbnQucG9zID0gZXZlbnQub3RoZXJFdmVudC5wb3M7XHJcbiAgICAgIGV2ZW50Lm90aGVyRXZlbnQucG9zID0gdG1wO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3VsdEV2ZW50cztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHBvc1xyXG4gKiBAcGFyYW0gIHtBcnJheS48U3dlZXBFdmVudD59IHJlc3VsdEV2ZW50c1xyXG4gKiBAcGFyYW0gIHtPYmplY3Q+fSAgICBwcm9jZXNzZWRcclxuICogQHJldHVybiB7TnVtYmVyfVxyXG4gKi9cclxuZnVuY3Rpb24gbmV4dFBvcyhwb3MsIHJlc3VsdEV2ZW50cywgcHJvY2Vzc2VkLCBvcmlnSW5kZXgpIHtcclxuICB2YXIgbmV3UG9zID0gcG9zICsgMTtcclxuICB2YXIgbGVuZ3RoID0gcmVzdWx0RXZlbnRzLmxlbmd0aDtcclxuICB2YXIgcCAgPSByZXN1bHRFdmVudHNbcG9zXS5wb2ludDtcclxuICB2YXIgcDEgPSByZXN1bHRFdmVudHNbbmV3UG9zXS5wb2ludDtcclxuXHJcbiAgLy8gaWYgKG5ld1BvcyA8IGxlbmd0aCAmJlxyXG4gIC8vICAgcDFbMF0gIT09IHBbMF0gfHwgcDFbMV0gIT09IHBbMV0gJiZcclxuICAvLyAgICFwcm9jZXNzZWRbbmV3UG9zXSkgcmV0dXJuIG5ld1BvcztcclxuICAvLyBlbHNlIHJldHVybiBwb3MgLSAxO1xyXG5cclxuXHJcbiAgLy8gd2hpbGUgaW4gcmFuZ2UgYW5kIG5vdCB0aGUgY3VycmVudCBvbmUgYnkgdmFsdWVcclxuICB3aGlsZSAobmV3UG9zIDwgbGVuZ3RoICYmIHAxWzBdID09PSBwWzBdICYmIHAxWzFdID09PSBwWzFdKSB7XHJcbiAgICBpZiAoIXByb2Nlc3NlZFtuZXdQb3NdKSB7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKHBvcywgbmV3UG9zLCBsZW5ndGgpO1xyXG4gICAgICByZXR1cm4gbmV3UG9zO1xyXG4gICAgfSBlbHNlICAgICAgICAgICAgICAgICAgICBuZXdQb3MrKztcclxuICAgIHAxID0gcmVzdWx0RXZlbnRzW25ld1Bvc10ucG9pbnQ7XHJcbiAgfVxyXG5cclxuICBuZXdQb3MgPSBwb3MgLSAxO1xyXG5cclxuICB3aGlsZSAocHJvY2Vzc2VkW25ld1Bvc10gJiYgbmV3UG9zID49IG9yaWdJbmRleCkge1xyXG4gICAgbmV3UG9zLS07XHJcbiAgfVxyXG4gIC8vIGNvbnNvbGUubG9nKCdvdGhlcicsIHBvcywgbmV3UG9zLCBsZW5ndGgpO1xyXG4gIHJldHVybiBuZXdQb3M7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQHBhcmFtICB7QXJyYXkuPFN3ZWVwRXZlbnQ+fSBzb3J0ZWRFdmVudHNcclxuICogQHJldHVybiB7QXJyYXkuPCo+fSBwb2x5Z29uc1xyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc29ydGVkRXZlbnRzLCBvcGVyYXRpb24pIHtcclxuICB2YXIgaSwgbGVuO1xyXG4gIHZhciByZXN1bHRFdmVudHMgPSBvcmRlckV2ZW50cyhzb3J0ZWRFdmVudHMpO1xyXG5cclxuICAvLyBcImZhbHNlXCItZmlsbGVkIGFycmF5XHJcbiAgdmFyIHByb2Nlc3NlZCA9IHt9O1xyXG4gIHZhciByZXN1bHQgPSBbXTtcclxuICB2YXIgZXZlbnQ7XHJcblxyXG4gIGZvciAoaSA9IDAsIGxlbiA9IHJlc3VsdEV2ZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgaWYgKHByb2Nlc3NlZFtpXSkgY29udGludWU7XHJcbiAgICB2YXIgY29udG91ciA9IFtbXV07XHJcblxyXG4gICAgaWYgKCFyZXN1bHRFdmVudHNbaV0uaXNFeHRlcmlvclJpbmcpIHtcclxuICAgICAgaWYgKHJlc3VsdC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXN1bHQucHVzaChbW2NvbnRvdXJdXSk7XHJcbiAgICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uID09PSBvcGVyYXRpb25UeXBlLlVOSU9OIHx8IG9wZXJhdGlvbiA9PT0gb3BlcmF0aW9uVHlwZS5YT1IpIHtcclxuICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdLnB1c2goY29udG91clswXSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXS5wdXNoKGNvbnRvdXIpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXN1bHQucHVzaChjb250b3VyKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcmluZ0lkID0gcmVzdWx0Lmxlbmd0aCAtIDE7XHJcbiAgICB2YXIgcG9zID0gaTtcclxuXHJcbiAgICB2YXIgaW5pdGlhbCA9IHJlc3VsdEV2ZW50c1tpXS5wb2ludDtcclxuICAgIC8vIGluaXRpYWwucHVzaChyZXN1bHRFdmVudHNbaV0uaXNFeHRlcmlvclJpbmcpO1xyXG4gICAgY29udG91clswXS5wdXNoKGluaXRpYWwpO1xyXG5cclxuICAgIHdoaWxlIChwb3MgPj0gaSkge1xyXG4gICAgICBldmVudCA9IHJlc3VsdEV2ZW50c1twb3NdO1xyXG4gICAgICBwcm9jZXNzZWRbcG9zXSA9IHRydWU7XHJcblxyXG4gICAgICBpZiAoZXZlbnQubGVmdCkge1xyXG4gICAgICAgIGV2ZW50LnJlc3VsdEluT3V0ID0gZmFsc2U7XHJcbiAgICAgICAgZXZlbnQuY29udG91cklkICAgPSByaW5nSWQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZXZlbnQub3RoZXJFdmVudC5yZXN1bHRJbk91dCA9IHRydWU7XHJcbiAgICAgICAgZXZlbnQub3RoZXJFdmVudC5jb250b3VySWQgICA9IHJpbmdJZDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcG9zID0gZXZlbnQucG9zO1xyXG4gICAgICBwcm9jZXNzZWRbcG9zXSA9IHRydWU7XHJcbiAgICAgIC8vIHJlc3VsdEV2ZW50c1twb3NdLnBvaW50LnB1c2gocmVzdWx0RXZlbnRzW3Bvc10uaXNFeHRlcmlvclJpbmcpO1xyXG5cclxuICAgICAgY29udG91clswXS5wdXNoKHJlc3VsdEV2ZW50c1twb3NdLnBvaW50KTtcclxuICAgICAgcG9zID0gbmV4dFBvcyhwb3MsIHJlc3VsdEV2ZW50cywgcHJvY2Vzc2VkLCBpKTtcclxuICAgIH1cclxuXHJcbiAgICBwb3MgPSBwb3MgPT09IC0xID8gaSA6IHBvcztcclxuXHJcbiAgICBldmVudCA9IHJlc3VsdEV2ZW50c1twb3NdO1xyXG4gICAgcHJvY2Vzc2VkW3Bvc10gPSBwcm9jZXNzZWRbZXZlbnQucG9zXSA9IHRydWU7XHJcbiAgICBldmVudC5vdGhlckV2ZW50LnJlc3VsdEluT3V0ID0gdHJ1ZTtcclxuICAgIGV2ZW50Lm90aGVyRXZlbnQuY29udG91cklkICAgPSByaW5nSWQ7XHJcbiAgfVxyXG5cclxuICBmb3IgKGkgPSAwLCBsZW4gPSByZXN1bHQubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgIHZhciBwb2x5Z29uID0gcmVzdWx0W2ldO1xyXG4gICAgZm9yICh2YXIgaiA9IDAsIGpqID0gcG9seWdvbi5sZW5ndGg7IGogPCBqajsgaisrKSB7XHJcbiAgICAgIHZhciBwb2x5Z29uQ29udG91ciA9IHBvbHlnb25bal07XHJcbiAgICAgIGZvciAodmFyIGsgPSAwLCBrayA9IHBvbHlnb25Db250b3VyLmxlbmd0aDsgayA8IGtrOyBrKyspIHtcclxuICAgICAgICB2YXIgY29vcmRzID0gcG9seWdvbkNvbnRvdXJba107XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb29yZHNbMF0gIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICBwb2x5Z29uLnB1c2goY29vcmRzWzBdKTtcclxuICAgICAgICAgIHBvbHlnb24uc3BsaWNlKGosIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gSGFuZGxlIGlmIHRoZSByZXN1bHQgaXMgYSBwb2x5Z29uIChlZyBub3QgbXVsdGlwb2x5KVxyXG4gIC8vIENvbW1lbnRlZCBpdCBhZ2FpbiwgbGV0J3Mgc2VlIHdoYXQgZG8gd2UgbWVhbiBieSB0aGF0XHJcbiAgLy8gaWYgKHJlc3VsdC5sZW5ndGggPT09IDEpIHJlc3VsdCA9IHJlc3VsdFswXTtcclxuICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgU3dlZXBFdmVudCAgICA9IHJlcXVpcmUoJy4vc3dlZXBfZXZlbnQnKTtcclxudmFyIGVxdWFscyAgICAgICAgPSByZXF1aXJlKCcuL2VxdWFscycpO1xyXG52YXIgY29tcGFyZUV2ZW50cyA9IHJlcXVpcmUoJy4vY29tcGFyZV9ldmVudHMnKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gIHtTd2VlcEV2ZW50fSBzZVxyXG4gKiBAcGFyYW0gIHtBcnJheS48TnVtYmVyPn0gcFxyXG4gKiBAcGFyYW0gIHtRdWV1ZX0gcXVldWVcclxuICogQHJldHVybiB7UXVldWV9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRpdmlkZVNlZ21lbnQoc2UsIHAsIHF1ZXVlKSAge1xyXG4gIHZhciByID0gbmV3IFN3ZWVwRXZlbnQocCwgZmFsc2UsIHNlLCAgICAgICAgICAgIHNlLmlzU3ViamVjdCk7XHJcbiAgdmFyIGwgPSBuZXcgU3dlZXBFdmVudChwLCB0cnVlLCAgc2Uub3RoZXJFdmVudCwgc2UuaXNTdWJqZWN0KTtcclxuXHJcbiAgaWYgKGVxdWFscyhzZS5wb2ludCwgc2Uub3RoZXJFdmVudC5wb2ludCkpIHtcclxuICAgIGNvbnNvbGUud2Fybignd2hhdCBpcyB0aGF0PycsIHNlKTtcclxuICB9XHJcblxyXG4gIHIuY29udG91cklkID0gbC5jb250b3VySWQgPSBzZS5jb250b3VySWQ7XHJcblxyXG4gIC8vIGF2b2lkIGEgcm91bmRpbmcgZXJyb3IuIFRoZSBsZWZ0IGV2ZW50IHdvdWxkIGJlIHByb2Nlc3NlZCBhZnRlciB0aGUgcmlnaHQgZXZlbnRcclxuICBpZiAoY29tcGFyZUV2ZW50cyhsLCBzZS5vdGhlckV2ZW50KSA+IDApIHtcclxuICAgIHNlLm90aGVyRXZlbnQubGVmdCA9IHRydWU7XHJcbiAgICBsLmxlZnQgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8vIGF2b2lkIGEgcm91bmRpbmcgZXJyb3IuIFRoZSBsZWZ0IGV2ZW50IHdvdWxkIGJlIHByb2Nlc3NlZCBhZnRlciB0aGUgcmlnaHQgZXZlbnRcclxuICAvLyBpZiAoY29tcGFyZUV2ZW50cyhzZSwgcikgPiAwKSB7fVxyXG5cclxuICBzZS5vdGhlckV2ZW50Lm90aGVyRXZlbnQgPSBsO1xyXG4gIHNlLm90aGVyRXZlbnQgPSByO1xyXG5cclxuICBxdWV1ZS5wdXNoKGwpO1xyXG4gIHF1ZXVlLnB1c2gocik7XHJcblxyXG4gIHJldHVybiBxdWV1ZTtcclxufTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgTk9STUFMOiAgICAgICAgICAgICAgIDAsXHJcbiAgTk9OX0NPTlRSSUJVVElORzogICAgIDEsXHJcbiAgU0FNRV9UUkFOU0lUSU9OOiAgICAgIDIsXHJcbiAgRElGRkVSRU5UX1RSQU5TSVRJT046IDNcclxufTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gdmFyIEVQU0lMT04gPSAxZS05O1xyXG4vLyB2YXIgYWJzID0gTWF0aC5hYnM7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGVxdWFscyhwMSwgcDIpIHtcclxuICBpZiAocDFbMF0gPT09IHAyWzBdKSB7XHJcbiAgICBpZiAocDFbMV0gPT09IHAyWzFdKSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG4vLyBUT0RPIGh0dHBzOi8vZ2l0aHViLmNvbS93OHIvbWFydGluZXovaXNzdWVzLzYjaXNzdWVjb21tZW50LTI2Mjg0NzE2NFxyXG4vLyBQcmVjaXNpb24gcHJvYmxlbS5cclxuLy9cclxuLy8gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBlcXVhbHMocDEsIHAyKSB7XHJcbi8vICAgcmV0dXJuIGFicyhwMVswXSAtIHAyWzBdKSA8PSBFUFNJTE9OICYmIGFicyhwMVsxXSAtIHAyWzFdKSA8PSBFUFNJTE9OO1xyXG4vLyB9O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUXVldWUgICAgICAgICAgID0gcmVxdWlyZSgndGlueXF1ZXVlJyk7XHJcbnZhciBTd2VlcEV2ZW50ICAgICAgPSByZXF1aXJlKCcuL3N3ZWVwX2V2ZW50Jyk7XHJcbnZhciBjb21wYXJlRXZlbnRzICAgPSByZXF1aXJlKCcuL2NvbXBhcmVfZXZlbnRzJyk7XHJcblxyXG52YXIgbWF4ID0gTWF0aC5tYXg7XHJcbnZhciBtaW4gPSBNYXRoLm1pbjtcclxuXHJcbnZhciBjb250b3VySWQgPSAwO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHByb2Nlc3NQb2x5Z29uKGNvbnRvdXJPckhvbGUsIGlzU3ViamVjdCwgZGVwdGgsIFEsIGJib3gsIGlzRXh0ZXJpb3JSaW5nKSB7XHJcbiAgdmFyIGksIGxlbiwgczEsIHMyLCBlMSwgZTI7XHJcbiAgLy8gdmFyIGQgPSBkZXB0aCArIDE7XHJcbiAgZm9yIChpID0gMCwgbGVuID0gY29udG91ck9ySG9sZS5sZW5ndGggLSAxOyBpIDwgbGVuOyBpKyspIHtcclxuICAgIHMxID0gY29udG91ck9ySG9sZVtpXTtcclxuICAgIHMyID0gY29udG91ck9ySG9sZVtpICsgMV07XHJcbiAgICAvL3Byb2Nlc3NTZWdtZW50KGNvbnRvdXJPckhvbGVbaV0sIGNvbnRvdXJPckhvbGVbaSArIDFdLCBpc1N1YmplY3QsIGRlcHRoICsgMSwgUSwgYmJveCwgaXNFeHRlcmlvclJpbmcpO1xyXG4gICAgZTEgPSBuZXcgU3dlZXBFdmVudChzMSwgZmFsc2UsIHVuZGVmaW5lZCwgaXNTdWJqZWN0KTtcclxuICAgIGUyID0gbmV3IFN3ZWVwRXZlbnQoczIsIGZhbHNlLCBlMSwgICAgICAgIGlzU3ViamVjdCk7XHJcbiAgICBlMS5vdGhlckV2ZW50ID0gZTI7XHJcblxyXG4gICAgZTEuY29udG91cklkID0gZTIuY29udG91cklkID0gZGVwdGg7XHJcbiAgICBpZiAoIWlzRXh0ZXJpb3JSaW5nKSB7XHJcbiAgICAgIGUxLmlzRXh0ZXJpb3JSaW5nID0gZmFsc2U7XHJcbiAgICAgIGUyLmlzRXh0ZXJpb3JSaW5nID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBpZiAoY29tcGFyZUV2ZW50cyhlMSwgZTIpID4gMCkge1xyXG4gICAgICBlMi5sZWZ0ID0gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGUxLmxlZnQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB4ID0gczFbMF0sIHkgPSBzMVsxXTtcclxuICAgIGJib3hbMF0gPSBtaW4oYmJveFswXSwgeCk7XHJcbiAgICBiYm94WzFdID0gbWluKGJib3hbMV0sIHkpO1xyXG4gICAgYmJveFsyXSA9IG1heChiYm94WzJdLCB4KTtcclxuICAgIGJib3hbM10gPSBtYXgoYmJveFszXSwgeSk7XHJcblxyXG4gICAgLy8gUHVzaGluZyBpdCBzbyB0aGUgcXVldWUgaXMgc29ydGVkIGZyb20gbGVmdCB0byByaWdodCxcclxuICAgIC8vIHdpdGggb2JqZWN0IG9uIHRoZSBsZWZ0IGhhdmluZyB0aGUgaGlnaGVzdCBwcmlvcml0eS5cclxuICAgIFEucHVzaChlMSk7XHJcbiAgICBRLnB1c2goZTIpO1xyXG4gIH1cclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZmlsbFF1ZXVlKHN1YmplY3QsIGNsaXBwaW5nLCBzYmJveCwgY2Jib3gpIHtcclxuICB2YXIgZXZlbnRRdWV1ZSA9IG5ldyBRdWV1ZShudWxsLCBjb21wYXJlRXZlbnRzKTtcclxuICB2YXIgcG9seWdvblNldCwgaXNFeHRlcmlvclJpbmcsIGksIGlpLCBqLCBqajsgLy8sIGssIGtrO1xyXG5cclxuICBmb3IgKGkgPSAwLCBpaSA9IHN1YmplY3QubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xyXG4gICAgcG9seWdvblNldCA9IHN1YmplY3RbaV07XHJcbiAgICBmb3IgKGogPSAwLCBqaiA9IHBvbHlnb25TZXQubGVuZ3RoOyBqIDwgamo7IGorKykge1xyXG4gICAgICBpc0V4dGVyaW9yUmluZyA9IGogPT09IDA7XHJcbiAgICAgIGlmIChpc0V4dGVyaW9yUmluZykgY29udG91cklkKys7XHJcbiAgICAgIHByb2Nlc3NQb2x5Z29uKHBvbHlnb25TZXRbal0sIHRydWUsIGNvbnRvdXJJZCwgZXZlbnRRdWV1ZSwgc2Jib3gsIGlzRXh0ZXJpb3JSaW5nKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZvciAoaSA9IDAsIGlpID0gY2xpcHBpbmcubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xyXG4gICAgcG9seWdvblNldCA9IGNsaXBwaW5nW2ldO1xyXG4gICAgZm9yIChqID0gMCwgamogPSBwb2x5Z29uU2V0Lmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcclxuICAgICAgaXNFeHRlcmlvclJpbmcgPSBqID09PSAwO1xyXG4gICAgICBpZiAoaXNFeHRlcmlvclJpbmcpIGNvbnRvdXJJZCsrO1xyXG4gICAgICBwcm9jZXNzUG9seWdvbihwb2x5Z29uU2V0W2pdLCBmYWxzZSwgY29udG91cklkLCBldmVudFF1ZXVlLCBjYmJveCwgaXNFeHRlcmlvclJpbmcpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGV2ZW50UXVldWU7XHJcbn07XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBzdWJkaXZpZGVTZWdtZW50cyA9IHJlcXVpcmUoJy4vc3ViZGl2aWRlX3NlZ21lbnRzJyk7XHJcbnZhciBjb25uZWN0RWRnZXMgICAgICA9IHJlcXVpcmUoJy4vY29ubmVjdF9lZGdlcycpO1xyXG52YXIgZmlsbFF1ZXVlICAgICAgICAgPSByZXF1aXJlKCcuL2ZpbGxfcXVldWUnKTtcclxudmFyIG9wZXJhdGlvbnMgICAgICAgID0gcmVxdWlyZSgnLi9vcGVyYXRpb24nKTtcclxuXHJcbnZhciBFTVBUWSA9IFtdO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHRyaXZpYWxPcGVyYXRpb24oc3ViamVjdCwgY2xpcHBpbmcsIG9wZXJhdGlvbikge1xyXG4gIHZhciByZXN1bHQgPSBudWxsO1xyXG4gIGlmIChzdWJqZWN0Lmxlbmd0aCAqIGNsaXBwaW5nLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgaWYgICAgICAgIChvcGVyYXRpb24gPT09IG9wZXJhdGlvbnMuSU5URVJTRUNUSU9OKSB7XHJcbiAgICAgIHJlc3VsdCA9IEVNUFRZO1xyXG4gICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09IG9wZXJhdGlvbnMuRElGRkVSRU5DRSkge1xyXG4gICAgICByZXN1bHQgPSBzdWJqZWN0O1xyXG4gICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09IG9wZXJhdGlvbnMuVU5JT04gfHxcclxuICAgICAgICAgICAgICAgb3BlcmF0aW9uID09PSBvcGVyYXRpb25zLlhPUikge1xyXG4gICAgICByZXN1bHQgPSAoc3ViamVjdC5sZW5ndGggPT09IDApID8gY2xpcHBpbmcgOiBzdWJqZWN0O1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gY29tcGFyZUJCb3hlcyhzdWJqZWN0LCBjbGlwcGluZywgc2Jib3gsIGNiYm94LCBvcGVyYXRpb24pIHtcclxuICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuICBpZiAoc2Jib3hbMF0gPiBjYmJveFsyXSB8fFxyXG4gICAgICBjYmJveFswXSA+IHNiYm94WzJdIHx8XHJcbiAgICAgIHNiYm94WzFdID4gY2Jib3hbM10gfHxcclxuICAgICAgY2Jib3hbMV0gPiBzYmJveFszXSkge1xyXG4gICAgaWYgICAgICAgIChvcGVyYXRpb24gPT09IG9wZXJhdGlvbnMuSU5URVJTRUNUSU9OKSB7XHJcbiAgICAgIHJlc3VsdCA9IEVNUFRZO1xyXG4gICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09IG9wZXJhdGlvbnMuRElGRkVSRU5DRSkge1xyXG4gICAgICByZXN1bHQgPSBzdWJqZWN0O1xyXG4gICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09IG9wZXJhdGlvbnMuVU5JT04gfHxcclxuICAgICAgICAgICAgICAgb3BlcmF0aW9uID09PSBvcGVyYXRpb25zLlhPUikge1xyXG4gICAgICByZXN1bHQgPSBzdWJqZWN0LmNvbmNhdChjbGlwcGluZyk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBib29sZWFuKHN1YmplY3QsIGNsaXBwaW5nLCBvcGVyYXRpb24pIHtcclxuICBpZiAodHlwZW9mIHN1YmplY3RbMF1bMF1bMF0gPT09ICdudW1iZXInKSB7XHJcbiAgICBzdWJqZWN0ID0gW3N1YmplY3RdO1xyXG4gIH1cclxuICBpZiAodHlwZW9mIGNsaXBwaW5nWzBdWzBdWzBdID09PSAnbnVtYmVyJykge1xyXG4gICAgY2xpcHBpbmcgPSBbY2xpcHBpbmddO1xyXG4gIH1cclxuICB2YXIgdHJpdmlhbCA9IHRyaXZpYWxPcGVyYXRpb24oc3ViamVjdCwgY2xpcHBpbmcsIG9wZXJhdGlvbik7XHJcbiAgaWYgKHRyaXZpYWwpIHtcclxuICAgIHJldHVybiB0cml2aWFsID09PSBFTVBUWSA/IG51bGwgOiB0cml2aWFsO1xyXG4gIH1cclxuICB2YXIgc2Jib3ggPSBbSW5maW5pdHksIEluZmluaXR5LCAtSW5maW5pdHksIC1JbmZpbml0eV07XHJcbiAgdmFyIGNiYm94ID0gW0luZmluaXR5LCBJbmZpbml0eSwgLUluZmluaXR5LCAtSW5maW5pdHldO1xyXG5cclxuICAvL2NvbnNvbGUudGltZSgnZmlsbCcpO1xyXG4gIHZhciBldmVudFF1ZXVlID0gZmlsbFF1ZXVlKHN1YmplY3QsIGNsaXBwaW5nLCBzYmJveCwgY2Jib3gpO1xyXG4gIC8vY29uc29sZS50aW1lRW5kKCdmaWxsJyk7XHJcblxyXG4gIHRyaXZpYWwgPSBjb21wYXJlQkJveGVzKHN1YmplY3QsIGNsaXBwaW5nLCBzYmJveCwgY2Jib3gsIG9wZXJhdGlvbik7XHJcbiAgaWYgKHRyaXZpYWwpIHtcclxuICAgIHJldHVybiB0cml2aWFsID09PSBFTVBUWSA/IG51bGwgOiB0cml2aWFsO1xyXG4gIH1cclxuICAvL2NvbnNvbGUudGltZSgnc3ViZGl2Jyk7XHJcbiAgdmFyIHNvcnRlZEV2ZW50cyA9IHN1YmRpdmlkZVNlZ21lbnRzKGV2ZW50UXVldWUsIHN1YmplY3QsIGNsaXBwaW5nLCBzYmJveCwgY2Jib3gsIG9wZXJhdGlvbik7XHJcbiAgLy9jb25zb2xlLnRpbWVFbmQoJ3N1YmRpdicpO1xyXG4gIC8vY29uc29sZS50aW1lKCdjb25uZWN0Jyk7XHJcbiAgdmFyIHJlc3VsdCA9IGNvbm5lY3RFZGdlcyhzb3J0ZWRFdmVudHMsIG9wZXJhdGlvbik7XHJcbiAgLy9jb25zb2xlLnRpbWVFbmQoJ2Nvbm5lY3QnKTtcclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBib29sZWFuO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzLnVuaW9uID0gZnVuY3Rpb24gKHN1YmplY3QsIGNsaXBwaW5nKSB7XHJcbiAgcmV0dXJuIGJvb2xlYW4oc3ViamVjdCwgY2xpcHBpbmcsIG9wZXJhdGlvbnMuVU5JT04pO1xyXG59O1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzLmRpZmYgPSBmdW5jdGlvbiAoc3ViamVjdCwgY2xpcHBpbmcpIHtcclxuICByZXR1cm4gYm9vbGVhbihzdWJqZWN0LCBjbGlwcGluZywgb3BlcmF0aW9ucy5ESUZGRVJFTkNFKTtcclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cy54b3IgPSBmdW5jdGlvbiAoc3ViamVjdCwgY2xpcHBpbmcpIHtcclxuICByZXR1cm4gYm9vbGVhbihzdWJqZWN0LCBjbGlwcGluZywgb3BlcmF0aW9ucy5YT1IpO1xyXG59O1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uIChzdWJqZWN0LCBjbGlwcGluZykge1xyXG4gIHJldHVybiBib29sZWFuKHN1YmplY3QsIGNsaXBwaW5nLCBvcGVyYXRpb25zLklOVEVSU0VDVElPTik7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIEBlbnVtIHtOdW1iZXJ9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cy5vcGVyYXRpb25zID0gb3BlcmF0aW9ucztcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgSU5URVJTRUNUSU9OOiAwLFxyXG4gIFVOSU9OOiAgICAgICAgMSxcclxuICBESUZGRVJFTkNFOiAgIDIsXHJcbiAgWE9SOiAgICAgICAgICAzXHJcbn07XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBkaXZpZGVTZWdtZW50ID0gcmVxdWlyZSgnLi9kaXZpZGVfc2VnbWVudCcpO1xyXG52YXIgaW50ZXJzZWN0aW9uICA9IHJlcXVpcmUoJy4vc2VnbWVudF9pbnRlcnNlY3Rpb24nKTtcclxudmFyIGVxdWFscyAgICAgICAgPSByZXF1aXJlKCcuL2VxdWFscycpO1xyXG52YXIgY29tcGFyZUV2ZW50cyA9IHJlcXVpcmUoJy4vY29tcGFyZV9ldmVudHMnKTtcclxudmFyIGVkZ2VUeXBlICAgICAgPSByZXF1aXJlKCcuL2VkZ2VfdHlwZScpO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSAge1N3ZWVwRXZlbnR9IHNlMVxyXG4gKiBAcGFyYW0gIHtTd2VlcEV2ZW50fSBzZTJcclxuICogQHBhcmFtICB7UXVldWV9ICAgICAgcXVldWVcclxuICogQHJldHVybiB7TnVtYmVyfVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwb3NzaWJsZUludGVyc2VjdGlvbihzZTEsIHNlMiwgcXVldWUpIHtcclxuICAvLyB0aGF0IGRpc2FsbG93cyBzZWxmLWludGVyc2VjdGluZyBwb2x5Z29ucyxcclxuICAvLyBkaWQgY29zdCB1cyBoYWxmIGEgZGF5LCBzbyBJJ2xsIGxlYXZlIGl0XHJcbiAgLy8gb3V0IG9mIHJlc3BlY3RcclxuICAvLyBpZiAoc2UxLmlzU3ViamVjdCA9PT0gc2UyLmlzU3ViamVjdCkgcmV0dXJuO1xyXG4gIHZhciBpbnRlciA9IGludGVyc2VjdGlvbihcclxuICAgIHNlMS5wb2ludCwgc2UxLm90aGVyRXZlbnQucG9pbnQsXHJcbiAgICBzZTIucG9pbnQsIHNlMi5vdGhlckV2ZW50LnBvaW50XHJcbiAgKTtcclxuXHJcbiAgdmFyIG5pbnRlcnNlY3Rpb25zID0gaW50ZXIgPyBpbnRlci5sZW5ndGggOiAwO1xyXG4gIGlmIChuaW50ZXJzZWN0aW9ucyA9PT0gMCkgcmV0dXJuIDA7IC8vIG5vIGludGVyc2VjdGlvblxyXG5cclxuICAvLyB0aGUgbGluZSBzZWdtZW50cyBpbnRlcnNlY3QgYXQgYW4gZW5kcG9pbnQgb2YgYm90aCBsaW5lIHNlZ21lbnRzXHJcbiAgaWYgKChuaW50ZXJzZWN0aW9ucyA9PT0gMSkgJiZcclxuICAgICAgKGVxdWFscyhzZTEucG9pbnQsIHNlMi5wb2ludCkgfHxcclxuICAgICAgIGVxdWFscyhzZTEub3RoZXJFdmVudC5wb2ludCwgc2UyLm90aGVyRXZlbnQucG9pbnQpKSkge1xyXG4gICAgcmV0dXJuIDA7XHJcbiAgfVxyXG5cclxuICBpZiAobmludGVyc2VjdGlvbnMgPT09IDIgJiYgc2UxLmlzU3ViamVjdCA9PT0gc2UyLmlzU3ViamVjdCkge1xyXG4gICAgLy8gaWYoc2UxLmNvbnRvdXJJZCA9PT0gc2UyLmNvbnRvdXJJZCl7XHJcbiAgICAvLyBjb25zb2xlLndhcm4oJ0VkZ2VzIG9mIHRoZSBzYW1lIHBvbHlnb24gb3ZlcmxhcCcsXHJcbiAgICAvLyAgIHNlMS5wb2ludCwgc2UxLm90aGVyRXZlbnQucG9pbnQsIHNlMi5wb2ludCwgc2UyLm90aGVyRXZlbnQucG9pbnQpO1xyXG4gICAgLy8gfVxyXG4gICAgLy90aHJvdyBuZXcgRXJyb3IoJ0VkZ2VzIG9mIHRoZSBzYW1lIHBvbHlnb24gb3ZlcmxhcCcpO1xyXG4gICAgcmV0dXJuIDA7XHJcbiAgfVxyXG5cclxuICAvLyBUaGUgbGluZSBzZWdtZW50cyBhc3NvY2lhdGVkIHRvIHNlMSBhbmQgc2UyIGludGVyc2VjdFxyXG4gIGlmIChuaW50ZXJzZWN0aW9ucyA9PT0gMSkge1xyXG5cclxuICAgIC8vIGlmIHRoZSBpbnRlcnNlY3Rpb24gcG9pbnQgaXMgbm90IGFuIGVuZHBvaW50IG9mIHNlMVxyXG4gICAgaWYgKCFlcXVhbHMoc2UxLnBvaW50LCBpbnRlclswXSkgJiYgIWVxdWFscyhzZTEub3RoZXJFdmVudC5wb2ludCwgaW50ZXJbMF0pKSB7XHJcbiAgICAgIGRpdmlkZVNlZ21lbnQoc2UxLCBpbnRlclswXSwgcXVldWUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIHRoZSBpbnRlcnNlY3Rpb24gcG9pbnQgaXMgbm90IGFuIGVuZHBvaW50IG9mIHNlMlxyXG4gICAgaWYgKCFlcXVhbHMoc2UyLnBvaW50LCBpbnRlclswXSkgJiYgIWVxdWFscyhzZTIub3RoZXJFdmVudC5wb2ludCwgaW50ZXJbMF0pKSB7XHJcbiAgICAgIGRpdmlkZVNlZ21lbnQoc2UyLCBpbnRlclswXSwgcXVldWUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDE7XHJcbiAgfVxyXG5cclxuICAvLyBUaGUgbGluZSBzZWdtZW50cyBhc3NvY2lhdGVkIHRvIHNlMSBhbmQgc2UyIG92ZXJsYXBcclxuICB2YXIgZXZlbnRzICAgICAgICA9IFtdO1xyXG4gIHZhciBsZWZ0Q29pbmNpZGUgID0gZmFsc2U7XHJcbiAgdmFyIHJpZ2h0Q29pbmNpZGUgPSBmYWxzZTtcclxuXHJcbiAgaWYgKGVxdWFscyhzZTEucG9pbnQsIHNlMi5wb2ludCkpIHtcclxuICAgIGxlZnRDb2luY2lkZSA9IHRydWU7IC8vIGxpbmtlZFxyXG4gIH0gZWxzZSBpZiAoY29tcGFyZUV2ZW50cyhzZTEsIHNlMikgPT09IDEpIHtcclxuICAgIGV2ZW50cy5wdXNoKHNlMiwgc2UxKTtcclxuICB9IGVsc2Uge1xyXG4gICAgZXZlbnRzLnB1c2goc2UxLCBzZTIpO1xyXG4gIH1cclxuXHJcbiAgaWYgKGVxdWFscyhzZTEub3RoZXJFdmVudC5wb2ludCwgc2UyLm90aGVyRXZlbnQucG9pbnQpKSB7XHJcbiAgICByaWdodENvaW5jaWRlID0gdHJ1ZTtcclxuICB9IGVsc2UgaWYgKGNvbXBhcmVFdmVudHMoc2UxLm90aGVyRXZlbnQsIHNlMi5vdGhlckV2ZW50KSA9PT0gMSkge1xyXG4gICAgZXZlbnRzLnB1c2goc2UyLm90aGVyRXZlbnQsIHNlMS5vdGhlckV2ZW50KTtcclxuICB9IGVsc2Uge1xyXG4gICAgZXZlbnRzLnB1c2goc2UxLm90aGVyRXZlbnQsIHNlMi5vdGhlckV2ZW50KTtcclxuICB9XHJcblxyXG4gIGlmICgobGVmdENvaW5jaWRlICYmIHJpZ2h0Q29pbmNpZGUpIHx8IGxlZnRDb2luY2lkZSkge1xyXG4gICAgLy8gYm90aCBsaW5lIHNlZ21lbnRzIGFyZSBlcXVhbCBvciBzaGFyZSB0aGUgbGVmdCBlbmRwb2ludFxyXG4gICAgc2UxLnR5cGUgPSBlZGdlVHlwZS5OT05fQ09OVFJJQlVUSU5HO1xyXG4gICAgc2UyLnR5cGUgPSAoc2UxLmluT3V0ID09PSBzZTIuaW5PdXQpID9cclxuICAgICAgZWRnZVR5cGUuU0FNRV9UUkFOU0lUSU9OIDpcclxuICAgICAgZWRnZVR5cGUuRElGRkVSRU5UX1RSQU5TSVRJT047XHJcblxyXG4gICAgaWYgKGxlZnRDb2luY2lkZSAmJiAhcmlnaHRDb2luY2lkZSkge1xyXG4gICAgICAvLyBob25lc3RseSBubyBpZGVhLCBidXQgY2hhbmdpbmcgZXZlbnRzIHNlbGVjdGlvbiBmcm9tIFsyLCAxXVxyXG4gICAgICAvLyB0byBbMCwgMV0gZml4ZXMgdGhlIG92ZXJsYXBwaW5nIHNlbGYtaW50ZXJzZWN0aW5nIHBvbHlnb25zIGlzc3VlXHJcbiAgICAgIGRpdmlkZVNlZ21lbnQoZXZlbnRzWzFdLm90aGVyRXZlbnQsIGV2ZW50c1swXS5wb2ludCwgcXVldWUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDI7XHJcbiAgfVxyXG5cclxuICAvLyB0aGUgbGluZSBzZWdtZW50cyBzaGFyZSB0aGUgcmlnaHQgZW5kcG9pbnRcclxuICBpZiAocmlnaHRDb2luY2lkZSkge1xyXG4gICAgZGl2aWRlU2VnbWVudChldmVudHNbMF0sIGV2ZW50c1sxXS5wb2ludCwgcXVldWUpO1xyXG4gICAgcmV0dXJuIDM7XHJcbiAgfVxyXG5cclxuICAvLyBubyBsaW5lIHNlZ21lbnQgaW5jbHVkZXMgdG90YWxseSB0aGUgb3RoZXIgb25lXHJcbiAgaWYgKGV2ZW50c1swXSAhPT0gZXZlbnRzWzNdLm90aGVyRXZlbnQpIHtcclxuICAgIGRpdmlkZVNlZ21lbnQoZXZlbnRzWzBdLCBldmVudHNbMV0ucG9pbnQsIHF1ZXVlKTtcclxuICAgIGRpdmlkZVNlZ21lbnQoZXZlbnRzWzFdLCBldmVudHNbMl0ucG9pbnQsIHF1ZXVlKTtcclxuICAgIHJldHVybiAzO1xyXG4gIH1cclxuXHJcbiAgLy8gb25lIGxpbmUgc2VnbWVudCBpbmNsdWRlcyB0aGUgb3RoZXIgb25lXHJcbiAgZGl2aWRlU2VnbWVudChldmVudHNbMF0sIGV2ZW50c1sxXS5wb2ludCwgcXVldWUpO1xyXG4gIGRpdmlkZVNlZ21lbnQoZXZlbnRzWzNdLm90aGVyRXZlbnQsIGV2ZW50c1syXS5wb2ludCwgcXVldWUpO1xyXG5cclxuICByZXR1cm4gMztcclxufTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEVQU0lMT04gPSAxZS05O1xyXG5cclxuLyoqXHJcbiAqIEZpbmRzIHRoZSBtYWduaXR1ZGUgb2YgdGhlIGNyb3NzIHByb2R1Y3Qgb2YgdHdvIHZlY3RvcnMgKGlmIHdlIHByZXRlbmRcclxuICogdGhleSdyZSBpbiB0aHJlZSBkaW1lbnNpb25zKVxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gYSBGaXJzdCB2ZWN0b3JcclxuICogQHBhcmFtIHtPYmplY3R9IGIgU2Vjb25kIHZlY3RvclxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgbWFnbml0dWRlIG9mIHRoZSBjcm9zcyBwcm9kdWN0XHJcbiAqL1xyXG5mdW5jdGlvbiBjcm9zc1Byb2R1Y3QoYSwgYikge1xyXG4gIHJldHVybiBhWzBdICogYlsxXSAtIGFbMV0gKiBiWzBdO1xyXG59XHJcblxyXG4vKipcclxuICogRmluZHMgdGhlIGRvdCBwcm9kdWN0IG9mIHR3byB2ZWN0b3JzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gYSBGaXJzdCB2ZWN0b3JcclxuICogQHBhcmFtIHtPYmplY3R9IGIgU2Vjb25kIHZlY3RvclxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgZG90IHByb2R1Y3RcclxuICovXHJcbmZ1bmN0aW9uIGRvdFByb2R1Y3QoYSwgYikge1xyXG4gIHJldHVybiBhWzBdICogYlswXSArIGFbMV0gKiBiWzFdO1xyXG59XHJcblxyXG4vKipcclxuICogRmluZHMgdGhlIGludGVyc2VjdGlvbiAoaWYgYW55KSBiZXR3ZWVuIHR3byBsaW5lIHNlZ21lbnRzIGEgYW5kIGIsIGdpdmVuIHRoZVxyXG4gKiBsaW5lIHNlZ21lbnRzJyBlbmQgcG9pbnRzIGExLCBhMiBhbmQgYjEsIGIyLlxyXG4gKlxyXG4gKiBUaGlzIGFsZ29yaXRobSBpcyBiYXNlZCBvbiBTY2huZWlkZXIgYW5kIEViZXJseS5cclxuICogaHR0cDovL3d3dy5jaW1lYy5vcmcuYXIvfm5jYWx2by9TY2huZWlkZXJfRWJlcmx5LnBkZlxyXG4gKiBQYWdlIDI0NC5cclxuICpcclxuICogQHBhcmFtIHtBcnJheS48TnVtYmVyPn0gYTEgcG9pbnQgb2YgZmlyc3QgbGluZVxyXG4gKiBAcGFyYW0ge0FycmF5LjxOdW1iZXI+fSBhMiBwb2ludCBvZiBmaXJzdCBsaW5lXHJcbiAqIEBwYXJhbSB7QXJyYXkuPE51bWJlcj59IGIxIHBvaW50IG9mIHNlY29uZCBsaW5lXHJcbiAqIEBwYXJhbSB7QXJyYXkuPE51bWJlcj59IGIyIHBvaW50IG9mIHNlY29uZCBsaW5lXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbj19ICAgICAgIG5vRW5kcG9pbnRUb3VjaCB3aGV0aGVyIHRvIHNraXAgc2luZ2xlIHRvdWNocG9pbnRzXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobWVhbmluZyBjb25uZWN0ZWQgc2VnbWVudHMpIGFzXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnNlY3Rpb25zXHJcbiAqIEByZXR1cm5zIHtBcnJheS48QXJyYXkuPE51bWJlcj4+fE51bGx9IElmIHRoZSBsaW5lcyBpbnRlcnNlY3QsIHRoZSBwb2ludCBvZlxyXG4gKiBpbnRlcnNlY3Rpb24uIElmIHRoZXkgb3ZlcmxhcCwgdGhlIHR3byBlbmQgcG9pbnRzIG9mIHRoZSBvdmVybGFwcGluZyBzZWdtZW50LlxyXG4gKiBPdGhlcndpc2UsIG51bGwuXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhMSwgYTIsIGIxLCBiMiwgbm9FbmRwb2ludFRvdWNoKSB7XHJcbiAgLy8gVGhlIGFsZ29yaXRobSBleHBlY3RzIG91ciBsaW5lcyBpbiB0aGUgZm9ybSBQICsgc2QsIHdoZXJlIFAgaXMgYSBwb2ludCxcclxuICAvLyBzIGlzIG9uIHRoZSBpbnRlcnZhbCBbMCwgMV0sIGFuZCBkIGlzIGEgdmVjdG9yLlxyXG4gIC8vIFdlIGFyZSBwYXNzZWQgdHdvIHBvaW50cy4gUCBjYW4gYmUgdGhlIGZpcnN0IHBvaW50IG9mIGVhY2ggcGFpci4gVGhlXHJcbiAgLy8gdmVjdG9yLCB0aGVuLCBjb3VsZCBiZSB0aG91Z2h0IG9mIGFzIHRoZSBkaXN0YW5jZSAoaW4geCBhbmQgeSBjb21wb25lbnRzKVxyXG4gIC8vIGZyb20gdGhlIGZpcnN0IHBvaW50IHRvIHRoZSBzZWNvbmQgcG9pbnQuXHJcbiAgLy8gU28gZmlyc3QsIGxldCdzIG1ha2Ugb3VyIHZlY3RvcnM6XHJcbiAgdmFyIHZhID0gW2EyWzBdIC0gYTFbMF0sIGEyWzFdIC0gYTFbMV1dO1xyXG4gIHZhciB2YiA9IFtiMlswXSAtIGIxWzBdLCBiMlsxXSAtIGIxWzFdXTtcclxuICAvLyBXZSBhbHNvIGRlZmluZSBhIGZ1bmN0aW9uIHRvIGNvbnZlcnQgYmFjayB0byByZWd1bGFyIHBvaW50IGZvcm06XHJcblxyXG4gIC8qIGVzbGludC1kaXNhYmxlIGFycm93LWJvZHktc3R5bGUgKi9cclxuXHJcbiAgZnVuY3Rpb24gdG9Qb2ludChwLCBzLCBkKSB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICBwWzBdICsgcyAqIGRbMF0sXHJcbiAgICAgIHBbMV0gKyBzICogZFsxXVxyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIC8qIGVzbGludC1lbmFibGUgYXJyb3ctYm9keS1zdHlsZSAqL1xyXG5cclxuICAvLyBUaGUgcmVzdCBpcyBwcmV0dHkgbXVjaCBhIHN0cmFpZ2h0IHBvcnQgb2YgdGhlIGFsZ29yaXRobS5cclxuICB2YXIgZSA9IFtiMVswXSAtIGExWzBdLCBiMVsxXSAtIGExWzFdXTtcclxuICB2YXIga3Jvc3MgICAgPSBjcm9zc1Byb2R1Y3QodmEsIHZiKTtcclxuICB2YXIgc3FyS3Jvc3MgPSBrcm9zcyAqIGtyb3NzO1xyXG4gIHZhciBzcXJMZW5BICA9IGRvdFByb2R1Y3QodmEsIHZhKTtcclxuICB2YXIgc3FyTGVuQiAgPSBkb3RQcm9kdWN0KHZiLCB2Yik7XHJcblxyXG4gIC8vIENoZWNrIGZvciBsaW5lIGludGVyc2VjdGlvbi4gVGhpcyB3b3JrcyBiZWNhdXNlIG9mIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZVxyXG4gIC8vIGNyb3NzIHByb2R1Y3QgLS0gc3BlY2lmaWNhbGx5LCB0d28gdmVjdG9ycyBhcmUgcGFyYWxsZWwgaWYgYW5kIG9ubHkgaWYgdGhlXHJcbiAgLy8gY3Jvc3MgcHJvZHVjdCBpcyB0aGUgMCB2ZWN0b3IuIFRoZSBmdWxsIGNhbGN1bGF0aW9uIGludm9sdmVzIHJlbGF0aXZlIGVycm9yXHJcbiAgLy8gdG8gYWNjb3VudCBmb3IgcG9zc2libGUgdmVyeSBzbWFsbCBsaW5lIHNlZ21lbnRzLiBTZWUgU2NobmVpZGVyICYgRWJlcmx5XHJcbiAgLy8gZm9yIGRldGFpbHMuXHJcbiAgaWYgKHNxcktyb3NzID4gRVBTSUxPTiAqIHNxckxlbkEgKiBzcXJMZW5CKSB7XHJcbiAgICAvLyBJZiB0aGV5J3JlIG5vdCBwYXJhbGxlbCwgdGhlbiAoYmVjYXVzZSB0aGVzZSBhcmUgbGluZSBzZWdtZW50cykgdGhleVxyXG4gICAgLy8gc3RpbGwgbWlnaHQgbm90IGFjdHVhbGx5IGludGVyc2VjdC4gVGhpcyBjb2RlIGNoZWNrcyB0aGF0IHRoZVxyXG4gICAgLy8gaW50ZXJzZWN0aW9uIHBvaW50IG9mIHRoZSBsaW5lcyBpcyBhY3R1YWxseSBvbiBib3RoIGxpbmUgc2VnbWVudHMuXHJcbiAgICB2YXIgcyA9IGNyb3NzUHJvZHVjdChlLCB2YikgLyBrcm9zcztcclxuICAgIGlmIChzIDwgMCB8fCBzID4gMSkge1xyXG4gICAgICAvLyBub3Qgb24gbGluZSBzZWdtZW50IGFcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICB2YXIgdCA9IGNyb3NzUHJvZHVjdChlLCB2YSkgLyBrcm9zcztcclxuICAgIGlmICh0IDwgMCB8fCB0ID4gMSkge1xyXG4gICAgICAvLyBub3Qgb24gbGluZSBzZWdtZW50IGJcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbm9FbmRwb2ludFRvdWNoID8gbnVsbCA6IFt0b1BvaW50KGExLCBzLCB2YSldO1xyXG4gIH1cclxuXHJcbiAgLy8gSWYgd2UndmUgcmVhY2hlZCB0aGlzIHBvaW50LCB0aGVuIHRoZSBsaW5lcyBhcmUgZWl0aGVyIHBhcmFsbGVsIG9yIHRoZVxyXG4gIC8vIHNhbWUsIGJ1dCB0aGUgc2VnbWVudHMgY291bGQgb3ZlcmxhcCBwYXJ0aWFsbHkgb3IgZnVsbHksIG9yIG5vdCBhdCBhbGwuXHJcbiAgLy8gU28gd2UgbmVlZCB0byBmaW5kIHRoZSBvdmVybGFwLCBpZiBhbnkuIFRvIGRvIHRoYXQsIHdlIGNhbiB1c2UgZSwgd2hpY2ggaXNcclxuICAvLyB0aGUgKHZlY3RvcikgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSB0d28gaW5pdGlhbCBwb2ludHMuIElmIHRoaXMgaXMgcGFyYWxsZWxcclxuICAvLyB3aXRoIHRoZSBsaW5lIGl0c2VsZiwgdGhlbiB0aGUgdHdvIGxpbmVzIGFyZSB0aGUgc2FtZSBsaW5lLCBhbmQgdGhlcmUgd2lsbFxyXG4gIC8vIGJlIG92ZXJsYXAuXHJcbiAgdmFyIHNxckxlbkUgPSBkb3RQcm9kdWN0KGUsIGUpO1xyXG4gIGtyb3NzID0gY3Jvc3NQcm9kdWN0KGUsIHZhKTtcclxuICBzcXJLcm9zcyA9IGtyb3NzICoga3Jvc3M7XHJcblxyXG4gIGlmIChzcXJLcm9zcyA+IEVQU0lMT04gKiBzcXJMZW5BICogc3FyTGVuRSkge1xyXG4gICAgLy8gTGluZXMgYXJlIGp1c3QgcGFyYWxsZWwsIG5vdCB0aGUgc2FtZS4gTm8gb3ZlcmxhcC5cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgdmFyIHNhID0gZG90UHJvZHVjdCh2YSwgZSkgLyBzcXJMZW5BO1xyXG4gIHZhciBzYiA9IHNhICsgZG90UHJvZHVjdCh2YSwgdmIpIC8gc3FyTGVuQTtcclxuICB2YXIgc21pbiA9IE1hdGgubWluKHNhLCBzYik7XHJcbiAgdmFyIHNtYXggPSBNYXRoLm1heChzYSwgc2IpO1xyXG5cclxuICAvLyB0aGlzIGlzLCBlc3NlbnRpYWxseSwgdGhlIEZpbmRJbnRlcnNlY3Rpb24gYWN0aW5nIG9uIGZsb2F0cyBmcm9tXHJcbiAgLy8gU2NobmVpZGVyICYgRWJlcmx5LCBqdXN0IGlubGluZWQgaW50byB0aGlzIGZ1bmN0aW9uLlxyXG4gIGlmIChzbWluIDw9IDEgJiYgc21heCA+PSAwKSB7XHJcblxyXG4gICAgLy8gb3ZlcmxhcCBvbiBhbiBlbmQgcG9pbnRcclxuICAgIGlmIChzbWluID09PSAxKSB7XHJcbiAgICAgIHJldHVybiBub0VuZHBvaW50VG91Y2ggPyBudWxsIDogW3RvUG9pbnQoYTEsIHNtaW4gPiAwID8gc21pbiA6IDAsIHZhKV07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHNtYXggPT09IDApIHtcclxuICAgICAgcmV0dXJuIG5vRW5kcG9pbnRUb3VjaCA/IG51bGwgOiBbdG9Qb2ludChhMSwgc21heCA8IDEgPyBzbWF4IDogMSwgdmEpXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobm9FbmRwb2ludFRvdWNoICYmIHNtaW4gPT09IDAgJiYgc21heCA9PT0gMSkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgLy8gVGhlcmUncyBvdmVybGFwIG9uIGEgc2VnbWVudCAtLSB0d28gcG9pbnRzIG9mIGludGVyc2VjdGlvbi4gUmV0dXJuIGJvdGguXHJcbiAgICByZXR1cm4gW1xyXG4gICAgICB0b1BvaW50KGExLCBzbWluID4gMCA/IHNtaW4gOiAwLCB2YSksXHJcbiAgICAgIHRvUG9pbnQoYTEsIHNtYXggPCAxID8gc21heCA6IDEsIHZhKSxcclxuICAgIF07XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbnVsbDtcclxufTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIFNpZ25lZCBhcmVhIG9mIHRoZSB0cmlhbmdsZSAocDAsIHAxLCBwMilcclxuICogQHBhcmFtICB7QXJyYXkuPE51bWJlcj59IHAwXHJcbiAqIEBwYXJhbSAge0FycmF5LjxOdW1iZXI+fSBwMVxyXG4gKiBAcGFyYW0gIHtBcnJheS48TnVtYmVyPn0gcDJcclxuICogQHJldHVybiB7TnVtYmVyfVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzaWduZWRBcmVhKHAwLCBwMSwgcDIpIHtcclxuICByZXR1cm4gKHAwWzBdIC0gcDJbMF0pICogKHAxWzFdIC0gcDJbMV0pIC0gKHAxWzBdIC0gcDJbMF0pICogKHAwWzFdIC0gcDJbMV0pO1xyXG59O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgVHJlZSAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdhdmwnKTtcclxudmFyIGNvbXB1dGVGaWVsZHMgICAgICAgID0gcmVxdWlyZSgnLi9jb21wdXRlX2ZpZWxkcycpO1xyXG52YXIgcG9zc2libGVJbnRlcnNlY3Rpb24gPSByZXF1aXJlKCcuL3Bvc3NpYmxlX2ludGVyc2VjdGlvbicpO1xyXG52YXIgY29tcGFyZVNlZ21lbnRzICAgICAgPSByZXF1aXJlKCcuL2NvbXBhcmVfc2VnbWVudHMnKTtcclxudmFyIG9wZXJhdGlvbnMgICAgICAgICAgID0gcmVxdWlyZSgnLi9vcGVyYXRpb24nKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN1YmRpdmlkZShldmVudFF1ZXVlLCBzdWJqZWN0LCBjbGlwcGluZywgc2Jib3gsIGNiYm94LCBvcGVyYXRpb24pIHtcclxuICB2YXIgc3dlZXBMaW5lID0gbmV3IFRyZWUoY29tcGFyZVNlZ21lbnRzKTtcclxuICB2YXIgc29ydGVkRXZlbnRzID0gW107XHJcblxyXG4gIHZhciByaWdodGJvdW5kID0gTWF0aC5taW4oc2Jib3hbMl0sIGNiYm94WzJdKTtcclxuXHJcbiAgdmFyIHByZXYsIG5leHQsIGJlZ2luO1xyXG5cclxuICB2YXIgSU5URVJTRUNUSU9OID0gb3BlcmF0aW9ucy5JTlRFUlNFQ1RJT047XHJcbiAgdmFyIERJRkZFUkVOQ0UgICA9IG9wZXJhdGlvbnMuRElGRkVSRU5DRTtcclxuXHJcbiAgd2hpbGUgKGV2ZW50UXVldWUubGVuZ3RoKSB7XHJcbiAgICB2YXIgZXZlbnQgPSBldmVudFF1ZXVlLnBvcCgpO1xyXG4gICAgc29ydGVkRXZlbnRzLnB1c2goZXZlbnQpO1xyXG5cclxuICAgIC8vIG9wdGltaXphdGlvbiBieSBiYm94ZXMgZm9yIGludGVyc2VjdGlvbiBhbmQgZGlmZmVyZW5jZSBnb2VzIGhlcmVcclxuICAgIGlmICgob3BlcmF0aW9uID09PSBJTlRFUlNFQ1RJT04gJiYgZXZlbnQucG9pbnRbMF0gPiByaWdodGJvdW5kKSB8fFxyXG4gICAgICAgIChvcGVyYXRpb24gPT09IERJRkZFUkVOQ0UgICAmJiBldmVudC5wb2ludFswXSA+IHNiYm94WzJdKSkge1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZXZlbnQubGVmdCkge1xyXG4gICAgICBuZXh0ICA9IHByZXYgPSBzd2VlcExpbmUuaW5zZXJ0KGV2ZW50KTtcclxuICAgICAgLy9fcmVuZGVyU3dlZXBMaW5lKHN3ZWVwTGluZSwgZXZlbnQucG9pbnQsIGV2ZW50KTtcclxuICAgICAgYmVnaW4gPSBzd2VlcExpbmUubWluTm9kZSgpO1xyXG5cclxuICAgICAgaWYgKHByZXYgIT09IGJlZ2luKSBwcmV2ID0gc3dlZXBMaW5lLnByZXYocHJldik7XHJcbiAgICAgIGVsc2UgICAgICAgICAgICAgICAgcHJldiA9IG51bGw7XHJcblxyXG4gICAgICBuZXh0ID0gc3dlZXBMaW5lLm5leHQobmV4dCk7XHJcblxyXG4gICAgICB2YXIgcHJldkV2ZW50ID0gcHJldiA/IHByZXYua2V5IDogbnVsbDtcclxuICAgICAgdmFyIHByZXZwcmV2RXZlbnQ7XHJcbiAgICAgIGNvbXB1dGVGaWVsZHMoZXZlbnQsIHByZXZFdmVudCwgb3BlcmF0aW9uKTtcclxuICAgICAgaWYgKG5leHQpIHtcclxuICAgICAgICBpZiAocG9zc2libGVJbnRlcnNlY3Rpb24oZXZlbnQsIG5leHQua2V5LCBldmVudFF1ZXVlKSA9PT0gMikge1xyXG4gICAgICAgICAgY29tcHV0ZUZpZWxkcyhldmVudCwgcHJldkV2ZW50LCBvcGVyYXRpb24pO1xyXG4gICAgICAgICAgY29tcHV0ZUZpZWxkcyhldmVudCwgbmV4dC5rZXksIG9wZXJhdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChwcmV2KSB7XHJcbiAgICAgICAgaWYgKHBvc3NpYmxlSW50ZXJzZWN0aW9uKHByZXYua2V5LCBldmVudCwgZXZlbnRRdWV1ZSkgPT09IDIpIHtcclxuICAgICAgICAgIHZhciBwcmV2cHJldiA9IHByZXY7XHJcbiAgICAgICAgICBpZiAocHJldnByZXYgIT09IGJlZ2luKSBwcmV2cHJldiA9IHN3ZWVwTGluZS5wcmV2KHByZXZwcmV2KTtcclxuICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgIHByZXZwcmV2ID0gbnVsbDtcclxuXHJcbiAgICAgICAgICBwcmV2cHJldkV2ZW50ID0gcHJldnByZXYgPyBwcmV2cHJldi5rZXkgOiBudWxsO1xyXG4gICAgICAgICAgY29tcHV0ZUZpZWxkcyhwcmV2RXZlbnQsIHByZXZwcmV2RXZlbnQsIG9wZXJhdGlvbik7XHJcbiAgICAgICAgICBjb21wdXRlRmllbGRzKGV2ZW50LCAgICAgcHJldkV2ZW50LCAgICAgb3BlcmF0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGV2ZW50ID0gZXZlbnQub3RoZXJFdmVudDtcclxuICAgICAgbmV4dCA9IHByZXYgPSBzd2VlcExpbmUuZmluZChldmVudCk7XHJcblxyXG4gICAgICAvLyBfcmVuZGVyU3dlZXBMaW5lKHN3ZWVwTGluZSwgZXZlbnQub3RoZXJFdmVudC5wb2ludCwgZXZlbnQpO1xyXG5cclxuICAgICAgaWYgKHByZXYgJiYgbmV4dCkge1xyXG5cclxuICAgICAgICBpZiAocHJldiAhPT0gYmVnaW4pIHByZXYgPSBzd2VlcExpbmUucHJldihwcmV2KTtcclxuICAgICAgICBlbHNlICAgICAgICAgICAgICAgIHByZXYgPSBudWxsO1xyXG5cclxuICAgICAgICBuZXh0ID0gc3dlZXBMaW5lLm5leHQobmV4dCk7XHJcbiAgICAgICAgc3dlZXBMaW5lLnJlbW92ZShldmVudCk7XHJcblxyXG4gICAgICAgIC8vIF9yZW5kZXJTd2VlcExpbmUoc3dlZXBMaW5lLCBldmVudC5vdGhlckV2ZW50LnBvaW50LCBldmVudCk7XHJcblxyXG4gICAgICAgIGlmIChuZXh0ICYmIHByZXYpIHtcclxuICAgICAgICAgIC8vaWYgKHR5cGVvZiBwcmV2ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbmV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgIHBvc3NpYmxlSW50ZXJzZWN0aW9uKHByZXYua2V5LCBuZXh0LmtleSwgZXZlbnRRdWV1ZSk7XHJcbiAgICAgICAgICAvL31cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHNvcnRlZEV2ZW50cztcclxufTtcclxuXHJcblxyXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycywgbm8tZGVidWdnZXIsIG5vLXVuZGVmICovXHJcbmZ1bmN0aW9uIF9yZW5kZXJTd2VlcExpbmUoc3dlZXBMaW5lLCBwb3MsIGV2ZW50KSB7XHJcbiAgdmFyIG1hcCA9IHdpbmRvdy5tYXA7XHJcbiAgaWYgKCFtYXApIHJldHVybjtcclxuICBpZiAod2luZG93LnN3cykgd2luZG93LnN3cy5mb3JFYWNoKGZ1bmN0aW9uIChwKSB7XHJcbiAgICBtYXAucmVtb3ZlTGF5ZXIocCk7XHJcbiAgfSk7XHJcbiAgd2luZG93LnN3cyA9IFtdO1xyXG4gIHN3ZWVwTGluZS5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XHJcbiAgICB2YXIgcG9seSA9IEwucG9seWxpbmUoW1xyXG4gICAgICBlLnBvaW50LnNsaWNlKCkucmV2ZXJzZSgpLFxyXG4gICAgICBlLm90aGVyRXZlbnQucG9pbnQuc2xpY2UoKS5yZXZlcnNlKClcclxuICAgIF0sIHtjb2xvcjogJ2dyZWVuJ30pLmFkZFRvKG1hcCk7XHJcbiAgICB3aW5kb3cuc3dzLnB1c2gocG9seSk7XHJcbiAgfSk7XHJcblxyXG4gIGlmICh3aW5kb3cudnQpIG1hcC5yZW1vdmVMYXllcih3aW5kb3cudnQpO1xyXG4gIHZhciB2ID0gcG9zLnNsaWNlKCk7XHJcbiAgdmFyIGIgPSBtYXAuZ2V0Qm91bmRzKCk7XHJcbiAgd2luZG93LnZ0ID0gTC5wb2x5bGluZShbXHJcbiAgICBbYi5nZXROb3J0aCgpLCB2WzBdXSxcclxuICAgIFtiLmdldFNvdXRoKCksIHZbMF1dXHJcbiAgXSwge2NvbG9yOiAnZ3JlZW4nLCB3ZWlnaHQ6IDF9KS5hZGRUbyhtYXApO1xyXG5cclxuICBpZiAod2luZG93LnBzKSBtYXAucmVtb3ZlTGF5ZXIod2luZG93LnBzKTtcclxuICB3aW5kb3cucHMgPSBMLnBvbHlsaW5lKFtcclxuICAgIGV2ZW50LnBvaW50LnNsaWNlKCkucmV2ZXJzZSgpLFxyXG4gICAgZXZlbnQub3RoZXJFdmVudC5wb2ludC5zbGljZSgpLnJldmVyc2UoKVxyXG4gIF0sIHtjb2xvcjogJ2JsYWNrJywgd2VpZ2h0OiA5LCBvcGFjaXR5OiAwLjR9KS5hZGRUbyhtYXApO1xyXG4gIGRlYnVnZ2VyO1xyXG59XHJcbi8qIGVzbGludC1lbmFibGUgbm8tdW51c2VkLXZhcnMsIG5vLWRlYnVnZ2VyLCBuby11bmRlZiAqL1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vL3ZhciBzaWduZWRBcmVhID0gcmVxdWlyZSgnLi9zaWduZWRfYXJlYScpO1xyXG52YXIgRWRnZVR5cGUgICA9IHJlcXVpcmUoJy4vZWRnZV90eXBlJyk7XHJcblxyXG4vKipcclxuICogU3dlZXBsaW5lIGV2ZW50XHJcbiAqXHJcbiAqIEBwYXJhbSB7QXJyYXkuPE51bWJlcj59ICBwb2ludFxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59ICAgICAgICAgbGVmdFxyXG4gKiBAcGFyYW0ge1N3ZWVwRXZlbnQ9fSAgICAgb3RoZXJFdmVudFxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59ICAgICAgICAgaXNTdWJqZWN0XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSAgICAgICAgICBlZGdlVHlwZVxyXG4gKi9cclxuZnVuY3Rpb24gU3dlZXBFdmVudChwb2ludCwgbGVmdCwgb3RoZXJFdmVudCwgaXNTdWJqZWN0LCBlZGdlVHlwZSkge1xyXG5cclxuICAvKipcclxuICAgKiBJcyBsZWZ0IGVuZHBvaW50P1xyXG4gICAqIEB0eXBlIHtCb29sZWFufVxyXG4gICAqL1xyXG4gIHRoaXMubGVmdCA9IGxlZnQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIEB0eXBlIHtBcnJheS48TnVtYmVyPn1cclxuICAgKi9cclxuICB0aGlzLnBvaW50ID0gcG9pbnQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIE90aGVyIGVkZ2UgcmVmZXJlbmNlXHJcbiAgICogQHR5cGUge1N3ZWVwRXZlbnR9XHJcbiAgICovXHJcbiAgdGhpcy5vdGhlckV2ZW50ID0gb3RoZXJFdmVudDtcclxuXHJcbiAgLyoqXHJcbiAgICogQmVsb25ncyB0byBzb3VyY2Ugb3IgY2xpcHBpbmcgcG9seWdvblxyXG4gICAqIEB0eXBlIHtCb29sZWFufVxyXG4gICAqL1xyXG4gIHRoaXMuaXNTdWJqZWN0ID0gaXNTdWJqZWN0O1xyXG5cclxuICAvKipcclxuICAgKiBFZGdlIGNvbnRyaWJ1dGlvbiB0eXBlXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKi9cclxuICB0aGlzLnR5cGUgPSBlZGdlVHlwZSB8fCBFZGdlVHlwZS5OT1JNQUw7XHJcblxyXG5cclxuICAvKipcclxuICAgKiBJbi1vdXQgdHJhbnNpdGlvbiBmb3IgdGhlIHN3ZWVwbGluZSBjcm9zc2luZyBwb2x5Z29uXHJcbiAgICogQHR5cGUge0Jvb2xlYW59XHJcbiAgICovXHJcbiAgdGhpcy5pbk91dCA9IGZhbHNlO1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQHR5cGUge0Jvb2xlYW59XHJcbiAgICovXHJcbiAgdGhpcy5vdGhlckluT3V0ID0gZmFsc2U7XHJcblxyXG4gIC8qKlxyXG4gICAqIFByZXZpb3VzIGV2ZW50IGluIHJlc3VsdD9cclxuICAgKiBAdHlwZSB7U3dlZXBFdmVudH1cclxuICAgKi9cclxuICB0aGlzLnByZXZJblJlc3VsdCA9IG51bGw7XHJcblxyXG4gIC8qKlxyXG4gICAqIERvZXMgZXZlbnQgYmVsb25nIHRvIHJlc3VsdD9cclxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cclxuICAgKi9cclxuICB0aGlzLmluUmVzdWx0ID0gZmFsc2U7XHJcblxyXG5cclxuICAvLyBjb25uZWN0aW9uIHN0ZXBcclxuXHJcbiAgLyoqXHJcbiAgICogQHR5cGUge0Jvb2xlYW59XHJcbiAgICovXHJcbiAgdGhpcy5yZXN1bHRJbk91dCA9IGZhbHNlO1xyXG5cclxuICB0aGlzLmlzRXh0ZXJpb3JSaW5nID0gdHJ1ZTtcclxufVxyXG5cclxuXHJcblN3ZWVwRXZlbnQucHJvdG90eXBlID0ge1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gIHtBcnJheS48TnVtYmVyPn0gIHBcclxuICAgKiBAcmV0dXJuIHtCb29sZWFufVxyXG4gICAqL1xyXG4gIGlzQmVsb3c6IGZ1bmN0aW9uIChwKSB7XHJcbiAgICB2YXIgcDAgPSB0aGlzLnBvaW50LCBwMSA9IHRoaXMub3RoZXJFdmVudC5wb2ludDtcclxuICAgIHJldHVybiB0aGlzLmxlZnQgP1xyXG4gICAgICAocDBbMF0gLSBwWzBdKSAqIChwMVsxXSAtIHBbMV0pIC0gKHAxWzBdIC0gcFswXSkgKiAocDBbMV0gLSBwWzFdKSA+IDAgOlxyXG4gICAgICAvLyBzaWduZWRBcmVhKHRoaXMucG9pbnQsIHRoaXMub3RoZXJFdmVudC5wb2ludCwgcCkgPiAwIDpcclxuICAgICAgKHAxWzBdIC0gcFswXSkgKiAocDBbMV0gLSBwWzFdKSAtIChwMFswXSAtIHBbMF0pICogKHAxWzFdIC0gcFsxXSkgPiAwO1xyXG4gICAgICAvL3NpZ25lZEFyZWEodGhpcy5vdGhlckV2ZW50LnBvaW50LCB0aGlzLnBvaW50LCBwKSA+IDA7XHJcbiAgfSxcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSAge0FycmF5LjxOdW1iZXI+fSAgcFxyXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XHJcbiAgICovXHJcbiAgaXNBYm92ZTogZnVuY3Rpb24gKHApIHtcclxuICAgIHJldHVybiAhdGhpcy5pc0JlbG93KHApO1xyXG4gIH0sXHJcblxyXG5cclxuICAvKipcclxuICAgKiBAcmV0dXJuIHtCb29sZWFufVxyXG4gICAqL1xyXG4gIGlzVmVydGljYWw6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLnBvaW50WzBdID09PSB0aGlzLm90aGVyRXZlbnQucG9pbnRbMF07XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTd2VlcEV2ZW50O1xyXG4iXX0=
