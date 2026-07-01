export async function fetchSitemap(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "SEO-Tool-Crawler/1.0" },
  });

  if (!response.ok) {
    return "";
  }

  return response.text();
}

const LOC_REGEX = /<loc>\s*([^<\s][^<]*?)\s*<\/loc>/gi;

export function parseSitemapUrls(xml: string): string[] {
  const urls: string[] = [];
  LOC_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = LOC_REGEX.exec(xml)) !== null) {
    const url = match[1].trim();
    if (url) urls.push(url);
  }

  return urls;
}

export async function downloadAndParseSitemap(url: string): Promise<string[]> {
  const xml = await fetchSitemap(url);
  return parseSitemapUrls(xml);
}
