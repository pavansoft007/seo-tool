import { prisma } from "../../lib/prisma";
import type { Page } from "@prisma/client";

export interface CreatePageInput {
  scanId: string;
  url: string;
  statusCode: number | null;
  title: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  h1: string | null;
  loadTimeMs: number | null;
  pageSizeBytes: number | null;
}

export function createPage(input: CreatePageInput): Promise<Page> {
  return prisma.page.create({ data: input });
}

export function listPagesByScan(scanId: string): Promise<Page[]> {
  return prisma.page.findMany({ where: { scanId } });
}
