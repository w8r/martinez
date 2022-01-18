(function (L, jsts) {
  'use strict';

  L = L && L.hasOwnProperty('default') ? L['default'] : L;
  jsts = jsts && jsts.hasOwnProperty('default') ? jsts['default'] : jsts;

  const CoordinatesControl = L.Control.extend({
    options: {
      position: 'bottomright'
    },

    onAdd: function (map) {
      this._container = L.DomUtil.create('div', 'leaflet-bar');
      this._container.style.background = '#ffffff';
      map.on('mousemove', this._onMouseMove, this);
      return this._container;
    },

    _onMouseMove: function (e) {
      this._container.innerHTML =
        '<span style="padding: 5px">' +
        e.latlng.lng.toFixed(3) +
        ', ' +
        e.latlng.lat.toFixed(3) +
        '</span>';
    }
  });

  const EditControl = L.Control.extend({
      options: {
          position: 'topleft',
          callback: null,
          kind: '',
          html: ''
      },
      onAdd: function (map) {
          const container = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
          const link = L.DomUtil.create('a', '', container);
          link.href = '#';
          link.title = 'Create a new ' + this.options.kind;
          link.innerHTML = this.options.html;
          L.DomEvent.on(link, 'click', L.DomEvent.stop).on(link, 'click', function () {
              // @ts-ignore
              globalThis.LAYER = this.options.callback.call(map.editTools);
          }, this);
          return container;
      }
  });
  const NewPolygonControl = EditControl.extend({
      options: {
          position: 'topleft',
          kind: 'polygon',
          html: '▰',
          callback: () => undefined
      }
  });

  const BooleanControl = L.Control.extend({
    options: {
      position: 'topright',
      callback: () => undefined
    },

    onAdd: function () {
      var container = (this._container = L.DomUtil.create('div', 'leaflet-bar'));
      this._container.style.background = '#ffffff';
      this._container.style.padding = '10px';
      container.innerHTML = `
      <form>
        <ul style="list-style:none; padding-left: 0">
          <li> <label> <input type="radio" name="op" value="0" checked />   Intersection </label> </li>
          <li> <label> <input type="radio" name="op" value="1" />   Union </label> </li>
          <li> <label> <input type="radio" name="op" value="2" />   Difference A - B </label> </li>
          <li> <label> <input type="radio" name="op" value="5" />   Difference B - A </label> </li>
          <li> <label> <input type="radio" name="op" value="3" />   Xor </label> </li>
        </ul>
        <input type="submit" value="Run">
        <input name="clear" type="button" value="Clear layers">
      </form>`;
      var form = container.querySelector('form');
      L.DomEvent.on(
        form,
        'submit',
        function (evt) {
          L.DomEvent.stop(evt);
          var radios = Array.prototype.slice.call(
            form.querySelectorAll('input[type=radio]')
          );
          for (var i = 0, len = radios.length; i < len; i++) {
            if (radios[i].checked) {
              this.options.callback(parseInt(radios[i].value));
              break;
            }
          }
        },
        this
      ).on(
        form.clear,
        'click',
        function (evt) {
          L.DomEvent.stop(evt);
          this.options.clear();
        },
        this
      );

      L.DomEvent.disableClickPropagation(
        this._container
      ).disableScrollPropagation(this._container);
      return this._container;
    }
  });

  function DEFAULT_COMPARE (a, b) { return a > b ? 1 : a < b ? -1 : 0; }

  class SplayTree {

    constructor(compare = DEFAULT_COMPARE, noDuplicates = false) {
      this._compare = compare;
      this._root = null;
      this._size = 0;
      this._noDuplicates = !!noDuplicates;
    }


    rotateLeft(x) {
      var y = x.right;
      if (y) {
        x.right = y.left;
        if (y.left) y.left.parent = x;
        y.parent = x.parent;
      }

      if (!x.parent)                this._root = y;
      else if (x === x.parent.left) x.parent.left = y;
      else                          x.parent.right = y;
      if (y) y.left = x;
      x.parent = y;
    }


    rotateRight(x) {
      var y = x.left;
      if (y) {
        x.left = y.right;
        if (y.right) y.right.parent = x;
        y.parent = x.parent;
      }

      if (!x.parent)               this._root = y;
      else if(x === x.parent.left) x.parent.left = y;
      else                         x.parent.right = y;
      if (y) y.right = x;
      x.parent = y;
    }


    _splay(x) {
      while (x.parent) {
        var p = x.parent;
        if (!p.parent) {
          if (p.left === x) this.rotateRight(p);
          else              this.rotateLeft(p);
        } else if (p.left === x && p.parent.left === p) {
          this.rotateRight(p.parent);
          this.rotateRight(p);
        } else if (p.right === x && p.parent.right === p) {
          this.rotateLeft(p.parent);
          this.rotateLeft(p);
        } else if (p.left === x && p.parent.right === p) {
          this.rotateRight(p);
          this.rotateLeft(p);
        } else {
          this.rotateLeft(p);
          this.rotateRight(p);
        }
      }
    }


    splay(x) {
      var p, gp, ggp, l, r;

      while (x.parent) {
        p = x.parent;
        gp = p.parent;

        if (gp && gp.parent) {
          ggp = gp.parent;
          if (ggp.left === gp) ggp.left  = x;
          else                 ggp.right = x;
          x.parent = ggp;
        } else {
          x.parent = null;
          this._root = x;
        }

        l = x.left; r = x.right;

        if (x === p.left) { // left
          if (gp) {
            if (gp.left === p) {
              /* zig-zig */
              if (p.right) {
                gp.left = p.right;
                gp.left.parent = gp;
              } else gp.left = null;

              p.right   = gp;
              gp.parent = p;
            } else {
              /* zig-zag */
              if (l) {
                gp.right = l;
                l.parent = gp;
              } else gp.right = null;

              x.left    = gp;
              gp.parent = x;
            }
          }
          if (r) {
            p.left = r;
            r.parent = p;
          } else p.left = null;

          x.right  = p;
          p.parent = x;
        } else { // right
          if (gp) {
            if (gp.right === p) {
              /* zig-zig */
              if (p.left) {
                gp.right = p.left;
                gp.right.parent = gp;
              } else gp.right = null;

              p.left = gp;
              gp.parent = p;
            } else {
              /* zig-zag */
              if (r) {
                gp.left = r;
                r.parent = gp;
              } else gp.left = null;

              x.right   = gp;
              gp.parent = x;
            }
          }
          if (l) {
            p.right = l;
            l.parent = p;
          } else p.right = null;

          x.left   = p;
          p.parent = x;
        }
      }
    }


    replace(u, v) {
      if (!u.parent) this._root = v;
      else if (u === u.parent.left) u.parent.left = v;
      else u.parent.right = v;
      if (v) v.parent = u.parent;
    }


    minNode(u = this._root) {
      if (u) while (u.left) u = u.left;
      return u;
    }


    maxNode(u = this._root) {
      if (u) while (u.right) u = u.right;
      return u;
    }


    insert(key, data) {
      var z = this._root;
      var p = null;
      var comp = this._compare;
      var cmp;

      if (this._noDuplicates) {
        while (z) {
          p = z;
          cmp = comp(z.key, key);
          if (cmp === 0) return;
          else if (comp(z.key, key) < 0) z = z.right;
          else z = z.left;
        }
      } else {
        while (z) {
          p = z;
          if (comp(z.key, key) < 0) z = z.right;
          else z = z.left;
        }
      }

      z = { key, data, left: null, right: null, parent: p };

      if (!p)                          this._root = z;
      else if (comp(p.key, z.key) < 0) p.right = z;
      else                             p.left  = z;

      this.splay(z);
      this._size++;
      return z;
    }


    find (key) {
      var z    = this._root;
      var comp = this._compare;
      while (z) {
        var cmp = comp(z.key, key);
        if      (cmp < 0) z = z.right;
        else if (cmp > 0) z = z.left;
        else              return z;
      }
      return null;
    }

    /**
     * Whether the tree contains a node with the given key
     * @param  {Key} key
     * @return {boolean} true/false
     */
    contains (key) {
      var node       = this._root;
      var comparator = this._compare;
      while (node)  {
        var cmp = comparator(key, node.key);
        if      (cmp === 0) return true;
        else if (cmp < 0)   node = node.left;
        else                node = node.right;
      }

      return false;
    }


    remove (key) {
      var z = this.find(key);

      if (!z) return false;

      this.splay(z);

      if (!z.left) this.replace(z, z.right);
      else if (!z.right) this.replace(z, z.left);
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
    }


    removeNode(z) {
      if (!z) return false;

      this.splay(z);

      if (!z.left) this.replace(z, z.right);
      else if (!z.right) this.replace(z, z.left);
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
    }


    erase (key) {
      var z = this.find(key);
      if (!z) return;

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
        if (s) sMax.right = t;
        else   this._root = t;
        t.parent = sMax;
      }

      this._size--;
    }

    /**
     * Removes and returns the node with smallest key
     * @return {?Node}
     */
    pop () {
      var node = this._root, returnValue = null;
      if (node) {
        while (node.left) node = node.left;
        returnValue = { key: node.key, data: node.data };
        this.remove(node.key);
      }
      return returnValue;
    }


    /* eslint-disable class-methods-use-this */

    /**
     * Successor node
     * @param  {Node} node
     * @return {?Node}
     */
    next (node) {
      var successor = node;
      if (successor) {
        if (successor.right) {
          successor = successor.right;
          while (successor && successor.left) successor = successor.left;
        } else {
          successor = node.parent;
          while (successor && successor.right === node) {
            node = successor; successor = successor.parent;
          }
        }
      }
      return successor;
    }


    /**
     * Predecessor node
     * @param  {Node} node
     * @return {?Node}
     */
    prev (node) {
      var predecessor = node;
      if (predecessor) {
        if (predecessor.left) {
          predecessor = predecessor.left;
          while (predecessor && predecessor.right) predecessor = predecessor.right;
        } else {
          predecessor = node.parent;
          while (predecessor && predecessor.left === node) {
            node = predecessor;
            predecessor = predecessor.parent;
          }
        }
      }
      return predecessor;
    }
    /* eslint-enable class-methods-use-this */


    /**
     * @param  {forEachCallback} callback
     * @return {SplayTree}
     */
    forEach(callback) {
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
          } else done = true;
        }
      }
      return this;
    }


    /**
     * Walk key range from `low` to `high`. Stops if `fn` returns a value.
     * @param  {Key}      low
     * @param  {Key}      high
     * @param  {Function} fn
     * @param  {*?}       ctx
     * @return {SplayTree}
     */
    range(low, high, fn, ctx) {
      const Q = [];
      const compare = this._compare;
      let node = this._root, cmp;

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
            if (fn.call(ctx, node)) return this; // stop if smth is returned
          }
          node = node.right;
        }
      }
      return this;
    }

    /**
     * Returns all keys in order
     * @return {Array<Key>}
     */
    keys () {
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
          } else done = true;
        }
      }
      return r;
    }


    /**
     * Returns `data` fields of all nodes in order.
     * @return {Array<Value>}
     */
    values () {
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
          } else done = true;
        }
      }
      return r;
    }


    /**
     * Returns node at given index
     * @param  {number} index
     * @return {?Node}
     */
    at (index) {
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
            if (i === index) return current;
            i++;
            current = current.right;
          } else done = true;
        }
      }
      return null;
    }

    /**
     * Bulk-load items. Both array have to be same size
     * @param  {Array<Key>}    keys
     * @param  {Array<Value>}  [values]
     * @param  {Boolean}       [presort=false] Pre-sort keys and values, using
     *                                         tree's comparator. Sorting is done
     *                                         in-place
     * @return {AVLTree}
     */
    load(keys = [], values = [], presort = false) {
      if (this._size !== 0) throw new Error('bulk-load: tree is not empty');
      const size = keys.length;
      if (presort) sort(keys, values, 0, size - 1, this._compare);
      this._root = loadRecursive(null, keys, values, 0, size);
      this._size = size;
      return this;
    }


    min() {
      var node = this.minNode(this._root);
      if (node) return node.key;
      else      return null;
    }


    max() {
      var node = this.maxNode(this._root);
      if (node) return node.key;
      else      return null;
    }

    isEmpty() { return this._root === null; }
    get size() { return this._size; }


    /**
     * Create a tree and load it with items
     * @param  {Array<Key>}          keys
     * @param  {Array<Value>?}        [values]

     * @param  {Function?}            [comparator]
     * @param  {Boolean?}             [presort=false] Pre-sort keys and values, using
     *                                               tree's comparator. Sorting is done
     *                                               in-place
     * @param  {Boolean?}             [noDuplicates=false]   Allow duplicates
     * @return {SplayTree}
     */
    static createTree(keys, values, comparator, presort, noDuplicates) {
      return new SplayTree(comparator, noDuplicates).load(keys, values, presort);
    }
  }


  function loadRecursive (parent, keys, values, start, end) {
    const size = end - start;
    if (size > 0) {
      const middle = start + Math.floor(size / 2);
      const key    = keys[middle];
      const data   = values[middle];
      const node   = { key, data, parent };
      node.left    = loadRecursive(node, keys, values, start, middle);
      node.right   = loadRecursive(node, keys, values, middle + 1, end);
      return node;
    }
    return null;
  }


  function sort(keys, values, left, right, compare) {
    if (left >= right) return;

    const pivot = keys[(left + right) >> 1];
    let i = left - 1;
    let j = right + 1;

    while (true) {
      do i++; while (compare(keys[i], pivot) < 0);
      do j--; while (compare(keys[j], pivot) > 0);
      if (i >= j) break;

      let tmp = keys[i];
      keys[i] = keys[j];
      keys[j] = tmp;

      tmp = values[i];
      values[i] = values[j];
      values[j] = tmp;
    }

    sort(keys, values,  left,     j, compare);
    sort(keys, values, j + 1, right, compare);
  }

  const NORMAL = 0;
  const NON_CONTRIBUTING = 1;
  const SAME_TRANSITION = 2;
  const DIFFERENT_TRANSITION = 3;

  const INTERSECTION = 0;
  const UNION = 1;
  const DIFFERENCE = 2;
  const XOR = 3;

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
              event.prevInResult =
                  !inResult(prev, operation) || prev.isVertical()
                      ? prev.prevInResult
                      : prev;
          }
      }
      // check if the line segment belongs to the Boolean operation
      let isInResult = inResult(event, operation);
      if (isInResult) {
          event.resultTransition = determineResultTransition(event, operation);
      }
      else {
          event.resultTransition = 0;
      }
  }
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
                      return ((event.isSubject && event.otherInOut) ||
                          (!event.isSubject && !event.otherInOut));
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
  /* eslint-enable indent */
  function determineResultTransition(event, operation) {
      let thisIn = !event.inOut;
      let thatIn = !event.otherInOut;
      let isIn;
      switch (operation) {
          case INTERSECTION:
              isIn = thisIn && thatIn;
              break;
          case UNION:
              isIn = thisIn || thatIn;
              break;
          case XOR:
              isIn = thisIn !== thatIn;
              break;
          case DIFFERENCE:
              if (event.isSubject)
                  isIn = thisIn && !thatIn;
              else
                  isIn = thatIn && !thisIn;
              break;
      }
      return isIn ? +1 : -1;
  }

  class SweepEvent {
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
      constructor(point, left, otherEvent, isSubject) {
          // transition flags
          // In-out transition for the sweepline crossing polygon
          this.inOut = false;
          this.otherInOut = false;
          this.prevInResult = null;
          // Does event belong to result?
          //public inResult: boolean = false;
          // connection step
          this.resultInOut = false;
          this.isExteriorRing = true;
          this.contourId = -1;
          this.resultTransition = 0;
          this.outputContourId = 0;
          this.otherPos = 0;
          this.left = left;
          this.point = point;
          this.otherEvent = otherEvent;
          this.isSubject = isSubject;
          this.type = NORMAL;
          this.inOut = false;
          this.otherInOut = false;
          /**
           * Previous event in result?
           * @type {SweepEvent}
           */
          this.prevInResult = null;
          /**
           * Type of result transition (0 = not in result, +1 = out-in, -1, in-out)
           * @type {Number}
           */
          this.resultTransition = 0;
          // connection step
          /**
           * @type {Number}
           */
          this.otherPos = -1;
          /**
           * @type {Number}
           */
          this.outputContourId = -1;
          this.isExteriorRing = true; // TODO: Looks unused, remove?
      }
      isBelow(p) {
          return isBelow(this, p);
      }
      isAbove(p) {
          return !isBelow(this, p);
      }
      /**
       * @return {Boolean}
       */
      isVertical() {
          return this.point[0] === this.otherEvent.point[0];
      }
      /**
       * Does event belong to result?
       * TODO: make it static
       * @return {Boolean}
       */
      get inResult() {
          return this.resultTransition !== 0;
      }
      clone() {
          const copy = new SweepEvent(this.point, this.left, this.otherEvent, this.isSubject);
          copy.type = this.type;
          copy.resultTransition = this.resultTransition;
          //copy.inResult = this.inResult;
          copy.prevInResult = this.prevInResult;
          copy.isExteriorRing = this.isExteriorRing;
          copy.inOut = this.inOut;
          copy.otherInOut = this.otherInOut;
          return copy;
      }
  }
  function isBelow(e, p) {
      const p0 = e.point, p1 = e.otherEvent.point;
      return e.left
          ? (p0[0] - p[0]) * (p1[1] - p[1]) - (p1[0] - p[0]) * (p0[1] - p[1]) > 0
          : // signedArea(this.point, this.otherEvent.point, p) > 0 :
              (p1[0] - p[0]) * (p0[1] - p[1]) - (p0[0] - p[0]) * (p1[1] - p[1]) > 0;
      //signedArea(this.otherEvent.point, this.point, p) > 0;
  }

  function equals(p1, p2) {
      if (p1[0] === p2[0]) {
          if (p1[1] === p2[1])
              return true;
          return false;
      }
      return false;
  }
  // const EPSILON = 1e-9;
  // const abs = Math.abs;
  // TODO https://github.com/w8r/martinez/issues/6#issuecomment-262847164
  // Precision problem.
  //
  // module.exports = function equals(p1, p2) {
  //   return abs(p1[0] - p2[0]) <= EPSILON && abs(p1[1] - p2[1]) <= EPSILON;
  // };

  const epsilon = 1.1102230246251565e-16;
  const splitter = 134217729;
  const resulterrbound = (3 + 8 * epsilon) * epsilon;

  // fast_expansion_sum_zeroelim routine from oritinal code
  function sum(elen, e, flen, f, h) {
      let Q, Qnew, hh, bvirt;
      let enow = e[0];
      let fnow = f[0];
      let eindex = 0;
      let findex = 0;
      if ((fnow > enow) === (fnow > -enow)) {
          Q = enow;
          enow = e[++eindex];
      } else {
          Q = fnow;
          fnow = f[++findex];
      }
      let hindex = 0;
      if (eindex < elen && findex < flen) {
          if ((fnow > enow) === (fnow > -enow)) {
              Qnew = enow + Q;
              hh = Q - (Qnew - enow);
              enow = e[++eindex];
          } else {
              Qnew = fnow + Q;
              hh = Q - (Qnew - fnow);
              fnow = f[++findex];
          }
          Q = Qnew;
          if (hh !== 0) {
              h[hindex++] = hh;
          }
          while (eindex < elen && findex < flen) {
              if ((fnow > enow) === (fnow > -enow)) {
                  Qnew = Q + enow;
                  bvirt = Qnew - Q;
                  hh = Q - (Qnew - bvirt) + (enow - bvirt);
                  enow = e[++eindex];
              } else {
                  Qnew = Q + fnow;
                  bvirt = Qnew - Q;
                  hh = Q - (Qnew - bvirt) + (fnow - bvirt);
                  fnow = f[++findex];
              }
              Q = Qnew;
              if (hh !== 0) {
                  h[hindex++] = hh;
              }
          }
      }
      while (eindex < elen) {
          Qnew = Q + enow;
          bvirt = Qnew - Q;
          hh = Q - (Qnew - bvirt) + (enow - bvirt);
          enow = e[++eindex];
          Q = Qnew;
          if (hh !== 0) {
              h[hindex++] = hh;
          }
      }
      while (findex < flen) {
          Qnew = Q + fnow;
          bvirt = Qnew - Q;
          hh = Q - (Qnew - bvirt) + (fnow - bvirt);
          fnow = f[++findex];
          Q = Qnew;
          if (hh !== 0) {
              h[hindex++] = hh;
          }
      }
      if (Q !== 0 || hindex === 0) {
          h[hindex++] = Q;
      }
      return hindex;
  }

  function estimate(elen, e) {
      let Q = e[0];
      for (let i = 1; i < elen; i++) Q += e[i];
      return Q;
  }

  function vec(n) {
      return new Float64Array(n);
  }

  const ccwerrboundA = (3 + 16 * epsilon) * epsilon;
  const ccwerrboundB = (2 + 12 * epsilon) * epsilon;
  const ccwerrboundC = (9 + 64 * epsilon) * epsilon * epsilon;

  const B = vec(4);
  const C1 = vec(8);
  const C2 = vec(12);
  const D = vec(16);
  const u = vec(4);

  function orient2dadapt(ax, ay, bx, by, cx, cy, detsum) {
      let acxtail, acytail, bcxtail, bcytail;
      let bvirt, c, ahi, alo, bhi, blo, _i, _j, _0, s1, s0, t1, t0, u3;

      const acx = ax - cx;
      const bcx = bx - cx;
      const acy = ay - cy;
      const bcy = by - cy;

      s1 = acx * bcy;
      c = splitter * acx;
      ahi = c - (c - acx);
      alo = acx - ahi;
      c = splitter * bcy;
      bhi = c - (c - bcy);
      blo = bcy - bhi;
      s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
      t1 = acy * bcx;
      c = splitter * acy;
      ahi = c - (c - acy);
      alo = acy - ahi;
      c = splitter * bcx;
      bhi = c - (c - bcx);
      blo = bcx - bhi;
      t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
      _i = s0 - t0;
      bvirt = s0 - _i;
      B[0] = s0 - (_i + bvirt) + (bvirt - t0);
      _j = s1 + _i;
      bvirt = _j - s1;
      _0 = s1 - (_j - bvirt) + (_i - bvirt);
      _i = _0 - t1;
      bvirt = _0 - _i;
      B[1] = _0 - (_i + bvirt) + (bvirt - t1);
      u3 = _j + _i;
      bvirt = u3 - _j;
      B[2] = _j - (u3 - bvirt) + (_i - bvirt);
      B[3] = u3;

      let det = estimate(4, B);
      let errbound = ccwerrboundB * detsum;
      if (det >= errbound || -det >= errbound) {
          return det;
      }

      bvirt = ax - acx;
      acxtail = ax - (acx + bvirt) + (bvirt - cx);
      bvirt = bx - bcx;
      bcxtail = bx - (bcx + bvirt) + (bvirt - cx);
      bvirt = ay - acy;
      acytail = ay - (acy + bvirt) + (bvirt - cy);
      bvirt = by - bcy;
      bcytail = by - (bcy + bvirt) + (bvirt - cy);

      if (acxtail === 0 && acytail === 0 && bcxtail === 0 && bcytail === 0) {
          return det;
      }

      errbound = ccwerrboundC * detsum + resulterrbound * Math.abs(det);
      det += (acx * bcytail + bcy * acxtail) - (acy * bcxtail + bcx * acytail);
      if (det >= errbound || -det >= errbound) return det;

      s1 = acxtail * bcy;
      c = splitter * acxtail;
      ahi = c - (c - acxtail);
      alo = acxtail - ahi;
      c = splitter * bcy;
      bhi = c - (c - bcy);
      blo = bcy - bhi;
      s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
      t1 = acytail * bcx;
      c = splitter * acytail;
      ahi = c - (c - acytail);
      alo = acytail - ahi;
      c = splitter * bcx;
      bhi = c - (c - bcx);
      blo = bcx - bhi;
      t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
      _i = s0 - t0;
      bvirt = s0 - _i;
      u[0] = s0 - (_i + bvirt) + (bvirt - t0);
      _j = s1 + _i;
      bvirt = _j - s1;
      _0 = s1 - (_j - bvirt) + (_i - bvirt);
      _i = _0 - t1;
      bvirt = _0 - _i;
      u[1] = _0 - (_i + bvirt) + (bvirt - t1);
      u3 = _j + _i;
      bvirt = u3 - _j;
      u[2] = _j - (u3 - bvirt) + (_i - bvirt);
      u[3] = u3;
      const C1len = sum(4, B, 4, u, C1);

      s1 = acx * bcytail;
      c = splitter * acx;
      ahi = c - (c - acx);
      alo = acx - ahi;
      c = splitter * bcytail;
      bhi = c - (c - bcytail);
      blo = bcytail - bhi;
      s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
      t1 = acy * bcxtail;
      c = splitter * acy;
      ahi = c - (c - acy);
      alo = acy - ahi;
      c = splitter * bcxtail;
      bhi = c - (c - bcxtail);
      blo = bcxtail - bhi;
      t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
      _i = s0 - t0;
      bvirt = s0 - _i;
      u[0] = s0 - (_i + bvirt) + (bvirt - t0);
      _j = s1 + _i;
      bvirt = _j - s1;
      _0 = s1 - (_j - bvirt) + (_i - bvirt);
      _i = _0 - t1;
      bvirt = _0 - _i;
      u[1] = _0 - (_i + bvirt) + (bvirt - t1);
      u3 = _j + _i;
      bvirt = u3 - _j;
      u[2] = _j - (u3 - bvirt) + (_i - bvirt);
      u[3] = u3;
      const C2len = sum(C1len, C1, 4, u, C2);

      s1 = acxtail * bcytail;
      c = splitter * acxtail;
      ahi = c - (c - acxtail);
      alo = acxtail - ahi;
      c = splitter * bcytail;
      bhi = c - (c - bcytail);
      blo = bcytail - bhi;
      s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
      t1 = acytail * bcxtail;
      c = splitter * acytail;
      ahi = c - (c - acytail);
      alo = acytail - ahi;
      c = splitter * bcxtail;
      bhi = c - (c - bcxtail);
      blo = bcxtail - bhi;
      t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
      _i = s0 - t0;
      bvirt = s0 - _i;
      u[0] = s0 - (_i + bvirt) + (bvirt - t0);
      _j = s1 + _i;
      bvirt = _j - s1;
      _0 = s1 - (_j - bvirt) + (_i - bvirt);
      _i = _0 - t1;
      bvirt = _0 - _i;
      u[1] = _0 - (_i + bvirt) + (bvirt - t1);
      u3 = _j + _i;
      bvirt = u3 - _j;
      u[2] = _j - (u3 - bvirt) + (_i - bvirt);
      u[3] = u3;
      const Dlen = sum(C2len, C2, 4, u, D);

      return D[Dlen - 1];
  }

  function orient2d(ax, ay, bx, by, cx, cy) {
      const detleft = (ay - cy) * (bx - cx);
      const detright = (ax - cx) * (by - cy);
      const det = detleft - detright;

      if (detleft === 0 || detright === 0 || (detleft > 0) !== (detright > 0)) return det;

      const detsum = Math.abs(detleft + detright);
      if (Math.abs(det) >= ccwerrboundA * detsum) return det;

      return -orient2dadapt(ax, ay, bx, by, cx, cy, detsum);
  }

  /**
   * Signed area of the triangle (p0, p1, p2)
   * @param  {Array.<Number>} p0
   * @param  {Array.<Number>} p1
   * @param  {Array.<Number>} p2
   * @return {Number}
   */
  function signedArea(p0, p1, p2) {
      const res = orient2d(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1]);
      if (res > 0)
          return -1;
      if (res < 0)
          return 1;
      return 0;
  }

  /**
   * @param  {SweepEvent} e1
   * @param  {SweepEvent} e2
   * @return {Number}
   */
  function compareEvents(e1, e2) {
      const p1 = e1.point;
      const p2 = e2.point;
      // Different x-coordinate
      if (p1[0] > p2[0])
          return 1;
      if (p1[0] < p2[0])
          return -1;
      // Different points, but same x-coordinate
      // Event with lower y-coordinate is processed first
      if (p1[1] !== p2[1])
          return p1[1] > p2[1] ? 1 : -1;
      return specialCases(e1, e2, p1 /*, p2 */);
  }
  /* eslint-disable no-unused-vars */
  function specialCases(e1, e2, p1 /*, p2: Point */) {
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
          return !isBelow(e1, e2.otherEvent.point) ? 1 : -1;
      }
      return !e1.isSubject && e2.isSubject ? 1 : -1;
  }
  /* eslint-enable no-unused-vars */

  function divideSegment(se, p, queue) {
      const r = new SweepEvent(p, false, se, se.isSubject);
      const l = new SweepEvent(p, true, se.otherEvent, se.isSubject);
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

  //const EPS = 1e-9;
  /**
   * Finds the magnitude of the cross product of two vectors (if we pretend
   * they're in three dimensions)
   */
  const crossProduct = (ax, ay, bx, by) => ax * by - ay * bx;
  /**
   * Finds the dot product of two vectors.
   */
  const dotProduct = (ax, ay, bx, by) => ax * bx + ay * by;
  const toPoint = (px, py, s, dx, dy) => [
      px + s * dx,
      py + s * dy
  ];
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
  function intersection (a1, a2, b1, b2, noEndpointTouch) {
      // The algorithm expects our lines in the form P + sd, where P is a point,
      // s is on the interval [0, 1], and d is a vector.
      // We are passed two points. P can be the first point of each pair. The
      // vector, then, could be thought of as the distance (in x and y components)
      // from the first point to the second point.
      // So first, let's make our vectors:
      const vax = a2[0] - a1[0];
      const vay = a2[1] - a1[1];
      const vbx = b2[0] - b1[0];
      const vby = b2[1] - b1[1];
      // We also define a function to convert back to regular point form:
      // The rest is pretty much a straight port of the algorithm.
      const ex = b1[0] - a1[0];
      const ey = b1[1] - a1[1];
      let kross = crossProduct(vax, vay, vbx, vby);
      let sqrKross = kross * kross;
      const sqrLenA = dotProduct(vax, vay, vax, vay);
      //const sqrLenB  = dotProduct(vb, vb);
      // Check for line intersection. This works because of the properties of the
      // cross product -- specifically, two vectors are parallel if and only if the
      // cross product is the 0 vector. The full calculation involves relative error
      // to account for possible very small line segments. See Schneider & Eberly
      // for details.
      if (sqrKross > 0 /* EPS * sqrLenB * sqLenA */) {
          // If they're not parallel, then (because these are line segments) they
          // still might not actually intersect. This code checks that the
          // intersection point of the lines is actually on both line segments.
          const s = crossProduct(ex, ey, vbx, vby) / kross;
          if (s < 0 || s > 1) {
              // not on line segment a
              return null;
          }
          const t = crossProduct(ex, ey, vax, vay) / kross;
          if (t < 0 || t > 1) {
              // not on line segment b
              return null;
          }
          if (s === 0 || s === 1) {
              // on an endpoint of line segment a
              return noEndpointTouch ? null : [toPoint(a1[0], a1[1], s, vax, vay)];
          }
          if (t === 0 || t === 1) {
              // on an endpoint of line segment b
              return noEndpointTouch ? null : [toPoint(b1[0], b1[1], t, vbx, vby)];
          }
          return [toPoint(a1[0], a1[1], s, vax, vay)];
      }
      // If we've reached this point, then the lines are either parallel or the
      // same, but the segments could overlap partially or fully, or not at all.
      // So we need to find the overlap, if any. To do that, we can use e, which is
      // the (vector) difference between the two initial points. If this is parallel
      // with the line itself, then the two lines are the same line, and there will
      // be overlap.
      //const sqrLenE = dotProduct(e, e);
      kross = crossProduct(ex, ey, vax, vay);
      sqrKross = kross * kross;
      if (sqrKross > 0 /* EPS * sqLenB * sqLenE */) {
          // Lines are just parallel, not the same. No overlap.
          return null;
      }
      const sa = dotProduct(vax, vay, ex, ey) / sqrLenA;
      const sb = sa + dotProduct(vax, vay, vbx, vby) / sqrLenA;
      const smin = Math.min(sa, sb);
      const smax = Math.max(sa, sb);
      // this is, essentially, the FindIntersection acting on floats from
      // Schneider & Eberly, just inlined into this function.
      if (smin <= 1 && smax >= 0) {
          // overlap on an end point
          if (smin === 1) {
              return noEndpointTouch
                  ? null
                  : [toPoint(a1[0], a1[1], smin > 0 ? smin : 0, vax, vay)];
          }
          if (smax === 0) {
              return noEndpointTouch
                  ? null
                  : [toPoint(a1[0], a1[1], smax < 1 ? smax : 1, vax, vay)];
          }
          if (noEndpointTouch && smin === 0 && smax === 1)
              return null;
          // There's overlap on a segment -- two points of intersection. Return both.
          return [
              toPoint(a1[0], a1[1], smin > 0 ? smin : 0, vax, vay),
              toPoint(a1[0], a1[1], smax < 1 ? smax : 1, vax, vay)
          ];
      }
      return null;
  }

  /**
   * @param  {SweepEvent} se1
   * @param  {SweepEvent} se2
   * @param  {Queue}      queue
   * @return {Number}
   */
  function possibleIntersection(se1, se2, queue) {
      // that disallows self-intersecting polygons,
      // did cost us half a day, so I'll leave it
      // out of respect
      // if (se1.isSubject === se2.isSubject) return;
      const inter = intersection(se1.point, se1.otherEvent.point, se2.point, se2.otherEvent.point, false);
      // simplify intersection result type
      const nintersections = inter ? inter.length : 0;
      if (nintersections === 0)
          return 0; // no intersection
      // the line segments intersect at an endpoint of both line segments
      if (nintersections === 1 &&
          (equals(se1.point, se2.point) ||
              equals(se1.otherEvent.point, se2.otherEvent.point)))
          return 0;
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
          // @ts-ignore;
          const i0 = inter[0];
          // if the intersection point is not an endpoint of se1
          if (!equals(se1.point, i0) && !equals(se1.otherEvent.point, i0)) {
              divideSegment(se1, i0, queue);
          }
          // if the intersection point is not an endpoint of se2
          if (!equals(se2.point, i0) && !equals(se2.otherEvent.point, i0)) {
              divideSegment(se2, i0, queue);
          }
          return 1;
      }
      // The line segments associated to se1 and se2 overlap
      const events = [];
      let leftCoincide = false;
      let rightCoincide = false;
      // linked
      if (equals(se1.point, se2.point))
          leftCoincide = true;
      else if (compareEvents(se1, se2) === 1)
          events.push(se2, se1);
      else
          events.push(se1, se2);
      if (equals(se1.otherEvent.point, se2.otherEvent.point))
          rightCoincide = true;
      else if (compareEvents(se1.otherEvent, se2.otherEvent) === 1) {
          events.push(se2.otherEvent, se1.otherEvent);
      }
      else {
          events.push(se1.otherEvent, se2.otherEvent);
      }
      if ((leftCoincide && rightCoincide) || leftCoincide) {
          // both line segments are equal or share the left endpoint
          se2.type = NON_CONTRIBUTING;
          se1.type = se2.inOut === se1.inOut ? SAME_TRANSITION : DIFFERENT_TRANSITION;
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

  /**
   * @param  {SweepEvent} le1
   * @param  {SweepEvent} le2
   * @return {Number}
   */
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
              return le2.isAbove(le1.point) ? -1 : 1;
          // The line segment associated to e2 has been inserted
          // into S after the line segment associated to e1
          return isBelow(le1, le2.point) ? -1 : 1;
      }
      if (le1.isSubject === le2.isSubject) {
          // same polygon
          let p1 = le1.point, p2 = le2.point;
          if (p1[0] === p2[0] && p1[1] === p2[1] /*equals(le1.point, le2.point)*/) {
              p1 = le1.otherEvent.point;
              p2 = le2.otherEvent.point;
              if (p1[0] === p2[0] && p1[1] === p2[1])
                  return 0;
              else
                  return le1.contourId > le2.contourId ? 1 : -1;
          }
      }
      else {
          // Segments are collinear, but belong to separate polygons
          return le1.isSubject ? -1 : 1;
      }
      return compareEvents(le1, le2) === 1 ? 1 : -1;
  }

  function subdivide(eventQueue, sbbox, cbbox, operation) {
      const sweepLine = new SplayTree(compareSegments);
      const sortedEvents = [];
      const rightbound = Math.min(sbbox[2], cbbox[2]);
      let prev, next, begin = sweepLine.minNode();
      while (eventQueue.length !== 0) {
          let event = eventQueue.pop();
          sortedEvents.push(event);
          // optimization by bboxes for intersection and difference goes here
          if ((operation === INTERSECTION && event.point[0] > rightbound) ||
              (operation === DIFFERENCE && event.point[0] > sbbox[2])) {
              break;
          }
          if (event.left) {
              next = prev = sweepLine.insert(event);
              begin = sweepLine.minNode();
              if (prev !== begin)
                  prev = sweepLine.prev(prev);
              else
                  prev = null;
              next = sweepLine.next(next);
              const prevEvent = prev ? prev.key : null;
              let prevprevEvent;
              computeFields(event, prevEvent, operation);
              if (next) {
                  if (possibleIntersection(event, next.key, eventQueue) === 2) {
                      computeFields(event, prevEvent, operation);
                      computeFields(event, next.key, operation);
                  }
              }
              if (prev) {
                  if (possibleIntersection(prev.key, event, eventQueue) === 2) {
                      let prevprev = prev;
                      if (prevprev !== begin)
                          prevprev = sweepLine.prev(prevprev);
                      else
                          prevprev = null;
                      prevprevEvent = prevprev ? prevprev.key : null;
                      computeFields(prevEvent, prevprevEvent, operation);
                      computeFields(event, prevEvent, operation);
                  }
              }
          }
          else {
              event = event.otherEvent;
              next = prev = sweepLine.find(event);
              if (prev && next) {
                  if (prev !== begin)
                      prev = sweepLine.prev(prev);
                  else
                      prev = null;
                  next = sweepLine.next(next);
                  sweepLine.remove(event);
                  if (next && prev) {
                      possibleIntersection(prev.key, next.key, eventQueue);
                  }
              }
          }
      }
      return sortedEvents;
  }

  class Contour {
      constructor() {
          this.points = [];
          this.holeIds = [];
          this.holeOf = null;
          this.depth = 0;
      }
      isExterior() {
          return this.holeOf === null;
      }
  }

  const EmptyPoint = [0, 0];
  function orderEvents(sortedEvents) {
      const resultEvents = [];
      for (let i = 0, len = sortedEvents.length; i < len; i++) {
          const event = sortedEvents[i];
          if ((event.left && event.inResult) ||
              (!event.left && event.otherEvent.inResult)) {
              resultEvents.push(event);
          }
      }
      // Due to overlapping edges the resultEvents array can be not wholly sorted
      let sorted = false;
      while (!sorted) {
          sorted = true;
          for (let i = 0, len = resultEvents.length; i < len; i++) {
              if (i + 1 < len &&
                  compareEvents(resultEvents[i], resultEvents[i + 1]) === 1) {
                  const tmp = resultEvents[i];
                  resultEvents[i] = resultEvents[i + 1];
                  resultEvents[i + 1] = tmp;
                  sorted = false;
              }
          }
      }
      for (let i = 0, len = resultEvents.length; i < len; i++) {
          resultEvents[i].otherPos = i;
      }
      // imagine, the right event is found in the beginning of the queue,
      // when his left counterpart is not marked yet
      for (let i = 0, len = resultEvents.length; i < len; i++) {
          const event = resultEvents[i];
          if (!event.left) {
              const tmp = event.otherPos;
              event.otherPos = event.otherEvent.otherPos;
              event.otherEvent.otherPos = tmp;
          }
      }
      return resultEvents;
  }
  function nextPos(pos, resultEvents, processed, origPos) {
      let newPos = pos + 1;
      const p = resultEvents[pos].point;
      let p1 = EmptyPoint;
      const length = resultEvents.length;
      if (newPos < length)
          p1 = resultEvents[newPos].point;
      while (newPos < length && p1[0] === p[0] && p1[1] === p[1]) {
          if (!processed.has(newPos))
              return newPos;
          else
              newPos++;
          p1 = resultEvents[newPos].point;
      }
      newPos = pos - 1;
      while (processed.has(newPos) && newPos > origPos)
          newPos--;
      return newPos;
  }
  function initializeContourFromContext(event, contours, contourId) {
      const contour = new Contour();
      if (event.prevInResult != null) {
          const prevInResult = event.prevInResult;
          // Note that it is valid to query the "previous in result" for its output contour id,
          // because we must have already processed it (i.e., assigned an output contour id)
          // in an earlier iteration, otherwise it wouldn't be possible that it is "previous in
          // result".
          const lowerContourId = prevInResult.outputContourId;
          const lowerResultTransition = prevInResult.resultTransition;
          if (lowerResultTransition > 0) {
              // We are inside. Now we have to check if the thing below us is another hole or
              // an exterior contour.
              const lowerContour = contours[lowerContourId];
              if (lowerContour.holeOf != null) {
                  // The lower contour is a hole => Connect the new contour as a hole to its parent,
                  // and use same depth.
                  const parentContourId = lowerContour.holeOf;
                  contours[parentContourId].holeIds.push(contourId);
                  contour.holeOf = parentContourId;
                  contour.depth = contours[lowerContourId].depth;
              }
              else {
                  // The lower contour is an exterior contour => Connect the new contour as a hole,
                  // and increment depth.
                  contours[lowerContourId].holeIds.push(contourId);
                  contour.holeOf = lowerContourId;
                  contour.depth = contours[lowerContourId].depth + 1;
              }
          }
          else {
              // We are outside => this contour is an exterior contour of same depth.
              contour.holeOf = null;
              contour.depth = contours[lowerContourId].depth;
          }
      }
      else {
          // There is no lower/previous contour => this contour is an exterior contour of depth 0.
          contour.holeOf = null;
          contour.depth = 0;
      }
      return contour;
  }
  /**
   * @return {Array.<*>} polygons
   */
  function connectEdges(sortedEvents) {
      const resultEvents = orderEvents(sortedEvents);
      // "false"-filled array
      const processed = new Set();
      const contours = [];
      for (let i = 0, len = resultEvents.length; i < len; i++) {
          if (processed.has(i))
              continue;
          const contourId = contours.length;
          const contour = initializeContourFromContext(resultEvents[i], contours, contourId);
          // Helper function that combines marking an event as processed with assigning its output contour ID
          const markAsProcessed = (pos) => {
              processed.add(pos);
              resultEvents[pos].outputContourId = contourId;
          };
          let pos = i;
          let origPos = i;
          const initial = resultEvents[i].point;
          contour.points.push(initial);
          /* eslint no-constant-condition: "off" */
          while (true) {
              markAsProcessed(pos);
              pos = resultEvents[pos].otherPos;
              markAsProcessed(pos);
              contour.points.push(resultEvents[pos].point);
              pos = nextPos(pos, resultEvents, processed, origPos);
              if (pos === origPos)
                  break;
          }
          contours.push(contour);
      }
      return contours;
  }

  class TinyQueue {
      constructor(data = [], compare = defaultCompare) {
          this.data = data;
          this.length = this.data.length;
          this.compare = compare;

          if (this.length > 0) {
              for (let i = (this.length >> 1) - 1; i >= 0; i--) this._down(i);
          }
      }

      push(item) {
          this.data.push(item);
          this.length++;
          this._up(this.length - 1);
      }

      pop() {
          if (this.length === 0) return undefined;

          const top = this.data[0];
          const bottom = this.data.pop();
          this.length--;

          if (this.length > 0) {
              this.data[0] = bottom;
              this._down(0);
          }

          return top;
      }

      peek() {
          return this.data[0];
      }

      _up(pos) {
          const {data, compare} = this;
          const item = data[pos];

          while (pos > 0) {
              const parent = (pos - 1) >> 1;
              const current = data[parent];
              if (compare(item, current) >= 0) break;
              data[pos] = current;
              pos = parent;
          }

          data[pos] = item;
      }

      _down(pos) {
          const {data, compare} = this;
          const halfLength = this.length >> 1;
          const item = data[pos];

          while (pos < halfLength) {
              let left = (pos << 1) + 1;
              let best = data[left];
              const right = left + 1;

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
  }

  function defaultCompare(a, b) {
      return a < b ? -1 : a > b ? 1 : 0;
  }

  const max = Math.max;
  const min = Math.min;
  let contourId = 0;
  function processPolygon(contourOrHole, isSubject, depth, Q, bbox, isExteriorRing) {
      for (let i = 0, len = contourOrHole.length - 1; i < len; i++) {
          const s1 = contourOrHole[i];
          const s2 = contourOrHole[i + 1];
          const e1 = new SweepEvent(s1, false, null, isSubject);
          const e2 = new SweepEvent(s2, false, e1, isSubject);
          e1.otherEvent = e2;
          // skip collapsed edges, or it breaks
          if (s1[0] === s2[0] && s1[1] === s2[1])
              continue;
          e1.contourId = e2.contourId = depth;
          if (!isExteriorRing) {
              e1.isExteriorRing = false;
              e2.isExteriorRing = false;
          }
          if (compareEvents(e1, e2) > 0)
              e2.left = true;
          else
              e1.left = true;
          const [x, y] = s1;
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
  function fillQueue(subject, clipping, sbbox, cbbox, operation) {
      const eventQueue = new TinyQueue(undefined, compareEvents);
      let polygonSet, isExteriorRing; //, k, kk;
      for (let i = 0, ii = subject.length; i < ii; i++) {
          polygonSet = subject[i];
          for (let j = 0, jj = polygonSet.length; j < jj; j++) {
              isExteriorRing = j === 0;
              if (isExteriorRing)
                  contourId++;
              processPolygon(polygonSet[j], true, contourId, eventQueue, sbbox, isExteriorRing);
          }
      }
      for (let i = 0, ii = clipping.length; i < ii; i++) {
          polygonSet = clipping[i];
          for (let j = 0, jj = polygonSet.length; j < jj; j++) {
              isExteriorRing = j === 0;
              if (operation === DIFFERENCE)
                  isExteriorRing = false;
              if (isExteriorRing)
                  contourId++;
              processPolygon(polygonSet[j], false, contourId, eventQueue, cbbox, isExteriorRing);
          }
      }
      return eventQueue;
  }

  const EMPTY = [];

  function trivialOperation(subject, clipping, operation) {
      if (subject.length * clipping.length === 0) {
          if (operation === INTERSECTION)
              return EMPTY;
          if (operation === DIFFERENCE)
              return subject;
          if (operation === UNION || operation === XOR) {
              return subject.length === 0 ? clipping : subject;
          }
      }
      return null;
  }
  function checkOverlap(subject, clipping, sbbox, cbbox, operation) {
      if (sbbox[0] > cbbox[2] ||
          cbbox[0] > sbbox[2] ||
          sbbox[1] > cbbox[3] ||
          cbbox[1] > sbbox[3]) {
          if (operation === INTERSECTION)
              return EMPTY;
          if (operation === DIFFERENCE)
              return subject;
          if (operation === UNION || operation === XOR)
              return subject.concat(clipping);
      }
      return null;
  }
  function boolean(subject, clipping, operation) {
      const s = typeof subject[0][0][0] === 'number'
          ? [subject]
          : subject;
      const c = typeof clipping[0][0][0] === 'number'
          ? [clipping]
          : clipping;
      let trivial = trivialOperation(s, c, operation);
      if (trivial)
          return trivial === EMPTY ? null : trivial;
      const sbbox = [Infinity, Infinity, -Infinity, -Infinity];
      const cbbox = [Infinity, Infinity, -Infinity, -Infinity];
      // console.time('fill queue');
      const eventQueue = fillQueue(s, c, sbbox, cbbox, operation);
      //console.timeEnd('fill queue');
      trivial = checkOverlap(s, c, sbbox, cbbox, operation);
      if (trivial)
          return trivial === EMPTY ? null : trivial;
      // console.time('subdivide edges');
      const sortedEvents = subdivide(eventQueue, sbbox, cbbox, operation);
      //console.timeEnd('subdivide edges');
      // console.time('connect vertices');
      const contours = connectEdges(sortedEvents);
      //console.timeEnd('connect vertices');
      // Convert contours to polygons
      const polygons = [];
      for (let i = 0; i < contours.length; i++) {
          const contour = contours[i];
          if (contour.isExterior()) {
              // The exterior ring goes first
              const rings = [contour.points];
              // Followed by holes if any
              for (let j = 0; j < contour.holeIds.length; j++) {
                  const holeId = contour.holeIds[j];
                  rings.push(contours[holeId].points);
              }
              polygons.push(rings);
          }
      }
      return polygons;
  }

  const union = (subject, clipping) => boolean(subject, clipping, UNION);
  const diff = (subject, clipping) => boolean(subject, clipping, DIFFERENCE);
  const xor = (subject, clipping) => boolean(subject, clipping, XOR);
  const intersection$1 = (subject, clipping) => boolean(subject, clipping, INTERSECTION);

  // import * as martinez from '../../dist/martinez.min';
  let mode = globalThis.location.hash.substring(1);
  let path = 'data/';
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
      UNION: 1,
      DIFFERENCE: 2,
      XOR: 3
  };
  var div = document.createElement('div');
  div.id = 'image-map';
  div.style.width = div.style.height = '100%';
  document.body.appendChild(div);
  // create the slippy map
  // @ts-ignore
  var map = (globalThis.map = L.map('image-map', {
      minZoom: 1,
      maxZoom: 20,
      center: [0, 0],
      zoom: 2,
      crs: mode === 'geo'
          ? L.CRS.EPSG4326
          : L.extend({}, L.CRS.Simple, {
              transformation: new L.Transformation(1 / 8, 0, -1 / 8, 0)
          }),
      editable: true
  }));
  map.addControl(new NewPolygonControl({
      // @ts-ignore
      callback: map.editTools.startPolygon
  }));
  // @ts-ignore
  map.addControl(new CoordinatesControl());
  map.addControl(new BooleanControl({
      // @ts-ignore
      callback: run,
      clear
  }));
  // @ts-ignore
  var drawnItems = (globalThis.drawnItems = L.geoJSON().addTo(map));
  var rawData = null;
  function loadData(path) {
      console.log(path);
      fetch(path)
          .then((r) => r.json())
          .then((json) => {
          drawnItems.addData(json);
          rawData = json;
          map.fitBounds(drawnItems.getBounds().pad(0.05), { animate: false });
      });
  }
  function clear() {
      drawnItems.clearLayers();
      results.clearLayers();
      rawData = null;
  }
  var reader = new jsts.io.GeoJSONReader();
  var writer = new jsts.io.GeoJSONWriter();
  function getClippingPoly(layers) {
      // @ts-ignore
      if (rawData && rawData.features && rawData.features.length > 1)
          return rawData.features[1];
      return layers[1].toGeoJSON();
  }
  function run(op) {
      var layers = drawnItems.getLayers();
      if (layers.length < 2)
          return;
      // @ts-ignore
      var subject = rawData !== null ? rawData.features[0] : layers[0].toGeoJSON();
      var clipping = getClippingPoly(layers);
      //console.log('input', subject, clipping, op);
      // subject  = JSON.parse(JSON.stringify(subject));
      // clipping = JSON.parse(JSON.stringify(clipping));
      var operation;
      if (op === OPERATIONS.INTERSECTION) {
          operation = intersection$1;
      }
      else if (op === OPERATIONS.UNION) {
          operation = union;
      }
      else if (op === OPERATIONS.DIFFERENCE) {
          operation = diff;
      }
      else if (op === 5) {
          // B - A
          operation = diff;
          var temp = subject;
          subject = clipping;
          clipping = temp;
      }
      else {
          operation = xor;
      }
      console.time('martinez');
      var result = operation(subject.geometry.coordinates, clipping.geometry.coordinates);
      console.timeEnd('martinez');
      console.log('result', result);
      // console.log(JSON.stringify(result));
      results.clearLayers();
      if (result !== null) {
          results.addData({
              type: 'Feature',
              geometry: {
                  type: 'MultiPolygon',
                  coordinates: result
              }
          });
          setTimeout(function () {
              console.time('jsts');
              var s = reader.read(subject);
              var c = reader.read(clipping);
              var res;
              if (op === OPERATIONS.INTERSECTION) {
                  // @ts-ignore
                  res = s.geometry.intersection(c.geometry);
              }
              else if (op === OPERATIONS.UNION) {
                  // @ts-ignore
                  res = s.geometry.union(c.geometry);
              }
              else if (op === OPERATIONS.DIFFERENCE) {
                  // @ts-ignore
                  res = s.geometry.difference(c.geometry);
              }
              else {
                  // @ts-ignore
                  res = s.geometry.symDifference(c.geometry);
              }
              res = writer.write(res);
              console.timeEnd('jsts');
              // console.log('JSTS result', res);
          }, 500);
      }
  }
  map.on('editable:created', function (evt) {
      drawnItems.addLayer(evt.layer);
      evt.layer.on('click', function (e) {
          if (
          // @ts-ignore
          (e.originalEvent.ctrlKey || e.originalEvent.metaKey) &&
              this.editEnabled()) {
              // @ts-ignore
              this.editor.newHole(e.latlng);
          }
      });
  });
  // @ts-ignore
  var results = (globalThis.results = L.geoJson(null, {
      style: function () {
          return {
              color: 'red',
              weight: 1
          };
      }
  }).addTo(map));
  loadData(path + file);

}(L, jsts));
