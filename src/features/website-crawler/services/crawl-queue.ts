export interface CrawlQueueOptions {
  maxPages: number;
}

export class CrawlQueue {
  private readonly maxPages: number;
  private readonly queue: string[] = [];
  private readonly seen = new Set<string>();
  private enqueuedCount = 0;

  constructor(options: CrawlQueueOptions) {
    this.maxPages = options.maxPages;
  }

  enqueue(url: string): boolean {
    if (this.isFull()) return false;
    if (this.seen.has(url)) return false;

    this.seen.add(url);
    this.queue.push(url);
    this.enqueuedCount += 1;
    return true;
  }

  dequeue(): string | undefined {
    return this.queue.shift();
  }

  peek(): string | undefined {
    return this.queue[0];
  }

  has(url: string): boolean {
    return this.seen.has(url);
  }

  isFull(): boolean {
    return this.enqueuedCount >= this.maxPages;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  get size(): number {
    return this.queue.length;
  }

  get remainingCapacity(): number {
    return Math.max(this.maxPages - this.enqueuedCount, 0);
  }
}
