const IGNORED_HOSTNAMES = [
  "facebook.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "youtu.be",
  "linkedin.com",
];

const IGNORED_PROTOCOLS = new Set(["mailto:", "javascript:"]);

const HREF_REGEX = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;

function isIgnoredHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^www\./, "");
  return IGNORED_HOSTNAMES.some(
    (domain) => normalized === domain || normalized.endsWith(`.${domain}`)
  );
}

export function extractInternalLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const internalUrls = new Set<string>();

  HREF_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = HREF_REGEX.exec(html)) !== null) {
    const rawHref = match[1].trim();
    if (!rawHref) continue;

    let resolved: URL;
    try {
      resolved = new URL(rawHref, base);
    } catch {
      continue;
    }

    if (IGNORED_PROTOCOLS.has(resolved.protocol)) continue;
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") continue;
    if (isIgnoredHostname(resolved.hostname)) continue;
    if (resolved.hostname.toLowerCase() !== base.hostname.toLowerCase()) continue;

    resolved.hash = "";
    internalUrls.add(resolved.toString());
  }

  return Array.from(internalUrls);
}
