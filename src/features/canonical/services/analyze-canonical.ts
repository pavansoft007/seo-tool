export type CanonicalIssueCode =
  | "CANONICAL_MISSING"
  | "CANONICAL_MISMATCH"
  | "CANONICAL_NOT_ABSOLUTE";

export interface CanonicalIssue {
  code: CanonicalIssueCode;
  message: string;
}

export function analyzeCanonical(
  pageUrl: string,
  canonicalUrl: string | null
): CanonicalIssue[] {
  const issues: CanonicalIssue[] = [];

  if (!canonicalUrl) {
    issues.push({
      code: "CANONICAL_MISSING",
      message: "Page is missing a canonical link tag",
    });
    return issues;
  }

  let resolved: URL;
  try {
    resolved = new URL(canonicalUrl, pageUrl);
  } catch {
    issues.push({
      code: "CANONICAL_NOT_ABSOLUTE",
      message: `Canonical URL "${canonicalUrl}" could not be resolved`,
    });
    return issues;
  }

  if (!/^https?:$/.test(new URL(canonicalUrl, pageUrl).protocol) || !canonicalUrl.startsWith("http")) {
    issues.push({
      code: "CANONICAL_NOT_ABSOLUTE",
      message: `Canonical URL "${canonicalUrl}" should be an absolute URL`,
    });
  }

  const normalizedPage = new URL(pageUrl);
  normalizedPage.hash = "";
  resolved.hash = "";

  if (resolved.toString() !== normalizedPage.toString()) {
    issues.push({
      code: "CANONICAL_MISMATCH",
      message: `Canonical URL (${resolved.toString()}) does not match the page URL (${normalizedPage.toString()})`,
    });
  }

  return issues;
}
