import PDFDocument from "pdfkit";
import type { ReportJson } from "./generate-report";
import type { PerformanceSolution } from "../../performance/services/generate-performance-solutions";
import { groupIssues, type GroupableIssue } from "../../../lib/group-issues";

export interface PdfPageSpeedRow {
  url: string;
  loadTimeMs: number | null;
  pageSizeBytes: number | null;
}

export interface PdfApiCallRow {
  url: string;
  method: string;
  statusCode: number | null;
  timingMs: number | null;
}

export interface PdfNetworkSummary {
  totalRequests: number;
  totalBytes: number;
  slowest: { url: string; resourceType: string; timingMs: number | null }[];
}

export interface PdfReportExtras {
  pages?: PdfPageSpeedRow[];
  performanceSolutions?: PerformanceSolution[];
  issues?: GroupableIssue[];
  apiCalls?: PdfApiCallRow[];
  networkSummary?: PdfNetworkSummary;
}

const COLORS = {
  primary: "#4f46e5",
  critical: "#dc2626",
  warning: "#d97706",
  success: "#059669",
  muted: "#64748b",
  text: "#0f172a",
  border: "#e2e8f0",
  headerBg: "#eef2ff",
};

type PdfDoc = InstanceType<typeof PDFDocument>;

interface TableColumn<T> {
  header: string;
  width: number;
  render: (row: T) => string;
  color?: (row: T) => string;
}

function scoreColor(score: number): string {
  if (score >= 80) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.critical;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "-";
  return `${Math.round(bytes / 1000)}KB`;
}

function speedLabel(loadTimeMs: number | null): { label: string; color: string } {
  if (loadTimeMs === null) return { label: "-", color: COLORS.muted };
  if (loadTimeMs < 3000) return { label: "Fast", color: COLORS.success };
  if (loadTimeMs < 6000) return { label: "Moderate", color: COLORS.warning };
  return { label: "Slow", color: COLORS.critical };
}

function severityColor(severity: string): string {
  if (severity === "CRITICAL") return COLORS.critical;
  if (severity === "WARNING") return COLORS.warning;
  return COLORS.muted;
}

function sectionHeader(doc: PdfDoc, title: string, color: string): void {
  doc.moveDown(1);
  doc.x = 50;
  const y = doc.y;
  doc.rect(50, y + 2, 4, 13).fill(color);
  doc.fillColor(COLORS.text).fontSize(13).text(title, 62, y);
  doc.fillColor(COLORS.text);
  doc.x = 50;
  doc.moveDown(0.3);
}

const TABLE_START_X = 50;
const ROW_HEIGHT = 20;
const HEADER_HEIGHT = 20;

function drawTable<T>(doc: PdfDoc, columns: TableColumn<T>[], rows: T[]): void {
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const bottomLimit = doc.page.height - doc.page.margins.bottom;

  const drawHeader = () => {
    doc.rect(TABLE_START_X, doc.y, totalWidth, HEADER_HEIGHT).fill(COLORS.headerBg);
    doc.fillColor(COLORS.muted).fontSize(8);
    const headerY = doc.y + 6;
    let x = TABLE_START_X;
    for (const col of columns) {
      doc.text(col.header, x + 5, headerY, { width: col.width - 8, ellipsis: true });
      x += col.width;
    }
    doc.y += HEADER_HEIGHT;
    doc.x = TABLE_START_X;
    doc.fillColor(COLORS.text);
  };

  if (doc.y + HEADER_HEIGHT + ROW_HEIGHT > bottomLimit) {
    doc.addPage();
    doc.y = doc.page.margins.top;
  }
  drawHeader();

  doc.fontSize(8);
  for (const row of rows) {
    if (doc.y + ROW_HEIGHT > bottomLimit) {
      doc.addPage();
      doc.y = doc.page.margins.top;
      drawHeader();
      doc.fontSize(8);
    }

    const rowY = doc.y;
    let x = TABLE_START_X;
    for (const col of columns) {
      doc
        .fillColor(col.color ? col.color(row) : COLORS.text)
        .text(col.render(row), x + 5, rowY + 5, {
          width: col.width - 8,
          height: ROW_HEIGHT - 6,
          ellipsis: true,
        });
      x += col.width;
    }

    doc.fillColor(COLORS.text);
    doc.y = rowY + ROW_HEIGHT;
    doc.x = TABLE_START_X;
    doc
      .moveTo(TABLE_START_X, doc.y)
      .lineTo(TABLE_START_X + totalWidth, doc.y)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();
  }

  doc.fillColor(COLORS.text);
  doc.moveDown(0.6);
}

