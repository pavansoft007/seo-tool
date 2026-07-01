import { NextRequest, NextResponse } from "next/server";
import { getScanWithRelations } from "../../../../../server/db/scan-storage";
import { generateReport } from "../../../../../features/pdf-report/services/generate-report";
import { generatePdfReport } from "../../../../../features/pdf-report/services/generate-pdf";
import { generatePerformanceSolutions } from "../../../../../features/performance/services/generate-performance-solutions";
import type { PerformanceIssueCode } from "../../../../../features/performance/services/analyze-performance";
import type { ImagePerformanceIssueCode } from "../../../../../features/images/services/analyze-image-performance";
import { deriveCategoryScores } from "../../../../../lib/derive-category-scores";
import { calculateSeoScore } from "../../../../../lib/seo-score";
import type { Issue, IssueCategory, ScanStatus } from "../../../../../types";

const PERFORMANCE_CODES: PerformanceIssueCode[] = ["SLOW_LOAD_TIME", "PAGE_SIZE_TOO_LARGE"];
const IMAGE_PERFORMANCE_CODES: ImagePerformanceIssueCode[] = [
  "IMAGE_SLOW_TO_LOAD",
  "IMAGE_TOO_LARGE",
];
const API_RESOURCE_TYPES = new Set(["fetch", "xhr"]);
const MAX_SLOWEST_REQUESTS = 10;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;
  const scan = await getScanWithRelations(scanId);

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const rawIssues = scan.pages.flatMap((page) => page.issues);

  const issues: Issue[] = rawIssues.map((issue) => ({
    ...issue,
    category: issue.category as IssueCategory,
    severity: issue.severity as Issue["severity"],
  }));

  const issuesWithPageUrl = scan.pages.flatMap((page) =>
    page.issues.map((issue) => ({
      category: issue.category,
      code: issue.code,
      severity: issue.severity,
      message: issue.message,
      pageUrl: page.url,
    }))
  );

  const networkRequests = scan.pages.flatMap((page) => page.networkRequests);

  const loadTimes = scan.pages
    .map((page) => page.loadTimeMs)
    .filter((value): value is number => value !== null);
  const avgLoadTimeMs =
    loadTimes.length > 0
      ? loadTimes.reduce((sum, value) => sum + value, 0) / loadTimes.length
      : 0;

  const categoryScores = deriveCategoryScores(issues, avgLoadTimeMs);
  const score = calculateSeoScore(categoryScores);

  const report = generateReport({
    scan: { ...scan, status: scan.status as ScanStatus },
    totalPages: scan.pages.length,
    issues,
    score,
    checkedCategories: ["ON_PAGE", "IMAGE", "ACCESSIBILITY", "PERFORMANCE"],
  });

  const performanceSolutions = generatePerformanceSolutions({
    performanceIssueCodes: rawIssues
      .filter((issue) => PERFORMANCE_CODES.includes(issue.code as PerformanceIssueCode))
      .map((issue) => issue.code as PerformanceIssueCode),
    imagePerformanceIssueCodes: rawIssues
      .filter((issue) =>
        IMAGE_PERFORMANCE_CODES.includes(issue.code as ImagePerformanceIssueCode)
      )
      .map((issue) => issue.code as ImagePerformanceIssueCode),
    hasMissingLazyLoading: rawIssues.some(
      (issue) => issue.code === "IMAGE_LAZY_LOADING_MISSING"
    ),
  });

  const apiCalls = networkRequests.filter((request) =>
    API_RESOURCE_TYPES.has(request.resourceType)
  );

  const pdfBuffer = await generatePdfReport(report, {
    pages: scan.pages.map((page) => ({
      url: page.url,
      loadTimeMs: page.loadTimeMs,
      pageSizeBytes: page.pageSizeBytes,
    })),
    performanceSolutions,
    issues: issuesWithPageUrl,
    apiCalls: apiCalls.map((request) => ({
      url: request.url,
      method: request.method,
      statusCode: request.statusCode,
      timingMs: request.timingMs,
    })),
    networkSummary: {
      totalRequests: networkRequests.length,
      totalBytes: networkRequests.reduce((sum, request) => sum + (request.sizeBytes ?? 0), 0),
      slowest: [...networkRequests]
        .filter((request) => request.timingMs !== null)
        .sort((a, b) => (b.timingMs ?? 0) - (a.timingMs ?? 0))
        .slice(0, MAX_SLOWEST_REQUESTS)
        .map((request) => ({
          url: request.url,
          resourceType: request.resourceType,
          timingMs: request.timingMs,
        })),
    },
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="scan-${scanId}.pdf"`,
    },
  });
}
