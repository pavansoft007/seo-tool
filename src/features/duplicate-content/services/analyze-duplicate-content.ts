import { createHash } from "crypto";

export interface PageContent {
  url: string;
  textContent: string;
}

export type DuplicateContentIssueCode = "DUPLICATE_CONTENT";

export interface DuplicateContentIssue {
  url: string;
  code: DuplicateContentIssueCode;
  message: string;
}

function hashContent(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ").toLowerCase();
  return createHash("sha256").update(normalized).digest("hex");
}

export function analyzeDuplicateContent(
  pages: PageContent[]
): DuplicateContentIssue[] {
  const issues: DuplicateContentIssue[] = [];
  const hashGroups = new Map<string, string[]>();

  for (const page of pages) {
    if (!page.textContent.trim()) continue;
    const hash = hashContent(page.textContent);
    const urls = hashGroups.get(hash) ?? [];
    urls.push(page.url);
    hashGroups.set(hash, urls);
  }

  for (const urls of hashGroups.values()) {
    if (urls.length > 1) {
      for (const url of urls) {
        issues.push({
          url,
          code: "DUPLICATE_CONTENT",
          message: "Page content is duplicated across multiple pages",
        });
      }
    }
  }

  return issues;
}
