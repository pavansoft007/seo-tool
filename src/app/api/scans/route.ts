import { NextRequest, NextResponse } from "next/server";
import { validateUrl } from "../../../lib/validator";
import { crawlWebsite } from "../../../features/website-crawler/services/crawl-website";
import { extractMetadata } from "../../../features/on-page-seo/services/extract-metadata";
import {
  analyzeTitlesAndDescriptions,
  type PageMeta,
} from "../../../features/on-page-seo/services/analyze-titles-descriptions";
import { analyzeHeadings } from "../../../features/on-page-seo/services/analyze-headings";
import { extractImages } from "../../../features/images/services/extract-images";
import { analyzeImages } from "../../../features/images/services/analyze-images";
import { analyzeImagePerformance } from "../../../features/images/services/analyze-image-performance";
import { analyzeAccessibility } from "../../../features/accessibility/services/analyze-accessibility";
import { analyzePerformance } from "../../../features/performance/services/analyze-performance";
import { renderPageWithNetworkCapture } from "../../../features/performance/services/render-page-network";
import { createScan, updateScanStatus, listScans } from "../../../server/db/scan-storage";
import { createPage } from "../../../server/db/page-storage";
import { createImages } from "../../../server/db/image-storage";
import { createIssues, type CreateIssueInput } from "../../../server/db/issue-storage";
import { createNetworkRequests } from "../../../server/db/network-request-storage";

const SITE_MAX_PAGES = 20;

type ScanMode = "single" | "site";

function resolveMaxPages(mode: ScanMode): number {
  return mode === "single" ? 1 : SITE_MAX_PAGES;
}

export async function GET() {
  const scans = await listScans();
  return NextResponse.json({ scans });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const url = body?.url;
  const mode: ScanMode = body?.mode === "single" ? "single" : "site";

  if (typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const validation = validateUrl(url);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  const scan = await createScan(url);
  await updateScanStatus(scan.id, "RUNNING", { startedAt: new Date() });

  try {
    const { pages } = await crawlWebsite(url, { maxPages: resolveMaxPages(mode) });
    const pageMetas: PageMeta[] = [];

    for (const crawledPage of pages) {
      if (!crawledPage.html) {
        await createPage({
          scanId: scan.id,
          url: crawledPage.url,
          statusCode: crawledPage.statusCode,
          title: null,
          metaDescription: null,
          canonicalUrl: null,
          h1: null,
          loadTimeMs: crawledPage.loadTimeMs,
          pageSizeBytes: null,
        });
        continue;
      }

      const metadata = extractMetadata(crawledPage.html);
      const h1 = metadata.headings.find((heading) => heading.tag === "h1")?.text ?? null;
      const htmlSizeBytes = Buffer.byteLength(crawledPage.html, "utf8");

      const page = await createPage({
        scanId: scan.id,
        url: crawledPage.url,
        statusCode: crawledPage.statusCode,
        title: metadata.title,
        metaDescription: metadata.description,
        canonicalUrl: metadata.canonical,
        h1,
        loadTimeMs: crawledPage.loadTimeMs,
        pageSizeBytes: htmlSizeBytes,
      });

      pageMetas.push({
        pageId: page.id,
        title: metadata.title,
        description: metadata.description,
      });

      const pageIssues: CreateIssueInput[] = [];

      for (const issue of analyzeHeadings(metadata.headings).issues) {
        pageIssues.push({
          pageId: page.id,
          category: "ON_PAGE",
          severity: issue.code === "H1_MISSING" ? "CRITICAL" : "WARNING",
          code: issue.code,
          message: issue.message,
        });
      }

      const seenImageSrcs = new Set<string>();
      const images = extractImages(crawledPage.html).filter((image) => {
        if (!image.src) return true;
        if (seenImageSrcs.has(image.src)) return false;
        seenImageSrcs.add(image.src);
        return true;
      });

      for (const issue of analyzeImages(images)) {
        pageIssues.push({
          pageId: page.id,
          category: "IMAGE",
          severity: issue.code === "IMAGE_ALT_MISSING" ? "WARNING" : "INFO",
          code: issue.code,
          message: issue.src ? `${issue.message} (${issue.src})` : issue.message,
        });
      }

      const performanceIssues = await analyzeImagePerformance(images, crawledPage.url);
      for (const issue of performanceIssues) {
        pageIssues.push({
          pageId: page.id,
          category: "IMAGE",
          severity: "WARNING",
          code: issue.code,
          message: `${issue.message} (${issue.src})`,
        });
      }

      for (const issue of analyzeAccessibility(crawledPage.html)) {
        pageIssues.push({
          pageId: page.id,
          category: "ACCESSIBILITY",
          severity: "WARNING",
          code: issue.code,
          message: issue.message,
        });
      }

      for (const issue of analyzePerformance(crawledPage.loadTimeMs ?? 0, htmlSizeBytes)) {
        pageIssues.push({
          pageId: page.id,
          category: "PERFORMANCE",
          severity: "WARNING",
          code: issue.code,
          message: issue.message,
        });
      }

      const staticImageSrcs = new Set(
        images
          .filter((image) => image.src)
          .map((image) => new URL(image.src as string, crawledPage.url).toString())
      );

      try {
        const { networkRequests, renderedImages } = await renderPageWithNetworkCapture(
          crawledPage.url,
          staticImageSrcs
        );

        await createNetworkRequests(
          networkRequests.map((request) => ({
            pageId: page.id,
            url: request.url,
            resourceType: request.resourceType,
            method: request.method,
            statusCode: request.statusCode,
            sizeBytes: request.sizeBytes,
            timingMs: request.timingMs,
          }))
        );

        for (const image of renderedImages) {
          if (!image.loadedDynamically) continue;
          pageIssues.push({
            pageId: page.id,
            category: "IMAGE",
            severity: "INFO",
            code: "IMAGE_LOADED_DYNAMICALLY",
            message: `Image is injected by client-side JavaScript and is not present in the server-rendered HTML, so search engines that don't execute JS may miss it (${image.src})`,
          });
        }
      } catch {
        pageIssues.push({
          pageId: page.id,
          category: "TECHNICAL",
          severity: "WARNING",
          code: "PAGE_RENDER_CHECK_FAILED",
          message:
            "The browser-based check for this page failed to load, so JavaScript-injected content (like dynamically loaded images) could not be verified. Re-run the scan or check the page manually.",
        });
      }

      await createIssues(pageIssues);

      await createImages(
        images
          .filter((image) => image.src)
          .map((image) => ({
            pageId: page.id,
            src: image.src as string,
            alt: image.alt,
            hasAlt: Boolean(image.alt),
          }))
      );
    }

    const titleDescriptionIssues = analyzeTitlesAndDescriptions(pageMetas);
    await createIssues(
      titleDescriptionIssues.map((issue) => ({
        pageId: issue.pageId,
        category: "ON_PAGE",
        severity:
          issue.code === "TITLE_MISSING" || issue.code === "DESCRIPTION_MISSING"
            ? "CRITICAL"
            : "WARNING",
        code: issue.code,
        message: issue.message,
      }))
    );

    await updateScanStatus(scan.id, "COMPLETED", { completedAt: new Date() });
  } catch (error) {
    await updateScanStatus(scan.id, "FAILED", { completedAt: new Date() });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scan failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ scanId: scan.id }, { status: 201 });
}
