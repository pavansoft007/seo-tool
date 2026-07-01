import type { ImageData } from "./extract-images";

export type ImageIssueCode =
  | "IMAGE_ALT_MISSING"
  | "IMAGE_ALT_TOO_LONG"
  | "IMAGE_LAZY_LOADING_MISSING";

export interface ImageIssue {
  src: string | null;
  code: ImageIssueCode;
  message: string;
}

const ALT_MAX_LENGTH = 125;

export function analyzeImages(images: ImageData[]): ImageIssue[] {
  const issues: ImageIssue[] = [];

  for (const image of images) {
    if (!image.alt || !image.alt.trim()) {
      issues.push({
        src: image.src,
        code: "IMAGE_ALT_MISSING",
        message: "Image is missing alt text",
      });
      continue;
    }

    if (image.alt.length > ALT_MAX_LENGTH) {
      issues.push({
        src: image.src,
        code: "IMAGE_ALT_TOO_LONG",
        message: `Alt text length (${image.alt.length}) exceeds recommended maximum of ${ALT_MAX_LENGTH}`,
      });
    }
  }

  for (const image of images) {
    if (!image.lazy) {
      issues.push({
        src: image.src,
        code: "IMAGE_LAZY_LOADING_MISSING",
        message: "Image does not use loading=\"lazy\"",
      });
    }
  }

  return issues;
}
