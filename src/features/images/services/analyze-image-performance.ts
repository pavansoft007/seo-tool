import type { ImageData } from "./extract-images";

export type ImagePerformanceIssueCode = "IMAGE_SLOW_TO_LOAD" | "IMAGE_TOO_LARGE";

export interface ImagePerformanceIssue {
  src: string;
  code: ImagePerformanceIssueCode;
  message: string;
}

const SLOW_THRESHOLD_MS = 1000;
const LARGE_THRESHOLD_BYTES = 200_000;
const REQUEST_TIMEOUT_MS = 5000;

async function checkImage(
  src: string,
  pageUrl: string
): Promise<ImagePerformanceIssue[]> {
  const issues: ImagePerformanceIssue[] = [];
  const url = new URL(src, pageUrl).toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, { method: "HEAD", signal: controller.signal });
    const elapsedMs = Date.now() - startedAt;
    clearTimeout(timer);

    if (elapsedMs >= SLOW_THRESHOLD_MS) {
      issues.push({
        src,
        code: "IMAGE_SLOW_TO_LOAD",
        message: `Image server took ${elapsedMs}ms to respond to this image request (separate from page load time), above the ${SLOW_THRESHOLD_MS}ms threshold`,
      });
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength >= LARGE_THRESHOLD_BYTES) {
      issues.push({
        src,
        code: "IMAGE_TOO_LARGE",
        message: `Image is ${Math.round(contentLength / 1000)}KB, above the recommended ${
          LARGE_THRESHOLD_BYTES / 1000
        }KB`,
      });
    }
  } catch {
    clearTimeout(timer);
  }

  return issues;
}

export async function analyzeImagePerformance(
  images: ImageData[],
  pageUrl: string
): Promise<ImagePerformanceIssue[]> {
  const results = await Promise.all(
    images
      .filter((image): image is ImageData & { src: string } => Boolean(image.src))
      .map((image) => checkImage(image.src, pageUrl))
  );

  return results.flat();
}
