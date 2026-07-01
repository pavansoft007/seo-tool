export type PerformanceIssueCode = "SLOW_LOAD_TIME" | "PAGE_SIZE_TOO_LARGE";

export interface PerformanceIssue {
  code: PerformanceIssueCode;
  message: string;
}

const LOAD_TIME_WARNING_MS = 3000;
const LOAD_TIME_CRITICAL_MS = 6000;
const PAGE_SIZE_WARNING_BYTES = 2_000_000;

export function analyzePerformance(
  loadTimeMs: number,
  htmlSizeBytes: number
): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  if (loadTimeMs >= LOAD_TIME_CRITICAL_MS) {
    issues.push({
      code: "SLOW_LOAD_TIME",
      message: `Page took ${loadTimeMs}ms to load, which is critically slow`,
    });
  } else if (loadTimeMs >= LOAD_TIME_WARNING_MS) {
    issues.push({
      code: "SLOW_LOAD_TIME",
      message: `Page took ${loadTimeMs}ms to load, above the recommended ${LOAD_TIME_WARNING_MS}ms`,
    });
  }

  if (htmlSizeBytes >= PAGE_SIZE_WARNING_BYTES) {
    issues.push({
      code: "PAGE_SIZE_TOO_LARGE",
      message: `HTML size (${Math.round(htmlSizeBytes / 1000)}KB) exceeds the recommended ${
        PAGE_SIZE_WARNING_BYTES / 1_000_000
      }MB`,
    });
  }

  return issues;
}
