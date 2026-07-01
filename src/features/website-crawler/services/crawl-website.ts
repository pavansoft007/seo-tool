import { CrawlQueue } from "./crawl-queue";
import { extractInternalLinks } from "../../internal-linking/services/extract-internal-links";
import { validateUrl } from "../../../lib/validator";

export interface CrawledPage {
  url: string;
  statusCode: number | null;
  html: string | null;
  loadTimeMs: number | null;
}

export interface CrawlWebsiteOptions {
  maxPages: number;
}

export interface CrawlWebsiteResult {
  pages: CrawledPage[];
}

export async function crawlWebsite(
  startUrl: string,
  options: CrawlWebsiteOptions
): Promise<CrawlWebsiteResult> {
  const validation = validateUrl(startUrl);
  if (!validation.valid) {
    throw new Error(validation.reason ?? "Invalid URL");
  }

  const domain = new URL(startUrl).hostname.toLowerCase();
  const queue = new CrawlQueue({ maxPages: options.maxPages });
  const pages: CrawledPage[] = [];

  queue.enqueue(startUrl);

  while (!queue.isEmpty()) {
    const url = queue.dequeue();
    if (!url) break;

    let statusCode: number | null = null;
    let html: string | null = null;
    let loadTimeMs: number | null = null;
    const startedAt = Date.now();

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "SEO-Tool-Crawler/1.0" },
      });
      statusCode = response.status;

      if (response.ok) {
        html = await response.text();
      }
      loadTimeMs = Date.now() - startedAt;
    } catch {
      statusCode = null;
    }

    pages.push({ url, statusCode, html, loadTimeMs });

    if (!html) continue;

    const internalUrls = extractInternalLinks(html, url);

    for (const internalUrl of internalUrls) {
      const hostname = new URL(internalUrl).hostname.toLowerCase();
      if (hostname !== domain) continue;
      queue.enqueue(internalUrl);
    }
  }

  return { pages };
}
