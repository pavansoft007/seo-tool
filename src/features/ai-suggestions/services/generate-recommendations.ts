import type { ReportJson } from "../../pdf-report/services/generate-report";
import type { Issue } from "../../../types";

const MAX_RECOMMENDATIONS = 10;

const CONCISE_SUGGESTIONS: Record<string, string> = {
  TITLE_MISSING: "Add a title tag to every page.",
  TITLE_TOO_SHORT: "Lengthen short title tags for better context.",
  TITLE_TOO_LONG: "Shorten title tags so they aren't truncated in search results.",
  DUPLICATE_TITLE: "Make duplicate page titles unique.",
  DESCRIPTION_MISSING: "Add a meta description to every page.",
  DESCRIPTION_TOO_SHORT: "Expand short meta descriptions.",
  DESCRIPTION_TOO_LONG: "Shorten meta descriptions so they aren't truncated.",
  H1_MISSING: "Add an H1 heading to every page.",
  H1_MULTIPLE: "Use only one H1 heading per page.",
  HEADING_HIERARCHY_SKIPPED: "Fix skipped heading levels for a clear structure.",
};

function toConciseSuggestion(issue: Issue): string {
  return CONCISE_SUGGESTIONS[issue.code] ?? issue.message;
}

export function generateRecommendations(report: ReportJson): string[] {
  const ordered = [...report.issues, ...report.warnings];
  const suggestions = new Map<string, string>();

  for (const issue of ordered) {
    if (!suggestions.has(issue.code)) {
      suggestions.set(issue.code, toConciseSuggestion(issue));
    }
  }

  return Array.from(suggestions.values()).slice(0, MAX_RECOMMENDATIONS);
}
