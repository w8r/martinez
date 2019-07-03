/**
 * martinez-polygon-clipping v0.6.0
 * Martinez polygon clipping algorithm, does boolean operation on polygons (multipolygons, polygons with holes etc): intersection, union, difference, xor
 *
 * @author Alex Milevski <info@w8r.name>
 * @license MIT
 * @preserve
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('leaflet')) :
  typeof define === 'function' && define.amd ? define(['leaflet'], factory) :
  (global = global || self, factory(global.L));
}(this, function (L$1) { 'use strict';

  L$1 = L$1 && L$1.hasOwnProperty('default') ? L$1['default'] : L$1;

  L$1.Coordinates = L$1.Control.extend({
    options: {
      position: 'bottomright'
    },

    onAdd: function(map) {
      this._container = L$1.DomUtil.create('div', 'leaflet-bar');
      this._container.style.background = '#ffffff';
      map.on('mousemove', this._onMouseMove, this);
      return this._container;
    },

    _onMouseMove: function(e) {
      this._container.innerHTML = '<span style="padding: 5px">' +
        e.latlng.lng.toFixed(3) + ', ' + e.latlng.lat.toFixed(3) + '</span>';
    }

  });

  L$1.EditControl = L$1.Control.extend({

    options: {
      position: 'topleft',
      callback: null,
      kind: '',
      html: ''
    },

    onAdd: function (map) {
      var container = L$1.DomUtil.create('div', 'leaflet-control leaflet-bar'),
          link = L$1.DomUtil.create('a', '', container);

      link.href = '#';
      link.title = 'Create a new ' + this.options.kind;
      link.innerHTML = this.options.html;
      L$1.DomEvent.on(link, 'click', L$1.DomEvent.stop)
                .on(link, 'click', function () {
                  window.LAYER = this.options.callback.call(map.editTools);
                }, this);

      return container;
    }

  });

  L$1.NewPolygonControl = L$1.EditControl.extend({
    options: {
      position: 'topleft',
      kind: 'polygon',
      html: '▰'
    }
  });

  L$1.BooleanControl = L$1.Control.extend({
    options: {
      position: 'topright'
    },

    onAdd: function(map) {
      var container = this._container = L$1.DomUtil.create('div', 'leaflet-bar');
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
      L$1.DomEvent
        .on(form, 'submit', function (evt) {
          L$1.DomEvent.stop(evt);
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
          L$1.DomEvent.stop(evt);
          this.options.clear();
        }, this);

      L$1.DomEvent
        .disableClickPropagation(this._container)
        .disableScrollPropagation(this._container);
      return this._container;
    }

  });

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var martinez_umd = createCommonjsModule(function (module, exports) {
  /**
   * martinez-polygon-clipping v0.6.0
   * Martinez polygon clipping algorithm, does boolean operation on polygons (multipolygons, polygons with holes etc): intersection, union, difference, xor
   *
   * @author Alex Milevski <info@w8r.name>
   * @license MIT
   * @preserve
   */

  (function (global, factory) {
    factory(exports);
  }(commonjsGlobal, function (exports) {
    var INTERSECTION = 0;
    var UNION = 1;
    var DIFFERENCE = 2;
    var XOR = 3;
    var Operation;
    (function (Operation) {
        Operation[Operation["INTERSECTION"] = 0] = "INTERSECTION";
        Operation[Operation["UNION"] = 1] = "UNION";
        Operation[Operation["DIFFERENCE"] = 2] = "DIFFERENCE";
        Operation[Operation["XOR"] = 3] = "XOR";
    })(Operation || (Operation = {}));
    

    var PRECISION = 12;
    var EMPTY = [];
    var EPS = Math.pow(10, -PRECISION);
    var E_LIMIT = Math.pow(10, PRECISION);
    

    var TinyQueue = function TinyQueue(data, compare) {
        if ( data === void 0 ) data = [];
        if ( compare === void 0 ) compare = defaultCompare;

        this.data = data;
        this.length = this.data.length;
        this.compare = compare;

        if (this.length > 0) {
            for (var i = (this.length >> 1) - 1; i >= 0; i--) { this._down(i); }
        }
    };

    TinyQueue.prototype.push = function push (item) {
        this.data.push(item);
        this.length++;
        this._up(this.length - 1);
    };

    TinyQueue.prototype.pop = function pop () {
        if (this.length === 0) { return undefined; }

        var top = this.data[0];
        var bottom = this.data.pop();
        this.length--;

        if (this.length > 0) {
            this.data[0] = bottom;
            this._down(0);
        }

        return top;
    };

    TinyQueue.prototype.peek = function peek () {
        return this.data[0];
    };

    TinyQueue.prototype._up = function _up (pos) {
        var ref = this;
            var data = ref.data;
            var compare = ref.compare;
        var item = data[pos];

        while (pos > 0) {
            var parent = (pos - 1) >> 1;
            var current = data[parent];
            if (compare(item, current) >= 0) { break; }
            data[pos] = current;
            pos = parent;
        }

        data[pos] = item;
    };

    TinyQueue.prototype._down = function _down (pos) {
        var ref = this;
            var data = ref.data;
            var compare = ref.compare;
        var halfLength = this.length >> 1;
        var item = data[pos];

        while (pos < halfLength) {
            var left = (pos << 1) + 1;
            var best = data[left];
            var right = left + 1;

            if (right < this.length && compare(data[right], best) < 0) {
                left = right;
                best = data[right];
            }
            if (compare(best, item) >= 0) { break; }

            data[pos] = best;
            pos = left;
        }

        data[pos] = item;
    };

    function defaultCompare(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    var NORMAL = 0;
    var NON_CONTRIBUTING = 1;
    var SAME_TRANSITION = 2;
    var DIFFERENT_TRANSITION = 3;
    

    var SweepEvent = /** @class */ (function () {
        function SweepEvent(point, left, otherEvent, isSubject, edgeType) {
            if (edgeType === void 0) { edgeType = NORMAL; }
            // transition flags
            this.inOut = false;
            this.otherInOut = false;
            this.prevInResult = null;
            // Does event belong to result?
            this.inResult = false;
            // connection step
            this.resultInOut = false;
            this.isExteriorRing = true;
            this.contourId = -1;
            // Is left endpoint?
            this.left = left;
            this.point = point;
            // Other edge reference
            this.otherEvent = otherEvent;
            // Belongs to source or clipping polygon
            this.isSubject = isSubject;
            // Edge contribution type
            this.type = edgeType;
        }
        SweepEvent.prototype.isVertical = function () {
            return this.point[0] === this.otherEvent.point[0];
        };
        SweepEvent.prototype.clone = function () {
            var copy = new SweepEvent(this.point, this.left, this.otherEvent, this.isSubject, this.type);
            copy.inResult = this.inResult;
            copy.prevInResult = this.prevInResult;
            copy.isExteriorRing = this.isExteriorRing;
            copy.inOut = this.inOut;
            copy.otherInOut = this.otherInOut;
            return copy;
        };
        return SweepEvent;
    }());
    function isBelow(e, p) {
        var p0 = e.point, p1 = e.otherEvent.point;
        return e.left
            ? (p0[0] - p[0]) * (p1[1] - p[1]) - (p1[0] - p[0]) * (p0[1] - p[1]) > 0
            // signedArea(this.point, this.otherEvent.point, p) > 0 :
            : (p1[0] - p[0]) * (p0[1] - p[1]) - (p0[0] - p[0]) * (p1[1] - p[1]) > 0;
        //signedArea(this.otherEvent.point, this.point, p) > 0;
    }
    

    /**
     * Signed area of the triangle (p0, p1, p2)
     */
    function signedArea(p0, p1, p2) {
        return (p0[0] - p2[0]) * (p1[1] - p2[1]) - (p1[0] - p2[0]) * (p0[1] - p2[1]);
    }
    

    /**
     * @param  {SweepEvent} e1
     * @param  {SweepEvent} e2
     * @return {Number}
     */
    function compareEvents(e1, e2) {
        var p1 = e1.point;
        var p2 = e2.point;
        // Different x-coordinate
        if (p1[0] > p2[0])
            return 1;
        if (p1[0] < p2[0])
            return -1;
        // Different points, but same x-coordinate
        // Event with lower y-coordinate is processed first
        if (p1[1] !== p2[1])
            return p1[1] > p2[1] ? 1 : -1;
        // Same coordinates, but one is a left endpoint and the other is
        // a right endpoint. The right endpoint is processed first
        if (e1.left !== e2.left)
            return e1.left ? 1 : -1;
        // const p2 = e1.otherEvent.point, p3 = e2.otherEvent.point;
        // const sa = (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])
        // Same coordinates, both events
        // are left endpoints or right endpoints.
        // not collinear
        if (signedArea(p1, e1.otherEvent.point, e2.otherEvent.point) !== 0) {
            // the event associate to the bottom segment is processed first
            return (!isBelow(e1, e2.otherEvent.point)) ? 1 : -1;
        }
        return (!e1.isSubject && e2.isSubject) ? 1 : -1;
    }
    

    var contourId = 0;
    function processPolygon(contourOrHole, isSubject, depth, Q, bbox, isExteriorRing) {
        var i, len, s1, s2, e1, e2;
        for (i = 0, len = contourOrHole.length - 1; i < len; i++) {
            s1 = contourOrHole[i];
            s2 = contourOrHole[i + 1];
            e1 = new SweepEvent(s1, false, undefined, isSubject);
            e2 = new SweepEvent(s2, false, e1, isSubject);
            e1.otherEvent = e2;
            if (s1[0] === s2[0] && s1[1] === s2[1]) {
                continue; // skip collapsed edges, or it breaks
            }
            e1.contourId = e2.contourId = depth;
            if (!isExteriorRing) {
                e1.isExteriorRing = false;
                e2.isExteriorRing = false;
            }
            if (compareEvents(e1, e2) > 0)
                e2.left = true;
            else
                e1.left = true;
            var x = s1[0], y = s1[1];
            if (x < bbox[0])
                bbox[0] = x;
            if (y < bbox[1])
                bbox[1] = y;
            if (x > bbox[2])
                bbox[2] = x;
            if (y > bbox[3])
                bbox[3] = x;
            // Pushing it so the queue is sorted from left to right,
            // with object on the left having the highest priority.
            Q.push(e1);
            Q.push(e2);
        }
    }
    function fillQueue(subject, clipping, sbbox, cbbox, operation) {
        var Q = new TinyQueue(undefined, compareEvents);
        var polygonSet, isExteriorRing, i, ii, j, jj;
        for (i = 0, ii = subject.length; i < ii; i++) {
            polygonSet = subject[i];
            for (j = 0, jj = polygonSet.length; j < jj; j++) {
                isExteriorRing = j === 0;
                if (isExteriorRing)
                    contourId++;
                processPolygon(polygonSet[j], true, contourId, Q, sbbox, isExteriorRing);
            }
        }
        for (i = 0, ii = clipping.length; i < ii; i++) {
            polygonSet = clipping[i];
            for (j = 0, jj = polygonSet.length; j < jj; j++) {
                isExteriorRing = j === 0;
                if (operation === DIFFERENCE)
                    isExteriorRing = false;
                if (isExteriorRing)
                    contourId++;
                processPolygon(polygonSet[j], false, contourId, Q, cbbox, isExteriorRing);
            }
        }
        return Q;
    }

    /**
     * splaytree v3.0.0
     * Fast Splay tree for Node and browser
     *
     * @author Alexander Milevski <info@w8r.name>
     * @license MIT
     * @preserve
     */

    var Node = function Node(key, data) {
        this.next = null;
        this.key = key;
        this.data = data;
        this.left = null;
        this.right = null;
    };

    /* follows "An implementation of top-down splaying"
     * by D. Sleator <sleator@cs.cmu.edu> March 1992
     */
    function DEFAULT_COMPARE(a, b) {
        return a > b ? 1 : a < b ? -1 : 0;
    }
    /**
     * Simple top down splay, not requiring i to be in the tree t.
     */
    function splay(i, t, comparator) {
        var N = new Node(null, null);
        var l = N;
        var r = N;
        while (true) {
            var cmp = comparator(i, t.key);
            //if (i < t.key) {
            if (cmp < 0) {
                if (t.left === null)
                    { break; }
                //if (i < t.left.key) {
                if (comparator(i, t.left.key) < 0) {
                    var y = t.left; /* rotate right */
                    t.left = y.right;
                    y.right = t;
                    t = y;
                    if (t.left === null)
                        { break; }
                }
                r.left = t; /* link right */
                r = t;
                t = t.left;
                //} else if (i > t.key) {
            }
            else if (cmp > 0) {
                if (t.right === null)
                    { break; }
                //if (i > t.right.key) {
                if (comparator(i, t.right.key) > 0) {
                    var y$1 = t.right; /* rotate left */
                    t.right = y$1.left;
                    y$1.left = t;
                    t = y$1;
                    if (t.right === null)
                        { break; }
                }
                l.right = t; /* link left */
                l = t;
                t = t.right;
            }
            else
                { break; }
        }
        /* assemble */
        l.right = t.left;
        r.left = t.right;
        t.left = N.right;
        t.right = N.left;
        return t;
    }
    function insert(i, data, t, comparator) {
        var node = new Node(i, data);
        if (t === null) {
            node.left = node.right = null;
            return node;
        }
        t = splay(i, t, comparator);
        var cmp = comparator(i, t.key);
        if (cmp < 0) {
            node.left = t.left;
            node.right = t;
            t.left = null;
        }
        else if (cmp >= 0) {
            node.right = t.right;
            node.left = t;
            t.right = null;
        }
        return node;
    }
    function split(key, v, comparator) {
        var left = null;
        var right = null;
        if (v) {
            v = splay(key, v, comparator);
            var cmp = comparator(v.key, key);
            if (cmp === 0) {
                left = v.left;
                right = v.right;
            }
            else if (cmp < 0) {
                right = v.right;
                v.right = null;
                left = v;
            }
            else {
                left = v.left;
                v.left = null;
                right = v;
            }
        }
        return { left: left, right: right };
    }
    function merge(left, right, comparator) {
        if (right === null)
            { return left; }
        if (left === null)
            { return right; }
        right = splay(left.key, right, comparator);
        right.left = left;
        return right;
    }
    /**
     * Prints level of the tree
     */
    function printRow(root, prefix, isTail, out, printNode) {
        if (root) {
            out(("" + prefix + (isTail ? '└── ' : '├── ') + (printNode(root)) + "\n"));
            var indent = prefix + (isTail ? '    ' : '│   ');
            if (root.left)
                { printRow(root.left, indent, false, out, printNode); }
            if (root.right)
                { printRow(root.right, indent, true, out, printNode); }
        }
    }
    var Tree = function Tree(comparator) {
        if ( comparator === void 0 ) comparator = DEFAULT_COMPARE;

        this._root = null;
        this._size = 0;
        this._comparator = comparator;
    };

    var prototypeAccessors = { size: { configurable: true },root: { configurable: true } };
    /**
     * Inserts a key, allows duplicates
     */
    Tree.prototype.insert = function insert$1 (key, data) {
        this._size++;
        return this._root = insert(key, data, this._root, this._comparator);
    };
    /**
     * Adds a key, if it is not present in the tree
     */
    Tree.prototype.add = function add (key, data) {
        var node = new Node(key, data);
        if (this._root === null) {
            node.left = node.right = null;
            this._size++;
            this._root = node;
        }
        var comparator = this._comparator;
        var t = splay(key, this._root, comparator);
        var cmp = comparator(key, t.key);
        if (cmp === 0)
            { this._root = t; }
        else {
            if (cmp < 0) {
                node.left = t.left;
                node.right = t;
                t.left = null;
            }
            else if (cmp > 0) {
                node.right = t.right;
                node.left = t;
                t.right = null;
            }
            this._size++;
            this._root = node;
        }
        return this._root;
    };
    /**
     * @param  {Key} key
     * @return {Node|null}
     */
    Tree.prototype.remove = function remove (key) {
        this._root = this._remove(key, this._root, this._comparator);
    };
    /**
     * Deletes i from the tree if it's there
     */
    Tree.prototype._remove = function _remove (i, t, comparator) {
        var x;
        if (t === null)
            { return null; }
        t = splay(i, t, comparator);
        var cmp = comparator(i, t.key);
        if (cmp === 0) { /* found it */
            if (t.left === null) {
                x = t.right;
            }
            else {
                x = splay(i, t.left, comparator);
                x.right = t.right;
            }
            this._size--;
            return x;
        }
        return t; /* It wasn't there */
    };
    /**
     * Removes and returns the node with smallest key
     */
    Tree.prototype.pop = function pop () {
        var node = this._root;
        if (node) {
            while (node.left)
                { node = node.left; }
            this._root = splay(node.key, this._root, this._comparator);
            this._root = this._remove(node.key, this._root, this._comparator);
            return { key: node.key, data: node.data };
        }
        return null;
    };
    /**
     * Find without splaying
     */
    Tree.prototype.findStatic = function findStatic (key) {
        var current = this._root;
        var compare = this._comparator;
        while (current) {
            var cmp = compare(key, current.key);
            if (cmp === 0)
                { return current; }
            else if (cmp < 0)
                { current = current.left; }
            else
                { current = current.right; }
        }
        return null;
    };
    Tree.prototype.find = function find (key) {
        if (this._root) {
            this._root = splay(key, this._root, this._comparator);
            if (this._comparator(key, this._root.key) !== 0)
                { return null; }
        }
        return this._root;
    };
    Tree.prototype.contains = function contains (key) {
        var current = this._root;
        var compare = this._comparator;
        while (current) {
            var cmp = compare(key, current.key);
            if (cmp === 0)
                { return true; }
            else if (cmp < 0)
                { current = current.left; }
            else
                { current = current.right; }
        }
        return false;
    };
    Tree.prototype.forEach = function forEach (visitor, ctx) {
        var current = this._root;
        var Q = []; /* Initialize stack s */
        var done = false;
        while (!done) {
            if (current !== null) {
                Q.push(current);
                current = current.left;
            }
            else {
                if (Q.length !== 0) {
                    current = Q.pop();
                    visitor.call(ctx, current);
                    current = current.right;
                }
                else
                    { done = true; }
            }
        }
        return this;
    };
    /**
     * Walk key range from `low` to `high`. Stops if `fn` returns a value.
     */
    Tree.prototype.range = function range (low, high, fn, ctx) {
        var Q = [];
        var compare = this._comparator;
        var node = this._root;
        var cmp;
        while (Q.length !== 0 || node) {
            if (node) {
                Q.push(node);
                node = node.left;
            }
            else {
                node = Q.pop();
                cmp = compare(node.key, high);
                if (cmp > 0) {
                    break;
                }
                else if (compare(node.key, low) >= 0) {
                    if (fn.call(ctx, node))
                        { return this; } // stop if smth is returned
                }
                node = node.right;
            }
        }
        return this;
    };
    /**
     * Returns array of keys
     */
    Tree.prototype.keys = function keys () {
        var keys = [];
        this.forEach(function (ref) {
                var key = ref.key;

                return keys.push(key);
            });
        return keys;
    };
    /**
     * Returns array of all the data in the nodes
     */
    Tree.prototype.values = function values () {
        var values = [];
        this.forEach(function (ref) {
                var data = ref.data;

                return values.push(data);
            });
        return values;
    };
    Tree.prototype.min = function min () {
        if (this._root)
            { return this.minNode(this._root).key; }
        return null;
    };
    Tree.prototype.max = function max () {
        if (this._root)
            { return this.maxNode(this._root).key; }
        return null;
    };
    Tree.prototype.minNode = function minNode (t) {
            if ( t === void 0 ) t = this._root;

        if (t)
            { while (t.left)
                { t = t.left; } }
        return t;
    };
    Tree.prototype.maxNode = function maxNode (t) {
            if ( t === void 0 ) t = this._root;

        if (t)
            { while (t.right)
                { t = t.right; } }
        return t;
    };
    /**
     * Returns node at given index
     */
    Tree.prototype.at = function at (index) {
        var current = this._root;
        var done = false;
        var i = 0;
        var Q = [];
        while (!done) {
            if (current) {
                Q.push(current);
                current = current.left;
            }
            else {
                if (Q.length > 0) {
                    current = Q.pop();
                    if (i === index)
                        { return current; }
                    i++;
                    current = current.right;
                }
                else
                    { done = true; }
            }
        }
        return null;
    };
    Tree.prototype.next = function next (d) {
        var root = this._root;
        var successor = null;
        if (d.right) {
            successor = d.right;
            while (successor.left)
                { successor = successor.left; }
            return successor;
        }
        var comparator = this._comparator;
        while (root) {
            var cmp = comparator(d.key, root.key);
            if (cmp === 0)
                { break; }
            else if (cmp < 0) {
                successor = root;
                root = root.left;
            }
            else
                { root = root.right; }
        }
        return successor;
    };
    Tree.prototype.prev = function prev (d) {
        var root = this._root;
        var predecessor = null;
        if (d.left !== null) {
            predecessor = d.left;
            while (predecessor.right)
                { predecessor = predecessor.right; }
            return predecessor;
        }
        var comparator = this._comparator;
        while (root) {
            var cmp = comparator(d.key, root.key);
            if (cmp === 0)
                { break; }
            else if (cmp < 0)
                { root = root.left; }
            else {
                predecessor = root;
                root = root.right;
            }
        }
        return predecessor;
    };
    Tree.prototype.clear = function clear () {
        this._root = null;
        this._size = 0;
        return this;
    };
    Tree.prototype.toList = function toList$1 () {
        return toList(this._root);
    };
    /**
     * Bulk-load items. Both array have to be same size
     */
    Tree.prototype.load = function load (keys, values, presort) {
            if ( values === void 0 ) values = [];
            if ( presort === void 0 ) presort = false;

        var size = keys.length;
        var comparator = this._comparator;
        // sort if needed
        if (presort)
            { sort(keys, values, 0, size - 1, comparator); }
        if (this._root === null) { // empty tree
            this._root = loadRecursive(keys, values, 0, size);
            this._size = size;
        }
        else { // that re-builds the whole tree from two in-order traversals
            var mergedList = mergeLists(this.toList(), createList(keys, values), comparator);
            size = this._size + size;
            this._root = sortedListToBST({ head: mergedList }, 0, size);
        }
        return this;
    };
    Tree.prototype.isEmpty = function isEmpty () { return this._root === null; };
    prototypeAccessors.size.get = function () { return this._size; };
    prototypeAccessors.root.get = function () { return this._root; };
    Tree.prototype.toString = function toString (printNode) {
            if ( printNode === void 0 ) printNode = function (n) { return String(n.key); };

        var out = [];
        printRow(this._root, '', true, function (v) { return out.push(v); }, printNode);
        return out.join('');
    };
    Tree.prototype.update = function update (key, newKey, newData) {
        var comparator = this._comparator;
        var ref = split(key, this._root, comparator);
            var left = ref.left;
            var right = ref.right;
        if (comparator(key, newKey) < 0) {
            right = insert(newKey, newData, right, comparator);
        }
        else {
            left = insert(newKey, newData, left, comparator);
        }
        this._root = merge(left, right, comparator);
    };
    Tree.prototype.split = function split$1 (key) {
        return split(key, this._root, this._comparator);
    };

    Object.defineProperties( Tree.prototype, prototypeAccessors );
    function loadRecursive(keys, values, start, end) {
        var size = end - start;
        if (size > 0) {
            var middle = start + Math.floor(size / 2);
            var key = keys[middle];
            var data = values[middle];
            var node = new Node(key, data);
            node.left = loadRecursive(keys, values, start, middle);
            node.right = loadRecursive(keys, values, middle + 1, end);
            return node;
        }
        return null;
    }
    function createList(keys, values) {
        var head = new Node(null, null);
        var p = head;
        for (var i = 0; i < keys.length; i++) {
            p = p.next = new Node(keys[i], values[i]);
        }
        p.next = null;
        return head.next;
    }
    function toList(root) {
        var current = root;
        var Q = [];
        var done = false;
        var head = new Node(null, null);
        var p = head;
        while (!done) {
            if (current) {
                Q.push(current);
                current = current.left;
            }
            else {
                if (Q.length > 0) {
                    current = p = p.next = Q.pop();
                    current = current.right;
                }
                else
                    { done = true; }
            }
        }
        p.next = null; // that'll work even if the tree was empty
        return head.next;
    }
    function sortedListToBST(list, start, end) {
        var size = end - start;
        if (size > 0) {
            var middle = start + Math.floor(size / 2);
            var left = sortedListToBST(list, start, middle);
            var root = list.head;
            root.left = left;
            list.head = list.head.next;
            root.right = sortedListToBST(list, middle + 1, end);
            return root;
        }
        return null;
    }
    function mergeLists(l1, l2, compare) {
        var head = new Node(null, null); // dummy
        var p = head;
        var p1 = l1;
        var p2 = l2;
        while (p1 !== null && p2 !== null) {
            if (compare(p1.key, p2.key) < 0) {
                p.next = p1;
                p1 = p1.next;
            }
            else {
                p.next = p2;
                p2 = p2.next;
            }
            p = p.next;
        }
        if (p1 !== null) {
            p.next = p1;
        }
        else if (p2 !== null) {
            p.next = p2;
        }
        return head.next;
    }
    function sort(keys, values, left, right, compare) {
        if (left >= right)
            { return; }
        var pivot = keys[(left + right) >> 1];
        var i = left - 1;
        var j = right + 1;
        while (true) {
            do
                { i++; }
            while (compare(keys[i], pivot) < 0);
            do
                { j--; }
            while (compare(keys[j], pivot) > 0);
            if (i >= j)
                { break; }
            var tmp = keys[i];
            keys[i] = keys[j];
            keys[j] = tmp;
            tmp = values[i];
            values[i] = values[j];
            values[j] = tmp;
        }
        sort(keys, values, left, j, compare);
        sort(keys, values, j + 1, right, compare);
    }
    

    /**
     * @param  {SweepEvent} event
     * @param  {SweepEvent} prev
     * @param  {Operation} operation
     */
    function computeFields(event, prev, operation) {
        // compute inOut and otherInOut fields
        if (prev === null) {
            event.inOut = false;
            event.otherInOut = true;
            // previous line segment in sweepline belongs to the same polygon
        }
        else {
            if (event.isSubject === prev.isSubject) {
                event.inOut = !prev.inOut;
                event.otherInOut = prev.otherInOut;
                // previous line segment in sweepline belongs to the clipping polygon
            }
            else {
                event.inOut = !prev.otherInOut;
                event.otherInOut = prev.isVertical() ? !prev.inOut : prev.inOut;
            }
            // compute prevInResult field
            if (prev) {
                event.prevInResult = (!inResult(prev, operation) || prev.isVertical())
                    ? prev.prevInResult : prev;
            }
        }
        // check if the line segment belongs to the Boolean operation
        event.inResult = inResult(event, operation);
    }
    /* eslint-disable indent */
    function inResult(event, operation) {
        switch (event.type) {
            case NORMAL:
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
            case SAME_TRANSITION:
                return operation === INTERSECTION || operation === UNION;
            case DIFFERENT_TRANSITION:
                return operation === DIFFERENCE;
            case NON_CONTRIBUTING:
                return false;
        }
        return false;
    }
    

    function equals(a, b) {
        if (a[0] === b[0]) {
            if (a[1] === b[1]) {
                return true;
            }
            else {
                return false;
            }
        }
        return false;
    }
    

    function divideSegment(se, p, queue) {
        var r = new SweepEvent(p, false, se, se.isSubject);
        var l = new SweepEvent(p, true, se.otherEvent, se.isSubject);
        /* eslint-disable no-console */
        if (equals(se.point, se.otherEvent.point)) {
            console.warn('what is that, a collapsed segment?', se);
        }
        /* eslint-enable no-console */
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
    }
    

    function intersection(a0x, a0y, a1x, a1y, b0x, b0y, b1x, b1y, I) {
        var vax = a1x - a0x;
        var vay = a1y - a0y;
        var vbx = b1x - b0x;
        var vby = b1y - b0y;
        // segments a0 + s * a1 for s in [0, 1], b0 + t * b1 for t in [0,1]
        var ex = b0x - a0x;
        var ey = b0y - a0y;
        var kross = vax * vby - vay * vbx;
        var sqrKross = kross * kross;
        var sqrLen0 = vax * vax + vay * vay;
        // const sqrLen1 = vbx * vbx + vby * vby;
        if (sqrKross > 0) {
            // lines of the segments are not parallel
            var s = Math.round((ex * vby - ey * vbx) / kross * E_LIMIT) / E_LIMIT;
            // intersection is outside the segment [a0, a1]
            if (s < 0 || s > 1)
                return 0;
            // precision issues
            // else if (s < EPS)     s = 0; 
            // else if (1 - s < EPS) s = 1;
            var t = Math.round((ex * vay - ey * vax) / kross * E_LIMIT) / E_LIMIT;
            // intersection is outside the segment [b0, b1]
            if (t < 0 || t > 1)
                return 0;
            // precision issues
            // else if (t < EPS)     t = 0; 
            // else if (1 - t < EPS) t = 1;
            if (s === 0 || s === 1) {
                // on an endpoint of line segment a
                I[0][0] = a0x + s * vax;
                I[0][1] = a0y + s * vay;
                return 1;
            }
            if (t === 0 || t === 1) {
                // on an endpoint of line segment b
                I[0][0] = b0x + t * vbx;
                I[0][1] = b0y + t * vby;
                return 1;
            }
            // intersection of lines is a point on each segment
            I[0][0] = a0x + s * vax;
            I[0][1] = a0y + s * vay;
            return 1;
        }
        // lines of the segments are parallel
        var sqrLenE = ex * ex + ey * ey;
        kross = ex * vay - ey * vax;
        sqrKross = kross * kross;
        if (sqrKross > EPS * sqrLen0 * sqrLenE) {
            // lines of the segments are different
            return 0;
        }
        // Lines of the segments are the same.  Need to test for overlap of
        // segments.
        var s0 = ((vax * ex) + (vay * ey)) / sqrLen0;
        var s1 = s0 + ((vax * vbx) + (vay * vby)) / sqrLen0;
        var smin = Math.min(s0, s1);
        var smax = Math.max(s0, s1);
        // this is, essentially, the FindIntersection acting on floats from
        // Schneider & Eberly, just inlined into this function.
        if (smin <= 1 && smax >= 0) {
            // overlap on an end point
            if (smin === 1) {
                var c = Math.max(smin, 0);
                I[0][0] = a0x + c * vax;
                I[0][1] = a0y + c * vay;
                return 1;
            }
            if (smax === 0) {
                var c = Math.min(smax, 1);
                I[0][0] = a0x + c * vax;
                I[0][1] = a0y + c * vay;
                return 1;
            }
            // There's overlap on a segment -- two points of intersection. Return both.
            var cmin = Math.max(smin, 0), cmax = Math.min(smax, 1);
            I[0][0] = a0x + cmin * vax;
            I[0][1] = a0y + cmin * vay;
            I[1][0] = a0x + cmax * vax;
            I[1][1] = a0y + cmax * vay;
            return 2;
        }
        return 0;
    }
    

    var intersections = [[0, 0], [0, 0]];
    function possibleIntersection(se1, se2, queue) {
        // that disallows self-intersecting polygons,
        // did cost us half a day, so I'll leave it
        // out of respect
        // if (se1.isSubject === se2.isSubject) return;
        var a = se1.point, b = se1.otherEvent.point, c = se2.point, d = se2.otherEvent.point;
        var nintersections = intersection(a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1], intersections);
        if (nintersections === 0)
            return 0; // no intersection
        // the line segments intersect at an endpoint of both line segments
        if ((nintersections === 1) &&
            (equals(se1.point, se2.point) ||
                equals(se1.otherEvent.point, se2.otherEvent.point))) {
            return 0;
        }
        // best would be to skip it
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
            if (!equals(se1.point, intersections[0]) && !equals(se1.otherEvent.point, intersections[0])) {
                divideSegment(se1, intersections[0], queue);
            }
            // if the intersection point is not an endpoint of se2
            if (!equals(se2.point, intersections[0]) && !equals(se2.otherEvent.point, intersections[0])) {
                divideSegment(se2, intersections[0], queue);
            }
            return 1;
        }
        // The line segments associated to se1 and se2 overlap
        var events = [];
        var leftCoincide = false;
        var rightCoincide = false;
        if (equals(se1.point, se2.point)) {
            leftCoincide = true; // linked
        }
        else if (compareEvents(se1, se2) === 1) {
            events.push(se2, se1);
        }
        else {
            events.push(se1, se2);
        }
        if (equals(se1.otherEvent.point, se2.otherEvent.point)) {
            rightCoincide = true;
        }
        else if (compareEvents(se1.otherEvent, se2.otherEvent) === 1) {
            events.push(se2.otherEvent, se1.otherEvent);
        }
        else {
            events.push(se1.otherEvent, se2.otherEvent);
        }
        if ((leftCoincide && rightCoincide) || leftCoincide) {
            // both line segments are equal or share the left endpoint
            se2.type = NON_CONTRIBUTING;
            se1.type = (se2.inOut === se1.inOut)
                ? SAME_TRANSITION : DIFFERENT_TRANSITION;
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
    }
    

    function compareSegments(le1, le2) {
        if (le1 === le2)
            return 0;
        // Segments are not collinear
        if (signedArea(le1.point, le1.otherEvent.point, le2.point) !== 0 ||
            signedArea(le1.point, le1.otherEvent.point, le2.otherEvent.point) !== 0) {
            // If they share their left endpoint use the right endpoint to sort
            if (equals(le1.point, le2.point))
                return isBelow(le1, le2.otherEvent.point) ? -1 : 1;
            // Different left endpoint: use the left endpoint to sort
            if (le1.point[0] === le2.point[0])
                return le1.point[1] < le2.point[1] ? -1 : 1;
            // has the line segment associated to e1 been inserted
            // into S after the line segment associated to e2 ?
            if (compareEvents(le1, le2) === 1)
                return isBelow(le2, le1.point) ? 1 : -1;
            // The line segment associated to e2 has been inserted
            // into S after the line segment associated to e1
            return isBelow(le1, le2.point) ? -1 : 1;
        }
        if (le1.isSubject === le2.isSubject) { // same polygon
            var p1 = le1.point, p2 = le2.point;
            if (p1[0] === p2[0] && p1[1] === p2[1] /*equals(le1.point, le2.point)*/) {
                p1 = le1.otherEvent.point;
                p2 = le2.otherEvent.point;
                if (p1[0] === p2[0] && p1[1] === p2[1])
                    return 0;
                else
                    return le1.contourId > le2.contourId ? 1 : -1;
            }
        }
        else { // Segments are collinear, but belong to separate polygons
            return le1.isSubject ? -1 : 1;
        }
        return compareEvents(le1, le2) === 1 ? 1 : -1;
    }
    

    function subdivide(eventQueue, subject, clipping, sbbox, cbbox, operation) {
        var sweepLine = new Tree(compareSegments);
        var sortedEvents = [];
        var rightbound = Math.min(sbbox[2], cbbox[2]);
        var prev, next, begin;
        while (eventQueue.length !== 0) {
            var event_1 = eventQueue.pop();
            sortedEvents.push(event_1);
            // optimization by bboxes for intersection and difference goes here
            if ((operation === INTERSECTION && event_1.point[0] > rightbound) ||
                (operation === DIFFERENCE && event_1.point[0] > sbbox[2])) {
                break;
            }
            if (event_1.left) {
                next = prev = sweepLine.insert(event_1);
                begin = sweepLine.minNode();
                if (prev !== begin)
                    prev = sweepLine.prev(prev);
                else
                    prev = null;
                next = sweepLine.next(next);
                var prevEvent = prev ? prev.key : null;
                var prevprevEvent = void 0;
                computeFields(event_1, prevEvent, operation);
                if (next) {
                    if (possibleIntersection(event_1, next.key, eventQueue) === 2) {
                        computeFields(event_1, prevEvent, operation);
                        computeFields(event_1, next.key, operation);
                    }
                }
                if (prev) {
                    if (possibleIntersection(prev.key, event_1, eventQueue) === 2) {
                        var prevprev = prev;
                        if (prevprev !== begin)
                            prevprev = sweepLine.prev(prevprev);
                        else
                            prevprev = null;
                        prevprevEvent = prevprev ? prevprev.key : null;
                        computeFields(prevEvent, prevprevEvent, operation);
                        computeFields(event_1, prevEvent, operation);
                    }
                }
            }
            else {
                event_1 = event_1.otherEvent;
                next = prev = sweepLine.find(event_1);
                if (prev && next) {
                    if (prev !== begin)
                        prev = sweepLine.prev(prev);
                    else
                        prev = null;
                    next = sweepLine.next(next);
                    sweepLine.remove(event_1);
                    if (next && prev) {
                        possibleIntersection(prev.key, next.key, eventQueue);
                    }
                }
            }
        }
        return sortedEvents;
    }
    

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
        }
        // imagine, the right event is found in the beginning of the queue,
        // when his left counterpart is not marked yet
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
    function nextPos(pos, resultEvents, processed, origIndex) {
        console.log(resultEvents);
        var p, p1;
        var newPos = pos + 1;
        var length = resultEvents.length;
        p = resultEvents[pos].point;
        if (newPos < length)
            p1 = resultEvents[newPos].point;
        // while in range and not the current one by value
        while (newPos < length && p1[0] === p[0] && p1[1] === p[1]) {
            if (!processed[newPos]) {
                return newPos;
            }
            else {
                newPos++;
            }
            try {
                p1 = resultEvents[newPos].point;
            }
            catch (e) {
                console.log(e, newPos, resultEvents.length);
            }
        }
        newPos = pos - 1;
        while (processed[newPos] && newPos >= origIndex) {
            newPos--;
        }
        return newPos;
    }
    function connectEdges(sortedEvents, operation) {
        var i, len;
        var resultEvents = orderEvents(sortedEvents);
        // "false"-filled array
        var processed = {};
        var result = [];
        var event;
        for (i = 0, len = resultEvents.length; i < len; i++) {
            if (processed[i])
                continue;
            var contour = [[]];
            if (!resultEvents[i].isExteriorRing) {
                if (operation === DIFFERENCE && !resultEvents[i].isSubject && result.length === 0) {
                    result.push(contour);
                }
                else if (result.length === 0) {
                    result.push([[]]);
                }
                else {
                    result[result.length - 1].push(contour[0]);
                }
            }
            else if (operation === DIFFERENCE && !resultEvents[i].isSubject && result.length > 1) {
                result[result.length - 1].push(contour[0]);
            }
            else {
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
                    event.contourId = ringId;
                }
                else {
                    event.otherEvent.resultInOut = true;
                    event.otherEvent.contourId = ringId;
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
            event.otherEvent.contourId = ringId;
        }
        // Handle if the result is a polygon (eg not multipoly)
        // Commented it again, let's see what do we mean by that
        // if (result.length === 1) result = result[0];
        return result;
    }
    

    function trivialOperation(subject, clipping, operation) {
        var result = null;
        if (subject.length * clipping.length === 0) {
            if (operation === INTERSECTION) {
                result = EMPTY;
            }
            else if (operation === DIFFERENCE) {
                result = subject;
            }
            else if (operation === UNION ||
                operation === XOR) {
                result = (subject.length === 0) ? clipping : subject;
            }
        }
        return result;
    }
    function compareBBoxes(subject, clipping, sbbox, cbbox, operation) {
        var result = null;
        // they are far apart
        if (sbbox[0] > cbbox[2] ||
            cbbox[0] > sbbox[2] ||
            sbbox[1] > cbbox[3] ||
            cbbox[1] > sbbox[3]) {
            if (operation === INTERSECTION) { // no intersection possible
                result = EMPTY;
            }
            else if (operation === DIFFERENCE) { // take the subject
                result = subject;
            }
            else if (operation === UNION ||
                operation === XOR) { // take both
                result = subject.concat(clipping);
            }
        }
        return result;
    }
    function boolean (subject, clipping, operation) {
        // 0. trivial cases
        var trivial = trivialOperation(subject, clipping, operation);
        if (trivial) {
            return trivial === EMPTY ? null : trivial;
        }
        var sbbox = [Infinity, Infinity, -Infinity, -Infinity];
        var cbbox = [Infinity, Infinity, -Infinity, -Infinity];
        var eventQueue = fillQueue(subject, clipping, sbbox, cbbox, operation);
        trivial = compareBBoxes(subject, clipping, sbbox, cbbox, operation);
        if (trivial) {
            return trivial === EMPTY ? null : trivial;
        }
        // 1. subdivide
        //console.time('subdivide edges');
        var sortedEvents = subdivide(eventQueue, subject, clipping, sbbox, cbbox, operation);
        //console.timeEnd('subdivide edges');
        //console.time('connect vertices');
        var result = connectEdges(sortedEvents, operation);
        //console.timeEnd('connect vertices');
        // 2. mark
        // 3. connect
        return result;
    }

    function union(subject, clipping) {
        return boolean(subject, clipping, UNION);
    }
    function diff(subject, clipping) {
        return boolean(subject, clipping, DIFFERENCE);
    }
    function xor(subject, clipping) {
        return boolean(subject, clipping, XOR);
    }
    function intersection$1(subject, clipping) {
        return boolean(subject, clipping, INTERSECTION);
    }
    var operations = { UNION: UNION, DIFFERENCE: DIFFERENCE, INTERSECTION: INTERSECTION, XOR: XOR };
    

    exports.diff = diff;
    exports.intersection = intersection$1;
    exports.operations = operations;
    exports.union = union;
    exports.xor = xor;

    Object.defineProperty(exports, '__esModule', { value: true });

  }));

  });

  var martinez = unwrapExports(martinez_umd);

  let mode = window.location.hash.substring(1);
  let path = '../test/fixtures/';
  let file;

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
    case 'fatal3':
      file = 'fatal3.geojson';
      break;
    case 'fatal4':
      file = 'fatal4.geojson';
      break;
    case 'rectangles':
      file = 'rectangles.geojson';
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
    fetch(path)
      .then((r) => r.json())
      .then((json) => {
          drawnItems.addData(json);
          map.fitBounds(drawnItems.getBounds().pad(0.05), { animate: false });
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

}));
//# sourceMappingURL=bundle.js.map
