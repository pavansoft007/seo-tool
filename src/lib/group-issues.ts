export interface GroupableIssue {
  category: string;
  code: string;
  severity: string;
  message: string;
  pageUrl?: string;
}

export interface IssueGroup {
  category: string;
  code: string;
  severity: string;
  message: string;
  count: number;
  samplePageUrls: string[];
}

const MAX_SAMPLE_PAGES = 3;

export function groupIssues<T extends GroupableIssue>(issues: T[]): IssueGroup[] {
  const groups = new Map<string, IssueGroup>();

  for (const issue of issues) {
    const key = `${issue.category}::${issue.code}`;
    const existing = groups.get(key);

    if (existing) {
      existing.count += 1;
      if (
        issue.pageUrl &&
        !existing.samplePageUrls.includes(issue.pageUrl) &&
        existing.samplePageUrls.length < MAX_SAMPLE_PAGES
      ) {
        existing.samplePageUrls.push(issue.pageUrl);
      }
      continue;
    }

    groups.set(key, {
      category: issue.category,
      code: issue.code,
      severity: issue.severity,
      message: issue.message,
      count: 1,
      samplePageUrls: issue.pageUrl ? [issue.pageUrl] : [],
    });
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}
