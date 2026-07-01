import type { HeadingData } from "./extract-metadata";

export type HeadingIssueCode =
  | "H1_MISSING"
  | "H1_MULTIPLE"
  | "HEADING_HIERARCHY_SKIPPED";

export interface HeadingIssue {
  code: HeadingIssueCode;
  message: string;
}

export interface HeadingAnalysis {
  h1: string[];
  h2: string[];
  h3: string[];
  issues: HeadingIssue[];
}

export function analyzeHeadings(headings: HeadingData[]): HeadingAnalysis {
  const h1 = headings.filter((h) => h.tag === "h1").map((h) => h.text);
  const h2 = headings.filter((h) => h.tag === "h2").map((h) => h.text);
  const h3 = headings.filter((h) => h.tag === "h3").map((h) => h.text);

  const issues: HeadingIssue[] = [];

  if (h1.length === 0) {
    issues.push({ code: "H1_MISSING", message: "Page is missing an H1 heading" });
  } else if (h1.length > 1) {
    issues.push({
      code: "H1_MULTIPLE",
      message: `Page has ${h1.length} H1 headings, expected 1`,
    });
  }

  let previousLevel = 0;
  for (const heading of headings) {
    const level = Number(heading.tag.replace("h", ""));
    if (previousLevel > 0 && level > previousLevel + 1) {
      issues.push({
        code: "HEADING_HIERARCHY_SKIPPED",
        message: `Heading level skipped from h${previousLevel} to h${level}`,
      });
    }
    previousLevel = level;
  }

  return { h1, h2, h3, issues };
}
