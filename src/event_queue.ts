import Queue from "tinyqueue";
import SweepEvent from "./sweep_event";
import compareEvents from "./compare_events";

/**
 * Priority queue of sweep events.
 *
 * Almost all events are known before the sweep starts, so they are sorted
 * once and consumed from an array. Only the events created while the sweep
 * runs (by dividing segments) go through a heap. Popping takes the smaller
 * of the two heads. This is much cheaper than pushing every event through
 * a heap and sifting it down again on every pop.
 */
export default class EventQueue {
  private sorted: SweepEvent[];
  private index = 0;
  private heap = new Queue<SweepEvent>(undefined, compareEvents);

  /**
   * @param {SweepEvent[]} events initial events, sorted by compareEvents
   */
  constructor(events: SweepEvent[]) {
    this.sorted = events;
  }

  get length(): number {
    return this.sorted.length - this.index + this.heap.length;
  }

  push(event: SweepEvent): void {
    this.heap.push(event);
  }

  peek(): SweepEvent | undefined {
    const next = this.sorted[this.index];
    const top = this.heap.peek();
    if (top === undefined) return next;
    if (next === undefined) return top;
    return compareEvents(top, next) < 0 ? top : next;
  }

  pop(): SweepEvent | undefined {
    const next = this.sorted[this.index];
    const top = this.heap.peek();
    if (top !== undefined && (next === undefined || compareEvents(top, next) < 0)) {
      return this.heap.pop();
    }
    if (next !== undefined) this.index++;
    return next;
  }
}
