import { prisma } from "../../lib/prisma";

export interface CreateImageInput {
  pageId: string;
  src: string;
  alt: string | null;
  hasAlt: boolean;
}

export function createImages(
  images: CreateImageInput[]
): Promise<{ count: number }> {
  if (images.length === 0) return Promise.resolve({ count: 0 });
  return prisma.image.createMany({ data: images });
}
