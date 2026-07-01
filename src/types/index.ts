export type ScanStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export type IssueSeverity = "INFO" | "WARNING" | "CRITICAL";

export type IssueCategory =
  | "TECHNICAL"
  | "ON_PAGE"
  | "PERFORMANCE"
  | "MOBILE"
  | "SECURITY"
  | "STRUCTURED_DATA"
  | "IMAGE"
  | "LINK"
  | "ACCESSIBILITY"
  | "CONTENT";

export interface Scan {
  id: string;
  url: string;
  status: ScanStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Page {
  id: string;
  scanId: string;
  url: string;
  statusCode: number | null;
  title: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  h1: string | null;
  wordCount: number | null;
  isIndexable: boolean;
  loadTimeMs: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Issue {
  id: string;
  pageId: string;
  category: IssueCategory;
  severity: IssueSeverity;
  code: string;
  message: string;
  createdAt: Date;
}

export interface Link {
  id: string;
  pageId: string;
  targetUrl: string;
  anchorText: string | null;
  isInternal: boolean;
  isBroken: boolean;
  statusCode: number | null;
  createdAt: Date;
}

export interface Image {
  id: string;
  pageId: string;
  src: string;
  alt: string | null;
  hasAlt: boolean;
  sizeKb: number | null;
  width: number | null;
  height: number | null;
  createdAt: Date;
}

export interface ReportSummary {
  totalPages: number;
  totalIssues: number;
  issuesBySeverity: Record<IssueSeverity, number>;
  issuesByCategory: Record<IssueCategory, number>;
  totalBrokenLinks: number;
  totalImagesMissingAlt: number;
}

export interface Report {
  id: string;
  scanId: string;
  scan: Scan;
  pages: Page[];
  issues: Issue[];
  links: Link[];
  images: Image[];
  summary: ReportSummary;
  generatedAt: Date;
}
