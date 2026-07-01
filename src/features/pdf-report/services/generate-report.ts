import type { Issue, IssueCategory, IssueSeverity, Scan } from "../../../types";

export interface ReportOverview {
  url: string;
  scanId: string;
  totalPages: number;
  totalIssues: number;
  score: number;
  generatedAt: string;
}

export interface ReportJson {
  overview: ReportOverview;
  issues: Issue[];
  warnings: Issue[];
  passed: IssueCategory[];
  recommendations: string[];
}

export interface GenerateReportInput {
  scan: Scan;
  totalPages: number;
  issues: Issue[];
  score: number;
  checkedCategories: IssueCategory[];
}

function severityRank(severity: IssueSeverity): number {
  switch (severity) {
    case "CRITICAL":
      return 0;
    case "WARNING":
      return 1;
    default:
      return 2;
  }
}

export function generateReport(input: GenerateReportInput): ReportJson {
  const { scan, totalPages, issues, score, checkedCategories } = input;

  const issuesSection = issues.filter((issue) => issue.severity === "CRITICAL");
  const warningsSection = issues.filter((issue) => issue.severity === "WARNING");

  const categoriesWithFindings = new Set(
    [...issuesSection, ...warningsSection].map((issue) => issue.category)
  );

  const passed = checkedCategories.filter(
    (category) => !categoriesWithFindings.has(category)
  );

  const recommendations = Array.from(
    new Map(
      [...issuesSection, ...warningsSection]
        .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
        .map((issue) => [issue.code, issue.message])
    ).values()
  );

  return {
    overview: {
      url: scan.url,
      scanId: scan.id,
      totalPages,
      totalIssues: issues.length,
      score,
      generatedAt: new Date().toISOString(),
    },
    issues: issuesSection,
    warnings: warningsSection,
    passed,
    recommendations,
  };
}
