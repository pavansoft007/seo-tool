import { prisma } from "../../lib/prisma";

export interface CreateLinkInput {
  pageId: string;
  targetUrl: string;
  anchorText: string | null;
  isInternal: boolean;
  isBroken: boolean;
  statusCode: number | null;
}

export function createLinks(
  links: CreateLinkInput[]
): Promise<{ count: number }> {
  if (links.length === 0) return Promise.resolve({ count: 0 });
  return prisma.link.createMany({ data: links });
}
