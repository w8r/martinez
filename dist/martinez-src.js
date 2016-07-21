(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./src/');

},{"./src/":10}],2:[function(require,module,exports){
module.exports = {
    RBTree: require('./lib/rbtree'),
    BinTree: require('./lib/bintree')
};

},{"./lib/bintree":3,"./lib/rbtree":4}],3:[function(require,module,exports){

var TreeBase = require('./treebase');

function Node(data) {
    this.data = data;
    this.left = null;
    this.right = null;
}

Node.prototype.get_child = function(dir) {
    return dir ? this.right : this.left;
};

Node.prototype.set_child = function(dir, val) {
    if(dir) {
        this.right = val;
    }
    else {
        this.left = val;
    }
};

function BinTree(comparator) {
    this._root = null;
    this._comparator = comparator;
    this.size = 0;
}

BinTree.prototype = new TreeBase();

// returns true if inserted, false if duplicate
BinTree.prototype.insert = function(data) {
    if(this._root === null) {
        // empty tree
        this._root = new Node(data);
        this.size++;
        return true;
    }

    var dir = 0;

    // setup
    var p = null; // parent
    var node = this._root;

    // search down
    while(true) {
        if(node === null) {
            // insert new node at the bottom
            node = new Node(data);
            p.set_child(dir, node);
            ret = true;
            this.size++;
            return true;
        }

        // stop if found
        if(this._comparator(node.data, data) === 0) {
            return false;
        }

        dir = this._comparator(node.data, data) < 0;

        // update helpers
        p = node;
        node = node.get_child(dir);
    }
};

// returns true if removed, false if not found
BinTree.prototype.remove = function(data) {
    if(this._root === null) {
        return false;
    }

    var head = new Node(undefined); // fake tree root
    var node = head;
    node.right = this._root;
    var p = null; // parent
    var found = null; // found item
    var dir = 1;

    while(node.get_child(dir) !== null) {
        p = node;
        node = node.get_child(dir);
        var cmp = this._comparator(data, node.data);
        dir = cmp > 0;

        if(cmp === 0) {
            found = node;
        }
    }

    if(found !== null) {
        found.data = node.data;
        p.set_child(p.right === node, node.get_child(node.left === null));

        this._root = head.right;
        this.size--;
        return true;
    }
    else {
        return false;
    }
};

module.exports = BinTree;


},{"./treebase":5}],4:[function(require,module,exports){

var TreeBase = require('./treebase');

function Node(data) {
    this.data = data;
    this.left = null;
    this.right = null;
    this.red = true;
}

Node.prototype.get_child = function(dir) {
    return dir ? this.right : this.left;
};

Node.prototype.set_child = function(dir, val) {
    if(dir) {
        this.right = val;
    }
    else {
        this.left = val;
    }
};

function RBTree(comparator) {
    this._root = null;
    this._comparator = comparator;
    this.size = 0;
}

RBTree.prototype = new TreeBase();

// returns true if inserted, false if duplicate
RBTree.prototype.insert = function(data) {
    var ret = false;

    if(this._root === null) {
        // empty tree
        this._root = new Node(data);
        ret = true;
        this.size++;
    }
    else {
        var head = new Node(undefined); // fake tree root

        var dir = 0;
        var last = 0;

        // setup
        var gp = null; // grandparent
        var ggp = head; // grand-grand-parent
        var p = null; // parent
        var node = this._root;
        ggp.right = this._root;

        // search down
        while(true) {
            if(node === null) {
                // insert new node at the bottom
                node = new Node(data);
                p.set_child(dir, node);
                ret = true;
                this.size++;
            }
            else if(is_red(node.left) && is_red(node.right)) {
                // color flip
                node.red = true;
                node.left.red = false;
                node.right.red = false;
            }

            // fix red violation
            if(is_red(node) && is_red(p)) {
                var dir2 = ggp.right === gp;

                if(node === p.get_child(last)) {
                    ggp.set_child(dir2, single_rotate(gp, !last));
                }
                else {
                    ggp.set_child(dir2, double_rotate(gp, !last));
                }
            }

            var cmp = this._comparator(node.data, data);

            // stop if found
            if(cmp === 0) {
                break;
            }

            last = dir;
            dir = cmp < 0;

            // update helpers
            if(gp !== null) {
                ggp = gp;
            }
            gp = p;
            p = node;
            node = node.get_child(dir);
        }

        // update root
        this._root = head.right;
    }

    // make root black
    this._root.red = false;

    return ret;
};

// returns true if removed, false if not found
RBTree.prototype.remove = function(data) {
    if(this._root === null) {
        return false;
    }

    var head = new Node(undefined); // fake tree root
    var node = head;
    node.right = this._root;
    var p = null; // parent
    var gp = null; // grand parent
    var found = null; // found item
    var dir = 1;

    while(node.get_child(dir) !== null) {
        var last = dir;

        // update helpers
        gp = p;
        p = node;
        node = node.get_child(dir);

        var cmp = this._comparator(data, node.data);

        dir = cmp > 0;

        // save found node
        if(cmp === 0) {
            found = node;
        }

        // push the red node down
        if(!is_red(node) && !is_red(node.get_child(dir))) {
            if(is_red(node.get_child(!dir))) {
                var sr = single_rotate(node, dir);
                p.set_child(last, sr);
                p = sr;
            }
            else if(!is_red(node.get_child(!dir))) {
                var sibling = p.get_child(!last);
                if(sibling !== null) {
                    if(!is_red(sibling.get_child(!last)) && !is_red(sibling.get_child(last))) {
                        // color flip
                        p.red = false;
                        sibling.red = true;
                        node.red = true;
                    }
                    else {
                        var dir2 = gp.right === p;

                        if(is_red(sibling.get_child(last))) {
                            gp.set_child(dir2, double_rotate(p, last));
                        }
                        else if(is_red(sibling.get_child(!last))) {
                            gp.set_child(dir2, single_rotate(p, last));
                        }

                        // ensure correct coloring
                        var gpc = gp.get_child(dir2);
                        gpc.red = true;
                        node.red = true;
                        gpc.left.red = false;
                        gpc.right.red = false;
                    }
                }
            }
        }
    }

    // replace and remove if found
    if(found !== null) {
        found.data = node.data;
        p.set_child(p.right === node, node.get_child(node.left === null));
        this.size--;
    }

    // update root and make it black
    this._root = head.right;
    if(this._root !== null) {
        this._root.red = false;
    }

    return found !== null;
};

function is_red(node) {
    return node !== null && node.red;
}

function single_rotate(root, dir) {
    var save = root.get_child(!dir);

    root.set_child(!dir, save.get_child(dir));
    save.set_child(dir, root);

    root.red = true;
    save.red = false;

    return save;
}

function double_rotate(root, dir) {
    root.set_child(!dir, single_rotate(root.get_child(!dir), !dir));
    return single_rotate(root, dir);
}

module.exports = RBTree;

},{"./treebase":5}],5:[function(require,module,exports){

function TreeBase() {}

// removes all nodes from the tree
TreeBase.prototype.clear = function() {
    this._root = null;
    this.size = 0;
};

// returns node data if found, null otherwise
TreeBase.prototype.find = function(data) {
    var res = this._root;

    while(res !== null) {
        var c = this._comparator(data, res.data);
        if(c === 0) {
            return res.data;
        }
        else {
            res = res.get_child(c > 0);
        }
    }

    return null;
};

// returns iterator to node if found, null otherwise
TreeBase.prototype.findIter = function(data) {
    var res = this._root;
    var iter = this.iterator();

    while(res !== null) {
        var c = this._comparator(data, res.data);
        if(c === 0) {
            iter._cursor = res;
            return iter;
        }
        else {
            iter._ancestors.push(res);
            res = res.get_child(c > 0);
        }
    }

    return null;
};

// Returns an iterator to the tree node at or immediately after the item
TreeBase.prototype.lowerBound = function(item) {
    var cur = this._root;
    var iter = this.iterator();
    var cmp = this._comparator;

    while(cur !== null) {
        var c = cmp(item, cur.data);
        if(c === 0) {
            iter._cursor = cur;
            return iter;
        }
        iter._ancestors.push(cur);
        cur = cur.get_child(c > 0);
    }

    for(var i=iter._ancestors.length - 1; i >= 0; --i) {
        cur = iter._ancestors[i];
        if(cmp(item, cur.data) < 0) {
            iter._cursor = cur;
            iter._ancestors.length = i;
            return iter;
        }
    }

    iter._ancestors.length = 0;
    return iter;
};

// Returns an iterator to the tree node immediately after the item
TreeBase.prototype.upperBound = function(item) {
    var iter = this.lowerBound(item);
    var cmp = this._comparator;

    while(iter.data() !== null && cmp(iter.data(), item) === 0) {
        iter.next();
    }

    return iter;
};

// returns null if tree is empty
TreeBase.prototype.min = function() {
    var res = this._root;
    if(res === null) {
        return null;
    }

    while(res.left !== null) {
        res = res.left;
    }

    return res.data;
};

// returns null if tree is empty
TreeBase.prototype.max = function() {
    var res = this._root;
    if(res === null) {
        return null;
    }

    while(res.right !== null) {
        res = res.right;
    }

    return res.data;
};

// returns a null iterator
// call next() or prev() to point to an element
TreeBase.prototype.iterator = function() {
    return new Iterator(this);
};

// calls cb on each node's data, in order
TreeBase.prototype.each = function(cb) {
    var it=this.iterator(), data;
    while((data = it.next()) !== null) {
        cb(data);
    }
};

// calls cb on each node's data, in reverse order
TreeBase.prototype.reach = function(cb) {
    var it=this.iterator(), data;
    while((data = it.prev()) !== null) {
        cb(data);
    }
};


function Iterator(tree) {
    this._tree = tree;
    this._ancestors = [];
    this._cursor = null;
}

Iterator.prototype.data = function() {
    return this._cursor !== null ? this._cursor.data : null;
};

// if null-iterator, returns first node
// otherwise, returns next node
Iterator.prototype.next = function() {
    if(this._cursor === null) {
        var root = this._tree._root;
        if(root !== null) {
            this._minNode(root);
        }
    }
    else {
        if(this._cursor.right === null) {
            // no greater node in subtree, go up to parent
            // if coming from a right child, continue up the stack
            var save;
            do {
                save = this._cursor;
                if(this._ancestors.length) {
                    this._cursor = this._ancestors.pop();
                }
                else {
                    this._cursor = null;
                    break;
                }
            } while(this._cursor.right === save);
        }
        else {
            // get the next node from the subtree
            this._ancestors.push(this._cursor);
            this._minNode(this._cursor.right);
        }
    }
    return this._cursor !== null ? this._cursor.data : null;
};

// if null-iterator, returns last node
// otherwise, returns previous node
Iterator.prototype.prev = function() {
    if(this._cursor === null) {
        var root = this._tree._root;
        if(root !== null) {
            this._maxNode(root);
        }
    }
    else {
        if(this._cursor.left === null) {
            var save;
            do {
                save = this._cursor;
                if(this._ancestors.length) {
                    this._cursor = this._ancestors.pop();
                }
                else {
                    this._cursor = null;
                    break;
                }
            } while(this._cursor.left === save);
        }
        else {
            this._ancestors.push(this._cursor);
            this._maxNode(this._cursor.left);
        }
    }
    return this._cursor !== null ? this._cursor.data : null;
};

Iterator.prototype._minNode = function(start) {
    while(start.left !== null) {
        this._ancestors.push(start);
        start = start.left;
    }
    this._cursor = start;
};

Iterator.prototype._maxNode = function(start) {
    while(start.right !== null) {
        this._ancestors.push(start);
        start = start.right;
    }
    this._cursor = start;
};

module.exports = TreeBase;


},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
var signedArea = require('./signed_area');

/**
 * @param  {SweepEvent} e1
 * @param  {SweepEvent} e2
 * @return {Number}
 */
module.exports = function sweepEventsComp(e1, e2) {
  var p1 = e1.point;
  var p2 = e2.point;

  // Different x-coordinate
  if (p1[0] > p2[0]) return 1;
  if (p1[0] < p2[0]) return -1;

  // Different points, but same x-coordinate
  // Event with lower y-coordinate is processed first
  if (p1[1] !== p2[1]) return p1[1] > p2[1] ? 1 : -1;

  // Same coordinates, but one is a left endpoint and the other is
  // a right endpoint. The right endpoint is processed first
  if (e1.left !== e2.left)
    return e1.left ? 1 : -1;

  // Same coordinates, both events
  // are left endpoints or right endpoints.
  // not collinear
  if (signedArea (p1, e1.otherEvent.point, e2.otherEvent.point) !== 0) {
    // the event associate to the bottom segment is processed first
    return e1.isAbove(e2.otherEvent.point) ? 1 : -1;
  }
  return e1.isSubject ? -1 : 1;
};

},{"./signed_area":12}],8:[function(require,module,exports){
var signedArea    = require('./signed_area');
var compareEvents = require('./compare_events');

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
    if (le1.point === le2.point) return le1.isBelow(le2.otherEvent.point) ? -1 : 1;

    // Different left endpoint: use the left endpoint to sort
    if (le1.point[0] === le2.point[0]) return le1.point[1] < le2.point[1] ? -1 : 1;

    // has the line segment associated to e1 been inserted
    // into S after the line segment associated to e2 ?
    if (compareEvents(le1, le2) === 1) return le2.isAbove(le1.point) ? -1 : 1;

    // The line segment associated to e2 has been inserted
    // into S after the line segment associated to e1
    return le1.isBelow(le2.point) ? -1 : 1;
  }

  // Segments are collinear
  if (le1.isSubject !== le2.isSubject) return (le1.isSubject && !le2.isSubject) ? 1 : -1;

  // Just a consistent criterion is used
  if (le1.point === le2.point) return 0;

  return compareEvents(le1, le2) === 1 ? 1 : -1;
}

},{"./compare_events":7,"./signed_area":12}],9:[function(require,module,exports){
module.exports = { 
  NORMAL:               0, 
  NON_CONTRIBUTING:     1, 
  SAME_TRANSITION:      2, 
  DIFFERENT_TRANSITION: 3
};

},{}],10:[function(require,module,exports){
var INTERSECTION = 0;
var UNION        = 1;
var DIFFERENCE   = 2;
var XOR          = 3;

var edgeType        = require('./edge_type');

var Queue           = require('tinyqueue');
var Tree            = require('bintrees').RBTree;
var SweepEvent      = require('./sweep_event');

var signedArea      = require('./signed_area');
var compareEvents   = require('./compare_events');
var compareSegments = require('./compare_segments');
var intersection    = require('./segment_intersection');

var eventQueue;

function pointsEqual(p1, p2) {
  return p1[0] === p2[0] && p1[1] === p2[1];
}


/**
 * @param  {Array.<Array.<Number>} segment
 * @param  {Boolean} isSubject
 * @param  {Queue}   eventQueue
 */
function processSegment(segment, isSubject, eventQueue) {
  // Possible degenerate condition.
  if (pointsEqual(segment[0], segment[1])) return;

  var e1 = new SweepEvent(segment[0], false, undefined, isSubject);
  var e2 = new SweepEvent(segment[1], false, e1, isSubject);
  e1.otherEvent = e2;

  if (compareEvents(e1, e2) > 0) {
    e2.left = true;
  } else {
    e1.left = true;
  }

  // Pushing it so the queue is sorted from left to right,
  // with object on the left having the highest priority.
  eventQueue.push(e1);
  eventQueue.push(e2);
}


function fillQueue(subject, clipping) {
  var i, ii, j, jj;
  eventQueue = new Queue(null, compareEvents);

  for (i = 0, ii = subject.length; i < ii; i++) {
    for (j = 0, jj = subject[i].length - 1; j < jj; j++) {
      processSegment([subject[i][j], subject[i][j + 1]], true, eventQueue);
    }
  }

  for (i = 0, ii = clipping.length; i < ii; i++) {
    for (j = 0, jj = clipping[i].length - 1; j < jj; j++) {
      processSegment([clipping[i][j], clipping[i][j + 1]], false, eventQueue);
    }
  }

  return eventQueue;
}


function computeFields(event, prev, sweepLine, operation) {
  // compute inOut and otherInOut fields
  if (prev === sweepLine.max()) {
    event.inOut      = false;
    event.otherInOut = true;

  // previous line segment in sweepline belongs to the same polygon
  } else if (event.isSubject === prev.isSubject) {
    event.inOut      = !prev.inOut;
    event.otherInOut = prev.otherInOut;

  // previous line segment in sweepline belongs to the clipping polygon
  } else {
    event.inOut      = !prev.otherInOut;
    event.otherInOut = prev.isVertical() ? !prev.inOut : prev.inOut;
  }

  // compute prevInResult field
  if (prev !== sweepLine.max()) {
    event.prevInResult = (!inResult(prev, operation) || prev.isVertical()) ?
       prev.prevInResult : prev;
  }
  // check if the line segment belongs to the Boolean operation
  event.inResult = inResult(event, operation);
}


function equals(p1, p2) {
  return p1[0] === p2[0] && p1[1] === p2[1];
}


function possibleIntersection(se1, se2, queue) {
  if(se1.isSubject === se2.isSubject) return;

  var inter = intersection(
    se1.point, se1.otherEvent.point,
    se2.point, se2.otherEvent.point
  );
  var nintersections = inter ? inter.length : 0;

  if (!nintersections === 0) return 0; // no intersection

  // the line segments intersect at an endpoint of both line segments
  if ((nintersections === 1) &&
      (equals(se1.point, se2.point) ||
       equals(se1.otherEvent.point, se2.otherEvent.point))) {
    return 0;
  }

  if (nintersections === 2 && se1.isSubject === se2.isSubject) {
    throw new Error("Sorry, edges of the same polygon overlap?");
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

  if (se1.point === se2.point) {
    leftCoincide = true; // linked
  } else if (compareEvents(se1, se2) === 1) {
    events.push(se2, se1);
  } else {
    events.push(se1, se2);
  }

  if (se1.otherEvent.point === se2.otherEvent.point) {
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
      divideSegment(events[2].otherEvent, events[1].point, queue);
    }
    return 2;
  }

  // the line segments share the right endpoint
  if (rightCoincide) {
    divideSegment(events[0], events[1].point);
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


function divideSegment(se, p, queue)  {
  var r = new SweepEvent(p, false, se,            se.isSubject/*, le->type*/);
  var l = new SweepEvent(p, true,  se.otherEvent, se.isSubject/*, le->other->type*/);

  // avoid a rounding error. The left event would be processed after the right event
  if (compareEvents(l, se.otherEvent) > 0) {
    se.otherEvent.left = true;
    l.left = false;
  }

  // avoid a rounding error. The left event would be processed after the right event
  if (compareEvents(se, r) > 0) {
    console.log("Oops2", '\n', se.point, se.left, se.otherEvent.point, se.otherEvent.left,
       '\n', r.point, r.left, r.otherEvent.point, r.otherEvent.left);
  }

  se.otherEvent.otherEvent = l;
  se.otherEvent = r;

  queue.push(l);
  queue.push(r);

  return queue;
}


function subdivideSegments(eventQueue, subject, clipping, operation) {
  var sortedEvents = [];
  var prev, next;

  var sweepLine = new Tree(compareSegments);
  var sortedEvents = [];

  var added = 0;
  var removed = 0;

  while (eventQueue.length) {
    var event = eventQueue.pop();
    sortedEvents.push(event);

    if (event.left) {
      sweepLine.insert(event);
      computeFields(event, event.prev, sweepLine, operation);

      possibleIntersection(event, event.next, eventQueue, sortedEvents);
      possibleIntersection(event, event.prev, eventQueue, sortedEvents);
    } else {
      sweepLine.remove(event.otherEvent);
    }
  }
  return sortedEvents;
}

function connectEdges(sortedEvents) {
  return [];
}


function inResult(event, operation) {
  switch (event.type) {
    case edgeType.NORMAL:
      switch (operation) {
        case INTERSECTION:
          return !event.otherInOut;
        case UNION:
          return event.otherInOut;
        case DIFFERENCE:
          return event.isSubject ? event.otherInOut : !event.otherInOut;
        case XOR:
          return true;
      }
    case edgeType.SAME_TRANSITION:
      return operation == INTERSECTION || operation == UNION;
    case edgeType.DIFFERENT_TRANSITION:
      return operation == DIFFERENCE;
    case edgeType.NON_CONTRIBUTING:
      return false;
  }
  return false;
}


function boolean(subject, clipping, operation) {
  var eventQueue = fillQueue(subject, clipping);
  var sortedEvents = subdivideSegments(eventQueue, subject, clipping, operation);
  return connectEdges(sortedEvents);
};


module.exports = boolean;


module.exports.union = function(subject, clipping) {
  return boolean(subject, clipping, UNION);
};


module.exports.diff = function(subject, clipping) {
  return boolean(subject, clipping, DIFFERENCE);
};


module.exports.xor = function(subject, clipping) {
  return boolean(subject, clipping, XOR);
};


module.exports.intersection = function(subject, clipping) {
  return boolean(subject, clipping, INTERSECTION);
};

module.exports.fillQueue         = fillQueue;
module.exports.computeFields     = computeFields;
module.exports.subdivideSegments = subdivideSegments;
module.exports.divideSegment     = divideSegment;
module.exports.possibleIntersection = possibleIntersection;
},{"./compare_events":7,"./compare_segments":8,"./edge_type":9,"./segment_intersection":11,"./signed_area":12,"./sweep_event":13,"bintrees":2,"tinyqueue":6}],11:[function(require,module,exports){
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
function krossProduct(a, b) {
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
module.exports = function(a1, a2, b1, b2, noEndpointTouch) {
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
  };

  /* eslint-enable arrow-body-style */

  // The rest is pretty much a straight port of the algorithm.
  var e = [b1[0] - a1[0], b1[1] - a1[1]];
  var kross = krossProduct(va, vb);
  var sqrKross = kross * kross;
  var sqrLenA = dotProduct(va, va);
  var sqrLenB = dotProduct(vb, vb);

  // Check for line intersection. This works because of the properties of the
  // cross product -- specifically, two vectors are parallel if and only if the
  // cross product is the 0 vector. The full calculation involves relative error
  // to account for possible very small line segments. See Schneider & Eberly
  // for details.
  if (sqrKross > EPSILON * sqrLenA * sqrLenB) {
    // If they're not parallel, then (because these are line segments) they
    // still might not actually intersect. This code checks that the
    // intersection point of the lines is actually on both line segments.
    var s = krossProduct(e, vb) / kross;
    if (s < 0 || s > 1) {
      // not on line segment a
      return null;
    }
    var t = krossProduct(e, va) / kross;
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
  kross = krossProduct(e, va);
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

},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
var signedArea = require('./signed_area');
var edgeType   = require('./edge_type');


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
  this.type = edgeType;


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
}


SweepEvent.prototype = {

  /**
   * @param  {Array.<Number>}  p
   * @return {Boolean}
   */
  isBelow: function(p) {
    return this.left ?
      signedArea (this.point, this.otherEvent.point, p) > 0 :
      signedArea (this.otherEvent.point, this.point, p) > 0;
  },


  /**
   * @param  {Array.<Number>}  p
   * @return {Boolean}
   */
  isAbove: function(p) {
    return !this.isBelow(p);
  },


  /**
   * @return {Boolean}
   */
  isVertical: function() {
    return this.point[0] === this.otherEvent.point[0];
  }
};

module.exports = SweepEvent;

},{"./edge_type":9,"./signed_area":12}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9iaW50cmVlcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9iaW50cmVlcy9saWIvYmludHJlZS5qcyIsIm5vZGVfbW9kdWxlcy9iaW50cmVlcy9saWIvcmJ0cmVlLmpzIiwibm9kZV9tb2R1bGVzL2JpbnRyZWVzL2xpYi90cmVlYmFzZS5qcyIsIm5vZGVfbW9kdWxlcy90aW55cXVldWUvaW5kZXguanMiLCJzcmMvY29tcGFyZV9ldmVudHMuanMiLCJzcmMvY29tcGFyZV9zZWdtZW50cy5qcyIsInNyYy9lZGdlX3R5cGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvc2VnbWVudF9pbnRlcnNlY3Rpb24uanMiLCJzcmMvc2lnbmVkX2FyZWEuanMiLCJzcmMvc3dlZXBfZXZlbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3NyYy8nKTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFJCVHJlZTogcmVxdWlyZSgnLi9saWIvcmJ0cmVlJyksXG4gICAgQmluVHJlZTogcmVxdWlyZSgnLi9saWIvYmludHJlZScpXG59O1xuIiwiXG52YXIgVHJlZUJhc2UgPSByZXF1aXJlKCcuL3RyZWViYXNlJyk7XG5cbmZ1bmN0aW9uIE5vZGUoZGF0YSkge1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgdGhpcy5sZWZ0ID0gbnVsbDtcbiAgICB0aGlzLnJpZ2h0ID0gbnVsbDtcbn1cblxuTm9kZS5wcm90b3R5cGUuZ2V0X2NoaWxkID0gZnVuY3Rpb24oZGlyKSB7XG4gICAgcmV0dXJuIGRpciA/IHRoaXMucmlnaHQgOiB0aGlzLmxlZnQ7XG59O1xuXG5Ob2RlLnByb3RvdHlwZS5zZXRfY2hpbGQgPSBmdW5jdGlvbihkaXIsIHZhbCkge1xuICAgIGlmKGRpcikge1xuICAgICAgICB0aGlzLnJpZ2h0ID0gdmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5sZWZ0ID0gdmFsO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIEJpblRyZWUoY29tcGFyYXRvcikge1xuICAgIHRoaXMuX3Jvb3QgPSBudWxsO1xuICAgIHRoaXMuX2NvbXBhcmF0b3IgPSBjb21wYXJhdG9yO1xuICAgIHRoaXMuc2l6ZSA9IDA7XG59XG5cbkJpblRyZWUucHJvdG90eXBlID0gbmV3IFRyZWVCYXNlKCk7XG5cbi8vIHJldHVybnMgdHJ1ZSBpZiBpbnNlcnRlZCwgZmFsc2UgaWYgZHVwbGljYXRlXG5CaW5UcmVlLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgaWYodGhpcy5fcm9vdCA9PT0gbnVsbCkge1xuICAgICAgICAvLyBlbXB0eSB0cmVlXG4gICAgICAgIHRoaXMuX3Jvb3QgPSBuZXcgTm9kZShkYXRhKTtcbiAgICAgICAgdGhpcy5zaXplKys7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHZhciBkaXIgPSAwO1xuXG4gICAgLy8gc2V0dXBcbiAgICB2YXIgcCA9IG51bGw7IC8vIHBhcmVudFxuICAgIHZhciBub2RlID0gdGhpcy5fcm9vdDtcblxuICAgIC8vIHNlYXJjaCBkb3duXG4gICAgd2hpbGUodHJ1ZSkge1xuICAgICAgICBpZihub2RlID09PSBudWxsKSB7XG4gICAgICAgICAgICAvLyBpbnNlcnQgbmV3IG5vZGUgYXQgdGhlIGJvdHRvbVxuICAgICAgICAgICAgbm9kZSA9IG5ldyBOb2RlKGRhdGEpO1xuICAgICAgICAgICAgcC5zZXRfY2hpbGQoZGlyLCBub2RlKTtcbiAgICAgICAgICAgIHJldCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNpemUrKztcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc3RvcCBpZiBmb3VuZFxuICAgICAgICBpZih0aGlzLl9jb21wYXJhdG9yKG5vZGUuZGF0YSwgZGF0YSkgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRpciA9IHRoaXMuX2NvbXBhcmF0b3Iobm9kZS5kYXRhLCBkYXRhKSA8IDA7XG5cbiAgICAgICAgLy8gdXBkYXRlIGhlbHBlcnNcbiAgICAgICAgcCA9IG5vZGU7XG4gICAgICAgIG5vZGUgPSBub2RlLmdldF9jaGlsZChkaXIpO1xuICAgIH1cbn07XG5cbi8vIHJldHVybnMgdHJ1ZSBpZiByZW1vdmVkLCBmYWxzZSBpZiBub3QgZm91bmRcbkJpblRyZWUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBpZih0aGlzLl9yb290ID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgaGVhZCA9IG5ldyBOb2RlKHVuZGVmaW5lZCk7IC8vIGZha2UgdHJlZSByb290XG4gICAgdmFyIG5vZGUgPSBoZWFkO1xuICAgIG5vZGUucmlnaHQgPSB0aGlzLl9yb290O1xuICAgIHZhciBwID0gbnVsbDsgLy8gcGFyZW50XG4gICAgdmFyIGZvdW5kID0gbnVsbDsgLy8gZm91bmQgaXRlbVxuICAgIHZhciBkaXIgPSAxO1xuXG4gICAgd2hpbGUobm9kZS5nZXRfY2hpbGQoZGlyKSAhPT0gbnVsbCkge1xuICAgICAgICBwID0gbm9kZTtcbiAgICAgICAgbm9kZSA9IG5vZGUuZ2V0X2NoaWxkKGRpcik7XG4gICAgICAgIHZhciBjbXAgPSB0aGlzLl9jb21wYXJhdG9yKGRhdGEsIG5vZGUuZGF0YSk7XG4gICAgICAgIGRpciA9IGNtcCA+IDA7XG5cbiAgICAgICAgaWYoY21wID09PSAwKSB7XG4gICAgICAgICAgICBmb3VuZCA9IG5vZGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZihmb3VuZCAhPT0gbnVsbCkge1xuICAgICAgICBmb3VuZC5kYXRhID0gbm9kZS5kYXRhO1xuICAgICAgICBwLnNldF9jaGlsZChwLnJpZ2h0ID09PSBub2RlLCBub2RlLmdldF9jaGlsZChub2RlLmxlZnQgPT09IG51bGwpKTtcblxuICAgICAgICB0aGlzLl9yb290ID0gaGVhZC5yaWdodDtcbiAgICAgICAgdGhpcy5zaXplLS07XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmluVHJlZTtcblxuIiwiXG52YXIgVHJlZUJhc2UgPSByZXF1aXJlKCcuL3RyZWViYXNlJyk7XG5cbmZ1bmN0aW9uIE5vZGUoZGF0YSkge1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgdGhpcy5sZWZ0ID0gbnVsbDtcbiAgICB0aGlzLnJpZ2h0ID0gbnVsbDtcbiAgICB0aGlzLnJlZCA9IHRydWU7XG59XG5cbk5vZGUucHJvdG90eXBlLmdldF9jaGlsZCA9IGZ1bmN0aW9uKGRpcikge1xuICAgIHJldHVybiBkaXIgPyB0aGlzLnJpZ2h0IDogdGhpcy5sZWZ0O1xufTtcblxuTm9kZS5wcm90b3R5cGUuc2V0X2NoaWxkID0gZnVuY3Rpb24oZGlyLCB2YWwpIHtcbiAgICBpZihkaXIpIHtcbiAgICAgICAgdGhpcy5yaWdodCA9IHZhbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMubGVmdCA9IHZhbDtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBSQlRyZWUoY29tcGFyYXRvcikge1xuICAgIHRoaXMuX3Jvb3QgPSBudWxsO1xuICAgIHRoaXMuX2NvbXBhcmF0b3IgPSBjb21wYXJhdG9yO1xuICAgIHRoaXMuc2l6ZSA9IDA7XG59XG5cblJCVHJlZS5wcm90b3R5cGUgPSBuZXcgVHJlZUJhc2UoKTtcblxuLy8gcmV0dXJucyB0cnVlIGlmIGluc2VydGVkLCBmYWxzZSBpZiBkdXBsaWNhdGVcblJCVHJlZS5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciByZXQgPSBmYWxzZTtcblxuICAgIGlmKHRoaXMuX3Jvb3QgPT09IG51bGwpIHtcbiAgICAgICAgLy8gZW1wdHkgdHJlZVxuICAgICAgICB0aGlzLl9yb290ID0gbmV3IE5vZGUoZGF0YSk7XG4gICAgICAgIHJldCA9IHRydWU7XG4gICAgICAgIHRoaXMuc2l6ZSsrO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIGhlYWQgPSBuZXcgTm9kZSh1bmRlZmluZWQpOyAvLyBmYWtlIHRyZWUgcm9vdFxuXG4gICAgICAgIHZhciBkaXIgPSAwO1xuICAgICAgICB2YXIgbGFzdCA9IDA7XG5cbiAgICAgICAgLy8gc2V0dXBcbiAgICAgICAgdmFyIGdwID0gbnVsbDsgLy8gZ3JhbmRwYXJlbnRcbiAgICAgICAgdmFyIGdncCA9IGhlYWQ7IC8vIGdyYW5kLWdyYW5kLXBhcmVudFxuICAgICAgICB2YXIgcCA9IG51bGw7IC8vIHBhcmVudFxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuX3Jvb3Q7XG4gICAgICAgIGdncC5yaWdodCA9IHRoaXMuX3Jvb3Q7XG5cbiAgICAgICAgLy8gc2VhcmNoIGRvd25cbiAgICAgICAgd2hpbGUodHJ1ZSkge1xuICAgICAgICAgICAgaWYobm9kZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIGluc2VydCBuZXcgbm9kZSBhdCB0aGUgYm90dG9tXG4gICAgICAgICAgICAgICAgbm9kZSA9IG5ldyBOb2RlKGRhdGEpO1xuICAgICAgICAgICAgICAgIHAuc2V0X2NoaWxkKGRpciwgbm9kZSk7XG4gICAgICAgICAgICAgICAgcmV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnNpemUrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoaXNfcmVkKG5vZGUubGVmdCkgJiYgaXNfcmVkKG5vZGUucmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgLy8gY29sb3IgZmxpcFxuICAgICAgICAgICAgICAgIG5vZGUucmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBub2RlLmxlZnQucmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgbm9kZS5yaWdodC5yZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZml4IHJlZCB2aW9sYXRpb25cbiAgICAgICAgICAgIGlmKGlzX3JlZChub2RlKSAmJiBpc19yZWQocCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGlyMiA9IGdncC5yaWdodCA9PT0gZ3A7XG5cbiAgICAgICAgICAgICAgICBpZihub2RlID09PSBwLmdldF9jaGlsZChsYXN0KSkge1xuICAgICAgICAgICAgICAgICAgICBnZ3Auc2V0X2NoaWxkKGRpcjIsIHNpbmdsZV9yb3RhdGUoZ3AsICFsYXN0KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBnZ3Auc2V0X2NoaWxkKGRpcjIsIGRvdWJsZV9yb3RhdGUoZ3AsICFsYXN0KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgY21wID0gdGhpcy5fY29tcGFyYXRvcihub2RlLmRhdGEsIGRhdGEpO1xuXG4gICAgICAgICAgICAvLyBzdG9wIGlmIGZvdW5kXG4gICAgICAgICAgICBpZihjbXAgPT09IDApIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGFzdCA9IGRpcjtcbiAgICAgICAgICAgIGRpciA9IGNtcCA8IDA7XG5cbiAgICAgICAgICAgIC8vIHVwZGF0ZSBoZWxwZXJzXG4gICAgICAgICAgICBpZihncCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGdncCA9IGdwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ3AgPSBwO1xuICAgICAgICAgICAgcCA9IG5vZGU7XG4gICAgICAgICAgICBub2RlID0gbm9kZS5nZXRfY2hpbGQoZGlyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVwZGF0ZSByb290XG4gICAgICAgIHRoaXMuX3Jvb3QgPSBoZWFkLnJpZ2h0O1xuICAgIH1cblxuICAgIC8vIG1ha2Ugcm9vdCBibGFja1xuICAgIHRoaXMuX3Jvb3QucmVkID0gZmFsc2U7XG5cbiAgICByZXR1cm4gcmV0O1xufTtcblxuLy8gcmV0dXJucyB0cnVlIGlmIHJlbW92ZWQsIGZhbHNlIGlmIG5vdCBmb3VuZFxuUkJUcmVlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgaWYodGhpcy5fcm9vdCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIGhlYWQgPSBuZXcgTm9kZSh1bmRlZmluZWQpOyAvLyBmYWtlIHRyZWUgcm9vdFxuICAgIHZhciBub2RlID0gaGVhZDtcbiAgICBub2RlLnJpZ2h0ID0gdGhpcy5fcm9vdDtcbiAgICB2YXIgcCA9IG51bGw7IC8vIHBhcmVudFxuICAgIHZhciBncCA9IG51bGw7IC8vIGdyYW5kIHBhcmVudFxuICAgIHZhciBmb3VuZCA9IG51bGw7IC8vIGZvdW5kIGl0ZW1cbiAgICB2YXIgZGlyID0gMTtcblxuICAgIHdoaWxlKG5vZGUuZ2V0X2NoaWxkKGRpcikgIT09IG51bGwpIHtcbiAgICAgICAgdmFyIGxhc3QgPSBkaXI7XG5cbiAgICAgICAgLy8gdXBkYXRlIGhlbHBlcnNcbiAgICAgICAgZ3AgPSBwO1xuICAgICAgICBwID0gbm9kZTtcbiAgICAgICAgbm9kZSA9IG5vZGUuZ2V0X2NoaWxkKGRpcik7XG5cbiAgICAgICAgdmFyIGNtcCA9IHRoaXMuX2NvbXBhcmF0b3IoZGF0YSwgbm9kZS5kYXRhKTtcblxuICAgICAgICBkaXIgPSBjbXAgPiAwO1xuXG4gICAgICAgIC8vIHNhdmUgZm91bmQgbm9kZVxuICAgICAgICBpZihjbXAgPT09IDApIHtcbiAgICAgICAgICAgIGZvdW5kID0gbm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHB1c2ggdGhlIHJlZCBub2RlIGRvd25cbiAgICAgICAgaWYoIWlzX3JlZChub2RlKSAmJiAhaXNfcmVkKG5vZGUuZ2V0X2NoaWxkKGRpcikpKSB7XG4gICAgICAgICAgICBpZihpc19yZWQobm9kZS5nZXRfY2hpbGQoIWRpcikpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNyID0gc2luZ2xlX3JvdGF0ZShub2RlLCBkaXIpO1xuICAgICAgICAgICAgICAgIHAuc2V0X2NoaWxkKGxhc3QsIHNyKTtcbiAgICAgICAgICAgICAgICBwID0gc3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKCFpc19yZWQobm9kZS5nZXRfY2hpbGQoIWRpcikpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNpYmxpbmcgPSBwLmdldF9jaGlsZCghbGFzdCk7XG4gICAgICAgICAgICAgICAgaWYoc2libGluZyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZighaXNfcmVkKHNpYmxpbmcuZ2V0X2NoaWxkKCFsYXN0KSkgJiYgIWlzX3JlZChzaWJsaW5nLmdldF9jaGlsZChsYXN0KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbG9yIGZsaXBcbiAgICAgICAgICAgICAgICAgICAgICAgIHAucmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWJsaW5nLnJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGlyMiA9IGdwLnJpZ2h0ID09PSBwO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihpc19yZWQoc2libGluZy5nZXRfY2hpbGQobGFzdCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3Auc2V0X2NoaWxkKGRpcjIsIGRvdWJsZV9yb3RhdGUocCwgbGFzdCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZihpc19yZWQoc2libGluZy5nZXRfY2hpbGQoIWxhc3QpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwLnNldF9jaGlsZChkaXIyLCBzaW5nbGVfcm90YXRlKHAsIGxhc3QpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZW5zdXJlIGNvcnJlY3QgY29sb3JpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBncGMgPSBncC5nZXRfY2hpbGQoZGlyMik7XG4gICAgICAgICAgICAgICAgICAgICAgICBncGMucmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUucmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdwYy5sZWZ0LnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3BjLnJpZ2h0LnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gcmVwbGFjZSBhbmQgcmVtb3ZlIGlmIGZvdW5kXG4gICAgaWYoZm91bmQgIT09IG51bGwpIHtcbiAgICAgICAgZm91bmQuZGF0YSA9IG5vZGUuZGF0YTtcbiAgICAgICAgcC5zZXRfY2hpbGQocC5yaWdodCA9PT0gbm9kZSwgbm9kZS5nZXRfY2hpbGQobm9kZS5sZWZ0ID09PSBudWxsKSk7XG4gICAgICAgIHRoaXMuc2l6ZS0tO1xuICAgIH1cblxuICAgIC8vIHVwZGF0ZSByb290IGFuZCBtYWtlIGl0IGJsYWNrXG4gICAgdGhpcy5fcm9vdCA9IGhlYWQucmlnaHQ7XG4gICAgaWYodGhpcy5fcm9vdCAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9yb290LnJlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBmb3VuZCAhPT0gbnVsbDtcbn07XG5cbmZ1bmN0aW9uIGlzX3JlZChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUgIT09IG51bGwgJiYgbm9kZS5yZWQ7XG59XG5cbmZ1bmN0aW9uIHNpbmdsZV9yb3RhdGUocm9vdCwgZGlyKSB7XG4gICAgdmFyIHNhdmUgPSByb290LmdldF9jaGlsZCghZGlyKTtcblxuICAgIHJvb3Quc2V0X2NoaWxkKCFkaXIsIHNhdmUuZ2V0X2NoaWxkKGRpcikpO1xuICAgIHNhdmUuc2V0X2NoaWxkKGRpciwgcm9vdCk7XG5cbiAgICByb290LnJlZCA9IHRydWU7XG4gICAgc2F2ZS5yZWQgPSBmYWxzZTtcblxuICAgIHJldHVybiBzYXZlO1xufVxuXG5mdW5jdGlvbiBkb3VibGVfcm90YXRlKHJvb3QsIGRpcikge1xuICAgIHJvb3Quc2V0X2NoaWxkKCFkaXIsIHNpbmdsZV9yb3RhdGUocm9vdC5nZXRfY2hpbGQoIWRpciksICFkaXIpKTtcbiAgICByZXR1cm4gc2luZ2xlX3JvdGF0ZShyb290LCBkaXIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJCVHJlZTtcbiIsIlxuZnVuY3Rpb24gVHJlZUJhc2UoKSB7fVxuXG4vLyByZW1vdmVzIGFsbCBub2RlcyBmcm9tIHRoZSB0cmVlXG5UcmVlQmFzZS5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9yb290ID0gbnVsbDtcbiAgICB0aGlzLnNpemUgPSAwO1xufTtcblxuLy8gcmV0dXJucyBub2RlIGRhdGEgaWYgZm91bmQsIG51bGwgb3RoZXJ3aXNlXG5UcmVlQmFzZS5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgcmVzID0gdGhpcy5fcm9vdDtcblxuICAgIHdoaWxlKHJlcyAhPT0gbnVsbCkge1xuICAgICAgICB2YXIgYyA9IHRoaXMuX2NvbXBhcmF0b3IoZGF0YSwgcmVzLmRhdGEpO1xuICAgICAgICBpZihjID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXMgPSByZXMuZ2V0X2NoaWxkKGMgPiAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xufTtcblxuLy8gcmV0dXJucyBpdGVyYXRvciB0byBub2RlIGlmIGZvdW5kLCBudWxsIG90aGVyd2lzZVxuVHJlZUJhc2UucHJvdG90eXBlLmZpbmRJdGVyID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciByZXMgPSB0aGlzLl9yb290O1xuICAgIHZhciBpdGVyID0gdGhpcy5pdGVyYXRvcigpO1xuXG4gICAgd2hpbGUocmVzICE9PSBudWxsKSB7XG4gICAgICAgIHZhciBjID0gdGhpcy5fY29tcGFyYXRvcihkYXRhLCByZXMuZGF0YSk7XG4gICAgICAgIGlmKGMgPT09IDApIHtcbiAgICAgICAgICAgIGl0ZXIuX2N1cnNvciA9IHJlcztcbiAgICAgICAgICAgIHJldHVybiBpdGVyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaXRlci5fYW5jZXN0b3JzLnB1c2gocmVzKTtcbiAgICAgICAgICAgIHJlcyA9IHJlcy5nZXRfY2hpbGQoYyA+IDApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG59O1xuXG4vLyBSZXR1cm5zIGFuIGl0ZXJhdG9yIHRvIHRoZSB0cmVlIG5vZGUgYXQgb3IgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIGl0ZW1cblRyZWVCYXNlLnByb3RvdHlwZS5sb3dlckJvdW5kID0gZnVuY3Rpb24oaXRlbSkge1xuICAgIHZhciBjdXIgPSB0aGlzLl9yb290O1xuICAgIHZhciBpdGVyID0gdGhpcy5pdGVyYXRvcigpO1xuICAgIHZhciBjbXAgPSB0aGlzLl9jb21wYXJhdG9yO1xuXG4gICAgd2hpbGUoY3VyICE9PSBudWxsKSB7XG4gICAgICAgIHZhciBjID0gY21wKGl0ZW0sIGN1ci5kYXRhKTtcbiAgICAgICAgaWYoYyA9PT0gMCkge1xuICAgICAgICAgICAgaXRlci5fY3Vyc29yID0gY3VyO1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgaXRlci5fYW5jZXN0b3JzLnB1c2goY3VyKTtcbiAgICAgICAgY3VyID0gY3VyLmdldF9jaGlsZChjID4gMCk7XG4gICAgfVxuXG4gICAgZm9yKHZhciBpPWl0ZXIuX2FuY2VzdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICBjdXIgPSBpdGVyLl9hbmNlc3RvcnNbaV07XG4gICAgICAgIGlmKGNtcChpdGVtLCBjdXIuZGF0YSkgPCAwKSB7XG4gICAgICAgICAgICBpdGVyLl9jdXJzb3IgPSBjdXI7XG4gICAgICAgICAgICBpdGVyLl9hbmNlc3RvcnMubGVuZ3RoID0gaTtcbiAgICAgICAgICAgIHJldHVybiBpdGVyO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXRlci5fYW5jZXN0b3JzLmxlbmd0aCA9IDA7XG4gICAgcmV0dXJuIGl0ZXI7XG59O1xuXG4vLyBSZXR1cm5zIGFuIGl0ZXJhdG9yIHRvIHRoZSB0cmVlIG5vZGUgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIGl0ZW1cblRyZWVCYXNlLnByb3RvdHlwZS51cHBlckJvdW5kID0gZnVuY3Rpb24oaXRlbSkge1xuICAgIHZhciBpdGVyID0gdGhpcy5sb3dlckJvdW5kKGl0ZW0pO1xuICAgIHZhciBjbXAgPSB0aGlzLl9jb21wYXJhdG9yO1xuXG4gICAgd2hpbGUoaXRlci5kYXRhKCkgIT09IG51bGwgJiYgY21wKGl0ZXIuZGF0YSgpLCBpdGVtKSA9PT0gMCkge1xuICAgICAgICBpdGVyLm5leHQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaXRlcjtcbn07XG5cbi8vIHJldHVybnMgbnVsbCBpZiB0cmVlIGlzIGVtcHR5XG5UcmVlQmFzZS5wcm90b3R5cGUubWluID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlcyA9IHRoaXMuX3Jvb3Q7XG4gICAgaWYocmVzID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHdoaWxlKHJlcy5sZWZ0ICE9PSBudWxsKSB7XG4gICAgICAgIHJlcyA9IHJlcy5sZWZ0O1xuICAgIH1cblxuICAgIHJldHVybiByZXMuZGF0YTtcbn07XG5cbi8vIHJldHVybnMgbnVsbCBpZiB0cmVlIGlzIGVtcHR5XG5UcmVlQmFzZS5wcm90b3R5cGUubWF4ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlcyA9IHRoaXMuX3Jvb3Q7XG4gICAgaWYocmVzID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHdoaWxlKHJlcy5yaWdodCAhPT0gbnVsbCkge1xuICAgICAgICByZXMgPSByZXMucmlnaHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcy5kYXRhO1xufTtcblxuLy8gcmV0dXJucyBhIG51bGwgaXRlcmF0b3Jcbi8vIGNhbGwgbmV4dCgpIG9yIHByZXYoKSB0byBwb2ludCB0byBhbiBlbGVtZW50XG5UcmVlQmFzZS5wcm90b3R5cGUuaXRlcmF0b3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEl0ZXJhdG9yKHRoaXMpO1xufTtcblxuLy8gY2FsbHMgY2Igb24gZWFjaCBub2RlJ3MgZGF0YSwgaW4gb3JkZXJcblRyZWVCYXNlLnByb3RvdHlwZS5lYWNoID0gZnVuY3Rpb24oY2IpIHtcbiAgICB2YXIgaXQ9dGhpcy5pdGVyYXRvcigpLCBkYXRhO1xuICAgIHdoaWxlKChkYXRhID0gaXQubmV4dCgpKSAhPT0gbnVsbCkge1xuICAgICAgICBjYihkYXRhKTtcbiAgICB9XG59O1xuXG4vLyBjYWxscyBjYiBvbiBlYWNoIG5vZGUncyBkYXRhLCBpbiByZXZlcnNlIG9yZGVyXG5UcmVlQmFzZS5wcm90b3R5cGUucmVhY2ggPSBmdW5jdGlvbihjYikge1xuICAgIHZhciBpdD10aGlzLml0ZXJhdG9yKCksIGRhdGE7XG4gICAgd2hpbGUoKGRhdGEgPSBpdC5wcmV2KCkpICE9PSBudWxsKSB7XG4gICAgICAgIGNiKGRhdGEpO1xuICAgIH1cbn07XG5cblxuZnVuY3Rpb24gSXRlcmF0b3IodHJlZSkge1xuICAgIHRoaXMuX3RyZWUgPSB0cmVlO1xuICAgIHRoaXMuX2FuY2VzdG9ycyA9IFtdO1xuICAgIHRoaXMuX2N1cnNvciA9IG51bGw7XG59XG5cbkl0ZXJhdG9yLnByb3RvdHlwZS5kYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2N1cnNvciAhPT0gbnVsbCA/IHRoaXMuX2N1cnNvci5kYXRhIDogbnVsbDtcbn07XG5cbi8vIGlmIG51bGwtaXRlcmF0b3IsIHJldHVybnMgZmlyc3Qgbm9kZVxuLy8gb3RoZXJ3aXNlLCByZXR1cm5zIG5leHQgbm9kZVxuSXRlcmF0b3IucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgICBpZih0aGlzLl9jdXJzb3IgPT09IG51bGwpIHtcbiAgICAgICAgdmFyIHJvb3QgPSB0aGlzLl90cmVlLl9yb290O1xuICAgICAgICBpZihyb290ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9taW5Ob2RlKHJvb3QpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZih0aGlzLl9jdXJzb3IucmlnaHQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIG5vIGdyZWF0ZXIgbm9kZSBpbiBzdWJ0cmVlLCBnbyB1cCB0byBwYXJlbnRcbiAgICAgICAgICAgIC8vIGlmIGNvbWluZyBmcm9tIGEgcmlnaHQgY2hpbGQsIGNvbnRpbnVlIHVwIHRoZSBzdGFja1xuICAgICAgICAgICAgdmFyIHNhdmU7XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgc2F2ZSA9IHRoaXMuX2N1cnNvcjtcbiAgICAgICAgICAgICAgICBpZih0aGlzLl9hbmNlc3RvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnNvciA9IHRoaXMuX2FuY2VzdG9ycy5wb3AoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnNvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUodGhpcy5fY3Vyc29yLnJpZ2h0ID09PSBzYXZlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGdldCB0aGUgbmV4dCBub2RlIGZyb20gdGhlIHN1YnRyZWVcbiAgICAgICAgICAgIHRoaXMuX2FuY2VzdG9ycy5wdXNoKHRoaXMuX2N1cnNvcik7XG4gICAgICAgICAgICB0aGlzLl9taW5Ob2RlKHRoaXMuX2N1cnNvci5yaWdodCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2N1cnNvciAhPT0gbnVsbCA/IHRoaXMuX2N1cnNvci5kYXRhIDogbnVsbDtcbn07XG5cbi8vIGlmIG51bGwtaXRlcmF0b3IsIHJldHVybnMgbGFzdCBub2RlXG4vLyBvdGhlcndpc2UsIHJldHVybnMgcHJldmlvdXMgbm9kZVxuSXRlcmF0b3IucHJvdG90eXBlLnByZXYgPSBmdW5jdGlvbigpIHtcbiAgICBpZih0aGlzLl9jdXJzb3IgPT09IG51bGwpIHtcbiAgICAgICAgdmFyIHJvb3QgPSB0aGlzLl90cmVlLl9yb290O1xuICAgICAgICBpZihyb290ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXhOb2RlKHJvb3QpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZih0aGlzLl9jdXJzb3IubGVmdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHNhdmU7XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgc2F2ZSA9IHRoaXMuX2N1cnNvcjtcbiAgICAgICAgICAgICAgICBpZih0aGlzLl9hbmNlc3RvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnNvciA9IHRoaXMuX2FuY2VzdG9ycy5wb3AoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnNvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUodGhpcy5fY3Vyc29yLmxlZnQgPT09IHNhdmUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYW5jZXN0b3JzLnB1c2godGhpcy5fY3Vyc29yKTtcbiAgICAgICAgICAgIHRoaXMuX21heE5vZGUodGhpcy5fY3Vyc29yLmxlZnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jdXJzb3IgIT09IG51bGwgPyB0aGlzLl9jdXJzb3IuZGF0YSA6IG51bGw7XG59O1xuXG5JdGVyYXRvci5wcm90b3R5cGUuX21pbk5vZGUgPSBmdW5jdGlvbihzdGFydCkge1xuICAgIHdoaWxlKHN0YXJ0LmxlZnQgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5fYW5jZXN0b3JzLnB1c2goc3RhcnQpO1xuICAgICAgICBzdGFydCA9IHN0YXJ0LmxlZnQ7XG4gICAgfVxuICAgIHRoaXMuX2N1cnNvciA9IHN0YXJ0O1xufTtcblxuSXRlcmF0b3IucHJvdG90eXBlLl9tYXhOb2RlID0gZnVuY3Rpb24oc3RhcnQpIHtcbiAgICB3aGlsZShzdGFydC5yaWdodCAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9hbmNlc3RvcnMucHVzaChzdGFydCk7XG4gICAgICAgIHN0YXJ0ID0gc3RhcnQucmlnaHQ7XG4gICAgfVxuICAgIHRoaXMuX2N1cnNvciA9IHN0YXJ0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmVlQmFzZTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRpbnlRdWV1ZTtcblxuZnVuY3Rpb24gVGlueVF1ZXVlKGRhdGEsIGNvbXBhcmUpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVGlueVF1ZXVlKSkgcmV0dXJuIG5ldyBUaW55UXVldWUoZGF0YSwgY29tcGFyZSk7XG5cbiAgICB0aGlzLmRhdGEgPSBkYXRhIHx8IFtdO1xuICAgIHRoaXMubGVuZ3RoID0gdGhpcy5kYXRhLmxlbmd0aDtcbiAgICB0aGlzLmNvbXBhcmUgPSBjb21wYXJlIHx8IGRlZmF1bHRDb21wYXJlO1xuXG4gICAgaWYgKGRhdGEpIGZvciAodmFyIGkgPSBNYXRoLmZsb29yKHRoaXMubGVuZ3RoIC8gMik7IGkgPj0gMDsgaS0tKSB0aGlzLl9kb3duKGkpO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0Q29tcGFyZShhLCBiKSB7XG4gICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiAwO1xufVxuXG5UaW55UXVldWUucHJvdG90eXBlID0ge1xuXG4gICAgcHVzaDogZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdGhpcy5kYXRhLnB1c2goaXRlbSk7XG4gICAgICAgIHRoaXMubGVuZ3RoKys7XG4gICAgICAgIHRoaXMuX3VwKHRoaXMubGVuZ3RoIC0gMSk7XG4gICAgfSxcblxuICAgIHBvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdG9wID0gdGhpcy5kYXRhWzBdO1xuICAgICAgICB0aGlzLmRhdGFbMF0gPSB0aGlzLmRhdGFbdGhpcy5sZW5ndGggLSAxXTtcbiAgICAgICAgdGhpcy5sZW5ndGgtLTtcbiAgICAgICAgdGhpcy5kYXRhLnBvcCgpO1xuICAgICAgICB0aGlzLl9kb3duKDApO1xuICAgICAgICByZXR1cm4gdG9wO1xuICAgIH0sXG5cbiAgICBwZWVrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFbMF07XG4gICAgfSxcblxuICAgIF91cDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZGF0YSxcbiAgICAgICAgICAgIGNvbXBhcmUgPSB0aGlzLmNvbXBhcmU7XG5cbiAgICAgICAgd2hpbGUgKHBvcyA+IDApIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBNYXRoLmZsb29yKChwb3MgLSAxKSAvIDIpO1xuICAgICAgICAgICAgaWYgKGNvbXBhcmUoZGF0YVtwb3NdLCBkYXRhW3BhcmVudF0pIDwgMCkge1xuICAgICAgICAgICAgICAgIHN3YXAoZGF0YSwgcGFyZW50LCBwb3MpO1xuICAgICAgICAgICAgICAgIHBvcyA9IHBhcmVudDtcblxuICAgICAgICAgICAgfSBlbHNlIGJyZWFrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9kb3duOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICAgIHZhciBkYXRhID0gdGhpcy5kYXRhLFxuICAgICAgICAgICAgY29tcGFyZSA9IHRoaXMuY29tcGFyZSxcbiAgICAgICAgICAgIGxlbiA9IHRoaXMubGVuZ3RoO1xuXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICB2YXIgbGVmdCA9IDIgKiBwb3MgKyAxLFxuICAgICAgICAgICAgICAgIHJpZ2h0ID0gbGVmdCArIDEsXG4gICAgICAgICAgICAgICAgbWluID0gcG9zO1xuXG4gICAgICAgICAgICBpZiAobGVmdCA8IGxlbiAmJiBjb21wYXJlKGRhdGFbbGVmdF0sIGRhdGFbbWluXSkgPCAwKSBtaW4gPSBsZWZ0O1xuICAgICAgICAgICAgaWYgKHJpZ2h0IDwgbGVuICYmIGNvbXBhcmUoZGF0YVtyaWdodF0sIGRhdGFbbWluXSkgPCAwKSBtaW4gPSByaWdodDtcblxuICAgICAgICAgICAgaWYgKG1pbiA9PT0gcG9zKSByZXR1cm47XG5cbiAgICAgICAgICAgIHN3YXAoZGF0YSwgbWluLCBwb3MpO1xuICAgICAgICAgICAgcG9zID0gbWluO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuZnVuY3Rpb24gc3dhcChkYXRhLCBpLCBqKSB7XG4gICAgdmFyIHRtcCA9IGRhdGFbaV07XG4gICAgZGF0YVtpXSA9IGRhdGFbal07XG4gICAgZGF0YVtqXSA9IHRtcDtcbn1cbiIsInZhciBzaWduZWRBcmVhID0gcmVxdWlyZSgnLi9zaWduZWRfYXJlYScpO1xuXG4vKipcbiAqIEBwYXJhbSAge1N3ZWVwRXZlbnR9IGUxXG4gKiBAcGFyYW0gIHtTd2VlcEV2ZW50fSBlMlxuICogQHJldHVybiB7TnVtYmVyfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN3ZWVwRXZlbnRzQ29tcChlMSwgZTIpIHtcbiAgdmFyIHAxID0gZTEucG9pbnQ7XG4gIHZhciBwMiA9IGUyLnBvaW50O1xuXG4gIC8vIERpZmZlcmVudCB4LWNvb3JkaW5hdGVcbiAgaWYgKHAxWzBdID4gcDJbMF0pIHJldHVybiAxO1xuICBpZiAocDFbMF0gPCBwMlswXSkgcmV0dXJuIC0xO1xuXG4gIC8vIERpZmZlcmVudCBwb2ludHMsIGJ1dCBzYW1lIHgtY29vcmRpbmF0ZVxuICAvLyBFdmVudCB3aXRoIGxvd2VyIHktY29vcmRpbmF0ZSBpcyBwcm9jZXNzZWQgZmlyc3RcbiAgaWYgKHAxWzFdICE9PSBwMlsxXSkgcmV0dXJuIHAxWzFdID4gcDJbMV0gPyAxIDogLTE7XG5cbiAgLy8gU2FtZSBjb29yZGluYXRlcywgYnV0IG9uZSBpcyBhIGxlZnQgZW5kcG9pbnQgYW5kIHRoZSBvdGhlciBpc1xuICAvLyBhIHJpZ2h0IGVuZHBvaW50LiBUaGUgcmlnaHQgZW5kcG9pbnQgaXMgcHJvY2Vzc2VkIGZpcnN0XG4gIGlmIChlMS5sZWZ0ICE9PSBlMi5sZWZ0KVxuICAgIHJldHVybiBlMS5sZWZ0ID8gMSA6IC0xO1xuXG4gIC8vIFNhbWUgY29vcmRpbmF0ZXMsIGJvdGggZXZlbnRzXG4gIC8vIGFyZSBsZWZ0IGVuZHBvaW50cyBvciByaWdodCBlbmRwb2ludHMuXG4gIC8vIG5vdCBjb2xsaW5lYXJcbiAgaWYgKHNpZ25lZEFyZWEgKHAxLCBlMS5vdGhlckV2ZW50LnBvaW50LCBlMi5vdGhlckV2ZW50LnBvaW50KSAhPT0gMCkge1xuICAgIC8vIHRoZSBldmVudCBhc3NvY2lhdGUgdG8gdGhlIGJvdHRvbSBzZWdtZW50IGlzIHByb2Nlc3NlZCBmaXJzdFxuICAgIHJldHVybiBlMS5pc0Fib3ZlKGUyLm90aGVyRXZlbnQucG9pbnQpID8gMSA6IC0xO1xuICB9XG4gIHJldHVybiBlMS5pc1N1YmplY3QgPyAtMSA6IDE7XG59O1xuIiwidmFyIHNpZ25lZEFyZWEgICAgPSByZXF1aXJlKCcuL3NpZ25lZF9hcmVhJyk7XG52YXIgY29tcGFyZUV2ZW50cyA9IHJlcXVpcmUoJy4vY29tcGFyZV9ldmVudHMnKTtcblxuLyoqXG4gKiBAcGFyYW0gIHtTd2VlcEV2ZW50fSBsZTFcbiAqIEBwYXJhbSAge1N3ZWVwRXZlbnR9IGxlMlxuICogQHJldHVybiB7TnVtYmVyfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNvbXBhcmVTZWdtZW50cyhsZTEsIGxlMikge1xuICBpZiAobGUxID09PSBsZTIpIHJldHVybiAwO1xuXG4gIC8vIFNlZ21lbnRzIGFyZSBub3QgY29sbGluZWFyXG4gIGlmIChzaWduZWRBcmVhKGxlMS5wb2ludCwgbGUxLm90aGVyRXZlbnQucG9pbnQsIGxlMi5wb2ludCkgIT09IDAgfHxcbiAgICBzaWduZWRBcmVhKGxlMS5wb2ludCwgbGUxLm90aGVyRXZlbnQucG9pbnQsIGxlMi5vdGhlckV2ZW50LnBvaW50KSAhPT0gMCkge1xuXG4gICAgLy8gSWYgdGhleSBzaGFyZSB0aGVpciBsZWZ0IGVuZHBvaW50IHVzZSB0aGUgcmlnaHQgZW5kcG9pbnQgdG8gc29ydFxuICAgIGlmIChsZTEucG9pbnQgPT09IGxlMi5wb2ludCkgcmV0dXJuIGxlMS5pc0JlbG93KGxlMi5vdGhlckV2ZW50LnBvaW50KSA/IC0xIDogMTtcblxuICAgIC8vIERpZmZlcmVudCBsZWZ0IGVuZHBvaW50OiB1c2UgdGhlIGxlZnQgZW5kcG9pbnQgdG8gc29ydFxuICAgIGlmIChsZTEucG9pbnRbMF0gPT09IGxlMi5wb2ludFswXSkgcmV0dXJuIGxlMS5wb2ludFsxXSA8IGxlMi5wb2ludFsxXSA/IC0xIDogMTtcblxuICAgIC8vIGhhcyB0aGUgbGluZSBzZWdtZW50IGFzc29jaWF0ZWQgdG8gZTEgYmVlbiBpbnNlcnRlZFxuICAgIC8vIGludG8gUyBhZnRlciB0aGUgbGluZSBzZWdtZW50IGFzc29jaWF0ZWQgdG8gZTIgP1xuICAgIGlmIChjb21wYXJlRXZlbnRzKGxlMSwgbGUyKSA9PT0gMSkgcmV0dXJuIGxlMi5pc0Fib3ZlKGxlMS5wb2ludCkgPyAtMSA6IDE7XG5cbiAgICAvLyBUaGUgbGluZSBzZWdtZW50IGFzc29jaWF0ZWQgdG8gZTIgaGFzIGJlZW4gaW5zZXJ0ZWRcbiAgICAvLyBpbnRvIFMgYWZ0ZXIgdGhlIGxpbmUgc2VnbWVudCBhc3NvY2lhdGVkIHRvIGUxXG4gICAgcmV0dXJuIGxlMS5pc0JlbG93KGxlMi5wb2ludCkgPyAtMSA6IDE7XG4gIH1cblxuICAvLyBTZWdtZW50cyBhcmUgY29sbGluZWFyXG4gIGlmIChsZTEuaXNTdWJqZWN0ICE9PSBsZTIuaXNTdWJqZWN0KSByZXR1cm4gKGxlMS5pc1N1YmplY3QgJiYgIWxlMi5pc1N1YmplY3QpID8gMSA6IC0xO1xuXG4gIC8vIEp1c3QgYSBjb25zaXN0ZW50IGNyaXRlcmlvbiBpcyB1c2VkXG4gIGlmIChsZTEucG9pbnQgPT09IGxlMi5wb2ludCkgcmV0dXJuIDA7XG5cbiAgcmV0dXJuIGNvbXBhcmVFdmVudHMobGUxLCBsZTIpID09PSAxID8gMSA6IC0xO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7IFxuICBOT1JNQUw6ICAgICAgICAgICAgICAgMCwgXG4gIE5PTl9DT05UUklCVVRJTkc6ICAgICAxLCBcbiAgU0FNRV9UUkFOU0lUSU9OOiAgICAgIDIsIFxuICBESUZGRVJFTlRfVFJBTlNJVElPTjogM1xufTtcbiIsInZhciBJTlRFUlNFQ1RJT04gPSAwO1xudmFyIFVOSU9OICAgICAgICA9IDE7XG52YXIgRElGRkVSRU5DRSAgID0gMjtcbnZhciBYT1IgICAgICAgICAgPSAzO1xuXG52YXIgZWRnZVR5cGUgICAgICAgID0gcmVxdWlyZSgnLi9lZGdlX3R5cGUnKTtcblxudmFyIFF1ZXVlICAgICAgICAgICA9IHJlcXVpcmUoJ3RpbnlxdWV1ZScpO1xudmFyIFRyZWUgICAgICAgICAgICA9IHJlcXVpcmUoJ2JpbnRyZWVzJykuUkJUcmVlO1xudmFyIFN3ZWVwRXZlbnQgICAgICA9IHJlcXVpcmUoJy4vc3dlZXBfZXZlbnQnKTtcblxudmFyIHNpZ25lZEFyZWEgICAgICA9IHJlcXVpcmUoJy4vc2lnbmVkX2FyZWEnKTtcbnZhciBjb21wYXJlRXZlbnRzICAgPSByZXF1aXJlKCcuL2NvbXBhcmVfZXZlbnRzJyk7XG52YXIgY29tcGFyZVNlZ21lbnRzID0gcmVxdWlyZSgnLi9jb21wYXJlX3NlZ21lbnRzJyk7XG52YXIgaW50ZXJzZWN0aW9uICAgID0gcmVxdWlyZSgnLi9zZWdtZW50X2ludGVyc2VjdGlvbicpO1xuXG52YXIgZXZlbnRRdWV1ZTtcblxuZnVuY3Rpb24gcG9pbnRzRXF1YWwocDEsIHAyKSB7XG4gIHJldHVybiBwMVswXSA9PT0gcDJbMF0gJiYgcDFbMV0gPT09IHAyWzFdO1xufVxuXG5cbi8qKlxuICogQHBhcmFtICB7QXJyYXkuPEFycmF5LjxOdW1iZXI+fSBzZWdtZW50XG4gKiBAcGFyYW0gIHtCb29sZWFufSBpc1N1YmplY3RcbiAqIEBwYXJhbSAge1F1ZXVlfSAgIGV2ZW50UXVldWVcbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc1NlZ21lbnQoc2VnbWVudCwgaXNTdWJqZWN0LCBldmVudFF1ZXVlKSB7XG4gIC8vIFBvc3NpYmxlIGRlZ2VuZXJhdGUgY29uZGl0aW9uLlxuICBpZiAocG9pbnRzRXF1YWwoc2VnbWVudFswXSwgc2VnbWVudFsxXSkpIHJldHVybjtcblxuICB2YXIgZTEgPSBuZXcgU3dlZXBFdmVudChzZWdtZW50WzBdLCBmYWxzZSwgdW5kZWZpbmVkLCBpc1N1YmplY3QpO1xuICB2YXIgZTIgPSBuZXcgU3dlZXBFdmVudChzZWdtZW50WzFdLCBmYWxzZSwgZTEsIGlzU3ViamVjdCk7XG4gIGUxLm90aGVyRXZlbnQgPSBlMjtcblxuICBpZiAoY29tcGFyZUV2ZW50cyhlMSwgZTIpID4gMCkge1xuICAgIGUyLmxlZnQgPSB0cnVlO1xuICB9IGVsc2Uge1xuICAgIGUxLmxlZnQgPSB0cnVlO1xuICB9XG5cbiAgLy8gUHVzaGluZyBpdCBzbyB0aGUgcXVldWUgaXMgc29ydGVkIGZyb20gbGVmdCB0byByaWdodCxcbiAgLy8gd2l0aCBvYmplY3Qgb24gdGhlIGxlZnQgaGF2aW5nIHRoZSBoaWdoZXN0IHByaW9yaXR5LlxuICBldmVudFF1ZXVlLnB1c2goZTEpO1xuICBldmVudFF1ZXVlLnB1c2goZTIpO1xufVxuXG5cbmZ1bmN0aW9uIGZpbGxRdWV1ZShzdWJqZWN0LCBjbGlwcGluZykge1xuICB2YXIgaSwgaWksIGosIGpqO1xuICBldmVudFF1ZXVlID0gbmV3IFF1ZXVlKG51bGwsIGNvbXBhcmVFdmVudHMpO1xuXG4gIGZvciAoaSA9IDAsIGlpID0gc3ViamVjdC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgZm9yIChqID0gMCwgamogPSBzdWJqZWN0W2ldLmxlbmd0aCAtIDE7IGogPCBqajsgaisrKSB7XG4gICAgICBwcm9jZXNzU2VnbWVudChbc3ViamVjdFtpXVtqXSwgc3ViamVjdFtpXVtqICsgMV1dLCB0cnVlLCBldmVudFF1ZXVlKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGkgPSAwLCBpaSA9IGNsaXBwaW5nLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICBmb3IgKGogPSAwLCBqaiA9IGNsaXBwaW5nW2ldLmxlbmd0aCAtIDE7IGogPCBqajsgaisrKSB7XG4gICAgICBwcm9jZXNzU2VnbWVudChbY2xpcHBpbmdbaV1bal0sIGNsaXBwaW5nW2ldW2ogKyAxXV0sIGZhbHNlLCBldmVudFF1ZXVlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZXZlbnRRdWV1ZTtcbn1cblxuXG5mdW5jdGlvbiBjb21wdXRlRmllbGRzKGV2ZW50LCBwcmV2LCBzd2VlcExpbmUsIG9wZXJhdGlvbikge1xuICAvLyBjb21wdXRlIGluT3V0IGFuZCBvdGhlckluT3V0IGZpZWxkc1xuICBpZiAocHJldiA9PT0gc3dlZXBMaW5lLm1heCgpKSB7XG4gICAgZXZlbnQuaW5PdXQgICAgICA9IGZhbHNlO1xuICAgIGV2ZW50Lm90aGVySW5PdXQgPSB0cnVlO1xuXG4gIC8vIHByZXZpb3VzIGxpbmUgc2VnbWVudCBpbiBzd2VlcGxpbmUgYmVsb25ncyB0byB0aGUgc2FtZSBwb2x5Z29uXG4gIH0gZWxzZSBpZiAoZXZlbnQuaXNTdWJqZWN0ID09PSBwcmV2LmlzU3ViamVjdCkge1xuICAgIGV2ZW50LmluT3V0ICAgICAgPSAhcHJldi5pbk91dDtcbiAgICBldmVudC5vdGhlckluT3V0ID0gcHJldi5vdGhlckluT3V0O1xuXG4gIC8vIHByZXZpb3VzIGxpbmUgc2VnbWVudCBpbiBzd2VlcGxpbmUgYmVsb25ncyB0byB0aGUgY2xpcHBpbmcgcG9seWdvblxuICB9IGVsc2Uge1xuICAgIGV2ZW50LmluT3V0ICAgICAgPSAhcHJldi5vdGhlckluT3V0O1xuICAgIGV2ZW50Lm90aGVySW5PdXQgPSBwcmV2LmlzVmVydGljYWwoKSA/ICFwcmV2LmluT3V0IDogcHJldi5pbk91dDtcbiAgfVxuXG4gIC8vIGNvbXB1dGUgcHJldkluUmVzdWx0IGZpZWxkXG4gIGlmIChwcmV2ICE9PSBzd2VlcExpbmUubWF4KCkpIHtcbiAgICBldmVudC5wcmV2SW5SZXN1bHQgPSAoIWluUmVzdWx0KHByZXYsIG9wZXJhdGlvbikgfHwgcHJldi5pc1ZlcnRpY2FsKCkpID9cbiAgICAgICBwcmV2LnByZXZJblJlc3VsdCA6IHByZXY7XG4gIH1cbiAgLy8gY2hlY2sgaWYgdGhlIGxpbmUgc2VnbWVudCBiZWxvbmdzIHRvIHRoZSBCb29sZWFuIG9wZXJhdGlvblxuICBldmVudC5pblJlc3VsdCA9IGluUmVzdWx0KGV2ZW50LCBvcGVyYXRpb24pO1xufVxuXG5cbmZ1bmN0aW9uIGVxdWFscyhwMSwgcDIpIHtcbiAgcmV0dXJuIHAxWzBdID09PSBwMlswXSAmJiBwMVsxXSA9PT0gcDJbMV07XG59XG5cblxuZnVuY3Rpb24gcG9zc2libGVJbnRlcnNlY3Rpb24oc2UxLCBzZTIsIHF1ZXVlKSB7XG4gIGlmKHNlMS5pc1N1YmplY3QgPT09IHNlMi5pc1N1YmplY3QpIHJldHVybjtcblxuICB2YXIgaW50ZXIgPSBpbnRlcnNlY3Rpb24oXG4gICAgc2UxLnBvaW50LCBzZTEub3RoZXJFdmVudC5wb2ludCxcbiAgICBzZTIucG9pbnQsIHNlMi5vdGhlckV2ZW50LnBvaW50XG4gICk7XG4gIHZhciBuaW50ZXJzZWN0aW9ucyA9IGludGVyID8gaW50ZXIubGVuZ3RoIDogMDtcblxuICBpZiAoIW5pbnRlcnNlY3Rpb25zID09PSAwKSByZXR1cm4gMDsgLy8gbm8gaW50ZXJzZWN0aW9uXG5cbiAgLy8gdGhlIGxpbmUgc2VnbWVudHMgaW50ZXJzZWN0IGF0IGFuIGVuZHBvaW50IG9mIGJvdGggbGluZSBzZWdtZW50c1xuICBpZiAoKG5pbnRlcnNlY3Rpb25zID09PSAxKSAmJlxuICAgICAgKGVxdWFscyhzZTEucG9pbnQsIHNlMi5wb2ludCkgfHxcbiAgICAgICBlcXVhbHMoc2UxLm90aGVyRXZlbnQucG9pbnQsIHNlMi5vdGhlckV2ZW50LnBvaW50KSkpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGlmIChuaW50ZXJzZWN0aW9ucyA9PT0gMiAmJiBzZTEuaXNTdWJqZWN0ID09PSBzZTIuaXNTdWJqZWN0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiU29ycnksIGVkZ2VzIG9mIHRoZSBzYW1lIHBvbHlnb24gb3ZlcmxhcD9cIik7XG4gIH1cblxuICAvLyBUaGUgbGluZSBzZWdtZW50cyBhc3NvY2lhdGVkIHRvIHNlMSBhbmQgc2UyIGludGVyc2VjdFxuICBpZiAobmludGVyc2VjdGlvbnMgPT09IDEpIHtcblxuICAgIC8vIGlmIHRoZSBpbnRlcnNlY3Rpb24gcG9pbnQgaXMgbm90IGFuIGVuZHBvaW50IG9mIHNlMVxuICAgIGlmICghZXF1YWxzKHNlMS5wb2ludCwgaW50ZXJbMF0pICYmICFlcXVhbHMoc2UxLm90aGVyRXZlbnQucG9pbnQsIGludGVyWzBdKSkge1xuICAgICAgZGl2aWRlU2VnbWVudChzZTEsIGludGVyWzBdLCBxdWV1ZSk7XG4gICAgfVxuXG4gICAgLy8gaWYgdGhlIGludGVyc2VjdGlvbiBwb2ludCBpcyBub3QgYW4gZW5kcG9pbnQgb2Ygc2UyXG4gICAgaWYgKCFlcXVhbHMoc2UyLnBvaW50LCBpbnRlclswXSkgJiYgIWVxdWFscyhzZTIub3RoZXJFdmVudC5wb2ludCwgaW50ZXJbMF0pKSB7XG4gICAgICBkaXZpZGVTZWdtZW50KHNlMiwgaW50ZXJbMF0sIHF1ZXVlKTtcbiAgICB9XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvLyBUaGUgbGluZSBzZWdtZW50cyBhc3NvY2lhdGVkIHRvIHNlMSBhbmQgc2UyIG92ZXJsYXBcbiAgdmFyIGV2ZW50cyAgICAgICAgPSBbXTtcbiAgdmFyIGxlZnRDb2luY2lkZSAgPSBmYWxzZTtcbiAgdmFyIHJpZ2h0Q29pbmNpZGUgPSBmYWxzZTtcblxuICBpZiAoc2UxLnBvaW50ID09PSBzZTIucG9pbnQpIHtcbiAgICBsZWZ0Q29pbmNpZGUgPSB0cnVlOyAvLyBsaW5rZWRcbiAgfSBlbHNlIGlmIChjb21wYXJlRXZlbnRzKHNlMSwgc2UyKSA9PT0gMSkge1xuICAgIGV2ZW50cy5wdXNoKHNlMiwgc2UxKTtcbiAgfSBlbHNlIHtcbiAgICBldmVudHMucHVzaChzZTEsIHNlMik7XG4gIH1cblxuICBpZiAoc2UxLm90aGVyRXZlbnQucG9pbnQgPT09IHNlMi5vdGhlckV2ZW50LnBvaW50KSB7XG4gICAgcmlnaHRDb2luY2lkZSA9IHRydWU7XG4gIH0gZWxzZSBpZiAoY29tcGFyZUV2ZW50cyhzZTEub3RoZXJFdmVudCwgc2UyLm90aGVyRXZlbnQpID09PSAxKSB7XG4gICAgZXZlbnRzLnB1c2goc2UyLm90aGVyRXZlbnQsIHNlMS5vdGhlckV2ZW50KTtcbiAgfSBlbHNlIHtcbiAgICBldmVudHMucHVzaChzZTEub3RoZXJFdmVudCwgc2UyLm90aGVyRXZlbnQpO1xuICB9XG5cbiAgaWYgKChsZWZ0Q29pbmNpZGUgJiYgcmlnaHRDb2luY2lkZSkgfHwgbGVmdENvaW5jaWRlKSB7XG4gICAgLy8gYm90aCBsaW5lIHNlZ21lbnRzIGFyZSBlcXVhbCBvciBzaGFyZSB0aGUgbGVmdCBlbmRwb2ludFxuICAgIHNlMS50eXBlID0gZWRnZVR5cGUuTk9OX0NPTlRSSUJVVElORztcbiAgICBzZTIudHlwZSA9IChzZTEuaW5PdXQgPT09IHNlMi5pbk91dCkgP1xuICAgICAgZWRnZVR5cGUuU0FNRV9UUkFOU0lUSU9OIDpcbiAgICAgIGVkZ2VUeXBlLkRJRkZFUkVOVF9UUkFOU0lUSU9OO1xuXG4gICAgaWYgKGxlZnRDb2luY2lkZSAmJiAhcmlnaHRDb2luY2lkZSkge1xuICAgICAgZGl2aWRlU2VnbWVudChldmVudHNbMl0ub3RoZXJFdmVudCwgZXZlbnRzWzFdLnBvaW50LCBxdWV1ZSk7XG4gICAgfVxuICAgIHJldHVybiAyO1xuICB9XG5cbiAgLy8gdGhlIGxpbmUgc2VnbWVudHMgc2hhcmUgdGhlIHJpZ2h0IGVuZHBvaW50XG4gIGlmIChyaWdodENvaW5jaWRlKSB7XG4gICAgZGl2aWRlU2VnbWVudChldmVudHNbMF0sIGV2ZW50c1sxXS5wb2ludCk7XG4gICAgcmV0dXJuIDM7XG4gIH1cblxuICAvLyBubyBsaW5lIHNlZ21lbnQgaW5jbHVkZXMgdG90YWxseSB0aGUgb3RoZXIgb25lXG4gIGlmIChldmVudHNbMF0gIT09IGV2ZW50c1szXS5vdGhlckV2ZW50KSB7XG4gICAgZGl2aWRlU2VnbWVudChldmVudHNbMF0sIGV2ZW50c1sxXS5wb2ludCwgcXVldWUpO1xuICAgIGRpdmlkZVNlZ21lbnQoZXZlbnRzWzFdLCBldmVudHNbMl0ucG9pbnQsIHF1ZXVlKTtcbiAgICByZXR1cm4gMztcbiAgfVxuXG4gIC8vIG9uZSBsaW5lIHNlZ21lbnQgaW5jbHVkZXMgdGhlIG90aGVyIG9uZVxuICBkaXZpZGVTZWdtZW50KGV2ZW50c1swXSwgZXZlbnRzWzFdLnBvaW50LCBxdWV1ZSk7XG4gIGRpdmlkZVNlZ21lbnQoZXZlbnRzWzNdLm90aGVyRXZlbnQsIGV2ZW50c1syXS5wb2ludCwgcXVldWUpO1xuXG4gIHJldHVybiAzO1xufVxuXG5cbmZ1bmN0aW9uIGRpdmlkZVNlZ21lbnQoc2UsIHAsIHF1ZXVlKSAge1xuICB2YXIgciA9IG5ldyBTd2VlcEV2ZW50KHAsIGZhbHNlLCBzZSwgICAgICAgICAgICBzZS5pc1N1YmplY3QvKiwgbGUtPnR5cGUqLyk7XG4gIHZhciBsID0gbmV3IFN3ZWVwRXZlbnQocCwgdHJ1ZSwgIHNlLm90aGVyRXZlbnQsIHNlLmlzU3ViamVjdC8qLCBsZS0+b3RoZXItPnR5cGUqLyk7XG5cbiAgLy8gYXZvaWQgYSByb3VuZGluZyBlcnJvci4gVGhlIGxlZnQgZXZlbnQgd291bGQgYmUgcHJvY2Vzc2VkIGFmdGVyIHRoZSByaWdodCBldmVudFxuICBpZiAoY29tcGFyZUV2ZW50cyhsLCBzZS5vdGhlckV2ZW50KSA+IDApIHtcbiAgICBzZS5vdGhlckV2ZW50LmxlZnQgPSB0cnVlO1xuICAgIGwubGVmdCA9IGZhbHNlO1xuICB9XG5cbiAgLy8gYXZvaWQgYSByb3VuZGluZyBlcnJvci4gVGhlIGxlZnQgZXZlbnQgd291bGQgYmUgcHJvY2Vzc2VkIGFmdGVyIHRoZSByaWdodCBldmVudFxuICBpZiAoY29tcGFyZUV2ZW50cyhzZSwgcikgPiAwKSB7XG4gICAgY29uc29sZS5sb2coXCJPb3BzMlwiLCAnXFxuJywgc2UucG9pbnQsIHNlLmxlZnQsIHNlLm90aGVyRXZlbnQucG9pbnQsIHNlLm90aGVyRXZlbnQubGVmdCxcbiAgICAgICAnXFxuJywgci5wb2ludCwgci5sZWZ0LCByLm90aGVyRXZlbnQucG9pbnQsIHIub3RoZXJFdmVudC5sZWZ0KTtcbiAgfVxuXG4gIHNlLm90aGVyRXZlbnQub3RoZXJFdmVudCA9IGw7XG4gIHNlLm90aGVyRXZlbnQgPSByO1xuXG4gIHF1ZXVlLnB1c2gobCk7XG4gIHF1ZXVlLnB1c2gocik7XG5cbiAgcmV0dXJuIHF1ZXVlO1xufVxuXG5cbmZ1bmN0aW9uIHN1YmRpdmlkZVNlZ21lbnRzKGV2ZW50UXVldWUsIHN1YmplY3QsIGNsaXBwaW5nLCBvcGVyYXRpb24pIHtcbiAgdmFyIHNvcnRlZEV2ZW50cyA9IFtdO1xuICB2YXIgcHJldiwgbmV4dDtcblxuICB2YXIgc3dlZXBMaW5lID0gbmV3IFRyZWUoY29tcGFyZVNlZ21lbnRzKTtcbiAgdmFyIHNvcnRlZEV2ZW50cyA9IFtdO1xuXG4gIHZhciBhZGRlZCA9IDA7XG4gIHZhciByZW1vdmVkID0gMDtcblxuICB3aGlsZSAoZXZlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICB2YXIgZXZlbnQgPSBldmVudFF1ZXVlLnBvcCgpO1xuICAgIHNvcnRlZEV2ZW50cy5wdXNoKGV2ZW50KTtcblxuICAgIGlmIChldmVudC5sZWZ0KSB7XG4gICAgICBzd2VlcExpbmUuaW5zZXJ0KGV2ZW50KTtcbiAgICAgIGNvbXB1dGVGaWVsZHMoZXZlbnQsIGV2ZW50LnByZXYsIHN3ZWVwTGluZSwgb3BlcmF0aW9uKTtcblxuICAgICAgcG9zc2libGVJbnRlcnNlY3Rpb24oZXZlbnQsIGV2ZW50Lm5leHQsIGV2ZW50UXVldWUsIHNvcnRlZEV2ZW50cyk7XG4gICAgICBwb3NzaWJsZUludGVyc2VjdGlvbihldmVudCwgZXZlbnQucHJldiwgZXZlbnRRdWV1ZSwgc29ydGVkRXZlbnRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3dlZXBMaW5lLnJlbW92ZShldmVudC5vdGhlckV2ZW50KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNvcnRlZEV2ZW50cztcbn1cblxuZnVuY3Rpb24gY29ubmVjdEVkZ2VzKHNvcnRlZEV2ZW50cykge1xuICByZXR1cm4gW107XG59XG5cblxuZnVuY3Rpb24gaW5SZXN1bHQoZXZlbnQsIG9wZXJhdGlvbikge1xuICBzd2l0Y2ggKGV2ZW50LnR5cGUpIHtcbiAgICBjYXNlIGVkZ2VUeXBlLk5PUk1BTDpcbiAgICAgIHN3aXRjaCAob3BlcmF0aW9uKSB7XG4gICAgICAgIGNhc2UgSU5URVJTRUNUSU9OOlxuICAgICAgICAgIHJldHVybiAhZXZlbnQub3RoZXJJbk91dDtcbiAgICAgICAgY2FzZSBVTklPTjpcbiAgICAgICAgICByZXR1cm4gZXZlbnQub3RoZXJJbk91dDtcbiAgICAgICAgY2FzZSBESUZGRVJFTkNFOlxuICAgICAgICAgIHJldHVybiBldmVudC5pc1N1YmplY3QgPyBldmVudC5vdGhlckluT3V0IDogIWV2ZW50Lm90aGVySW5PdXQ7XG4gICAgICAgIGNhc2UgWE9SOlxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIGNhc2UgZWRnZVR5cGUuU0FNRV9UUkFOU0lUSU9OOlxuICAgICAgcmV0dXJuIG9wZXJhdGlvbiA9PSBJTlRFUlNFQ1RJT04gfHwgb3BlcmF0aW9uID09IFVOSU9OO1xuICAgIGNhc2UgZWRnZVR5cGUuRElGRkVSRU5UX1RSQU5TSVRJT046XG4gICAgICByZXR1cm4gb3BlcmF0aW9uID09IERJRkZFUkVOQ0U7XG4gICAgY2FzZSBlZGdlVHlwZS5OT05fQ09OVFJJQlVUSU5HOlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuXG5mdW5jdGlvbiBib29sZWFuKHN1YmplY3QsIGNsaXBwaW5nLCBvcGVyYXRpb24pIHtcbiAgdmFyIGV2ZW50UXVldWUgPSBmaWxsUXVldWUoc3ViamVjdCwgY2xpcHBpbmcpO1xuICB2YXIgc29ydGVkRXZlbnRzID0gc3ViZGl2aWRlU2VnbWVudHMoZXZlbnRRdWV1ZSwgc3ViamVjdCwgY2xpcHBpbmcsIG9wZXJhdGlvbik7XG4gIHJldHVybiBjb25uZWN0RWRnZXMoc29ydGVkRXZlbnRzKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBib29sZWFuO1xuXG5cbm1vZHVsZS5leHBvcnRzLnVuaW9uID0gZnVuY3Rpb24oc3ViamVjdCwgY2xpcHBpbmcpIHtcbiAgcmV0dXJuIGJvb2xlYW4oc3ViamVjdCwgY2xpcHBpbmcsIFVOSU9OKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMuZGlmZiA9IGZ1bmN0aW9uKHN1YmplY3QsIGNsaXBwaW5nKSB7XG4gIHJldHVybiBib29sZWFuKHN1YmplY3QsIGNsaXBwaW5nLCBESUZGRVJFTkNFKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMueG9yID0gZnVuY3Rpb24oc3ViamVjdCwgY2xpcHBpbmcpIHtcbiAgcmV0dXJuIGJvb2xlYW4oc3ViamVjdCwgY2xpcHBpbmcsIFhPUik7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKHN1YmplY3QsIGNsaXBwaW5nKSB7XG4gIHJldHVybiBib29sZWFuKHN1YmplY3QsIGNsaXBwaW5nLCBJTlRFUlNFQ1RJT04pO1xufTtcblxubW9kdWxlLmV4cG9ydHMuZmlsbFF1ZXVlICAgICAgICAgPSBmaWxsUXVldWU7XG5tb2R1bGUuZXhwb3J0cy5jb21wdXRlRmllbGRzICAgICA9IGNvbXB1dGVGaWVsZHM7XG5tb2R1bGUuZXhwb3J0cy5zdWJkaXZpZGVTZWdtZW50cyA9IHN1YmRpdmlkZVNlZ21lbnRzO1xubW9kdWxlLmV4cG9ydHMuZGl2aWRlU2VnbWVudCAgICAgPSBkaXZpZGVTZWdtZW50O1xubW9kdWxlLmV4cG9ydHMucG9zc2libGVJbnRlcnNlY3Rpb24gPSBwb3NzaWJsZUludGVyc2VjdGlvbjsiLCJ2YXIgRVBTSUxPTiA9IDFlLTk7XG5cbi8qKlxuICogRmluZHMgdGhlIG1hZ25pdHVkZSBvZiB0aGUgY3Jvc3MgcHJvZHVjdCBvZiB0d28gdmVjdG9ycyAoaWYgd2UgcHJldGVuZFxuICogdGhleSdyZSBpbiB0aHJlZSBkaW1lbnNpb25zKVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhIEZpcnN0IHZlY3RvclxuICogQHBhcmFtIHtPYmplY3R9IGIgU2Vjb25kIHZlY3RvclxuICogQHByaXZhdGVcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBtYWduaXR1ZGUgb2YgdGhlIGNyb3NzIHByb2R1Y3RcbiAqL1xuZnVuY3Rpb24ga3Jvc3NQcm9kdWN0KGEsIGIpIHtcbiAgcmV0dXJuIGFbMF0gKiBiWzFdIC0gYVsxXSAqIGJbMF07XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGRvdCBwcm9kdWN0IG9mIHR3byB2ZWN0b3JzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhIEZpcnN0IHZlY3RvclxuICogQHBhcmFtIHtPYmplY3R9IGIgU2Vjb25kIHZlY3RvclxuICogQHByaXZhdGVcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBkb3QgcHJvZHVjdFxuICovXG5mdW5jdGlvbiBkb3RQcm9kdWN0KGEsIGIpIHtcbiAgcmV0dXJuIGFbMF0gKiBiWzBdICsgYVsxXSAqIGJbMV07XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGludGVyc2VjdGlvbiAoaWYgYW55KSBiZXR3ZWVuIHR3byBsaW5lIHNlZ21lbnRzIGEgYW5kIGIsIGdpdmVuIHRoZVxuICogbGluZSBzZWdtZW50cycgZW5kIHBvaW50cyBhMSwgYTIgYW5kIGIxLCBiMi5cbiAqXG4gKiBUaGlzIGFsZ29yaXRobSBpcyBiYXNlZCBvbiBTY2huZWlkZXIgYW5kIEViZXJseS5cbiAqIGh0dHA6Ly93d3cuY2ltZWMub3JnLmFyL35uY2Fsdm8vU2NobmVpZGVyX0ViZXJseS5wZGZcbiAqIFBhZ2UgMjQ0LlxuICpcbiAqIEBwYXJhbSB7QXJyYXkuPE51bWJlcj59IGExIHBvaW50IG9mIGZpcnN0IGxpbmVcbiAqIEBwYXJhbSB7QXJyYXkuPE51bWJlcj59IGEyIHBvaW50IG9mIGZpcnN0IGxpbmVcbiAqIEBwYXJhbSB7QXJyYXkuPE51bWJlcj59IGIxIHBvaW50IG9mIHNlY29uZCBsaW5lXG4gKiBAcGFyYW0ge0FycmF5LjxOdW1iZXI+fSBiMiBwb2ludCBvZiBzZWNvbmQgbGluZVxuICogQHBhcmFtIHtCb29sZWFuPX0gICAgICAgbm9FbmRwb2ludFRvdWNoIHdoZXRoZXIgdG8gc2tpcCBzaW5nbGUgdG91Y2hwb2ludHNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobWVhbmluZyBjb25uZWN0ZWQgc2VnbWVudHMpIGFzXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJzZWN0aW9uc1xuICogQHJldHVybnMge0FycmF5LjxBcnJheS48TnVtYmVyPj58TnVsbH0gSWYgdGhlIGxpbmVzIGludGVyc2VjdCwgdGhlIHBvaW50IG9mXG4gKiBpbnRlcnNlY3Rpb24uIElmIHRoZXkgb3ZlcmxhcCwgdGhlIHR3byBlbmQgcG9pbnRzIG9mIHRoZSBvdmVybGFwcGluZyBzZWdtZW50LlxuICogT3RoZXJ3aXNlLCBudWxsLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGExLCBhMiwgYjEsIGIyLCBub0VuZHBvaW50VG91Y2gpIHtcbiAgLy8gVGhlIGFsZ29yaXRobSBleHBlY3RzIG91ciBsaW5lcyBpbiB0aGUgZm9ybSBQICsgc2QsIHdoZXJlIFAgaXMgYSBwb2ludCxcbiAgLy8gcyBpcyBvbiB0aGUgaW50ZXJ2YWwgWzAsIDFdLCBhbmQgZCBpcyBhIHZlY3Rvci5cbiAgLy8gV2UgYXJlIHBhc3NlZCB0d28gcG9pbnRzLiBQIGNhbiBiZSB0aGUgZmlyc3QgcG9pbnQgb2YgZWFjaCBwYWlyLiBUaGVcbiAgLy8gdmVjdG9yLCB0aGVuLCBjb3VsZCBiZSB0aG91Z2h0IG9mIGFzIHRoZSBkaXN0YW5jZSAoaW4geCBhbmQgeSBjb21wb25lbnRzKVxuICAvLyBmcm9tIHRoZSBmaXJzdCBwb2ludCB0byB0aGUgc2Vjb25kIHBvaW50LlxuICAvLyBTbyBmaXJzdCwgbGV0J3MgbWFrZSBvdXIgdmVjdG9yczpcbiAgdmFyIHZhID0gW2EyWzBdIC0gYTFbMF0sIGEyWzFdIC0gYTFbMV1dO1xuICB2YXIgdmIgPSBbYjJbMF0gLSBiMVswXSwgYjJbMV0gLSBiMVsxXV07XG4gIC8vIFdlIGFsc28gZGVmaW5lIGEgZnVuY3Rpb24gdG8gY29udmVydCBiYWNrIHRvIHJlZ3VsYXIgcG9pbnQgZm9ybTpcblxuICAvKiBlc2xpbnQtZGlzYWJsZSBhcnJvdy1ib2R5LXN0eWxlICovXG5cbiAgZnVuY3Rpb24gdG9Qb2ludChwLCBzLCBkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIHBbMF0gKyBzICogZFswXSxcbiAgICAgIHBbMV0gKyBzICogZFsxXVxuICAgIF07XG4gIH07XG5cbiAgLyogZXNsaW50LWVuYWJsZSBhcnJvdy1ib2R5LXN0eWxlICovXG5cbiAgLy8gVGhlIHJlc3QgaXMgcHJldHR5IG11Y2ggYSBzdHJhaWdodCBwb3J0IG9mIHRoZSBhbGdvcml0aG0uXG4gIHZhciBlID0gW2IxWzBdIC0gYTFbMF0sIGIxWzFdIC0gYTFbMV1dO1xuICB2YXIga3Jvc3MgPSBrcm9zc1Byb2R1Y3QodmEsIHZiKTtcbiAgdmFyIHNxcktyb3NzID0ga3Jvc3MgKiBrcm9zcztcbiAgdmFyIHNxckxlbkEgPSBkb3RQcm9kdWN0KHZhLCB2YSk7XG4gIHZhciBzcXJMZW5CID0gZG90UHJvZHVjdCh2YiwgdmIpO1xuXG4gIC8vIENoZWNrIGZvciBsaW5lIGludGVyc2VjdGlvbi4gVGhpcyB3b3JrcyBiZWNhdXNlIG9mIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZVxuICAvLyBjcm9zcyBwcm9kdWN0IC0tIHNwZWNpZmljYWxseSwgdHdvIHZlY3RvcnMgYXJlIHBhcmFsbGVsIGlmIGFuZCBvbmx5IGlmIHRoZVxuICAvLyBjcm9zcyBwcm9kdWN0IGlzIHRoZSAwIHZlY3Rvci4gVGhlIGZ1bGwgY2FsY3VsYXRpb24gaW52b2x2ZXMgcmVsYXRpdmUgZXJyb3JcbiAgLy8gdG8gYWNjb3VudCBmb3IgcG9zc2libGUgdmVyeSBzbWFsbCBsaW5lIHNlZ21lbnRzLiBTZWUgU2NobmVpZGVyICYgRWJlcmx5XG4gIC8vIGZvciBkZXRhaWxzLlxuICBpZiAoc3FyS3Jvc3MgPiBFUFNJTE9OICogc3FyTGVuQSAqIHNxckxlbkIpIHtcbiAgICAvLyBJZiB0aGV5J3JlIG5vdCBwYXJhbGxlbCwgdGhlbiAoYmVjYXVzZSB0aGVzZSBhcmUgbGluZSBzZWdtZW50cykgdGhleVxuICAgIC8vIHN0aWxsIG1pZ2h0IG5vdCBhY3R1YWxseSBpbnRlcnNlY3QuIFRoaXMgY29kZSBjaGVja3MgdGhhdCB0aGVcbiAgICAvLyBpbnRlcnNlY3Rpb24gcG9pbnQgb2YgdGhlIGxpbmVzIGlzIGFjdHVhbGx5IG9uIGJvdGggbGluZSBzZWdtZW50cy5cbiAgICB2YXIgcyA9IGtyb3NzUHJvZHVjdChlLCB2YikgLyBrcm9zcztcbiAgICBpZiAocyA8IDAgfHwgcyA+IDEpIHtcbiAgICAgIC8vIG5vdCBvbiBsaW5lIHNlZ21lbnQgYVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciB0ID0ga3Jvc3NQcm9kdWN0KGUsIHZhKSAvIGtyb3NzO1xuICAgIGlmICh0IDwgMCB8fCB0ID4gMSkge1xuICAgICAgLy8gbm90IG9uIGxpbmUgc2VnbWVudCBiXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIG5vRW5kcG9pbnRUb3VjaCA/IG51bGwgOiBbdG9Qb2ludChhMSwgcywgdmEpXTtcbiAgfVxuXG4gIC8vIElmIHdlJ3ZlIHJlYWNoZWQgdGhpcyBwb2ludCwgdGhlbiB0aGUgbGluZXMgYXJlIGVpdGhlciBwYXJhbGxlbCBvciB0aGVcbiAgLy8gc2FtZSwgYnV0IHRoZSBzZWdtZW50cyBjb3VsZCBvdmVybGFwIHBhcnRpYWxseSBvciBmdWxseSwgb3Igbm90IGF0IGFsbC5cbiAgLy8gU28gd2UgbmVlZCB0byBmaW5kIHRoZSBvdmVybGFwLCBpZiBhbnkuIFRvIGRvIHRoYXQsIHdlIGNhbiB1c2UgZSwgd2hpY2ggaXNcbiAgLy8gdGhlICh2ZWN0b3IpIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgdHdvIGluaXRpYWwgcG9pbnRzLiBJZiB0aGlzIGlzIHBhcmFsbGVsXG4gIC8vIHdpdGggdGhlIGxpbmUgaXRzZWxmLCB0aGVuIHRoZSB0d28gbGluZXMgYXJlIHRoZSBzYW1lIGxpbmUsIGFuZCB0aGVyZSB3aWxsXG4gIC8vIGJlIG92ZXJsYXAuXG4gIHZhciBzcXJMZW5FID0gZG90UHJvZHVjdChlLCBlKTtcbiAga3Jvc3MgPSBrcm9zc1Byb2R1Y3QoZSwgdmEpO1xuICBzcXJLcm9zcyA9IGtyb3NzICoga3Jvc3M7XG5cbiAgaWYgKHNxcktyb3NzID4gRVBTSUxPTiAqIHNxckxlbkEgKiBzcXJMZW5FKSB7XG4gICAgLy8gTGluZXMgYXJlIGp1c3QgcGFyYWxsZWwsIG5vdCB0aGUgc2FtZS4gTm8gb3ZlcmxhcC5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZhciBzYSA9IGRvdFByb2R1Y3QodmEsIGUpIC8gc3FyTGVuQTtcbiAgdmFyIHNiID0gc2EgKyBkb3RQcm9kdWN0KHZhLCB2YikgLyBzcXJMZW5BO1xuICB2YXIgc21pbiA9IE1hdGgubWluKHNhLCBzYik7XG4gIHZhciBzbWF4ID0gTWF0aC5tYXgoc2EsIHNiKTtcblxuICAvLyB0aGlzIGlzLCBlc3NlbnRpYWxseSwgdGhlIEZpbmRJbnRlcnNlY3Rpb24gYWN0aW5nIG9uIGZsb2F0cyBmcm9tXG4gIC8vIFNjaG5laWRlciAmIEViZXJseSwganVzdCBpbmxpbmVkIGludG8gdGhpcyBmdW5jdGlvbi5cbiAgaWYgKHNtaW4gPD0gMSAmJiBzbWF4ID49IDApIHtcblxuICAgIC8vIG92ZXJsYXAgb24gYW4gZW5kIHBvaW50XG4gICAgaWYgKHNtaW4gPT09IDEpIHtcbiAgICAgIHJldHVybiBub0VuZHBvaW50VG91Y2ggPyBudWxsIDogW3RvUG9pbnQoYTEsIHNtaW4gPiAwID8gc21pbiA6IDAsIHZhKV07XG4gICAgfVxuXG4gICAgaWYgKHNtYXggPT09IDApIHtcbiAgICAgIHJldHVybiBub0VuZHBvaW50VG91Y2ggPyBudWxsIDogW3RvUG9pbnQoYTEsIHNtYXggPCAxID8gc21heCA6IDEsIHZhKV07XG4gICAgfVxuXG4gICAgaWYgKG5vRW5kcG9pbnRUb3VjaCAmJiBzbWluID09PSAwICYmIHNtYXggPT09IDEpIHJldHVybiBudWxsO1xuXG4gICAgLy8gVGhlcmUncyBvdmVybGFwIG9uIGEgc2VnbWVudCAtLSB0d28gcG9pbnRzIG9mIGludGVyc2VjdGlvbi4gUmV0dXJuIGJvdGguXG4gICAgcmV0dXJuIFtcbiAgICAgIHRvUG9pbnQoYTEsIHNtaW4gPiAwID8gc21pbiA6IDAsIHZhKSxcbiAgICAgIHRvUG9pbnQoYTEsIHNtYXggPCAxID8gc21heCA6IDEsIHZhKSxcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuIiwiLyoqXG4gKiBTaWduZWQgYXJlYSBvZiB0aGUgdHJpYW5nbGUgKHAwLCBwMSwgcDIpXG4gKiBAcGFyYW0gIHtBcnJheS48TnVtYmVyPn0gcDBcbiAqIEBwYXJhbSAge0FycmF5LjxOdW1iZXI+fSBwMVxuICogQHBhcmFtICB7QXJyYXkuPE51bWJlcj59IHAyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc2lnbmVkQXJlYShwMCwgcDEsIHAyKSB7XG4gIHJldHVybiAocDBbMF0gLSBwMlswXSkgKiAocDFbMV0gLSBwMlsxXSkgLSAocDFbMF0gLSBwMlswXSkgKiAocDBbMV0gLSBwMlsxXSk7XG59O1xuIiwidmFyIHNpZ25lZEFyZWEgPSByZXF1aXJlKCcuL3NpZ25lZF9hcmVhJyk7XG52YXIgZWRnZVR5cGUgICA9IHJlcXVpcmUoJy4vZWRnZV90eXBlJyk7XG5cblxuLyoqXG4gKiBTd2VlcGxpbmUgZXZlbnRcbiAqXG4gKiBAcGFyYW0ge0FycmF5LjxOdW1iZXI+fSAgcG9pbnRcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gICAgICAgICBsZWZ0XG4gKiBAcGFyYW0ge1N3ZWVwRXZlbnQ9fSAgICAgb3RoZXJFdmVudFxuICogQHBhcmFtIHtCb29sZWFufSAgICAgICAgIGlzU3ViamVjdFxuICogQHBhcmFtIHtOdW1iZXJ9ICAgICAgICAgIGVkZ2VUeXBlXG4gKi9cbmZ1bmN0aW9uIFN3ZWVwRXZlbnQocG9pbnQsIGxlZnQsIG90aGVyRXZlbnQsIGlzU3ViamVjdCwgZWRnZVR5cGUpIHtcblxuICAvKipcbiAgICogSXMgbGVmdCBlbmRwb2ludD9cbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmxlZnQgPSBsZWZ0O1xuXG4gIC8qKlxuICAgKiBAdHlwZSB7QXJyYXkuPE51bWJlcj59XG4gICAqL1xuICB0aGlzLnBvaW50ID0gcG9pbnQ7XG5cbiAgLyoqXG4gICAqIE90aGVyIGVkZ2UgcmVmZXJlbmNlXG4gICAqIEB0eXBlIHtTd2VlcEV2ZW50fVxuICAgKi9cbiAgdGhpcy5vdGhlckV2ZW50ID0gb3RoZXJFdmVudDtcblxuICAvKipcbiAgICogQmVsb25ncyB0byBzb3VyY2Ugb3IgY2xpcHBpbmcgcG9seWdvblxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG4gIHRoaXMuaXNTdWJqZWN0ID0gaXNTdWJqZWN0O1xuXG4gIC8qKlxuICAgKiBFZGdlIGNvbnRyaWJ1dGlvbiB0eXBlXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnR5cGUgPSBlZGdlVHlwZTtcblxuXG4gIC8qKlxuICAgKiBJbi1vdXQgdHJhbnNpdGlvbiBmb3IgdGhlIHN3ZWVwbGluZSBjcm9zc2luZyBwb2x5Z29uXG4gICAqIEB0eXBlIHtCb29sZWFufVxuICAgKi9cbiAgdGhpcy5pbk91dCA9IGZhbHNlO1xuXG5cbiAgLyoqXG4gICAqIEB0eXBlIHtCb29sZWFufVxuICAgKi9cbiAgdGhpcy5vdGhlckluT3V0ID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFByZXZpb3VzIGV2ZW50IGluIHJlc3VsdD9cbiAgICogQHR5cGUge1N3ZWVwRXZlbnR9XG4gICAqL1xuICB0aGlzLnByZXZJblJlc3VsdCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIERvZXMgZXZlbnQgYmVsb25nIHRvIHJlc3VsdD9cbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmluUmVzdWx0ID0gZmFsc2U7XG59XG5cblxuU3dlZXBFdmVudC5wcm90b3R5cGUgPSB7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0FycmF5LjxOdW1iZXI+fSAgcFxuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKi9cbiAgaXNCZWxvdzogZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiB0aGlzLmxlZnQgP1xuICAgICAgc2lnbmVkQXJlYSAodGhpcy5wb2ludCwgdGhpcy5vdGhlckV2ZW50LnBvaW50LCBwKSA+IDAgOlxuICAgICAgc2lnbmVkQXJlYSAodGhpcy5vdGhlckV2ZW50LnBvaW50LCB0aGlzLnBvaW50LCBwKSA+IDA7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHBhcmFtICB7QXJyYXkuPE51bWJlcj59ICBwXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqL1xuICBpc0Fib3ZlOiBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICF0aGlzLmlzQmVsb3cocCk7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG4gIGlzVmVydGljYWw6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnBvaW50WzBdID09PSB0aGlzLm90aGVyRXZlbnQucG9pbnRbMF07XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU3dlZXBFdmVudDtcbiJdfQ==
