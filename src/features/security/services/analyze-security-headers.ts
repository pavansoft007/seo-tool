export type SecurityIssueCode =
  | "NOT_HTTPS"
  | "MISSING_HSTS"
  | "MISSING_CSP"
  | "MISSING_X_FRAME_OPTIONS"
  | "MISSING_X_CONTENT_TYPE_OPTIONS";

export interface SecurityIssue {
  code: SecurityIssueCode;
  message: string;
}

export function analyzeSecurityHeaders(
  pageUrl: string,
  headers: Headers
): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  if (new URL(pageUrl).protocol !== "https:") {
    issues.push({ code: "NOT_HTTPS", message: "Page is not served over HTTPS" });
  }

  if (!headers.has("strict-transport-security")) {
    issues.push({
      code: "MISSING_HSTS",
      message: "Missing Strict-Transport-Security header",
    });
  }

  if (!headers.has("content-security-policy")) {
    issues.push({
      code: "MISSING_CSP",
      message: "Missing Content-Security-Policy header",
    });
  }

  if (!headers.has("x-frame-options")) {
    issues.push({
      code: "MISSING_X_FRAME_OPTIONS",
      message: "Missing X-Frame-Options header",
    });
  }

  if (!headers.has("x-content-type-options")) {
    issues.push({
      code: "MISSING_X_CONTENT_TYPE_OPTIONS",
      message: "Missing X-Content-Type-Options header",
    });
  }

  return issues;
}
