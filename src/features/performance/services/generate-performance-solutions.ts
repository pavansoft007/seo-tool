import type { PerformanceIssueCode } from "./analyze-performance";
import type { ImagePerformanceIssueCode } from "../../images/services/analyze-image-performance";

export interface PerformanceSolution {
  title: string;
  description: string;
}

const PAGE_SOLUTIONS: Record<PerformanceIssueCode, PerformanceSolution> = {
  SLOW_LOAD_TIME: {
    title: "Reduce server response time",
    description:
      "Enable Gzip/Brotli compression, use a CDN, and cache responses at the edge to cut time-to-first-byte.",
  },
  PAGE_SIZE_TOO_LARGE: {
    title: "Reduce total page size",
    description:
      "Minify HTML/CSS/JS, remove unused code, and compress text assets with Gzip/Brotli to shrink the response.",
  },
};

const IMAGE_SOLUTIONS: Record<ImagePerformanceIssueCode, PerformanceSolution> = {
  IMAGE_SLOW_TO_LOAD: {
    title: "Serve images from a faster host or CDN",
    description:
      "Slow-responding images should be moved behind a CDN or image-optimization service to cut round-trip time.",
  },
  IMAGE_TOO_LARGE: {
    title: "Compress and resize oversized images",
    description:
      "Re-encode as WebP/AVIF, resize to the display dimensions, and compress before serving to reduce transfer size.",
  },
};

const LAZY_LOADING_SOLUTION: PerformanceSolution = {
  title: "Add lazy loading to below-the-fold images",
  description:
    "Add loading=\"lazy\" to images outside the initial viewport so they don't block first paint.",
};

export interface PerformanceSolutionInput {
  performanceIssueCodes: PerformanceIssueCode[];
  imagePerformanceIssueCodes: ImagePerformanceIssueCode[];
  hasMissingLazyLoading: boolean;
}

export function generatePerformanceSolutions(
  input: PerformanceSolutionInput
): PerformanceSolution[] {
  const solutions: PerformanceSolution[] = [];
  const seen = new Set<string>();

  const add = (solution: PerformanceSolution) => {
    if (seen.has(solution.title)) return;
    seen.add(solution.title);
    solutions.push(solution);
  };

  for (const code of input.performanceIssueCodes) {
    add(PAGE_SOLUTIONS[code]);
  }

  for (const code of input.imagePerformanceIssueCodes) {
    add(IMAGE_SOLUTIONS[code]);
  }

  if (input.hasMissingLazyLoading) {
    add(LAZY_LOADING_SOLUTION);
  }

  return solutions;
}