export function generatePdfReport(
  report: ReportJson,
  extras: PdfReportExtras = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contentWidth = doc.page.width - 100;

    doc.rect(0, 0, doc.page.width, 90).fill(COLORS.primary);
    doc
      .fillColor("#ffffff")
      .fontSize(22)
      .text("SEO Scan Report", 50, 30, { width: contentWidth });
    doc.fontSize(10).text(report.overview.url, 50, 60, { width: contentWidth });

    const boxY = 112;
    doc.roundedRect(50, boxY, 110, 70, 6).fill(scoreColor(report.overview.score));
    doc
      .fillColor("#ffffff")
      .fontSize(28)
      .text(String(report.overview.score), 50, boxY + 12, { width: 110, align: "center" });
    doc.fontSize(9).text("SEO Score", 50, boxY + 46, { width: 110, align: "center" });

    doc.fillColor(COLORS.text);
    let overviewY = boxY + 4;
    const overviewX = 180;
    const overviewLine = (label: string, value: string) => {
      doc
        .fontSize(10)
        .fillColor(COLORS.muted)
        .text(label, overviewX, overviewY, { continued: true, width: 300 });
      doc.fillColor(COLORS.text).text(` ${value}`);
      overviewY += 18;
    };
    overviewLine("Total Pages:", String(report.overview.totalPages));
    overviewLine("Total Issues:", String(report.overview.totalIssues));
    overviewLine("Generated At:", report.overview.generatedAt);

    doc.x = 50;
    doc.y = boxY + 70 + 20;

    if (extras.pages && extras.pages.length > 0) {
      sectionHeader(doc, "Page Speed", COLORS.primary);
      drawTable<PdfPageSpeedRow>(
        doc,
        [
          { header: "URL", width: 250, render: (row) => row.url },
          {
            header: "Load Time",
            width: 90,
            render: (row) => (row.loadTimeMs !== null ? `${row.loadTimeMs}ms` : "-"),
          },
          { header: "Size", width: 70, render: (row) => formatBytes(row.pageSizeBytes) },
          {
            header: "Speed",
            width: 85,
            render: (row) => speedLabel(row.loadTimeMs).label,
            color: (row) => speedLabel(row.loadTimeMs).color,
          },
        ],
        extras.pages
      );
    }

    if (extras.apiCalls && extras.apiCalls.length > 0) {
      sectionHeader(doc, "API Calls", COLORS.primary);
      doc
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text("fetch/XHR requests made by the page.");
      doc.moveDown(0.3);
      drawTable<PdfApiCallRow>(
        doc,
        [
          { header: "URL", width: 280, render: (row) => row.url },
          { header: "Method", width: 60, render: (row) => row.method },
          {
            header: "Status",
            width: 60,
            render: (row) => (row.statusCode !== null ? String(row.statusCode) : "-"),
          },
          {
            header: "Time",
            width: 95,
            render: (row) => (row.timingMs !== null ? `${row.timingMs}ms` : "-"),
            color: (row) =>
              row.timingMs !== null && row.timingMs >= 1000 ? COLORS.warning : COLORS.text,
          },
        ],
        extras.apiCalls
      );
    }

    if (extras.networkSummary && extras.networkSummary.totalRequests > 0) {
      sectionHeader(doc, "Network Summary", COLORS.primary);
      doc
        .fontSize(9)
        .fillColor(COLORS.text)
        .text(
          `${extras.networkSummary.totalRequests} total requests · ${formatBytes(
            extras.networkSummary.totalBytes
          )} transferred`
        );
      doc.moveDown(0.3);
      if (extras.networkSummary.slowest.length > 0) {
        doc.fontSize(8).fillColor(COLORS.muted).text("Slowest requests:");
        doc.moveDown(0.2);
        drawTable(
          doc,
          [
            { header: "URL", width: 280, render: (row: { url: string }) => row.url },
            {
              header: "Type",
              width: 80,
              render: (row: { resourceType: string }) => row.resourceType,
            },
            {
              header: "Time",
              width: 95,
              render: (row: { timingMs: number | null }) =>
                row.timingMs !== null ? `${row.timingMs}ms` : "-",
              color: () => COLORS.warning,
            },
          ],
          extras.networkSummary.slowest
        );
      }
    }

    if (extras.performanceSolutions && extras.performanceSolutions.length > 0) {
      sectionHeader(doc, "Page Speed Improvements", COLORS.warning);
      doc.fontSize(9);
      for (const solution of extras.performanceSolutions) {
        doc.fillColor(COLORS.text).text(`• ${solution.title}`);
        doc.fillColor(COLORS.muted).text(`  ${solution.description}`);
      }
      doc.fillColor(COLORS.text);
    }

    if (extras.issues && extras.issues.length > 0) {
      const grouped = groupIssues(extras.issues);
      sectionHeader(doc, "Issue Summary", COLORS.critical);
      drawTable(
        doc,
        [
          { header: "Category", width: 90, render: (row) => row.category },
          {
            header: "Issue",
            width: 280,
            render: (row) => (row.count > 1 ? `${row.message} (example)` : row.message),
          },
          { header: "Count", width: 45, render: (row) => String(row.count) },
          {
            header: "Severity",
            width: 85,
            render: (row) => row.severity,
            color: (row) => severityColor(row.severity),
          },
        ],
        grouped
      );
    }

    sectionHeader(doc, "Passed", COLORS.success);
    doc.fontSize(9).fillColor(COLORS.text);
    if (report.passed.length === 0) {
      doc.text("None");
    } else {
      report.passed.forEach((category) => {
        doc.text(`• ${category}`);
      });
    }

    sectionHeader(doc, "Recommendations", COLORS.primary);
    doc.fontSize(9).fillColor(COLORS.text);
    if (report.recommendations.length === 0) {
      doc.text("None");
    } else {
      report.recommendations.forEach((recommendation) => {
        doc.text(`• ${recommendation}`);
      });
    }

    doc.end();
  });
}
