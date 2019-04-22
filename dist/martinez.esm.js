/**
 * martinez-polygon-clipping v0.5.0
 * Martinez polygon clipping algorithm, does boolean operation on polygons (multipolygons, polygons with holes etc): intersection, union, difference, xor
 *
 * @author Alex Milevski <info@w8r.name>
 * @license MIT
 * @preserve
 */

/**
 * splaytree v3.0.0
 * Fast Splay tree for Node and browser
 *
 * @author Alexander Milevski <info@w8r.name>
 * @license MIT
 * @preserve
 */

class Node {
    constructor(key, data) {
        this.next = null;
        this.key = key;
        this.data = data;
        this.left = null;
        this.right = null;
    }
}

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
    const N = new Node(null, null);
    let l = N;
    let r = N;
    while (true) {
        const cmp = comparator(i, t.key);
        //if (i < t.key) {
        if (cmp < 0) {
            if (t.left === null)
                break;
            //if (i < t.left.key) {
            if (comparator(i, t.left.key) < 0) {
                const y = t.left; /* rotate right */
                t.left = y.right;
                y.right = t;
                t = y;
                if (t.left === null)
                    break;
            }
            r.left = t; /* link right */
            r = t;
            t = t.left;
            //} else if (i > t.key) {
        }
        else if (cmp > 0) {
            if (t.right === null)
                break;
            //if (i > t.right.key) {
            if (comparator(i, t.right.key) > 0) {
                const y = t.right; /* rotate left */
                t.right = y.left;
                y.left = t;
                t = y;
                if (t.right === null)
                    break;
            }
            l.right = t; /* link left */
            l = t;
            t = t.right;
        }
        else
            break;
    }
    /* assemble */
    l.right = t.left;
    r.left = t.right;
    t.left = N.right;
    t.right = N.left;
    return t;
}
function insert(i, data, t, comparator) {
    const node = new Node(i, data);
    if (t === null) {
        node.left = node.right = null;
        return node;
    }
    t = splay(i, t, comparator);
    const cmp = comparator(i, t.key);
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
    let left = null;
    let right = null;
    if (v) {
        v = splay(key, v, comparator);
        const cmp = comparator(v.key, key);
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
    return { left, right };
}
function merge(left, right, comparator) {
    if (right === null)
        return left;
    if (left === null)
        return right;
    right = splay(left.key, right, comparator);
    right.left = left;
    return right;
}
/**
 * Prints level of the tree
 */
function printRow(root, prefix, isTail, out, printNode) {
    if (root) {
        out(`${prefix}${isTail ? '└── ' : '├── '}${printNode(root)}\n`);
        const indent = prefix + (isTail ? '    ' : '│   ');
        if (root.left)
            printRow(root.left, indent, false, out, printNode);
        if (root.right)
            printRow(root.right, indent, true, out, printNode);
    }
}
class Tree {
    constructor(comparator = DEFAULT_COMPARE) {
        this._root = null;
        this._size = 0;
        this._comparator = comparator;
    }
    /**
     * Inserts a key, allows duplicates
     */
    insert(key, data) {
        this._size++;
        return this._root = insert(key, data, this._root, this._comparator);
    }
    /**
     * Adds a key, if it is not present in the tree
     */
    add(key, data) {
        const node = new Node(key, data);
        if (this._root === null) {
            node.left = node.right = null;
            this._size++;
            this._root = node;
        }
        const comparator = this._comparator;
        const t = splay(key, this._root, comparator);
        const cmp = comparator(key, t.key);
        if (cmp === 0)
            this._root = t;
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
    }
    /**
     * @param  {Key} key
     * @return {Node|null}
     */
    remove(key) {
        this._root = this._remove(key, this._root, this._comparator);
    }
    /**
     * Deletes i from the tree if it's there
     */
    _remove(i, t, comparator) {
        let x;
        if (t === null)
            return null;
        t = splay(i, t, comparator);
        const cmp = comparator(i, t.key);
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
    }
    /**
     * Removes and returns the node with smallest key
     */
    pop() {
        let node = this._root;
        if (node) {
            while (node.left)
                node = node.left;
            this._root = splay(node.key, this._root, this._comparator);
            this._root = this._remove(node.key, this._root, this._comparator);
            return { key: node.key, data: node.data };
        }
        return null;
    }
    /**
     * Find without splaying
     */
    findStatic(key) {
        let current = this._root;
        const compare = this._comparator;
        while (current) {
            const cmp = compare(key, current.key);
            if (cmp === 0)
                return current;
            else if (cmp < 0)
                current = current.left;
            else
                current = current.right;
        }
        return null;
    }
    find(key) {
        if (this._root) {
            this._root = splay(key, this._root, this._comparator);
            if (this._comparator(key, this._root.key) !== 0)
                return null;
        }
        return this._root;
    }
    contains(key) {
        let current = this._root;
        const compare = this._comparator;
        while (current) {
            const cmp = compare(key, current.key);
            if (cmp === 0)
                return true;
            else if (cmp < 0)
                current = current.left;
            else
                current = current.right;
        }
        return false;
    }
    forEach(visitor, ctx) {
        let current = this._root;
        const Q = []; /* Initialize stack s */
        let done = false;
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
                    done = true;
            }
        }
        return this;
    }
    /**
     * Walk key range from `low` to `high`. Stops if `fn` returns a value.
     */
    range(low, high, fn, ctx) {
        const Q = [];
        const compare = this._comparator;
        let node = this._root;
        let cmp;
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
                        return this; // stop if smth is returned
                }
                node = node.right;
            }
        }
        return this;
    }
    /**
     * Returns array of keys
     */
    keys() {
        const keys = [];
        this.forEach(({ key }) => keys.push(key));
        return keys;
    }
    /**
     * Returns array of all the data in the nodes
     */
    values() {
        const values = [];
        this.forEach(({ data }) => values.push(data));
        return values;
    }
    min() {
        if (this._root)
            return this.minNode(this._root).key;
        return null;
    }
    max() {
        if (this._root)
            return this.maxNode(this._root).key;
        return null;
    }
    minNode(t = this._root) {
        if (t)
            while (t.left)
                t = t.left;
        return t;
    }
    maxNode(t = this._root) {
        if (t)
            while (t.right)
                t = t.right;
        return t;
    }
    /**
     * Returns node at given index
     */
    at(index) {
        let current = this._root;
        let done = false;
        let i = 0;
        const Q = [];
        while (!done) {
            if (current) {
                Q.push(current);
                current = current.left;
            }
            else {
                if (Q.length > 0) {
                    current = Q.pop();
                    if (i === index)
                        return current;
                    i++;
                    current = current.right;
                }
                else
                    done = true;
            }
        }
        return null;
    }
    next(d) {
        let root = this._root;
        let successor = null;
        if (d.right) {
            successor = d.right;
            while (successor.left)
                successor = successor.left;
            return successor;
        }
        const comparator = this._comparator;
        while (root) {
            const cmp = comparator(d.key, root.key);
            if (cmp === 0)
                break;
            else if (cmp < 0) {
                successor = root;
                root = root.left;
            }
            else
                root = root.right;
        }
        return successor;
    }
    prev(d) {
        let root = this._root;
        let predecessor = null;
        if (d.left !== null) {
            predecessor = d.left;
            while (predecessor.right)
                predecessor = predecessor.right;
            return predecessor;
        }
        const comparator = this._comparator;
        while (root) {
            const cmp = comparator(d.key, root.key);
            if (cmp === 0)
                break;
            else if (cmp < 0)
                root = root.left;
            else {
                predecessor = root;
                root = root.right;
            }
        }
        return predecessor;
    }
    clear() {
        this._root = null;
        this._size = 0;
        return this;
    }
    toList() {
        return toList(this._root);
    }
    /**
     * Bulk-load items. Both array have to be same size
     */
    load(keys, values = [], presort = false) {
        let size = keys.length;
        const comparator = this._comparator;
        // sort if needed
        if (presort)
            sort(keys, values, 0, size - 1, comparator);
        if (this._root === null) { // empty tree
            this._root = loadRecursive(keys, values, 0, size);
            this._size = size;
        }
        else { // that re-builds the whole tree from two in-order traversals
            const mergedList = mergeLists(this.toList(), createList(keys, values), comparator);
            size = this._size + size;
            this._root = sortedListToBST({ head: mergedList }, 0, size);
        }
        return this;
    }
    isEmpty() { return this._root === null; }
    get size() { return this._size; }
    get root() { return this._root; }
    toString(printNode = (n) => String(n.key)) {
        const out = [];
        printRow(this._root, '', true, (v) => out.push(v), printNode);
        return out.join('');
    }
    update(key, newKey, newData) {
        const comparator = this._comparator;
        let { left, right } = split(key, this._root, comparator);
        if (comparator(key, newKey) < 0) {
            right = insert(newKey, newData, right, comparator);
        }
        else {
            left = insert(newKey, newData, left, comparator);
        }
        this._root = merge(left, right, comparator);
    }
    split(key) {
        return split(key, this._root, this._comparator);
    }
}
function loadRecursive(keys, values, start, end) {
    const size = end - start;
    if (size > 0) {
        const middle = start + Math.floor(size / 2);
        const key = keys[middle];
        const data = values[middle];
        const node = new Node(key, data);
        node.left = loadRecursive(keys, values, start, middle);
        node.right = loadRecursive(keys, values, middle + 1, end);
        return node;
    }
    return null;
}
function createList(keys, values) {
    const head = new Node(null, null);
    let p = head;
    for (let i = 0; i < keys.length; i++) {
        p = p.next = new Node(keys[i], values[i]);
    }
    p.next = null;
    return head.next;
}
function toList(root) {
    let current = root;
    const Q = [];
    let done = false;
    const head = new Node(null, null);
    let p = head;
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
                done = true;
        }
    }
    p.next = null; // that'll work even if the tree was empty
    return head.next;
}
function sortedListToBST(list, start, end) {
    const size = end - start;
    if (size > 0) {
        const middle = start + Math.floor(size / 2);
        const left = sortedListToBST(list, start, middle);
        const root = list.head;
        root.left = left;
        list.head = list.head.next;
        root.right = sortedListToBST(list, middle + 1, end);
        return root;
    }
    return null;
}
function mergeLists(l1, l2, compare) {
    const head = new Node(null, null); // dummy
    let p = head;
    let p1 = l1;
    let p2 = l2;
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
        return;
    const pivot = keys[(left + right) >> 1];
    let i = left - 1;
    let j = right + 1;
    while (true) {
        do
            i++;
        while (compare(keys[i], pivot) < 0);
        do
            j--;
        while (compare(keys[j], pivot) > 0);
        if (i >= j)
            break;
        let tmp = keys[i];
        keys[i] = keys[j];
        keys[j] = tmp;
        tmp = values[i];
        values[i] = values[j];
        values[j] = tmp;
    }
    sort(keys, values, left, j, compare);
    sort(keys, values, j + 1, right, compare);
}

