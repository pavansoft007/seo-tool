import { afterEach, describe, expect, it, vi } from "vitest";
import { CrawlQueue } from "../src/features/website-crawler/services/crawl-queue";
import { crawlWebsite } from "../src/features/website-crawler/services/crawl-website";

describe("CrawlQueue", () => {
  it("dequeues URLs in FIFO order", () => {
    const queue = new CrawlQueue({ maxPages: 10 });
    queue.enqueue("https://example.com/a");
    queue.enqueue("https://example.com/b");
    queue.enqueue("https://example.com/c");

    expect(queue.dequeue()).toBe("https://example.com/a");
    expect(queue.dequeue()).toBe("https://example.com/b");
    expect(queue.dequeue()).toBe("https://example.com/c");
  });

  it("prevents duplicate URLs from being enqueued", () => {
    const queue = new CrawlQueue({ maxPages: 10 });
    expect(queue.enqueue("https://example.com/a")).toBe(true);
    expect(queue.enqueue("https://example.com/a")).toBe(false);
    expect(queue.size).toBe(1);
  });

  it("stops accepting URLs once maxPages is reached", () => {
    const queue = new CrawlQueue({ maxPages: 2 });
    expect(queue.enqueue("https://example.com/a")).toBe(true);
    expect(queue.enqueue("https://example.com/b")).toBe(true);
    expect(queue.enqueue("https://example.com/c")).toBe(false);
    expect(queue.isFull()).toBe(true);
  });
});

describe("crawlWebsite", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("crawls recursively while deduping links and staying on the same domain", async () => {
    const pages: Record<string, string> = {
      "https://example.com/": `
        <a href="/about">About</a>
        <a href="/about">About again</a>
        <a href="https://external.com/page">External</a>
      `,
      "https://example.com/about": `<a href="/">Home</a><a href="/contact">Contact</a>`,
      "https://example.com/contact": `<a href="/">Home</a>`,
    };

    const fetchMock = vi.fn(async (input: string) => {
      const html = pages[String(input)];
      return html
        ? new Response(html, { status: 200 })
        : new Response(null, { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await crawlWebsite("https://example.com/", { maxPages: 10 });
    const crawledUrls = result.pages.map((page) => page.url);

    expect(crawledUrls).toEqual([
      "https://example.com/",
      "https://example.com/about",
      "https://example.com/contact",
    ]);
    expect(crawledUrls).not.toContain("https://external.com/page");
  });

  it("stops once maxPages is reached", async () => {
    const pages: Record<string, string> = {
      "https://example.com/": `<a href="/a">A</a><a href="/b">B</a>`,
      "https://example.com/a": `<a href="/c">C</a>`,
      "https://example.com/b": "",
      "https://example.com/c": "",
    };

    const fetchMock = vi.fn(async (input: string) => {
      return new Response(pages[String(input)] ?? "", { status: 200 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await crawlWebsite("https://example.com/", { maxPages: 2 });
    expect(result.pages).toHaveLength(2);
  });
});
