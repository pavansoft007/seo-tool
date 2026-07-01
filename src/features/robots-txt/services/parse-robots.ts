export interface RobotsRule {
  userAgent: string;
  disallow: string[];
  allow: string[];
}

export interface RobotsTxtResult {
  rules: RobotsRule[];
  sitemaps: string[];
}

export async function fetchRobotsTxt(baseUrl: string): Promise<string> {
  const url = new URL("/robots.txt", baseUrl).toString();

  const response = await fetch(url, {
    headers: { "User-Agent": "SEO-Tool-Crawler/1.0" },
  });

  if (!response.ok) {
    return "";
  }

  return response.text();
}

export function parseRobotsTxt(content: string): RobotsTxtResult {
  const rules: RobotsRule[] = [];
  const sitemaps: string[] = [];

  let currentGroup: RobotsRule | null = null;

  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    const field = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    switch (field) {
      case "user-agent": {
        currentGroup = { userAgent: value, disallow: [], allow: [] };
        rules.push(currentGroup);
        break;
      }
      case "disallow": {
        if (currentGroup && value) currentGroup.disallow.push(value);
        break;
      }
      case "allow": {
        if (currentGroup && value) currentGroup.allow.push(value);
        break;
      }
      case "sitemap": {
        if (value) sitemaps.push(value);
        break;
      }
      default:
        break;
    }
  }

  return { rules, sitemaps };
}

export async function downloadAndParseRobotsTxt(
  baseUrl: string
): Promise<RobotsTxtResult> {
  const content = await fetchRobotsTxt(baseUrl);
  return parseRobotsTxt(content);
}
