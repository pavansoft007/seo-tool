export interface IndexabilityInput {
  statusCode: number | null;
  robotsMeta: string | null;
  canonicalUrl: string | null;
  pageUrl: string;
}

export type IndexabilityIssueCode =
  | "NOT_INDEXABLE_STATUS_CODE"
  | "NOT_INDEXABLE_NOINDEX"
  | "NOT_INDEXABLE_CANONICAL_MISMATCH";

export interface IndexabilityIssue {
  code: IndexabilityIssueCode;
  message: string;
}

export interface IndexabilityResult {
  isIndexable: boolean;
  issues: IndexabilityIssue[];
}

export function analyzeIndexability(input: IndexabilityInput): IndexabilityResult {
  const issues: IndexabilityIssue[] = [];

  if (input.statusCode !== null && input.statusCode !== 200) {
    issues.push({
      code: "NOT_INDEXABLE_STATUS_CODE",
      message: `Page returned status code ${input.statusCode}, so it cannot be indexed`,
    });
  }

  if (input.robotsMeta && /noindex/i.test(input.robotsMeta)) {
    issues.push({
      code: "NOT_INDEXABLE_NOINDEX",
      message: "Page has a noindex directive",
    });
  }

  if (input.canonicalUrl) {
    const canonical = new URL(input.canonicalUrl, input.pageUrl);
    const page = new URL(input.pageUrl);
    canonical.hash = "";
    page.hash = "";
    if (canonical.toString() !== page.toString()) {
      issues.push({
        code: "NOT_INDEXABLE_CANONICAL_MISMATCH",
        message: "Canonical URL points to a different page, so this URL will not be indexed",
      });
    }
  }

  return { isIndexable: issues.length === 0, issues };
}
