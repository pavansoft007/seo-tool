import * as cheerio from "cheerio";

export interface LinkAnalysis {
  url: string;
  type: "internal" | "external";
  broken: boolean;
  redirected: boolean;
  statusCode: number | null;
}

export interface AnalyzeLinksResult {
  internal: LinkAnalysis[];
  external: LinkAnalysis[];
  broken: LinkAnalysis[];
  redirects: LinkAnalysis[];
}

async function checkLink(
  url: string
): Promise<{ statusCode: number | null; broken: boolean; redirected: boolean }> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
    });

    const statusCode = response.status;
    const redirected = statusCode >= 300 && statusCode < 400;
    const broken = statusCode >= 400;

    return { statusCode, broken, redirected };
  } catch {
    return { statusCode: null, broken: true, redirected: false };
  }
}

export async function analyzeLinks(
  html: string,
  baseUrl: string
): Promise<AnalyzeLinksResult> {
  const base = new URL(baseUrl);
  const $ = cheerio.load(html);

  const seen = new Set<string>();
  const candidates: { url: string; type: "internal" | "external" }[] = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href")?.trim();
    if (!href) return;

    let resolved: URL;
    try {
      resolved = new URL(href, base);
    } catch {
      return;
    }

    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return;

    resolved.hash = "";
    const normalized = resolved.toString();

    if (seen.has(normalized)) return;
    seen.add(normalized);

    const type =
      resolved.hostname.toLowerCase() === base.hostname.toLowerCase()
        ? "internal"
        : "external";

    candidates.push({ url: normalized, type });
  });

  const results: LinkAnalysis[] = await Promise.all(
    candidates.map(async (candidate) => {
      const { statusCode, broken, redirected } = await checkLink(candidate.url);
      return {
        url: candidate.url,
        type: candidate.type,
        broken,
        redirected,
        statusCode,
      };
    })
  );

  return {
    internal: results.filter((r) => r.type === "internal"),
    external: results.filter((r) => r.type === "external"),
    broken: results.filter((r) => r.broken),
    redirects: results.filter((r) => r.redirected),
  };
}
