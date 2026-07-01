import type { CategoryScores } from "./seo-score";

export interface ScoredIssue {
  category: string;
}

const PENALTY_PER_ISSUE = 10;

function penalize(issues: ScoredIssue[], category: string): number {
  const count = issues.filter((issue) => issue.category === category).length;
  return Math.max(0, 100 - count * PENALTY_PER_ISSUE);
}

function performanceScore(avgLoadTimeMs: number): number {
  if (avgLoadTimeMs <= 1000) return 100;
  if (avgLoadTimeMs <= 3000) return 80;
  if (avgLoadTimeMs <= 6000) return 50;
  return 20;
}

export function deriveCategoryScores(
  issues: ScoredIssue[],
  avgLoadTimeMs: number
): CategoryScores {
  return {
    metadata: penalize(issues, "ON_PAGE"),
    images: penalize(issues, "IMAGE"),
    links: penalize(issues, "LINK"),
    performance: performanceScore(avgLoadTimeMs),
    accessibility: penalize(issues, "ACCESSIBILITY"),
    security: 100,
  };
}
