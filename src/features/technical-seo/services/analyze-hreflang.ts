import * as cheerio from "cheerio";

export type HreflangIssueCode =
  | "HREFLANG_MISSING_X_DEFAULT"
  | "HREFLANG_INVALID_LANG_CODE";

export interface HreflangEntry {
  lang: string;
  href: string;
}

export interface HreflangIssue {
  code: HreflangIssueCode;
  message: string;
}

const LANG_CODE_REGEX = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;

export function extractHreflangTags(html: string): HreflangEntry[] {
  const $ = cheerio.load(html);
  const entries: HreflangEntry[] = [];

  $('link[rel="alternate"][hreflang]').each((_, element) => {
    const lang = $(element).attr("hreflang")?.trim();
    const href = $(element).attr("href")?.trim();
    if (lang && href) entries.push({ lang, href });
  });

  return entries;
}

export function analyzeHreflang(entries: HreflangEntry[]): HreflangIssue[] {
  if (entries.length === 0) return [];

  const issues: HreflangIssue[] = [];

  const hasXDefault = entries.some((entry) => entry.lang.toLowerCase() === "x-default");
  if (!hasXDefault) {
    issues.push({
      code: "HREFLANG_MISSING_X_DEFAULT",
      message: "hreflang set is missing an x-default entry",
    });
  }

  for (const entry of entries) {
    if (entry.lang.toLowerCase() === "x-default") continue;
    if (!LANG_CODE_REGEX.test(entry.lang)) {
      issues.push({
        code: "HREFLANG_INVALID_LANG_CODE",
        message: `hreflang value "${entry.lang}" is not a valid language code`,
      });
    }
  }

  return issues;
}
