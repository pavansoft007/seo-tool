export interface PageMeta {
  pageId: string;
  title: string | null;
  description: string | null;
}

export type OnPageIssueCode =
  | "TITLE_MISSING"
  | "TITLE_TOO_SHORT"
  | "TITLE_TOO_LONG"
  | "DESCRIPTION_MISSING"
  | "DESCRIPTION_TOO_SHORT"
  | "DESCRIPTION_TOO_LONG"
  | "DUPLICATE_TITLE";

export interface OnPageIssue {
  pageId: string;
  code: OnPageIssueCode;
  message: string;
}

const TITLE_MIN_LENGTH = 30;
const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MIN_LENGTH = 70;
const DESCRIPTION_MAX_LENGTH = 160;

export function analyzeTitlesAndDescriptions(pages: PageMeta[]): OnPageIssue[] {
  const issues: OnPageIssue[] = [];
  const titleCounts = new Map<string, string[]>();

  for (const page of pages) {
    const title = page.title?.trim() ?? "";
    const description = page.description?.trim() ?? "";

    if (!title) {
      issues.push({
        pageId: page.pageId,
        code: "TITLE_MISSING",
        message: "Title is missing",
      });
    } else {
      if (title.length < TITLE_MIN_LENGTH) {
        issues.push({
          pageId: page.pageId,
          code: "TITLE_TOO_SHORT",
          message: `Title length (${title.length}) is below recommended minimum of ${TITLE_MIN_LENGTH}`,
        });
      } else if (title.length > TITLE_MAX_LENGTH) {
        issues.push({
          pageId: page.pageId,
          code: "TITLE_TOO_LONG",
          message: `Title length (${title.length}) exceeds recommended maximum of ${TITLE_MAX_LENGTH}`,
        });
      }

      const key = title.toLowerCase();
      const existing = titleCounts.get(key) ?? [];
      existing.push(page.pageId);
      titleCounts.set(key, existing);
    }

    if (!description) {
      issues.push({
        pageId: page.pageId,
        code: "DESCRIPTION_MISSING",
        message: "Description is missing",
      });
    } else {
      if (description.length < DESCRIPTION_MIN_LENGTH) {
        issues.push({
          pageId: page.pageId,
          code: "DESCRIPTION_TOO_SHORT",
          message: `Description length (${description.length}) is below recommended minimum of ${DESCRIPTION_MIN_LENGTH}`,
        });
      } else if (description.length > DESCRIPTION_MAX_LENGTH) {
        issues.push({
          pageId: page.pageId,
          code: "DESCRIPTION_TOO_LONG",
          message: `Description length (${description.length}) exceeds recommended maximum of ${DESCRIPTION_MAX_LENGTH}`,
        });
      }
    }
  }

  for (const [, pageIds] of titleCounts) {
    if (pageIds.length > 1) {
      for (const pageId of pageIds) {
        issues.push({
          pageId,
          code: "DUPLICATE_TITLE",
          message: "Title is duplicated across multiple pages",
        });
      }
    }
  }

  return issues;
}
