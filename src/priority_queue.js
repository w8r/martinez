/**
 * @param {Number} a
 * @param {Number} b
 * @return {Number}
 */
function DEFAULT_COMPARATOR(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * @param {Array.<*>=} data
 * @param {Function=}  comparator
 */
function Queue(data, comparator) {
  this._comparator = comparator || DEFAULT_COMPARATOR;
  this.data = [];
  this.length = 0;
  if (data) {
    for (var i = 0, len = data.length; i < len; i++) {
      this.push(data[i]);
    }
  }
}
Queue.DEFAULT_COMPARATOR = DEFAULT_COMPARATOR;


Queue.prototype = {

  /**
   * First element
   * @return {*}
   */
  peek: function() {
    return this.data[0];
  },


  /**
   * @return {*}
   */
  pop: function() {
    var data = this.data;
    var first = data[0];
    var last = data.pop();
    var size = --this.length;

    if (size === 0) {
      return first;
    }

    data[0] = last;
    var current = 0;
    var compare = this._comparator;

    while (current < size) {
      var largest = current;
      var left = (2 * current) + 1;
      var right = (2 * current) + 2;

      if (left < size && compare(data[left], data[largest]) > 0) {
        largest = left;
      }

      if (right < size && compare(data[right], data[largest]) > 0) {
        largest = right;
      }

      if (largest === current) break;

      this._swap(largest, current);
      current = largest;
    }

    return first;
  },


  /**
   * @param {*} element
   * @return {Number} new size
   */
  push: function(element) {
    var size = this.length = this.data.push(element);
    var current = size - 1;
    var compare = this._comparator;
    var data = this.data;

    while (current > 0) {
      var parent = Math.floor((current - 1) / 2);
      if (compare(data[current], data[parent]) > 0) break;
      this._swap(parent, current);
      current = parent;
    }

    return size;
  },


  /**
   * @return {Number}
   */
  size: function() {
    return this.length;
  },


  /**
   * @param {Function} fn
   * @param {*}        context
   */
  forEach: function(fn, context) {
    this.data.forEach(fn, context);
  },


  /**
   * @param {Number} a
   * @param {Number} b
   */
  _swap: function(a, b) {
    var temp = this.data[a];
    this.data[a] = this.data[b];
    this.data[b] = temp;
  }
};


module.exports = Queue;
