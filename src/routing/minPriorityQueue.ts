// Binary-heap min-priority queue used by Dijkstra.
//
// Supports insert, extract-min, and decrease-key — all O(log n). The queue
// tracks each element's index via a position map so decrease-key can bubble up
// in O(log n) instead of re-inserting stale entries. This is what gives
// Dijkstra its O((V + E) log V) complexity with an adjacency list.

export interface PQEntry {
  id: string;
  /** Current best-known distance (the priority key). */
  dist: number;
}

export class MinPriorityQueue {
  private heap: PQEntry[] = [];
  /** Maps id → current index in the heap array. */
  private pos = new Map<string, number>();

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  contains(id: string): boolean {
    return this.pos.has(id);
  }

  /** Insert a new entry or update if the id already exists. */
  insert(id: string, dist: number): void {
    if (this.pos.has(id)) {
      this.decreaseKey(id, dist);
      return;
    }
    const idx = this.heap.length;
    this.heap.push({ id, dist });
    this.pos.set(id, idx);
    this.bubbleUp(idx);
  }

  /** Lower the distance of an existing entry. Throws if not present. */
  decreaseKey(id: string, newDist: number): void {
    const idx = this.pos.get(id);
    if (idx === undefined) return;
    if (newDist >= this.heap[idx].dist) return;
    this.heap[idx].dist = newDist;
    this.bubbleUp(idx);
  }

  /** Remove and return the entry with the smallest distance. */
  extractMin(): PQEntry | null {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    this.pos.delete(min.id);
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.pos.set(last.id, 0);
      this.sinkDown(0);
    }
    return min;
  }

  /** Peek at the minimum without removing it. */
  peekMin(): PQEntry | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  // --- Internal heap operations ---

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[idx].dist >= this.heap[parent].dist) break;
      this.swap(idx, parent);
      idx = parent;
    }
  }

  private sinkDown(idx: number): void {
    const n = this.heap.length;
    while (true) {
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      let smallest = idx;
      if (left < n && this.heap[left].dist < this.heap[smallest].dist) {
        smallest = left;
      }
      if (right < n && this.heap[right].dist < this.heap[smallest].dist) {
        smallest = right;
      }
      if (smallest === idx) break;
      this.swap(idx, smallest);
      idx = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const tmp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = tmp;
    this.pos.set(this.heap[i].id, i);
    this.pos.set(this.heap[j].id, j);
  }
}
