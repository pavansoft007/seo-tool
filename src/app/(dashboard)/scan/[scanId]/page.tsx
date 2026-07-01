import { notFound } from "next/navigation";
import { getScanWithRelations } from "../../../../server/db/scan-storage";
import { deriveCategoryScores } from "../../../../lib/derive-category-scores";
import { calculateSeoScore } from "../../../../lib/seo-score";
import { groupIssues } from "../../../../lib/group-issues";
import {
  generatePerformanceSolutions,
  type PerformanceSolution,
} from "../../../../features/performance/services/generate-performance-solutions";
import type { PerformanceIssueCode } from "../../../../features/performance/services/analyze-performance";
import type { ImagePerformanceIssueCode } from "../../../../features/images/services/analyze-image-performance";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Badge, type BadgeVariant } from "../../../../components/ui/badge";

const SEVERITY_VARIANT: Record<string, BadgeVariant> = {
  CRITICAL: "critical",
  WARNING: "warning",
  INFO: "info",
};

const PERFORMANCE_CODES: PerformanceIssueCode[] = ["SLOW_LOAD_TIME", "PAGE_SIZE_TOO_LARGE"];
const IMAGE_PERFORMANCE_CODES: ImagePerformanceIssueCode[] = [
  "IMAGE_SLOW_TO_LOAD",
  "IMAGE_TOO_LARGE",
];
const API_RESOURCE_TYPES = new Set(["fetch", "xhr"]);
const MAX_TABLE_ROWS = 200;
const MAX_OCCURRENCES_SHOWN = 200;

function getSpeedBadge(loadTimeMs: number | null): { label: string; variant: BadgeVariant } {
  if (loadTimeMs === null) return { label: "—", variant: "neutral" };
  if (loadTimeMs < 3000) return { label: "Fast", variant: "success" };
  if (loadTimeMs < 6000) return { label: "Moderate", variant: "warning" };
  return { label: "Slow", variant: "critical" };
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  return `${Math.round(bytes / 1000)}KB`;
}

