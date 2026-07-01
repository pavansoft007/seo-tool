import { prisma } from "../../lib/prisma";

export interface CreateNetworkRequestInput {
  pageId: string;
  url: string;
  resourceType: string;
  method: string;
  statusCode: number | null;
  sizeBytes: number | null;
  timingMs: number | null;
}

export function createNetworkRequests(
  requests: CreateNetworkRequestInput[]
): Promise<{ count: number }> {
  if (requests.length === 0) return Promise.resolve({ count: 0 });
  return prisma.networkRequest.createMany({ data: requests });
}
