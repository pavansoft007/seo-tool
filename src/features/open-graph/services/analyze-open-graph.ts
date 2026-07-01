import type { SocialMeta } from "./extract-social-meta";

export type OpenGraphIssueCode =
  | "OG_TITLE_MISSING"
  | "OG_IMAGE_MISSING"
  | "OG_URL_MISSING"
  | "OG_TYPE_MISSING";

export interface OpenGraphIssue {
  code: OpenGraphIssueCode;
  message: string;
}

export function analyzeOpenGraph(social: SocialMeta): OpenGraphIssue[] {
  const issues: OpenGraphIssue[] = [];

  if (!social.ogTitle) {
    issues.push({ code: "OG_TITLE_MISSING", message: "Missing og:title tag" });
  }

  if (!social.ogImage) {
    issues.push({ code: "OG_IMAGE_MISSING", message: "Missing og:image tag" });
  }

  if (!social.ogUrl) {
    issues.push({ code: "OG_URL_MISSING", message: "Missing og:url tag" });
  }

  if (!social.ogType) {
    issues.push({ code: "OG_TYPE_MISSING", message: "Missing og:type tag" });
  }

  return issues;
}
