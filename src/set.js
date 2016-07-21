/**
 * @param {Number} a
 * @param {Number} b
 * @return {Number}
 */
function DEFAULT_COMPARATOR(a, b) {
  return a.data < b.data ? -1 : a.data > b.data ? 1 : 0;
}


/**
 * Doubly linked sorted list.
 * If you want to use it with raw numbers - wrap them into objects, or
 * they're going to be replaced on insert and it's gonna break
 *
 * @example
 * var list = new Set([{data: 50}, {data: 120}, {data: 10}]);
 * list.head; // {data:10, next: {data: 50, ...}, prev: {data: 120, ...}}
 * list.tail; // {data:120, next: {data: 10, ...}, prev: {data: 50, ...}}
 * 
 * @param {Array.<*>=} data
 * @param {Function=}  comparator
 */
function Set(data, comparator) {

  /**
   * @type {*}
   */
  this.head = null;

  /**
   * @type {*}
   */
  this.tail = null;

  /**
   * @type {Number}
   */
  this.length = 0;

  /**
   * @type {Function}
   */
  this._comparator = comparator || DEFAULT_COMPARATOR;

  if (data) {
    for (var i = 0, len = data.length; i < len; i++) {
      this.insert(data[i]);
    }
  }
}


Set.prototype = {


  /**
   * @param  {*} a
   * @param  {*} b
   * @return {*} Inserted node
   */
  insertBefore: function(a, b) {
    if (b === this.head) {
      a.prev = this.tail;
      this.head = a;
      this.tail.next = this.head;
    } else {
      a.prev = b.prev;
      b.prev.next = a;
    }
    a.next = b;
    return b.prev = a;
  },


  /**
   * @param  {*} a
   * @param  {*} b
   * @return {*} inserted node
   */
  insertAfter: function(a, b) {
    if (b === this.tail) {
      a.next = this.head;
      this.tail = a;
      this.head.prev = this.tail;
    } else {
      a.next = b.next;
      b.next.prev = a;
    }
    a.prev = b;
    return b.next = a;
  },


  /**
   * @param  {*} node
   * @return {*}
   */
  insert: function(node) {
    var current, next;

    this.length++;
    
    if (this.head == null) {
      this.head = node;
      this.head.next = this.head.prev = this.tail = this.head;
      return node;
    }

    if (this._comparator(this.head, node) > 0) {
      this.insertBefore(node, this.head);
    } else {
      current = this.head;
      while (current !== this.tail) {
        next = current.next;
        if (this._comparator(next, node) > 0) break;
        current = current.next;
      }
      this.insertAfter(node, current);
    }

    if (this._comparator(node, this.head) < 0) this.head = node;
    if (this._comparator(node, this.tail) > 0) this.tail = node;

    return node;
  },


  /**
   * @param  {*} node
   * @return {*}
   */
  remove: function(node) {
    var current = this.head;
    while (current !== node) {
      current = current.next;
      if (current === this.head) return;
    }

    if (current === this.head) {
      this.head = this.tail.next = current.next;
      this.head.prev = this.tail;
    } else {
      current.prev.next = current.next;
    }

    this.length--;

    if (current === this.tail) {
      this.tail = this.head.prev = current.prev;
      this.tail.next = this.head;
      return this.head;
    } else {
      current.next.prev = current.prev;
      return current.prev;
    }
  },


  /**
   * @param  {*} node
   * @return {*|Null}
   */
  find: function(node) {
    var current;
    if (!this.head) { // empty list
      return null;
    } else {
      current = this.head;
      while (current.next !== this.head) {
        if (current === node) return current;
        current = current.next;
      }
      return null;
    }
  },


  /**
   * @return {Array.<*>}
   */
  toArray: function() {
    var arr = [];
    var current = this.head;
    while(current !== this.tail) {
      arr.push(current);
      current = current.next;
    }
    return arr;
  }

};


module.exports = Set;
