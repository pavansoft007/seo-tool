import { extractInternalLinks } from "../../internal-linking/services/extract-internal-links";
import { validateUrl } from "../../../lib/validator";

export interface HomepageCrawlResult {
  url: string;
  internalUrls: string[];
}

export async function crawlHomepage(url: string): Promise<HomepageCrawlResult> {
  const validation = validateUrl(url);
  if (!validation.valid) {
    throw new Error(validation.reason ?? "Invalid URL");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "SEO-Tool-Crawler/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch homepage: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const internalUrls = extractInternalLinks(html, url);

  return { url, internalUrls };
}
