export interface DownloadHtmlOptions {
  timeoutMs?: number;
  retries?: number;
  userAgent?: string;
}

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRIES = 2;
const DEFAULT_USER_AGENT = "SEO-Tool-Crawler/1.0";

export async function downloadHtml(
  url: string,
  options: DownloadHtmlOptions = {}
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": userAgent },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to download HTML from ${url}`);
}