export default async function ScanResultsPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  const scan = await getScanWithRelations(scanId);

  if (!scan) notFound();

  const issues = scan.pages.flatMap((page) =>
    page.issues.map((issue) => ({ ...issue, pageUrl: page.url }))
  );

  const networkRequests = scan.pages.flatMap((page) =>
    page.networkRequests.map((request) => ({ ...request, pageUrl: page.url }))
  );
  const apiCalls = networkRequests.filter((request) =>
    API_RESOURCE_TYPES.has(request.resourceType)
  );

  const loadTimes = scan.pages
    .map((page) => page.loadTimeMs)
    .filter((value): value is number => value !== null);
  const avgLoadTimeMs =
    loadTimes.length > 0
      ? Math.round(loadTimes.reduce((sum, value) => sum + value, 0) / loadTimes.length)
      : 0;

  const categoryScores = deriveCategoryScores(issues, avgLoadTimeMs);
  const score = calculateSeoScore(categoryScores);

  const issuesByCategory = new Map<string, typeof issues>();
  for (const issue of issues) {
    const list = issuesByCategory.get(issue.category) ?? [];
    list.push(issue);
    issuesByCategory.set(issue.category, list);
  }

  const performanceSolutions: PerformanceSolution[] = generatePerformanceSolutions({
    performanceIssueCodes: issues
      .filter((issue) => PERFORMANCE_CODES.includes(issue.code as PerformanceIssueCode))
      .map((issue) => issue.code as PerformanceIssueCode),
    imagePerformanceIssueCodes: issues
      .filter((issue) =>
        IMAGE_PERFORMANCE_CODES.includes(issue.code as ImagePerformanceIssueCode)
      )
      .map((issue) => issue.code as ImagePerformanceIssueCode),
    hasMissingLazyLoading: issues.some(
      (issue) => issue.code === "IMAGE_LAZY_LOADING_MISSING"
    ),
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Scan Results</h1>
          <p className="text-sm text-muted-foreground">
            {scan.url} · scanned {new Date(scan.createdAt).toLocaleString()}
          </p>
        </div>
        <a
          href={`/api/scans/${scanId}/pdf`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Download PDF
        </a>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>SEO Score</CardDescription>
            <CardTitle className="text-3xl">{score}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pages Scanned</CardDescription>
            <CardTitle className="text-3xl">{scan.pages.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Avg Load Time</CardDescription>
            <CardTitle className="text-3xl">{avgLoadTimeMs}ms</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Issues</CardDescription>
            <CardTitle className="text-3xl">{issues.length}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Page Speed</h2>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Load Time</th>
                <th className="px-4 py-3 font-medium">Page Size</th>
                <th className="px-4 py-3 font-medium">Speed</th>
              </tr>
            </thead>
            <tbody>
              {scan.pages.map((page) => {
                const speed = getSpeedBadge(page.loadTimeMs);
                return (
                  <tr key={page.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{page.url}</td>
                    <td className="px-4 py-3">{page.statusCode ?? "—"}</td>
                    <td className="px-4 py-3">
                      {page.loadTimeMs !== null ? `${page.loadTimeMs}ms` : "—"}
                    </td>
                    <td className="px-4 py-3">{formatBytes(page.pageSizeBytes)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={speed.variant}>{speed.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </section>

      {apiCalls.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">API Calls</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            fetch/XHR requests the page made — separate from static assets like images and
            scripts.
            {apiCalls.length > MAX_TABLE_ROWS &&
              ` Showing the first ${MAX_TABLE_ROWS} of ${apiCalls.length} requests.`}
          </p>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">URL</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {apiCalls.slice(0, MAX_TABLE_ROWS).map((request) => (
                  <tr key={request.id} className="border-b border-border last:border-0">
                    <td className="max-w-xs truncate px-4 py-3" title={request.url}>
                      {request.url}
                    </td>
                    <td className="px-4 py-3">{request.method}</td>
                    <td className="px-4 py-3">{request.statusCode ?? "—"}</td>
                    <td className="px-4 py-3">
                      {request.timingMs !== null ? (
                        <Badge variant={request.timingMs >= 1000 ? "warning" : "neutral"}>
                          {request.timingMs}ms
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}

      {networkRequests.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Network</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            Every request the browser made while rendering the page — like the DevTools
            Network tab.
            {networkRequests.length > MAX_TABLE_ROWS &&
              ` Showing the first ${MAX_TABLE_ROWS} of ${networkRequests.length} requests.`}
          </p>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">URL</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {networkRequests.slice(0, MAX_TABLE_ROWS).map((request) => (
                  <tr key={request.id} className="border-b border-border last:border-0">
                    <td className="max-w-xs truncate px-4 py-3" title={request.url}>
                      {request.url}
                    </td>
                    <td className="px-4 py-3">{request.resourceType}</td>
                    <td className="px-4 py-3">{request.method}</td>
                    <td className="px-4 py-3">{request.statusCode ?? "—"}</td>
                    <td className="px-4 py-3">{formatBytes(request.sizeBytes)}</td>
                    <td className="px-4 py-3">
                      {request.timingMs !== null ? (
                        <Badge variant={request.timingMs >= 1000 ? "warning" : "neutral"}>
                          {request.timingMs}ms
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Pages</h2>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">Title</th>
              </tr>
            </thead>
            <tbody>
              {scan.pages.map((page) => (
                <tr key={page.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{page.url}</td>
                  <td className="px-4 py-3">{page.title ?? "(missing)"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {performanceSolutions.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Page Speed Improvements</h2>
          <Card>
            <ul className="divide-y divide-border">
              {performanceSolutions.map((solution) => (
                <li key={solution.title} className="px-6 py-4">
                  <p className="font-medium">{solution.title}</p>
                  <p className="text-sm text-muted-foreground">{solution.description}</p>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Issues by Category</h2>
        <div className="flex flex-col gap-4">
          {Array.from(issuesByCategory.entries()).map(([category, categoryIssues]) => {
            const grouped = groupIssues(categoryIssues);
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-base">{category}</CardTitle>
                </CardHeader>
                <ul className="flex flex-col gap-2 px-6 pb-6">
                  {grouped.map((group) => (
                    <li key={group.code} className="flex flex-col gap-1 text-sm">
                      <div className="flex items-start gap-2">
                        <Badge variant={SEVERITY_VARIANT[group.severity] ?? "neutral"}>
                          {group.severity}
                        </Badge>
                        <span>
                          {group.message}
                          {group.count > 1 && " (example)"}
                        </span>
                        {group.count > 1 && (
                          <Badge variant="neutral">×{group.count}</Badge>
                        )}
                      </div>
                      {group.count > 1 ? (
                        <details className="pl-1 text-xs text-muted-foreground">
                          <summary className="cursor-pointer select-none">
                            Show all {group.count} occurrences
                          </summary>
                          <ul className="mt-1 flex flex-col gap-1">
                            {group.occurrences.slice(0, MAX_OCCURRENCES_SHOWN).map((occurrence, index) => (
                              <li key={index}>
                                {occurrence.message}
                                {occurrence.pageUrl && ` — Page: ${occurrence.pageUrl}`}
                              </li>
                            ))}
                          </ul>
                          {group.count > MAX_OCCURRENCES_SHOWN && (
                            <p className="mt-1">
                              Showing the first {MAX_OCCURRENCES_SHOWN} of {group.count}.
                            </p>
                          )}
                        </details>
                      ) : (
                        group.samplePageUrls.length > 0 && (
                          <span className="pl-1 text-xs text-muted-foreground">
                            Page: {group.samplePageUrls.join(", ")}
                          </span>
                        )
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
          {issues.length === 0 && (
            <p className="text-sm text-muted-foreground">No issues found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
