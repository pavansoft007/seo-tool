import { prisma } from "../../lib/prisma";
import type { Scan } from "@prisma/client";
import type { ScanStatus } from "../../types";

export function createScan(url: string): Promise<Scan> {
  return prisma.scan.create({ data: { url } });
}

export function updateScanStatus(
  scanId: string,
  status: ScanStatus,
  timestamps: { startedAt?: Date; completedAt?: Date } = {}
): Promise<Scan> {
  return prisma.scan.update({
    where: { id: scanId },
    data: { status, ...timestamps },
  });
}

export function getScanWithRelations(scanId: string) {
  return prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      pages: {
        include: { issues: true, links: true, images: true, networkRequests: true },
      },
    },
  });
}

export function listScans(limit = 20) {
  return prisma.scan.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getDashboardStats() {
  const [scanCount, pageCount, criticalIssueCount, warningIssueCount] = await Promise.all([
    prisma.scan.count(),
    prisma.page.count(),
    prisma.issue.count({ where: { severity: "CRITICAL" } }),
    prisma.issue.count({ where: { severity: "WARNING" } }),
  ]);

  return { scanCount, pageCount, criticalIssueCount, warningIssueCount };
}
