import { prisma } from "../../lib/prisma";
import type { IssueCategory, IssueSeverity } from "../../types";

export interface CreateIssueInput {
  pageId: string;
  category: IssueCategory;
  severity: IssueSeverity;
  code: string;
  message: string;
}

export function createIssues(
  issues: CreateIssueInput[]
): Promise<{ count: number }> {
  if (issues.length === 0) return Promise.resolve({ count: 0 });
  return prisma.issue.createMany({ data: issues });
}
