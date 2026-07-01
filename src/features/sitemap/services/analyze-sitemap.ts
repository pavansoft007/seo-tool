export type SitemapIssueCode = "MISSING_FROM_SITEMAP" | "ORPHAN_IN_SITEMAP";

export interface SitemapIssue {
  url: string;
  code: SitemapIssueCode;
  message: string;
}

function normalize(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }
  return parsed.toString();
}

export function analyzeSitemap(
  crawledUrls: string[],
  sitemapUrls: string[]
): SitemapIssue[] {
  const issues: SitemapIssue[] = [];

  const normalizedSitemap = new Set(sitemapUrls.map(normalize));
  const normalizedCrawled = new Set(crawledUrls.map(normalize));

  for (const url of crawledUrls) {
    if (!normalizedSitemap.has(normalize(url))) {
      issues.push({
        url,
        code: "MISSING_FROM_SITEMAP",
        message: "Crawled page is not listed in the sitemap",
      });
    }
  }

  for (const url of sitemapUrls) {
    if (!normalizedCrawled.has(normalize(url))) {
      issues.push({
        url,
        code: "ORPHAN_IN_SITEMAP",
        message: "Sitemap URL was not reached during the crawl",
      });
    }
  }

  return issues;
}