var NORMAL = 0;
var NON_CONTRIBUTING = 1;
var SAME_TRANSITION = 2;
var DIFFERENT_TRANSITION = 3;

var INTERSECTION = 0;
var UNION = 1;
var DIFFERENCE = 2;
var XOR = 3;

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
/* eslint-enable indent */

/**
 * Sweepline event
 */
var SweepEvent = /** @class */ (function () {
    function SweepEvent(point, left, otherEvent, isSubject, edgeType) {
        if (edgeType === void 0) { edgeType = NORMAL; }
        this.left = left;
        this.point = point;
        this.otherEvent = otherEvent;
        this.isSubject = isSubject;
        this.type = edgeType;
        this.inOut = false;
        this.otherInOut = false;
        this.prevInResult = null;
        this.inResult = false;
        // connection step
        this.resultInOut = false;
        this.isExteriorRing = true;
    }
    /**
     * @param  {Array.<Number>}  p
     * @return {Boolean}
     */
    SweepEvent.prototype.isBelow = function (p) {
        var p0 = this.point, p1 = this.otherEvent.point;
        return this.left
            ? (p0[0] - p[0]) * (p1[1] - p[1]) - (p1[0] - p[0]) * (p0[1] - p[1]) > 0
            // signedArea(this.point, this.otherEvent.point, p) > 0 :
            : (p1[0] - p[0]) * (p0[1] - p[1]) - (p0[0] - p[0]) * (p1[1] - p[1]) > 0;
        //signedArea(this.otherEvent.point, this.point, p) > 0;
    };
    /**
     * @param  {Array.<Number>}  p
     * @return {Boolean}
     */
    SweepEvent.prototype.isAbove = function (p) {
        return !this.isBelow(p);
    };
    /**
     * @return {Boolean}
     */
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

function equals(p1, p2) {
    if (p1[0] === p2[0]) {
        if (p1[1] === p2[1]) {
            return true;
        }
        else {
            return false;
        }
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

/**
 * Signed area of the triangle (p0, p1, p2)
 */
function signedArea(p0, p1, p2) {
    return (p0[0] - p2[0]) * (p1[1] - p2[1]) - (p1[0] - p2[0]) * (p0[1] - p2[1]);
}

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
    return specialCases(e1, e2, p1, p2);
}
/* eslint-disable no-unused-vars */
function specialCases(e1, e2, p1, p2) {
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
        return (!e1.isBelow(e2.otherEvent.point)) ? 1 : -1;
    }
    return (!e1.isSubject && e2.isSubject) ? 1 : -1;
}
/* eslint-enable no-unused-vars */

/**
 * @param  {SweepEvent} se
 * @param  {Array.<Number>} p
 * @param  {Queue} queue
 * @return {Queue}
 */
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

var EPS = 1e-9;
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
function intersection (a1, a2, b1, b2, noEndpointTouch) {
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
    var kross = crossProduct(va, vb);
    var sqrKross = kross * kross;
    var sqrLenA = dotProduct(va, va);
    var sqrLenB = dotProduct(vb, vb);
    // Check for line intersection. This works because of the properties of the
    // cross product -- specifically, two vectors are parallel if and only if the
    // cross product is the 0 vector. The full calculation involves relative error
    // to account for possible very small line segments. See Schneider & Eberly
    // for details.
    if (sqrKross > EPS * sqrLenB * sqrLenA) {
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
    var sqrLenE = dotProduct(e, e);
    kross = crossProduct(e, va);
    sqrKross = kross * kross;
    if (sqrKross > EPS * sqrLenB * sqrLenE) {
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
        if (noEndpointTouch && smin === 0 && smax === 1)
            return null;
        // There's overlap on a segment -- two points of intersection. Return both.
        return [
            toPoint(a1, smin > 0 ? smin : 0, va),
            toPoint(a1, smax < 1 ? smax : 1, va)
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
    var inter = intersection(se1.point, se1.otherEvent.point, se2.point, se2.otherEvent.point, false);
    var nintersections = inter ? inter.length : 0;
    if (nintersections === 0)
        return 0; // no intersection
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
            return le1.isBelow(le2.otherEvent.point) ? -1 : 1;
        // Different left endpoint: use the left endpoint to sort
        if (le1.point[0] === le2.point[0])
            return le1.point[1] < le2.point[1] ? -1 : 1;
        // has the line segment associated to e1 been inserted
        // into S after the line segment associated to e2 ?
        if (compareEvents(le1, le2) === 1)
            return le2.isAbove(le1.point) ? -1 : 1;
        // The line segment associated to e2 has been inserted
        // into S after the line segment associated to e1
        return le1.isBelow(le2.point) ? -1 : 1;
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
/**
 * @param  {Number} pos
 * @param  {Array.<SweepEvent>} resultEvents
 * @param  {Object>}    processed
 * @return {Number}
 */
function nextPos(pos, resultEvents, processed, origIndex) {
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

var max = Math.max;
var min = Math.min;
var contourId = 0;
function processPolygon(contourOrHole, isSubject, depth, Q, bbox, isExteriorRing) {
    var i, len, s1, s2, e1, e2;
    for (i = 0, len = contourOrHole.length - 1; i < len; i++) {
        s1 = contourOrHole[i];
        s2 = contourOrHole[i + 1];
        e1 = new SweepEvent(s1, false, null, isSubject);
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
        if (compareEvents(e1, e2) > 0) {
            e2.left = true;
        }
        else {
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
function fillQueue(subject, clipping, sbbox, cbbox, operation) {
    var eventQueue = new TinyQueue(undefined, compareEvents);
    var polygonSet, isExteriorRing, i, ii, j, jj; //, k, kk;
    for (i = 0, ii = subject.length; i < ii; i++) {
        polygonSet = subject[i];
        for (j = 0, jj = polygonSet.length; j < jj; j++) {
            isExteriorRing = j === 0;
            if (isExteriorRing)
                contourId++;
            processPolygon(polygonSet[j], true, contourId, eventQueue, sbbox, isExteriorRing);
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
            processPolygon(polygonSet[j], false, contourId, eventQueue, cbbox, isExteriorRing);
        }
    }
    return eventQueue;
}

var EMPTY = [];
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
    if (sbbox[0] > cbbox[2] ||
        cbbox[0] > sbbox[2] ||
        sbbox[1] > cbbox[3] ||
        cbbox[1] > sbbox[3]) {
        if (operation === INTERSECTION) {
            result = EMPTY;
        }
        else if (operation === DIFFERENCE) {
            result = subject;
        }
        else if (operation === UNION ||
            operation === XOR) {
            result = subject.concat(clipping);
        }
    }
    return result;
}
function boolean(subjectGeometry, clippingGeometry, operation) {
    if (typeof subjectGeometry[0][0][0] === 'number') {
        subjectGeometry = [subjectGeometry];
    }
    if (typeof clippingGeometry[0][0][0] === 'number') {
        clippingGeometry = [clippingGeometry];
    }
    var subject = subjectGeometry;
    var clipping = clippingGeometry;
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
    var sortedEvents = subdivide(eventQueue, subject, clipping, sbbox, cbbox, operation);
    //console.timeEnd('subdivide edges');
    //console.time('connect vertices');
    var result = connectEdges(sortedEvents, operation);
    //console.timeEnd('connect vertices');
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
/**
 * @enum {Number}
 */
var operations = { UNION: UNION, DIFFERENCE: DIFFERENCE, INTERSECTION: INTERSECTION, XOR: XOR };

export { diff, intersection$1 as intersection, operations, union, xor };
//# sourceMappingURL=martinez.esm.js.map
